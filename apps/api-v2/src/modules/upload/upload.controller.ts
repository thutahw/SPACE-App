import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as path from 'path';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService } from './upload.service';

@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    })
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const result = await this.uploadService.uploadImage(file);
    return {
      success: true,
      data: result,
    };
  }

  @Post('images')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    })
  )
  async uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    const results = await this.uploadService.uploadImages(files);
    return {
      success: true,
      data: results,
    };
  }

  @Delete(':filename')
  @UseGuards(JwtAuthGuard)
  async deleteImage(@Param('filename') filename: string) {
    await this.uploadService.deleteImage(filename);
    return {
      success: true,
      message: 'Image deleted successfully',
    };
  }

  // Serve uploaded images (for local storage)
  @Get('images/:filename')
  async serveImage(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = path.join(process.cwd(), 'uploads', 'images', filename);
    return res.sendFile(filePath);
  }

  // Serve thumbnails (for local storage)
  @Get('thumbnails/:filename')
  async serveThumbnail(
    @Param('filename') filename: string,
    @Res() res: Response
  ) {
    const filePath = path.join(process.cwd(), 'uploads', 'thumbnails', filename);
    return res.sendFile(filePath);
  }
}
