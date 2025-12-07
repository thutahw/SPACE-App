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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get all unique partner user IDs
    const partnerIds = new Set<string>();
    messages.forEach((message) => {
      const partnerId = message.senderId === userId ? message.receiverId : message.senderId;
      if (partnerId) {
        partnerIds.add(partnerId);
      }
    });

    // Fetch partner user details
    const partners = await this.prisma.user.findMany({
      where: { id: { in: Array.from(partnerIds) } },
      select: { id: true, name: true, email: true },
    });

    const partnerMap = new Map(partners.map((p) => [p.id, p]));

    // Group by conversation partner
    const conversationsMap = new Map();
    messages.forEach((message) => {
      const partnerId = message.senderId === userId ? message.receiverId : message.senderId;
      if (!partnerId) return;

      if (!conversationsMap.has(partnerId)) {
        conversationsMap.set(partnerId, {
          partner: partnerMap.get(partnerId) || { id: partnerId, name: null, email: 'Unknown' },
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
