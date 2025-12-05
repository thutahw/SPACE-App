import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { BookingStatus as PrismaBookingStatus, Prisma } from '@prisma/client';

import { BookingStatus, ErrorCodes, UserRole } from '@space-app/shared';

import { ConversationsService } from '../conversations/conversations.service';
import { PrismaService } from '../prisma/prisma.service';
import { SpacesService } from '../spaces/spaces.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { QueryBookingsDto } from './dto/query-bookings.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly spacesService: SpacesService,
    @Inject(forwardRef(() => ConversationsService))
    private readonly conversationsService: ConversationsService,
  ) {}

  async create(createBookingDto: CreateBookingDto, userId: string) {
    const { spaceId, startDate, endDate, message } = createBookingDto;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      throw new BadRequestException({
        code: ErrorCodes.BOOKING_INVALID_DATES,
        message: 'End date must be after start date',
      });
    }

    if (start < new Date()) {
      throw new BadRequestException({
        code: ErrorCodes.BOOKING_INVALID_DATES,
        message: 'Start date cannot be in the past',
      });
    }

    // Check if space exists
    const space = await this.spacesService.findOne(spaceId);

    // Check if user is trying to book their own space
    if (space.ownerId === userId) {
      throw new ForbiddenException({
        code: ErrorCodes.BOOKING_OWN_SPACE,
        message: 'You cannot book your own space',
      });
    }

    // Check for overlapping bookings (optional - can be enabled for strict availability)
    const overlapping = await this.prisma.booking.findFirst({
      where: {
        spaceId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [
          {
            AND: [
              { startDate: { lte: start } },
              { endDate: { gt: start } },
            ],
          },
          {
            AND: [
              { startDate: { lt: end } },
              { endDate: { gte: end } },
            ],
          },
          {
            AND: [
              { startDate: { gte: start } },
              { endDate: { lte: end } },
            ],
          },
        ],
      },
    });

    if (overlapping) {
      throw new BadRequestException({
        code: ErrorCodes.BOOKING_CONFLICT,
        message: 'This space is not available for the selected dates',
      });
    }

    // Calculate total price based on number of days
    const daysDiff = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    const numberOfDays = Math.max(daysDiff, 1); // Minimum 1 day
    const totalPrice = Number(space.price) * numberOfDays;

    // Create booking
    return this.prisma.booking.create({
      data: {
        startDate: start,
        endDate: end,
        totalPrice,
        message,
        status: PrismaBookingStatus.PENDING,
        userId,
        spaceId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        space: {
          select: {
            id: true,
            title: true,
            price: true,
            location: true,
            ownerId: true,
          },
        },
      },
    });
  }

  async findAll(query: QueryBookingsDto, userId: string, userRole: UserRole) {
    const {
      page = 1,
      limit = 20,
      status,
      spaceId,
      startDateFrom,
      startDateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.BookingWhereInput = {};

    // Non-admin users can only see their own bookings
    if (userRole !== UserRole.ADMIN) {
      where.userId = userId;
    }

    if (status) {
      where.status = status as PrismaBookingStatus;
    }

    if (spaceId) {
      where.spaceId = spaceId;
    }

    if (startDateFrom || startDateTo) {
      where.startDate = {};
      if (startDateFrom) {
        where.startDate.gte = new Date(startDateFrom);
      }
      if (startDateTo) {
        where.startDate.lte = new Date(startDateTo);
      }
    }

    // Execute query with count
    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          space: {
            select: {
              id: true,
              title: true,
              price: true,
              location: true,
              ownerId: true,
              owner: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data: bookings,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string, userRole: UserRole) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        space: {
          select: {
            id: true,
            title: true,
            price: true,
            location: true,
            imageUrls: true,
            ownerId: true,
            owner: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException({
        code: ErrorCodes.BOOKING_NOT_FOUND,
        message: 'Booking not found',
      });
    }

    // Check authorization (user can see their bookings or bookings for their spaces)
    const isOwner = booking.userId === userId;
    const isSpaceOwner = booking.space.ownerId === userId;
    const isAdmin = userRole === UserRole.ADMIN;

    if (!isOwner && !isSpaceOwner && !isAdmin) {
      throw new ForbiddenException({
        code: ErrorCodes.AUTH_FORBIDDEN,
        message: 'You are not authorized to view this booking',
      });
    }

    return booking;
  }

  async findByUser(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: {
        space: {
          select: {
            id: true,
            title: true,
            price: true,
            location: true,
            imageUrls: true,
            owner: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByOwner(ownerId: string) {
    return this.prisma.booking.findMany({
      where: {
        space: {
          ownerId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        space: {
          select: {
            id: true,
            title: true,
            price: true,
            location: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(
    id: string,
    updateDto: UpdateBookingStatusDto,
    userId: string,
    userRole: UserRole
  ) {
    const booking = await this.findOne(id, userId, userRole);

    // Only space owner or admin can confirm/reject
    // Only booking user or admin can cancel
    const isSpaceOwner = booking.space.ownerId === userId;
    const isBookingUser = booking.userId === userId;
    const isAdmin = userRole === UserRole.ADMIN;

    const { status } = updateDto;

    // Validate status transitions
    if (status === BookingStatus.CONFIRMED || status === BookingStatus.REJECTED) {
      if (!isSpaceOwner && !isAdmin) {
        throw new ForbiddenException({
          code: ErrorCodes.AUTH_FORBIDDEN,
          message: 'Only the space owner can confirm or reject bookings',
        });
      }
    }

    if (status === BookingStatus.CANCELLED) {
      if (!isBookingUser && !isAdmin) {
        throw new ForbiddenException({
          code: ErrorCodes.AUTH_FORBIDDEN,
          message: 'Only the booking user can cancel their booking',
        });
      }

      // Can't cancel an already cancelled booking
      if (booking.status === PrismaBookingStatus.CANCELLED) {
        throw new BadRequestException({
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Booking is already cancelled',
        });
      }
    }

    // Can't modify completed/cancelled bookings (except cancelling pending)
    if (
      booking.status === PrismaBookingStatus.REJECTED ||
      (booking.status === PrismaBookingStatus.CANCELLED &&
        status !== BookingStatus.CANCELLED)
    ) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Cannot modify a rejected or cancelled booking',
      });
    }

    const updatedBooking = await this.prisma.booking.update({
      where: { id },
      data: { status: status as PrismaBookingStatus },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        space: {
          select: {
            id: true,
            title: true,
            price: true,
            ownerId: true,
          },
        },
      },
    });

    // Auto-create conversation when booking is confirmed
    if (status === BookingStatus.CONFIRMED) {
      try {
        await this.conversationsService.findOrCreate(
          updatedBooking.space.ownerId,
          {
            participantId: updatedBooking.userId,
            spaceId: updatedBooking.spaceId,
            bookingId: updatedBooking.id,
            initialMessage: `Your booking for "${updatedBooking.space.title}" has been confirmed! Feel free to reach out with any questions.`,
          },
        );
      } catch (error) {
        // Log error but don't fail the booking confirmation
        console.error('Failed to create conversation for booking:', error);
      }
    }

    return updatedBooking;
  }

  async cancel(id: string, userId: string, userRole: UserRole) {
    return this.updateStatus(
      id,
      { status: BookingStatus.CANCELLED },
      userId,
      userRole
    );
  }

  async remove(id: string, userId: string, userRole: UserRole) {
    // Only admin can permanently delete bookings
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException({
        code: ErrorCodes.AUTH_FORBIDDEN,
        message: 'Only administrators can delete bookings',
      });
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new NotFoundException({
        code: ErrorCodes.BOOKING_NOT_FOUND,
        message: 'Booking not found',
      });
    }

    await this.prisma.booking.delete({
      where: { id },
    });

    return { message: 'Booking deleted successfully' };
  }
}
