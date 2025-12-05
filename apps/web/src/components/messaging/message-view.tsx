'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { Send, ArrowLeft, Loader2 } from 'lucide-react';
import { conversationsApi } from '@/lib/api-client';
import { useSocket } from '@/providers/socket-provider';
import { useAuth } from '@/providers/auth-provider';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  sender: { id: string; name: string | null; email: string };
}

interface ConversationInfo {
  id: string;
  partner: { id: string; name: string | null; email: string };
  space: { id: string; title: string } | null;
  booking: { id: string; startDate: string; endDate: string } | null;
}

interface MessageViewProps {
  conversationId: string;
  onBack?: () => void;
}

export function MessageView({ conversationId, onBack }: MessageViewProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { sendMessage, markAsRead, joinConversation, leaveConversation, onNewMessage, isConnected } =
    useSocket();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Fetch conversation info
  const { data: conversationInfo } = useQuery({
    queryKey: ['conversation-info', conversationId],
    queryFn: () => conversationsApi.getInfo(conversationId),
    enabled: !!conversationId,
  });

  // Fetch messages with cursor pagination
  const {
    data: messagesData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam }) =>
      conversationsApi.getMessages(conversationId, pageParam, 20),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!conversationId,
  });

  // Flatten messages from all pages
  const messages = messagesData?.pages.flatMap((page) => page.messages) ?? [];

  // Join conversation room and mark as read on mount
  useEffect(() => {
    if (!conversationId) return;

    joinConversation(conversationId);
    markAsRead(conversationId);

    return () => {
      leaveConversation(conversationId);
    };
  }, [conversationId, joinConversation, leaveConversation, markAsRead]);

  // Listen for new messages
  useEffect(() => {
    const unsubscribe = onNewMessage((message) => {
      // Add message to cache if it's for this conversation
      queryClient.setQueryData(
        ['messages', conversationId],
        (oldData: typeof messagesData) => {
          if (!oldData) return oldData;

          // Check if message already exists (by real ID)
          const allMessages = oldData.pages.flatMap((p) => p.messages);
          if (allMessages.some((m) => m.id === message.id)) {
            return oldData;
          }

          // Remove any temp message from the same sender (optimistic update)
          // This prevents duplicate messages when the real message arrives
          const newPages = oldData.pages.map((page) => ({
            ...page,
            messages: page.messages.filter(
              (m) => !(m.id.startsWith('temp-') && m.sender.id === message.sender.id)
            ),
          }));

          // Add the real message to the first page (most recent)
          if (newPages[0]) {
            newPages[0] = {
              ...newPages[0],
              messages: [...newPages[0].messages, message],
            };
          }

          return { ...oldData, pages: newPages };
        }
      );

      // Mark as read if from partner
      if (message.sender.id !== user?.id) {
        markAsRead(conversationId);
      }

      // Scroll to bottom
      scrollToBottom();
    });

    return unsubscribe;
  }, [conversationId, onNewMessage, queryClient, markAsRead, user?.id]);

  // Auto-scroll to bottom on initial load
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      scrollToBottom();
    }
  }, [isLoading]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Handle scroll to load more
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container || !hasNextPage || isFetchingNextPage) return;

    // Load more when scrolled near top
    if (container.scrollTop < 100) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !isConnected) return;

    setIsSending(true);
    try {
      // Optimistically add message
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        content: newMessage,
        createdAt: new Date().toISOString(),
        isRead: false,
        sender: {
          id: user?.id || '',
          name: user?.name || null,
          email: user?.email || '',
        },
      };

      queryClient.setQueryData(
        ['messages', conversationId],
        (oldData: typeof messagesData) => {
          if (!oldData) return oldData;
          const newPages = [...oldData.pages];
          if (newPages[0]) {
            newPages[0] = {
              ...newPages[0],
              messages: [...newPages[0].messages, optimisticMessage],
            };
          }
          return { ...oldData, pages: newPages };
        }
      );

      sendMessage(conversationId, newMessage);
      setNewMessage('');
      scrollToBottom();
    } finally {
      setIsSending(false);
    }
  };

  const formatMessageDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  const formatMessageTime = (dateStr: string) => {
    return format(new Date(dateStr), 'h:mm a');
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  let currentDate = '';
  messages.forEach((msg) => {
    const msgDate = formatMessageDate(msg.createdAt);
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groupedMessages.push({ date: msgDate, messages: [msg] });
    } else {
      const lastGroup = groupedMessages[groupedMessages.length - 1];
      if (lastGroup) {
        lastGroup.messages.push(msg);
      }
    }
  });

  if (!conversationId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <p>Select a conversation to start messaging</p>
      </div>
    );
  }

  const partner = conversationInfo?.partner;
  const partnerInitials = partner?.name
    ? partner.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : partner?.email?.[0]?.toUpperCase() || '?';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-background">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/10 text-primary">
            {partnerInitials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold truncate">
            {partner?.name || partner?.email || 'Loading...'}
          </h2>
          {conversationInfo?.space && (
            <p className="text-sm text-muted-foreground truncate">
              {conversationInfo.space.title}
            </p>
          )}
        </div>
        {!isConnected && (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
            Reconnecting...
          </span>
        )}
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p>No messages yet</p>
            <p className="text-sm">Send a message to start the conversation</p>
          </div>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.date}>
              {/* Date separator */}
              <div className="flex items-center justify-center my-4">
                <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  {group.date}
                </span>
              </div>

              {/* Messages for this date */}
              {group.messages.map((message, idx) => {
                const isOwn = message.sender.id === user?.id;
                const prevMessage = idx > 0 ? group.messages[idx - 1] : null;
                const showAvatar =
                  !isOwn &&
                  (idx === 0 || prevMessage?.sender.id !== message.sender.id);

                return (
                  <div
                    key={message.id}
                    className={cn(
                      'flex items-end gap-2 mb-2',
                      isOwn && 'flex-row-reverse'
                    )}
                  >
                    {!isOwn && (
                      <div className="w-8">
                        {showAvatar && (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {partnerInitials}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    )}

                    <div
                      className={cn(
                        'max-w-[70%] px-4 py-2 rounded-2xl',
                        isOwn
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-muted rounded-bl-sm'
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      <p
                        className={cn(
                          'text-[10px] mt-1',
                          isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        )}
                      >
                        {formatMessageTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t bg-background">
        <div className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={!isConnected || isSending}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newMessage.trim() || !isConnected || isSending}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
