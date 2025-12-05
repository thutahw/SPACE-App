import { Module, forwardRef } from '@nestjs/common';

import { ConversationsModule } from '../conversations/conversations.module';
import { SpacesModule } from '../spaces/spaces.module';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [SpacesModule, forwardRef(() => ConversationsModule)],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
