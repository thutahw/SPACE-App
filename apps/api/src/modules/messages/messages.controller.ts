import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() createMessageDto: CreateMessageDto) {
    return this.messagesService.create(user.sub, createMessageDto);
  }

  @Get('conversations')
  findAllConversations(@CurrentUser() user: any) {
    return this.messagesService.findAllConversations(user.sub);
  }

  @Get('conversation')
  findConversation(@CurrentUser() user: any, @Query('userId') otherUserId: string) {
    return this.messagesService.findConversation(user.sub, otherUserId);
  }
}
