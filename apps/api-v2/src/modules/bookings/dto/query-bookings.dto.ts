import { IsOptional, IsString, IsNumber, Min, Max, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

import { BookingStatus } from '@space-app/shared';

export class QueryBookingsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsString()
  spaceId?: string;

  @IsOptional()
  @IsDateString()
  startDateFrom?: string;

  @IsOptional()
  @IsDateString()
  startDateTo?: string;

  @IsOptional()
  @IsEnum(['startDate', 'endDate', 'createdAt', 'status'])
  sortBy?: 'startDate' | 'endDate' | 'createdAt' | 'status' = 'createdAt';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
