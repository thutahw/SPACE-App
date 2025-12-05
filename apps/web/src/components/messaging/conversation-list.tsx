'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, User } from 'lucide-react';
import { conversationsApi } from '@/lib/api-client';
import { useSocket } from '@/providers/socket-provider';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  partner: { id: string; name: string | null; email: string };
  space: { id: string; title: string } | null;
  booking: { id: string; startDate: string; endDate: string } | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  createdAt: string;
  unreadCount: number;
}

interface ConversationListProps {
  selectedId?: string;
  onSelect: (conversation: Conversation) => void;
}

export function ConversationList({ selectedId, onSelect }: ConversationListProps) {
  const queryClient = useQueryClient();
  const { onNewMessage } = useSocket();

  const { data: conversations, isLoading, error } = useQuery({
    queryKey: ['conversations'],
    queryFn: conversationsApi.list,
  });

  // Listen for new messages to update the list
  useEffect(() => {
    const unsubscribe = onNewMessage((message) => {
      // Invalidate conversations query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });

    return unsubscribe;
  }, [onNewMessage, queryClient]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
            <div className="w-12 h-12 rounded-full bg-muted" />
            <div className="flex-1">
              <div className="h-4 w-24 bg-muted rounded mb-2" />
              <div className="h-3 w-32 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
        <p>Failed to load conversations</p>
        <p className="text-sm">Please try again later</p>
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
        <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
        <p className="font-medium">No conversations yet</p>
        <p className="text-sm">Contact a space owner to start messaging</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y">
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          isSelected={selectedId === conversation.id}
          onClick={() => onSelect(conversation)}
        />
      ))}
    </div>
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

function ConversationItem({ conversation, isSelected, onClick }: ConversationItemProps) {
  const { partner, space, lastMessageAt, lastMessagePreview, unreadCount } = conversation;

  // Get initials for avatar
  const initials = partner.name
    ? partner.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : (partner.email?.[0] || '?').toUpperCase();

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-start gap-3 p-4 w-full text-left transition-colors hover:bg-muted/50',
        isSelected && 'bg-muted',
        unreadCount > 0 && 'bg-blue-50/50'
      )}
    >
      <Avatar className="h-12 w-12">
        <AvatarFallback className="bg-primary/10 text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn('font-medium truncate', unreadCount > 0 && 'font-semibold')}>
            {partner.name || partner.email}
          </span>
          {lastMessageAt && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(lastMessageAt), { addSuffix: true })}
            </span>
          )}
        </div>

        {space && (
          <p className="text-xs text-muted-foreground truncate">
            Re: {space.title}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 mt-1">
          <p
            className={cn(
              'text-sm truncate',
              unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
            )}
          >
            {lastMessagePreview || 'No messages yet'}
          </p>

          {unreadCount > 0 && (
            <span className="flex-shrink-0 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-blue-500 rounded-full">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
