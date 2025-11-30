import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  MaxLength,
  Min,
  ArrayMaxSize,
} from 'class-validator';

export class CreateSpaceDto {
  @IsString()
  @MaxLength(255, { message: 'Title must be less than 255 characters' })
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Price must be positive' })
  price: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10, { message: 'Maximum 10 images allowed' })
  imageUrls?: string[];
}
