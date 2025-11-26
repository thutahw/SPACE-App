import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

import { StorageService, UploadedFile } from './storage.interface';

@Injectable()
export class LocalStorageService implements StorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly uploadDir: string;
  private readonly thumbnailDir: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = path.join(process.cwd(), 'uploads', 'images');
    this.thumbnailDir = path.join(process.cwd(), 'uploads', 'thumbnails');
    this.baseUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4001';

    // Ensure upload directories exist
    this.ensureDirectories();
  }

  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(this.thumbnailDir, { recursive: true });
      this.logger.log(`Upload directories created: ${this.uploadDir}`);
    } catch (error) {
      this.logger.error('Failed to create upload directories', error);
    }
  }

  async uploadImage(file: Buffer, originalName: string): Promise<UploadedFile> {
    const ext = path.extname(originalName).toLowerCase();
    const filename = `${uuidv4()}.webp`;
    const thumbnailFilename = `thumb_${filename}`;

    const imagePath = path.join(this.uploadDir, filename);
    const thumbnailPath = path.join(this.thumbnailDir, thumbnailFilename);

    try {
      // Process main image (1200x800, quality 80, WebP)
      await sharp(file)
        .resize(1200, 800, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toFile(imagePath);

      // Process thumbnail (400x300, quality 70, WebP)
      await sharp(file)
        .resize(400, 300, {
          fit: 'cover',
        })
        .webp({ quality: 70 })
        .toFile(thumbnailPath);

      const stats = await fs.stat(imagePath);

      this.logger.log(`Image uploaded: ${filename}`);

      return {
        originalName,
        filename,
        path: imagePath,
        url: this.getUrl(filename),
        thumbnailUrl: this.getThumbnailUrl(thumbnailFilename),
        size: stats.size,
        mimeType: 'image/webp',
      };
    } catch (error) {
      this.logger.error(`Failed to process image: ${originalName}`, error);
      throw error;
    }
  }

  async deleteFile(filename: string): Promise<void> {
    const imagePath = path.join(this.uploadDir, filename);
    const thumbnailPath = path.join(this.thumbnailDir, `thumb_${filename}`);

    try {
      await Promise.all([
        fs.unlink(imagePath).catch(() => {}),
        fs.unlink(thumbnailPath).catch(() => {}),
      ]);
      this.logger.log(`Deleted file: ${filename}`);
    } catch (error) {
      this.logger.warn(`Failed to delete file: ${filename}`, error);
    }
  }

  getUrl(filename: string): string {
    return `/api/uploads/images/${filename}`;
  }

  getThumbnailUrl(filename: string): string {
    return `/api/uploads/thumbnails/${filename}`;
  }
}
