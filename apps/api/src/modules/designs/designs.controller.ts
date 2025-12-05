import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DesignsService } from './designs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiResponse, ErrorCodes } from '@space-app/shared';
import { DesignStatus } from '@prisma/client';
import { LocalStorageService } from '../upload/local-storage.service';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Controller('designs')
@UseGuards(JwtAuthGuard)
export class DesignsController {
  constructor(
    private readonly designsService: DesignsService,
    private readonly storageService: LocalStorageService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { name: string; description?: string; spaceId?: string; bookingId?: string; width?: string; height?: string },
  ): Promise<ApiResponse<any>> {
    if (!file) {
      return {
        success: false,
        error: { code: ErrorCodes.VALIDATION_ERROR, message: 'No file uploaded' },
      };
    }

    // Upload file to storage
    const uploadResult = await this.storageService.uploadImage(file.buffer, file.originalname);

    const design = await this.designsService.create(user.sub, {
      name: body.name || file.originalname,
      description: body.description,
      fileUrl: uploadResult.url,
      fileType: file.mimetype,
      fileSize: file.size,
      thumbnailUrl: uploadResult.thumbnailUrl,
      width: body.width ? parseFloat(body.width) : undefined,
      height: body.height ? parseFloat(body.height) : undefined,
      spaceId: body.spaceId,
      bookingId: body.bookingId,
    });

    return { success: true, data: design };
  }

  @Get()
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: DesignStatus,
    @Query('spaceId') spaceId?: string,
  ): Promise<ApiResponse<any[]>> {
    const designs = await this.designsService.findAll(user.sub, { status, spaceId });
    return { success: true, data: designs };
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<ApiResponse<any>> {
    const design = await this.designsService.findOne(id, user.sub);
    return { success: true, data: design };
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string; width?: number; height?: number },
  ): Promise<ApiResponse<any>> {
    const design = await this.designsService.update(id, user.sub, body);
    return { success: true, data: design };
  }

  @Delete(':id')
  async delete(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<ApiResponse<{ success: boolean }>> {
    const result = await this.designsService.delete(id, user.sub);
    return { success: true, data: result };
  }

  // Admin endpoint for reviewing designs
  @Patch(':id/review')
  async review(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { status: DesignStatus; reviewNotes?: string },
  ): Promise<ApiResponse<any>> {
    // TODO: Add admin role check
    if (user.role !== 'ADMIN') {
      return { success: false, error: { code: ErrorCodes.AUTH_FORBIDDEN, message: 'Only admins can review designs' } };
    }

    const design = await this.designsService.updateStatus(id, body.status, body.reviewNotes);
    return { success: true, data: design };
  }

  @Get('admin/pending')
  async getPendingReview(@CurrentUser() user: JwtPayload): Promise<ApiResponse<any[]>> {
    // TODO: Add admin role check
    if (user.role !== 'ADMIN') {
      return { success: false, error: { code: ErrorCodes.AUTH_FORBIDDEN, message: 'Only admins can view pending designs' } };
    }

    const designs = await this.designsService.findPendingReview();
    return { success: true, data: designs };
  }
}
