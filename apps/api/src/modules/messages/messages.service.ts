import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(senderId: string, createMessageDto: CreateMessageDto) {
    const { receiverId, content, bookingId } = createMessageDto;

    return this.prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
        bookingId: bookingId || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findConversation(userId: string, otherUserId: string) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findAllConversations(userId: string) {
    // Get all unique users that current user has messaged with
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group by conversation partner
    const conversationsMap = new Map();
    messages.forEach((message) => {
      const partnerId = message.senderId === userId ? message.receiverId : message.senderId;
      if (!conversationsMap.has(partnerId)) {
        conversationsMap.set(partnerId, {
          partner: message.senderId === userId ? message.receiver : message.sender,
          lastMessage: message,
          unreadCount: 0,
        });
      }
      if (!message.isRead && message.receiverId === userId) {
        conversationsMap.get(partnerId).unreadCount++;
      }
    });

    return Array.from(conversationsMap.values());
  }

  async markAsRead(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.receiverId !== userId) {
      throw new ForbiddenException('Cannot mark other users messages as read');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { isRead: true },
    });
  }
}
