'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { ConversationList, MessageView } from '@/components/messaging';
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

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const conversationId = searchParams.get('conversation');

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isMobileListView, setIsMobileListView] = useState(true);

  // Set selected conversation from URL param
  useEffect(() => {
    if (conversationId && !selectedConversation) {
      // The conversation will be selected when the list loads
    }
  }, [conversationId]);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setIsMobileListView(false);
    // Update URL without full navigation
    router.push(`/messages?conversation=${conversation.id}`, { scroll: false });
  };

  const handleBack = () => {
    setIsMobileListView(true);
    setSelectedConversation(null);
    router.push('/messages', { scroll: false });
  };

  return (
    <div className="h-[calc(100vh-4rem)]">
      <div className="h-full flex flex-col md:flex-row">
        {/* Conversation List - Hidden on mobile when viewing messages */}
        <div
          className={cn(
            'w-full md:w-80 lg:w-96 border-r bg-background flex-shrink-0',
            'md:block',
            isMobileListView ? 'block' : 'hidden'
          )}
        >
          <div className="h-full flex flex-col">
            <div className="p-4 border-b">
              <h1 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Messages
              </h1>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ConversationList
                selectedId={selectedConversation?.id || conversationId || undefined}
                onSelect={handleSelectConversation}
              />
            </div>
          </div>
        </div>

        {/* Message View - Full screen on mobile when viewing messages */}
        <div
          className={cn(
            'flex-1 bg-muted/30',
            'md:block',
            isMobileListView ? 'hidden' : 'block'
          )}
        >
          {selectedConversation || conversationId ? (
            <MessageView
              conversationId={selectedConversation?.id || conversationId || ''}
              onBack={handleBack}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4">
              <MessageSquare className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">Choose a conversation from the list to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
