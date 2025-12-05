import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AvailabilityType } from '@prisma/client';

interface SetAvailabilityDto {
  dates: string[]; // Array of ISO date strings
  type: AvailabilityType;
  notes?: string;
  priceOverride?: number;
}

@Injectable()
export class AvailabilityService {
  private readonly logger = new Logger(AvailabilityService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get availability for a space within a date range
   */
  async getAvailability(
    spaceId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId, deletedAt: null },
    });

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    // Get explicit availability entries
    const availability = await this.prisma.spaceAvailability.findMany({
      where: {
        spaceId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
      include: {
        booking: {
          select: { id: true, userId: true },
        },
      },
    });

    // Get bookings that overlap with the date range
    const bookings = await this.prisma.booking.findMany({
      where: {
        spaceId,
        status: { in: ['CONFIRMED', 'PENDING'] },
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
      select: { id: true, startDate: true, endDate: true, status: true },
    });

    return {
      spaceId,
      basePrice: space.price,
      availability,
      bookings,
    };
  }

  /**
   * Set availability for specific dates (owner only)
   */
  async setAvailability(
    spaceId: string,
    userId: string,
    dto: SetAvailabilityDto,
  ) {
    // Verify ownership
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId, deletedAt: null },
    });

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    if (space.ownerId !== userId) {
      throw new BadRequestException('Only the space owner can manage availability');
    }

    // Validate dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parsedDates = dto.dates.map((d) => {
      const date = new Date(d);
      date.setHours(0, 0, 0, 0);
      if (date < today) {
        throw new BadRequestException('Cannot set availability for past dates');
      }
      return date;
    });

    // Upsert availability for each date
    const results = await Promise.all(
      parsedDates.map((date) =>
        this.prisma.spaceAvailability.upsert({
          where: {
            spaceId_date: { spaceId, date },
          },
          update: {
            type: dto.type,
            notes: dto.notes,
            priceOverride: dto.priceOverride,
          },
          create: {
            spaceId,
            date,
            type: dto.type,
            notes: dto.notes,
            priceOverride: dto.priceOverride,
          },
        }),
      ),
    );

    this.logger.log(`Availability updated for space ${spaceId}: ${results.length} dates`);
    return results;
  }

  /**
   * Block dates (convenience method)
   */
  async blockDates(spaceId: string, userId: string, dates: string[], notes?: string) {
    return this.setAvailability(spaceId, userId, {
      dates,
      type: 'BLOCKED',
      notes,
    });
  }

  /**
   * Unblock dates (remove availability entries)
   */
  async unblockDates(spaceId: string, userId: string, dates: string[]) {
    // Verify ownership
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId, deletedAt: null },
    });

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    if (space.ownerId !== userId) {
      throw new BadRequestException('Only the space owner can manage availability');
    }

    const parsedDates = dates.map((d) => {
      const date = new Date(d);
      date.setHours(0, 0, 0, 0);
      return date;
    });

    // Delete blocked entries (but not BOOKED ones)
    const result = await this.prisma.spaceAvailability.deleteMany({
      where: {
        spaceId,
        date: { in: parsedDates },
        type: { not: 'BOOKED' },
      },
    });

    this.logger.log(`Availability cleared for space ${spaceId}: ${result.count} dates`);
    return { deleted: result.count };
  }

  /**
   * Set price override for specific dates
   */
  async setPriceOverride(
    spaceId: string,
    userId: string,
    dates: string[],
    price: number,
  ) {
    return this.setAvailability(spaceId, userId, {
      dates,
      type: 'AVAILABLE',
      priceOverride: price,
    });
  }

  /**
   * Mark dates as booked (called when booking is confirmed)
   */
  async markAsBooked(
    spaceId: string,
    bookingId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const dates: Date[] = [];
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    await Promise.all(
      dates.map((date) =>
        this.prisma.spaceAvailability.upsert({
          where: {
            spaceId_date: { spaceId, date },
          },
          update: {
            type: 'BOOKED',
            bookingId,
          },
          create: {
            spaceId,
            date,
            type: 'BOOKED',
            bookingId,
          },
        }),
      ),
    );

    this.logger.log(`Marked ${dates.length} dates as booked for booking ${bookingId}`);
  }

  /**
   * Release booked dates (called when booking is cancelled)
   */
  async releaseBookedDates(bookingId: string) {
    const result = await this.prisma.spaceAvailability.deleteMany({
      where: {
        bookingId,
        type: 'BOOKED',
      },
    });

    this.logger.log(`Released ${result.count} booked dates for booking ${bookingId}`);
    return { released: result.count };
  }

  /**
   * Check if dates are available for booking
   */
  async checkAvailability(
    spaceId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ available: boolean; conflicts: Date[] }> {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    // Check for blocked or booked dates
    const blockedDates = await this.prisma.spaceAvailability.findMany({
      where: {
        spaceId,
        date: { gte: start, lte: end },
        type: { in: ['BLOCKED', 'BOOKED'] },
      },
    });

    const conflicts = blockedDates.map((a) => a.date);

    return {
      available: conflicts.length === 0,
      conflicts,
    };
  }
}
