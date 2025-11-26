import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { TokenPayload, UserRole } from '@space-app/shared';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { QueryBookingsDto } from './dto/query-bookings.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(
    @Body() createBookingDto: CreateBookingDto,
    @CurrentUser('sub') userId: string
  ) {
    return this.bookingsService.create(createBookingDto, userId);
  }

  @Get()
  findAll(@Query() query: QueryBookingsDto, @CurrentUser() user: TokenPayload) {
    return this.bookingsService.findAll(query, user.sub, user.role as UserRole);
  }

  @Get('my-bookings')
  findMyBookings(@CurrentUser('sub') userId: string) {
    return this.bookingsService.findByUser(userId);
  }

  @Get('owner-bookings')
  findOwnerBookings(@CurrentUser('sub') userId: string) {
    return this.bookingsService.findByOwner(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: TokenPayload) {
    return this.bookingsService.findOne(id, user.sub, user.role as UserRole);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateBookingStatusDto,
    @CurrentUser() user: TokenPayload
  ) {
    return this.bookingsService.updateStatus(
      id,
      updateDto,
      user.sub,
      user.role as UserRole
    );
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: TokenPayload) {
    return this.bookingsService.cancel(id, user.sub, user.role as UserRole);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: TokenPayload) {
    return this.bookingsService.remove(id, user.sub, user.role as UserRole);
  }
}
