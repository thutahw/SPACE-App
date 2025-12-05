import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  },
})
@UseGuards(JwtAuthGuard)
export class MessagesGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly messagesService: MessagesService) {}

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() createMessageDto: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = (client as any).user?.userId;
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    const message = await this.messagesService.create(userId, createMessageDto);

    // Emit to receiver
    this.server.to(`user-${createMessageDto.receiverId}`).emit('newMessage', message);

    return message;
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@MessageBody() userId: string, @ConnectedSocket() client: Socket) {
    client.join(`user-${userId}`);
    return { success: true };
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @MessageBody() messageId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = (client as any).user?.userId;
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    await this.messagesService.markAsRead(messageId, userId);
    return { success: true };
  }
}
