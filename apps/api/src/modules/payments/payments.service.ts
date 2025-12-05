import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(PaymentsService.name);
  private readonly webhookSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      this.logger.warn('STRIPE_SECRET_KEY not configured - payments will be disabled');
      // Use a placeholder key format to allow Stripe SDK to initialize
      // Actual payment operations will check for key presence
      this.stripe = new Stripe('sk_test_placeholder');
    } else {
      this.stripe = new Stripe(stripeSecretKey);
    }

    this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '';
  }

  private isConfigured(): boolean {
    const key = this.configService.get<string>('STRIPE_SECRET_KEY');
    return !!key && key !== 'sk_test_placeholder';
  }

  /**
   * Create a Stripe Checkout Session for a booking
   */
  async createCheckoutSession(
    bookingId: string,
    userId: string,
    successUrl: string,
    cancelUrl: string,
  ): Promise<{ sessionId: string; url: string }> {
    if (!this.isConfigured()) {
      throw new BadRequestException('Payment processing is not configured. Please contact support.');
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        space: {
          select: {
            id: true,
            title: true,
            imageUrls: true,
            ownerId: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.userId !== userId) {
      throw new BadRequestException('You can only pay for your own bookings');
    }

    if (booking.paymentStatus === PaymentStatus.SUCCEEDED) {
      throw new BadRequestException('This booking has already been paid');
    }

    // Calculate number of days
    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: booking.user.email,
      client_reference_id: bookingId,
      line_items: [
        {
          price_data: {
            currency: 'krw',
            product_data: {
              name: booking.space.title,
              description: `Booking from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()} (${days} days)`,
              images: booking.space.imageUrls.slice(0, 1).map((url) =>
                url.startsWith('http') ? url : `${this.configService.get('APP_URL')}${url}`,
              ),
            },
            unit_amount: Number(booking.totalPrice), // KRW doesn't use decimals
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId,
        userId,
        spaceId: booking.space.id,
        ownerId: booking.space.ownerId,
      },
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
    });

    // Update booking with session ID
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        stripeSessionId: session.id,
        paymentStatus: PaymentStatus.PROCESSING,
      },
    });

    this.logger.log(`Created checkout session ${session.id} for booking ${bookingId}`);

    return {
      sessionId: session.id,
      url: session.url!,
    };
  }

  /**
   * Create a Payment Intent directly (for custom payment forms)
   */
  async createPaymentIntent(
    bookingId: string,
    userId: string,
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    if (!this.isConfigured()) {
      throw new BadRequestException('Payment processing is not configured. Please contact support.');
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        space: {
          select: {
            id: true,
            title: true,
            ownerId: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.userId !== userId) {
      throw new BadRequestException('You can only pay for your own bookings');
    }

    if (booking.paymentStatus === PaymentStatus.SUCCEEDED) {
      throw new BadRequestException('This booking has already been paid');
    }

    // If there's an existing payment intent, return it
    if (booking.stripePaymentIntentId) {
      const existingIntent = await this.stripe.paymentIntents.retrieve(
        booking.stripePaymentIntentId,
      );
      if (existingIntent.status !== 'canceled') {
        return {
          clientSecret: existingIntent.client_secret!,
          paymentIntentId: existingIntent.id,
        };
      }
    }

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Number(booking.totalPrice), // KRW doesn't use decimals
      currency: 'krw',
      metadata: {
        bookingId,
        userId,
        spaceId: booking.space.id,
        ownerId: booking.space.ownerId,
      },
      description: `Booking for ${booking.space.title}`,
    });

    // Update booking with payment intent ID
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        stripePaymentIntentId: paymentIntent.id,
        paymentStatus: PaymentStatus.PROCESSING,
      },
    });

    this.logger.log(`Created payment intent ${paymentIntent.id} for booking ${bookingId}`);

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
    };
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(payload: Buffer, signature: string): Promise<void> {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Webhook signature verification failed: ${message}`);
      throw new BadRequestException('Webhook signature verification failed');
    }

    this.logger.log(`Received webhook event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await this.handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const bookingId = session.client_reference_id || session.metadata?.bookingId;

    if (!bookingId) {
      this.logger.warn('No booking ID in checkout session');
      return;
    }

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: PaymentStatus.SUCCEEDED,
        status: 'CONFIRMED',
        paidAt: new Date(),
        stripePaymentIntentId: session.payment_intent as string,
      },
    });

    this.logger.log(`Booking ${bookingId} marked as paid via checkout session`);
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const bookingId = paymentIntent.metadata?.bookingId;

    if (!bookingId) {
      this.logger.warn('No booking ID in payment intent metadata');
      return;
    }

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: PaymentStatus.SUCCEEDED,
        status: 'CONFIRMED',
        paidAt: new Date(),
      },
    });

    this.logger.log(`Booking ${bookingId} marked as paid via payment intent`);
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const bookingId = paymentIntent.metadata?.bookingId;

    if (!bookingId) {
      this.logger.warn('No booking ID in payment intent metadata');
      return;
    }

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: PaymentStatus.FAILED,
      },
    });

    this.logger.log(`Booking ${bookingId} payment failed`);
  }

  private async handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
    const paymentIntentId = charge.payment_intent as string;

    if (!paymentIntentId) {
      return;
    }

    const booking = await this.prisma.booking.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
    });

    if (!booking) {
      this.logger.warn(`No booking found for payment intent ${paymentIntentId}`);
      return;
    }

    const isFullRefund = charge.amount_refunded === charge.amount;

    await this.prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentStatus: isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
        refundedAt: new Date(),
        refundAmount: charge.amount_refunded,
        status: isFullRefund ? 'CANCELLED' : booking.status,
      },
    });

    this.logger.log(
      `Booking ${booking.id} ${isFullRefund ? 'fully' : 'partially'} refunded`,
    );
  }

  /**
   * Get payment status for a booking
   */
  async getPaymentStatus(bookingId: string, userId: string): Promise<{
    paymentStatus: PaymentStatus;
    stripeSessionId: string | null;
    paidAt: Date | null;
  }> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        userId: true,
        paymentStatus: true,
        stripeSessionId: true,
        paidAt: true,
        space: {
          select: { ownerId: true },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Only allow booking owner or space owner to view payment status
    if (booking.userId !== userId && booking.space.ownerId !== userId) {
      throw new BadRequestException('You do not have access to this booking');
    }

    return {
      paymentStatus: booking.paymentStatus,
      stripeSessionId: booking.stripeSessionId,
      paidAt: booking.paidAt,
    };
  }

  /**
   * Request a refund for a booking (space owner or admin only)
   */
  async requestRefund(
    bookingId: string,
    userId: string,
    amount?: number,
  ): Promise<{ refundId: string; amount: number }> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        space: {
          select: { ownerId: true },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Only space owner can issue refunds
    if (booking.space.ownerId !== userId) {
      throw new BadRequestException('Only the space owner can issue refunds');
    }

    if (booking.paymentStatus !== PaymentStatus.SUCCEEDED) {
      throw new BadRequestException('Can only refund successful payments');
    }

    if (!booking.stripePaymentIntentId) {
      throw new BadRequestException('No payment intent found for this booking');
    }

    const refundAmount = amount || Number(booking.totalPrice);

    const refund = await this.stripe.refunds.create({
      payment_intent: booking.stripePaymentIntentId,
      amount: refundAmount,
    });

    this.logger.log(`Created refund ${refund.id} for booking ${bookingId}`);

    return {
      refundId: refund.id,
      amount: refund.amount,
    };
  }
}
