import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  /**
   * GET /conversations
   * Get all conversations for the current user (inbox).
   */
  @Get()
  findAll(@CurrentUser() user: any) {
    return this.conversationsService.findByUser(user.sub);
  }

  /**
   * POST /conversations
   * Create or find an existing conversation with another user.
   */
  @Post()
  create(
    @CurrentUser() user: any,
    @Body() createConversationDto: CreateConversationDto,
  ) {
    return this.conversationsService.findOrCreate(
      user.sub,
      createConversationDto,
    );
  }

  /**
   * GET /conversations/:id
   * Get a specific conversation with messages (cursor pagination).
   */
  @Get(':id')
  findOne(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.conversationsService.getMessages(
      id,
      user.sub,
      cursor,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  /**
   * GET /conversations/:id/info
   * Get conversation metadata (without messages).
   */
  @Get(':id/info')
  getInfo(@CurrentUser() user: any, @Param('id') id: string) {
    return this.conversationsService.findById(id, user.sub);
  }

  /**
   * POST /conversations/:id/messages
   * Send a message in a conversation.
   */
  @Post(':id/messages')
  sendMessage(
    @CurrentUser() user: any,
    @Param('id') conversationId: string,
    @Body('content') content: string,
  ) {
    return this.conversationsService.sendMessage(user.sub, {
      conversationId,
      content,
    });
  }

  /**
   * PATCH /conversations/:id/read
   * Mark all messages in a conversation as read.
   */
  @Patch(':id/read')
  markAsRead(@CurrentUser() user: any, @Param('id') id: string) {
    return this.conversationsService.markAsRead(id, user.sub);
  }

  /**
   * PATCH /conversations/:id/archive
   * Archive a conversation for the current user.
   */
  @Patch(':id/archive')
  archive(@CurrentUser() user: any, @Param('id') id: string) {
    return this.conversationsService.archive(id, user.sub);
  }
}
