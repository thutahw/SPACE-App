import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { LocalStorageService } from './local-storage.service';
import { STORAGE_SERVICE } from './storage.interface';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(), // Use memory storage for processing before saving
    }),
  ],
  controllers: [UploadController],
  providers: [
    UploadService,
    {
      provide: STORAGE_SERVICE,
      useClass: LocalStorageService,
    },
  ],
  exports: [UploadService],
})
export class UploadModule {}
