'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { getStoredTokens } from '@/lib/api-client';
import { useAuth } from './auth-provider';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  sender: { id: string; name: string | null; email: string };
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (conversationId: string, content: string) => void;
  markAsRead: (conversationId: string) => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  onNewMessage: (callback: (message: Message) => void) => () => void;
  onMessagesRead: (callback: (data: { conversationId: string; readBy: string }) => void) => () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4001';

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Connect to WebSocket when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Disconnect if not authenticated
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const tokens = getStoredTokens();
    if (!tokens?.accessToken) return;

    const newSocket = io(SOCKET_URL, {
      auth: {
        token: tokens.accessToken,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected');
      setIsConnected(true);
      reconnectAttempts.current = 0;
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
      reconnectAttempts.current++;

      // If auth error, don't keep retrying
      if (error.message.includes('Unauthorized') || error.message.includes('jwt')) {
        newSocket.disconnect();
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user]);

  // Refresh socket auth when tokens change
  useEffect(() => {
    if (!socket || !isConnected) return;

    const tokens = getStoredTokens();
    if (tokens?.accessToken) {
      socket.auth = { token: tokens.accessToken };
    }
  }, [socket, isConnected]);

  const sendMessage = useCallback(
    (conversationId: string, content: string) => {
      if (!socket || !isConnected) {
        console.warn('[Socket] Cannot send message: not connected');
        return;
      }
      socket.emit('sendMessage', { conversationId, content });
    },
    [socket, isConnected]
  );

  const markAsRead = useCallback(
    (conversationId: string) => {
      if (!socket || !isConnected) return;
      socket.emit('markAsRead', conversationId);
    },
    [socket, isConnected]
  );

  const joinConversation = useCallback(
    (conversationId: string) => {
      if (!socket || !isConnected) return;
      socket.emit('joinConversation', conversationId);
    },
    [socket, isConnected]
  );

  const leaveConversation = useCallback(
    (conversationId: string) => {
      if (!socket || !isConnected) return;
      socket.emit('leaveConversation', conversationId);
    },
    [socket, isConnected]
  );

  const onNewMessage = useCallback(
    (callback: (message: Message) => void) => {
      if (!socket) return () => {};

      socket.on('newMessage', callback);
      return () => {
        socket.off('newMessage', callback);
      };
    },
    [socket]
  );

  const onMessagesRead = useCallback(
    (callback: (data: { conversationId: string; readBy: string }) => void) => {
      if (!socket) return () => {};

      socket.on('messagesRead', callback);
      return () => {
        socket.off('messagesRead', callback);
      };
    },
    [socket]
  );

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        sendMessage,
        markAsRead,
        joinConversation,
        leaveConversation,
        onNewMessage,
        onMessagesRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
