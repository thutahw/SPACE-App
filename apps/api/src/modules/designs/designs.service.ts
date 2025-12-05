import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DesignStatus } from '@prisma/client';

interface CreateDesignDto {
  name: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  spaceId?: string;
  bookingId?: string;
}

interface UpdateDesignDto {
  name?: string;
  description?: string;
  width?: number;
  height?: number;
}

@Injectable()
export class DesignsService {
  private readonly logger = new Logger(DesignsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(uploaderId: string, dto: CreateDesignDto) {
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(dto.fileType)) {
      throw new BadRequestException('Invalid file type. Allowed: PDF, JPG, PNG, WebP');
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (dto.fileSize > maxSize) {
      throw new BadRequestException('File too large. Maximum size is 50MB');
    }

    const design = await this.prisma.design.create({
      data: {
        name: dto.name,
        description: dto.description,
        fileUrl: dto.fileUrl,
        fileType: dto.fileType,
        fileSize: dto.fileSize,
        thumbnailUrl: dto.thumbnailUrl,
        width: dto.width,
        height: dto.height,
        uploaderId,
        spaceId: dto.spaceId,
        bookingId: dto.bookingId,
      },
      include: {
        uploader: {
          select: { id: true, name: true, email: true },
        },
        space: {
          select: { id: true, title: true },
        },
        booking: {
          select: { id: true, startDate: true, endDate: true },
        },
      },
    });

    this.logger.log(`Design created: ${design.id} by user ${uploaderId}`);
    return design;
  }

  async findAll(userId: string, options?: { status?: DesignStatus; spaceId?: string }) {
    return this.prisma.design.findMany({
      where: {
        uploaderId: userId,
        ...(options?.status && { status: options.status }),
        ...(options?.spaceId && { spaceId: options.spaceId }),
      },
      include: {
        space: {
          select: { id: true, title: true },
        },
        booking: {
          select: { id: true, startDate: true, endDate: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const design = await this.prisma.design.findUnique({
      where: { id },
      include: {
        uploader: {
          select: { id: true, name: true, email: true },
        },
        space: {
          select: { id: true, title: true, ownerId: true },
        },
        booking: {
          select: { id: true, startDate: true, endDate: true },
        },
      },
    });

    if (!design) {
      throw new NotFoundException('Design not found');
    }

    // Check if user has access (uploader or space owner)
    if (design.uploaderId !== userId && design.space?.ownerId !== userId) {
      throw new BadRequestException('You do not have access to this design');
    }

    return design;
  }

  async update(id: string, userId: string, dto: UpdateDesignDto) {
    const design = await this.findOne(id, userId);

    // Only uploader can update
    if (design.uploaderId !== userId) {
      throw new BadRequestException('Only the uploader can update this design');
    }

    return this.prisma.design.update({
      where: { id },
      data: dto,
      include: {
        space: {
          select: { id: true, title: true },
        },
      },
    });
  }

  async delete(id: string, userId: string) {
    const design = await this.findOne(id, userId);

    // Only uploader can delete
    if (design.uploaderId !== userId) {
      throw new BadRequestException('Only the uploader can delete this design');
    }

    await this.prisma.design.delete({ where: { id } });
    this.logger.log(`Design deleted: ${id}`);
    return { success: true };
  }

  // Admin functions for review workflow
  async updateStatus(
    id: string,
    status: DesignStatus,
    reviewNotes?: string,
  ) {
    return this.prisma.design.update({
      where: { id },
      data: {
        status,
        reviewNotes,
        reviewedAt: new Date(),
      },
    });
  }

  async findPendingReview() {
    return this.prisma.design.findMany({
      where: { status: 'PENDING_REVIEW' },
      include: {
        uploader: {
          select: { id: true, name: true, email: true },
        },
        space: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
