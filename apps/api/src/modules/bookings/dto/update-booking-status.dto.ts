import { IsEnum } from 'class-validator';

import { BookingStatus } from '@space-app/shared';

export class UpdateBookingStatusDto {
  @IsEnum(BookingStatus, { message: 'Invalid booking status' })
  status: BookingStatus;
}
