import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { ConversationsService } from '../conversations/conversations.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  email?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  },
})
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagesGateway.name);

  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * CRITICAL: Explicit JWT validation on WebSocket connection.
   * Disconnects immediately if token is invalid.
   */
  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth.token;

      if (!token) {
        this.logger.warn(`Connection rejected: No token provided`);
        client.disconnect();
        return;
      }

      // Verify JWT
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Attach user info to socket
      client.userId = payload.sub;
      client.email = payload.email;

      // Auto-join user's room for receiving messages
      client.join(`user:${payload.sub}`);

      this.logger.log(`User ${payload.email} connected (${client.id})`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Connection rejected: Invalid token - ${message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.logger.log(`User ${client.email} disconnected (${client.id})`);
    }
  }

  /**
   * Send a message in a conversation.
   * Emits 'newMessage' to both participants.
   */
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { conversationId: string; content: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    try {
      const message = await this.conversationsService.sendMessage(
        client.userId,
        {
          conversationId: data.conversationId,
          content: data.content,
        },
      );

      // Get conversation to find the other participant
      const conversation = await this.conversationsService.findById(
        data.conversationId,
        client.userId,
      );

      // Emit to both participants
      this.server.to(`user:${client.userId}`).emit('newMessage', message);
      this.server
        .to(`user:${conversation.partner.id}`)
        .emit('newMessage', message);

      return message;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error sending message: ${message}`);
      return { error: message };
    }
  }

  /**
   * Mark messages as read in a conversation.
   * Emits 'messagesRead' to the sender.
   */
  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    try {
      await this.conversationsService.markAsRead(conversationId, client.userId);

      // Get conversation to notify the other participant
      const conversation = await this.conversationsService.findById(
        conversationId,
        client.userId,
      );

      // Notify the other participant that their messages were read
      this.server.to(`user:${conversation.partner.id}`).emit('messagesRead', {
        conversationId,
        readBy: client.userId,
      });

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error marking as read: ${message}`);
      return { error: message };
    }
  }

  /**
   * Join a specific conversation room (for typing indicators, etc).
   */
  @SubscribeMessage('joinConversation')
  handleJoinConversation(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    client.join(`conversation:${conversationId}`);
    return { success: true };
  }

  /**
   * Leave a conversation room.
   */
  @SubscribeMessage('leaveConversation')
  handleLeaveConversation(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    client.leave(`conversation:${conversationId}`);
    return { success: true };
  }
}
