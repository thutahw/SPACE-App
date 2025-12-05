'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Loader2, MessageSquare } from 'lucide-react';
import { conversationsApi } from '@/lib/api-client';
import { useAuth } from '@/providers/auth-provider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ContactHostModalProps {
  spaceId: string;
  spaceTitle: string;
  hostId: string;
  hostName: string;
  trigger?: React.ReactNode;
}

export function ContactHostModal({
  spaceId,
  spaceTitle,
  hostId,
  hostName,
  trigger,
}: ContactHostModalProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');

  const createConversation = useMutation({
    mutationFn: (initialMessage: string) =>
      conversationsApi.create({
        participantId: hostId,
        spaceId,
        initialMessage,
      }),
    onSuccess: (data) => {
      setOpen(false);
      setMessage('');
      router.push(`/messages?conversation=${data.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    createConversation.mutate(message.trim());
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && !isAuthenticated) {
      router.push(`/login?redirect=/spaces/${spaceId}`);
      return;
    }
    setOpen(newOpen);
  };

  // Don't show if user is the host
  if (user?.id === hostId) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="w-full">
            <MessageSquare className="h-4 w-4 mr-2" />
            Contact Host
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Contact {hostName}</DialogTitle>
          <DialogDescription>
            Send a message about &quot;{spaceTitle}&quot;
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="message">Your message</Label>
              <Textarea
                id="message"
                placeholder="Hi! I'm interested in your space..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                disabled={createConversation.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createConversation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!message.trim() || createConversation.isPending}
            >
              {createConversation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Message'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
