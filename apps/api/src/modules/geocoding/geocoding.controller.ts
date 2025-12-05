import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GeocodingService } from './geocoding.service';

@Controller('geocoding')
@UseGuards(JwtAuthGuard, ThrottlerGuard)
export class GeocodingController {
  constructor(private readonly geocodingService: GeocodingService) {}

  /**
   * GET /api/geocoding/status
   * Check if geocoding is available
   */
  @Get('status')
  getStatus() {
    return {
      available: this.geocodingService.isAvailable(),
    };
  }

  /**
   * GET /api/geocoding/forward?address=...
   * Convert address to coordinates
   * Rate limited: 30 requests per minute
   */
  @Get('forward')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async forward(@Query('address') address: string) {
    if (!address || address.trim().length < 2) {
      throw new BadRequestException('Address must be at least 2 characters');
    }

    const result = await this.geocodingService.geocode(address.trim());

    if (!result) {
      return {
        success: false,
        message: 'Address not found',
        data: null,
      };
    }

    return {
      success: true,
      data: result,
    };
  }

  /**
   * GET /api/geocoding/reverse?lat=...&lng=...
   * Convert coordinates to address
   * Rate limited: 30 requests per minute
   */
  @Get('reverse')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async reverse(@Query('lat') lat: string, @Query('lng') lng: string) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new BadRequestException('Invalid coordinates');
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new BadRequestException('Coordinates out of range');
    }

    const result = await this.geocodingService.reverseGeocode(latitude, longitude);

    if (!result) {
      return {
        success: false,
        message: 'Location not found',
        data: null,
      };
    }

    return {
      success: true,
      data: result,
    };
  }

  /**
   * GET /api/geocoding/autocomplete?query=...&lat=...&lng=...
   * Address autocomplete for search
   * Rate limited: 60 requests per minute (higher for autocomplete)
   */
  @Get('autocomplete')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async autocomplete(
    @Query('query') query: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
  ) {
    if (!query || query.trim().length < 2) {
      return {
        success: true,
        data: [],
      };
    }

    let proximity: { lat: number; lng: number } | undefined;
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      if (!isNaN(latitude) && !isNaN(longitude)) {
        proximity = { lat: latitude, lng: longitude };
      }
    }

    const results = await this.geocodingService.autocomplete(
      query.trim(),
      proximity,
    );

    return {
      success: true,
      data: results,
    };
  }
}
