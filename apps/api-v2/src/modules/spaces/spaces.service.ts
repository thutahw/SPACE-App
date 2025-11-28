import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { ErrorCodes, UserRole } from '@space-app/shared';

import { PrismaService } from '../prisma/prisma.service';
import { CreateSpaceDto } from './dto/create-space.dto';
import { QuerySpacesDto } from './dto/query-spaces.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';

@Injectable()
export class SpacesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSpaceDto: CreateSpaceDto, ownerId: string) {
    return this.prisma.space.create({
      data: {
        title: createSpaceDto.title,
        description: createSpaceDto.description,
        price: new Prisma.Decimal(createSpaceDto.price),
        location: createSpaceDto.location,
        imageUrls: createSpaceDto.imageUrls || [],
        ownerId,
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });
  }

  async findAll(query: QuerySpacesDto) {
    const {
      page = 1,
      limit = 20,
      search,
      location,
      minPrice,
      maxPrice,
      ownerId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.SpaceWhereInput = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = new Prisma.Decimal(minPrice);
      }
      if (maxPrice !== undefined) {
        where.price.lte = new Prisma.Decimal(maxPrice);
      }
    }

    if (ownerId) {
      where.ownerId = ownerId;
    }

    // Execute query with count
    const [spaces, total] = await Promise.all([
      this.prisma.space.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.space.count({ where }),
    ]);

    return {
      data: spaces,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const space = await this.prisma.space.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (!space) {
      throw new NotFoundException({
        code: ErrorCodes.SPACE_NOT_FOUND,
        message: 'Space not found',
      });
    }

    return space;
  }

  async findByOwner(ownerId: string) {
    return this.prisma.space.findMany({
      where: { ownerId, deletedAt: null },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(
    id: string,
    updateSpaceDto: UpdateSpaceDto,
    userId: string,
    userRole: UserRole
  ) {
    // Check if space exists and get owner
    const space = await this.findOne(id);

    // Check authorization
    if (space.ownerId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException({
        code: ErrorCodes.SPACE_UNAUTHORIZED,
        message: 'You are not authorized to update this space',
      });
    }

    // Build update data
    const data: Prisma.SpaceUpdateInput = {};

    if (updateSpaceDto.title !== undefined) {
      data.title = updateSpaceDto.title;
    }
    if (updateSpaceDto.description !== undefined) {
      data.description = updateSpaceDto.description;
    }
    if (updateSpaceDto.price !== undefined) {
      data.price = new Prisma.Decimal(updateSpaceDto.price);
    }
    if (updateSpaceDto.location !== undefined) {
      data.location = updateSpaceDto.location;
    }
    if (updateSpaceDto.imageUrls !== undefined) {
      data.imageUrls = updateSpaceDto.imageUrls;
    }

    return this.prisma.space.update({
      where: { id },
      data,
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string, userRole: UserRole) {
    // Check if space exists and get owner
    const space = await this.findOne(id);

    // Check authorization
    if (space.ownerId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException({
        code: ErrorCodes.SPACE_UNAUTHORIZED,
        message: 'You are not authorized to delete this space',
      });
    }

    // Soft delete (handled by middleware)
    await this.prisma.space.delete({
      where: { id },
    });

    return { message: 'Space deleted successfully' };
  }

  async isOwner(spaceId: string, userId: string): Promise<boolean> {
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
      select: { ownerId: true },
    });

    return space?.ownerId === userId;
  }
}
