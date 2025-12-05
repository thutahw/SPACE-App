import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  private readonly appUrl: string;
  private readonly isConfigured: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.fromEmail = this.configService.get<string>('EMAIL_FROM') || 'noreply@space-app.com';
    this.appUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3001';

    // Check if email is configured (SMTP or SendGrid)
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const sendgridKey = this.configService.get<string>('SENDGRID_API_KEY');
    this.isConfigured = !!(smtpHost || sendgridKey);

    if (!this.isConfigured) {
      this.logger.warn('Email service not configured - emails will be logged only');
    }
  }

  /**
   * Generate a verification token and save to user
   */
  async generateVerificationToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationToken: token,
        emailVerificationExpires: expires,
      },
    });

    return token;
  }

  /**
   * Send verification email to user
   */
  async sendVerificationEmail(userId: string, email: string, name?: string): Promise<void> {
    const token = await this.generateVerificationToken(userId);
    const verificationUrl = `${this.appUrl}/verify-email?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Welcome to SPACE!</h1>
        <p>Hello ${name || 'there'},</p>
        <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}"
             style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          If you didn't create an account with SPACE, please ignore this email.
        </p>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Verify your email address - SPACE',
      html,
    });
  }

  /**
   * Verify email token and mark user as verified
   */
  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: { gte: new Date() },
      },
    });

    if (!user) {
      return { success: false, message: 'Invalid or expired verification token' };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    this.logger.log(`Email verified for user: ${user.id}`);
    return { success: true, message: 'Email verified successfully' };
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.emailVerified) {
      throw new Error('Email already verified');
    }

    await this.sendVerificationEmail(userId, user.email, user.name || undefined);
  }

  /**
   * Send a generic email
   */
  private async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.isConfigured) {
      // Log email in development
      this.logger.log(`📧 Email would be sent to: ${options.to}`);
      this.logger.log(`   Subject: ${options.subject}`);
      this.logger.debug(`   Body: ${options.html.substring(0, 200)}...`);
      return;
    }

    // TODO: Implement actual email sending with SMTP or SendGrid
    // For now, just log the email
    this.logger.log(`Sending email to ${options.to}: ${options.subject}`);

    // Example SendGrid implementation:
    // const sendgridKey = this.configService.get<string>('SENDGRID_API_KEY');
    // if (sendgridKey) {
    //   const sgMail = require('@sendgrid/mail');
    //   sgMail.setApiKey(sendgridKey);
    //   await sgMail.send({
    //     to: options.to,
    //     from: this.fromEmail,
    //     subject: options.subject,
    //     html: options.html,
    //   });
    // }
  }

  /**
   * Send booking confirmation email
   */
  async sendBookingConfirmation(
    email: string,
    name: string | null,
    booking: { spaceTitle: string; startDate: Date; endDate: Date; totalPrice: number },
  ): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Booking Confirmed!</h1>
        <p>Hello ${name || 'there'},</p>
        <p>Your booking has been confirmed:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Space:</strong> ${booking.spaceTitle}</p>
          <p><strong>Dates:</strong> ${booking.startDate.toLocaleDateString()} - ${booking.endDate.toLocaleDateString()}</p>
          <p><strong>Total:</strong> ₩${booking.totalPrice.toLocaleString()}</p>
        </div>
        <p>Thank you for using SPACE!</p>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: `Booking Confirmed - ${booking.spaceTitle}`,
      html,
    });
  }

  /**
   * Send payment receipt email
   */
  async sendPaymentReceipt(
    email: string,
    name: string | null,
    payment: { amount: number; bookingId: string; spaceTitle: string },
  ): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Payment Receipt</h1>
        <p>Hello ${name || 'there'},</p>
        <p>We've received your payment:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Amount:</strong> ₩${payment.amount.toLocaleString()}</p>
          <p><strong>Space:</strong> ${payment.spaceTitle}</p>
          <p><strong>Booking ID:</strong> ${payment.bookingId}</p>
        </div>
        <p>Thank you for your payment!</p>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Payment Receipt - SPACE',
      html,
    });
  }
}
