import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiResponse, ErrorCodes } from '@space-app/shared';
import { AvailabilityType } from '@prisma/client';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  /**
   * Get availability for a space (public)
   */
  @Get(':spaceId')
  async getAvailability(
    @Param('spaceId') spaceId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<ApiResponse<any>> {
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate
      ? new Date(endDate)
      : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // Default 90 days

    const result = await this.availabilityService.getAvailability(spaceId, start, end);
    return { success: true, data: result };
  }

  /**
   * Check if specific dates are available (public)
   */
  @Get(':spaceId/check')
  async checkAvailability(
    @Param('spaceId') spaceId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<ApiResponse<{ available: boolean; conflicts: Date[] }>> {
    if (!startDate || !endDate) {
      return { success: false, error: { code: ErrorCodes.VALIDATION_ERROR, message: 'startDate and endDate are required' } };
    }

    const result = await this.availabilityService.checkAvailability(
      spaceId,
      new Date(startDate),
      new Date(endDate),
    );
    return { success: true, data: result };
  }

  /**
   * Set availability for specific dates (owner only)
   */
  @Post(':spaceId')
  @UseGuards(JwtAuthGuard)
  async setAvailability(
    @CurrentUser() user: JwtPayload,
    @Param('spaceId') spaceId: string,
    @Body() body: { dates: string[]; type: AvailabilityType; notes?: string; priceOverride?: number },
  ): Promise<ApiResponse<any[]>> {
    const result = await this.availabilityService.setAvailability(spaceId, user.sub, body);
    return { success: true, data: result };
  }

  /**
   * Block specific dates (owner only)
   */
  @Post(':spaceId/block')
  @UseGuards(JwtAuthGuard)
  async blockDates(
    @CurrentUser() user: JwtPayload,
    @Param('spaceId') spaceId: string,
    @Body() body: { dates: string[]; notes?: string },
  ): Promise<ApiResponse<any[]>> {
    const result = await this.availabilityService.blockDates(
      spaceId,
      user.sub,
      body.dates,
      body.notes,
    );
    return { success: true, data: result };
  }

  /**
   * Unblock dates (owner only)
   */
  @Delete(':spaceId/block')
  @UseGuards(JwtAuthGuard)
  async unblockDates(
    @CurrentUser() user: JwtPayload,
    @Param('spaceId') spaceId: string,
    @Body() body: { dates: string[] },
  ): Promise<ApiResponse<{ deleted: number }>> {
    const result = await this.availabilityService.unblockDates(spaceId, user.sub, body.dates);
    return { success: true, data: result };
  }

  /**
   * Set price override for specific dates (owner only)
   */
  @Post(':spaceId/price')
  @UseGuards(JwtAuthGuard)
  async setPriceOverride(
    @CurrentUser() user: JwtPayload,
    @Param('spaceId') spaceId: string,
    @Body() body: { dates: string[]; price: number },
  ): Promise<ApiResponse<any[]>> {
    const result = await this.availabilityService.setPriceOverride(
      spaceId,
      user.sub,
      body.dates,
      body.price,
    );
    return { success: true, data: result };
  }
}
