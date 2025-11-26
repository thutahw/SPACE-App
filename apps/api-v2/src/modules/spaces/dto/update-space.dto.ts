import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsUrl,
  MaxLength,
  Min,
  ArrayMaxSize,
} from 'class-validator';

export class UpdateSpaceDto {
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Title must be less than 255 characters' })
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Price must be positive' })
  price?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true, message: 'Each image URL must be a valid URL' })
  @ArrayMaxSize(10, { message: 'Maximum 10 images allowed' })
  imageUrls?: string[];
}
