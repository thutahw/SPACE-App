import {
  IsString,
  IsDateString,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateBookingDto {
  @IsString()
  spaceId: string;

  @IsDateString({}, { message: 'Start date must be a valid ISO date string' })
  startDate: string;

  @IsDateString({}, { message: 'End date must be a valid ISO date string' })
  endDate: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;
}
