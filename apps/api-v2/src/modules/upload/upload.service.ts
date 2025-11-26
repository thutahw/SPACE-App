import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';

import { STORAGE_SERVICE, StorageService, UploadedFile } from './storage.interface';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    @Inject(STORAGE_SERVICE)
    private readonly storageService: StorageService
  ) {}

  async uploadImage(
    file: Express.Multer.File
  ): Promise<UploadedFile> {
    // Validate file
    this.validateFile(file);

    // Upload and process image
    const result = await this.storageService.uploadImage(
      file.buffer,
      file.originalname
    );

    this.logger.log(`Image uploaded successfully: ${result.filename}`);

    return result;
  }

  async uploadImages(
    files: Express.Multer.File[]
  ): Promise<UploadedFile[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    if (files.length > 5) {
      throw new BadRequestException('Maximum 5 files allowed per upload');
    }

    const results = await Promise.all(
      files.map((file) => this.uploadImage(file))
    );

    return results;
  }

  async deleteImage(filename: string): Promise<void> {
    await this.storageService.deleteFile(filename);
    this.logger.log(`Image deleted: ${filename}`);
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`
      );
    }
  }
}
