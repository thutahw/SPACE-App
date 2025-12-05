import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from './modules/auth/auth.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { HealthModule } from './modules/health/health.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { SpacesModule } from './modules/spaces/spaces.module';
import { UploadModule } from './modules/upload/upload.module';
import { UsersModule } from './modules/users/users.module';
import { MessagesModule } from './modules/messages/messages.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { GeocodingModule } from './modules/geocoding/geocoding.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { DesignsModule } from './modules/designs/designs.module';
import { EmailModule } from './modules/email/email.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { configValidationSchema } from './config/validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configValidationSchema,
      envFilePath: ['.env', '../../.env'],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 1 minute
        limit: 100, // Default: 100 requests per minute
      },
    ]),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    SpacesModule,
    BookingsModule,
    UploadModule,
    MessagesModule,
    ConversationsModule,
    GeocodingModule,
    PaymentsModule,
    DesignsModule,
    EmailModule,
    AvailabilityModule,
  ],
})
export class AppModule {}
