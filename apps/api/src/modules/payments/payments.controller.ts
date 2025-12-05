import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  RawBodyRequest,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiResponse } from '@space-app/shared';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Create a Stripe Checkout Session for a booking
   */
  @Post('checkout-session')
  @UseGuards(JwtAuthGuard)
  async createCheckoutSession(
    @CurrentUser() user: JwtPayload,
    @Body() body: { bookingId: string; successUrl: string; cancelUrl: string },
  ): Promise<ApiResponse<{ sessionId: string; url: string }>> {
    const result = await this.paymentsService.createCheckoutSession(
      body.bookingId,
      user.sub,
      body.successUrl,
      body.cancelUrl,
    );

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Create a Payment Intent for custom payment forms
   */
  @Post('payment-intent')
  @UseGuards(JwtAuthGuard)
  async createPaymentIntent(
    @CurrentUser() user: JwtPayload,
    @Body() body: { bookingId: string },
  ): Promise<ApiResponse<{ clientSecret: string; paymentIntentId: string }>> {
    const result = await this.paymentsService.createPaymentIntent(body.bookingId, user.sub);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Get payment status for a booking
   */
  @Get('status/:bookingId')
  @UseGuards(JwtAuthGuard)
  async getPaymentStatus(
    @CurrentUser() user: JwtPayload,
    @Param('bookingId') bookingId: string,
  ): Promise<ApiResponse<{ paymentStatus: string; stripeSessionId: string | null; paidAt: Date | null }>> {
    const result = await this.paymentsService.getPaymentStatus(bookingId, user.sub);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Request a refund (space owner only)
   */
  @Post('refund')
  @UseGuards(JwtAuthGuard)
  async requestRefund(
    @CurrentUser() user: JwtPayload,
    @Body() body: { bookingId: string; amount?: number },
  ): Promise<ApiResponse<{ refundId: string; amount: number }>> {
    const result = await this.paymentsService.requestRefund(body.bookingId, user.sub, body.amount);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Stripe webhook handler
   * Note: This endpoint must receive raw body for signature verification
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean }> {
    const rawBody = req.rawBody;

    if (!rawBody) {
      throw new Error('No raw body found');
    }

    await this.paymentsService.handleWebhook(rawBody, signature);

    return { received: true };
  }
}
