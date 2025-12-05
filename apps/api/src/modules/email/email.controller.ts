import {
  Controller,
  Post,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EmailService } from './email.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiResponse, ErrorCodes } from '@space-app/shared';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  /**
   * Verify email with token (public endpoint)
   */
  @Get('verify')
  async verifyEmail(
    @Query('token') token: string,
  ): Promise<ApiResponse<{ message: string }>> {
    if (!token) {
      return { success: false, error: { code: ErrorCodes.VALIDATION_ERROR, message: 'Token is required' } };
    }

    const result = await this.emailService.verifyEmail(token);

    if (!result.success) {
      return { success: false, error: { code: ErrorCodes.VALIDATION_ERROR, message: result.message } };
    }

    return { success: true, data: { message: result.message } };
  }

  /**
   * Resend verification email (requires auth)
   */
  @Post('resend-verification')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async resendVerification(
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      await this.emailService.resendVerificationEmail(user.sub);
      return { success: true, data: { message: 'Verification email sent' } };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send email';
      return { success: false, error: { code: ErrorCodes.INTERNAL_ERROR, message } };
    }
  }
}
