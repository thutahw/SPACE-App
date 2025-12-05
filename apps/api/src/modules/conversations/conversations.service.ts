import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find or create a conversation between two users.
   * CRITICAL: Normalizes participant order (smaller ID first) to prevent duplicates.
   */
  async findOrCreate(userId: string, dto: CreateConversationDto) {
    const { participantId, spaceId, bookingId, initialMessage } = dto;

    // Validate inputs
    if (!userId || typeof userId !== 'string') {
      throw new BadRequestException('Invalid user ID');
    }
    if (!participantId || typeof participantId !== 'string') {
      throw new BadRequestException('Invalid participant ID');
    }
    if (userId === participantId) {
      throw new BadRequestException('Cannot create conversation with yourself');
    }

    // Verify both users exist
    const [user1, user2] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.user.findUnique({ where: { id: participantId } }),
    ]);

    if (!user1) {
      throw new BadRequestException(`User with ID ${userId} not found`);
    }
    if (!user2) {
      throw new BadRequestException(`Participant with ID ${participantId} not found`);
    }

    // Normalize participant order: smaller ID = participantOne
    const sorted = [userId, participantId].sort() as [string, string];
    const participantOneId = sorted[0];
    const participantTwoId = sorted[1];

    console.log('[ConversationsService] findOrCreate called:', {
      userId,
      participantId,
      spaceId,
      bookingId,
      participantOneId,
      participantTwoId,
    });

    // Try to find existing conversation
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        participantOneId,
        participantTwoId,
      },
      include: {
        participantOne: {
          select: { id: true, name: true, email: true },
        },
        participantTwo: {
          select: { id: true, name: true, email: true },
        },
        space: {
          select: { id: true, title: true },
        },
        booking: {
          select: { id: true, startDate: true, endDate: true },
        },
      },
    });

    // Create if not exists
    if (!conversation) {
      console.log('[ConversationsService] Creating new conversation');

      try {
        // Build create data with proper Prisma types
        const createData: Prisma.ConversationCreateInput = {
          participantOne: { connect: { id: participantOneId } },
          participantTwo: { connect: { id: participantTwoId } },
        };

        // Only connect space if it's a valid non-empty string
        if (spaceId && typeof spaceId === 'string' && spaceId.trim() !== '') {
          createData.space = { connect: { id: spaceId } };
        }
        // Only connect booking if it's a valid non-empty string
        if (bookingId && typeof bookingId === 'string' && bookingId.trim() !== '') {
          createData.booking = { connect: { id: bookingId } };
        }

        console.log('[ConversationsService] Create data:', JSON.stringify(createData, null, 2));

        conversation = await this.prisma.conversation.create({
          data: createData,
          include: {
            participantOne: {
              select: { id: true, name: true, email: true },
            },
            participantTwo: {
              select: { id: true, name: true, email: true },
            },
            space: {
              select: { id: true, title: true },
            },
            booking: {
              select: { id: true, startDate: true, endDate: true },
            },
          },
        });

        console.log('[ConversationsService] Conversation created:', conversation.id);
      } catch (error) {
        console.error('[ConversationsService] Error creating conversation:', error);
        throw error;
      }
    } else {
      console.log('[ConversationsService] Found existing conversation:', conversation.id);
    }

    // Send initial message if provided
    if (initialMessage && conversation) {
      await this.sendMessage(userId, {
        conversationId: conversation.id,
        content: initialMessage,
      });

      // Refresh conversation to get updated lastMessageAt
      const refreshed = await this.prisma.conversation.findUnique({
        where: { id: conversation.id },
        include: {
          participantOne: {
            select: { id: true, name: true, email: true },
          },
          participantTwo: {
            select: { id: true, name: true, email: true },
          },
          space: {
            select: { id: true, title: true },
          },
          booking: {
            select: { id: true, startDate: true, endDate: true },
          },
        },
      });
      if (refreshed) {
        conversation = refreshed;
      }
    }

    if (!conversation) {
      throw new BadRequestException('Failed to create or find conversation');
    }

    return this.formatConversationForUser(conversation, userId);
  }

  /**
   * Get all conversations for a user (inbox).
   */
  async findByUser(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ participantOneId: userId }, { participantTwoId: userId }],
        // Don't show archived
        AND: [
          {
            OR: [
              { participantOneId: userId, isArchivedByOne: false },
              { participantTwoId: userId, isArchivedByTwo: false },
            ],
          },
        ],
      },
      include: {
        participantOne: {
          select: { id: true, name: true, email: true },
        },
        participantTwo: {
          select: { id: true, name: true, email: true },
        },
        space: {
          select: { id: true, title: true },
        },
        booking: {
          select: { id: true, startDate: true, endDate: true },
        },
      },
      orderBy: {
        lastMessageAt: { sort: 'desc', nulls: 'last' },
      },
    });

    // Format and add unread counts
    const formattedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await this.prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            isRead: false,
          },
        });

        return {
          ...this.formatConversationForUser(conv, userId),
          unreadCount,
        };
      }),
    );

    return formattedConversations;
  }

  /**
   * Get messages for a conversation with cursor-based pagination.
   */
  async getMessages(
    conversationId: string,
    userId: string,
    cursor?: string,
    limit = 20,
  ) {
    // Verify user is participant
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (
      conversation.participantOneId !== userId &&
      conversation.participantTwoId !== userId
    ) {
      throw new ForbiddenException('Not a participant of this conversation');
    }

    // Fetch messages with cursor pagination
    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
        ...(cursor && { id: { lt: cursor } }),
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Determine if there are more messages
    const hasMore = messages.length === limit;
    const nextCursor = hasMore ? messages[messages.length - 1]?.id : null;

    return {
      messages: messages.reverse(), // Return in chronological order
      hasMore,
      nextCursor,
    };
  }

  /**
   * Send a message in a conversation.
   */
  async sendMessage(senderId: string, dto: SendMessageDto) {
    const { conversationId, content } = dto;

    // Verify conversation exists and user is participant
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (
      conversation.participantOneId !== senderId &&
      conversation.participantTwoId !== senderId
    ) {
      throw new ForbiddenException('Not a participant of this conversation');
    }

    // Create message and update conversation in transaction
    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          content,
          senderId,
          conversationId,
        },
        include: {
          sender: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          lastMessagePreview: content.substring(0, 100),
        },
      }),
    ]);

    return message;
  }

  /**
   * Mark all messages in a conversation as read for a user.
   */
  async markAsRead(conversationId: string, userId: string) {
    // Verify user is participant
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (
      conversation.participantOneId !== userId &&
      conversation.participantTwoId !== userId
    ) {
      throw new ForbiddenException('Not a participant of this conversation');
    }

    // Mark all unread messages from the other user as read
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { success: true };
  }

  /**
   * Archive a conversation for a user.
   */
  async archive(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isParticipantOne = conversation.participantOneId === userId;
    const isParticipantTwo = conversation.participantTwoId === userId;

    if (!isParticipantOne && !isParticipantTwo) {
      throw new ForbiddenException('Not a participant of this conversation');
    }

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        ...(isParticipantOne && { isArchivedByOne: true }),
        ...(isParticipantTwo && { isArchivedByTwo: true }),
      },
    });

    return { success: true };
  }

  /**
   * Get conversation by ID with participant check.
   */
  async findById(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participantOne: {
          select: { id: true, name: true, email: true },
        },
        participantTwo: {
          select: { id: true, name: true, email: true },
        },
        space: {
          select: { id: true, title: true },
        },
        booking: {
          select: { id: true, startDate: true, endDate: true },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (
      conversation.participantOneId !== userId &&
      conversation.participantTwoId !== userId
    ) {
      throw new ForbiddenException('Not a participant of this conversation');
    }

    return this.formatConversationForUser(conversation, userId);
  }

  /**
   * Format conversation response to show "partner" instead of participantOne/Two.
   */
  private formatConversationForUser(conversation: any, userId: string) {
    const isParticipantOne = conversation.participantOneId === userId;
    const partner = isParticipantOne
      ? conversation.participantTwo
      : conversation.participantOne;

    return {
      id: conversation.id,
      partner,
      space: conversation.space,
      booking: conversation.booking,
      lastMessageAt: conversation.lastMessageAt,
      lastMessagePreview: conversation.lastMessagePreview,
      createdAt: conversation.createdAt,
    };
  }
}
