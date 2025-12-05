import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class BoundsQueryDto {
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(-90)
  @Max(90)
  swLat: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(-180)
  @Max(180)
  swLng: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(-90)
  @Max(90)
  neLat: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(-180)
  @Max(180)
  neLng: number;

  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @Transform(({ value }) => (value ? parseInt(value, 10) : 50))
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}
