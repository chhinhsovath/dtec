/**
 * useChat Hook
 * React hook for managing chat state and Socket.IO communication
 * Handles real-time messaging, typing indicators, and presence tracking
 */

'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { io, Socket } from 'socket.io-client';

export interface ChatMessage {
  message_id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string;
  sender_avatar?: string;
  message_text: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  attachments?: any[];
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface TypingUser {
  userId: number;
  userName: string;
  conversationId: number;
}

export interface OnlineUser {
  userId: number;
  userName: string;
  isOnline: boolean;
  lastSeen?: string;
}

interface UseChatOptions {
  conversationId?: number;
  autoConnect?: boolean;
}

/**
 * Custom hook for chat functionality
 */
export function useChat(options: UseChatOptions = {}) {
  const { conversationId, autoConnect = true } = options;
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<Map<number, OnlineUser>>(new Map());
  const [error, setError] = useState<string | null>(null);

  /**
   * Initialize Socket.IO connection
   */
  const connect = useCallback(() => {
    if (!session?.user?.id) {
      console.warn('Cannot connect socket: no user session');
      return;
    }

    if (socketRef.current?.connected) {
      return;
    }

    try {
      const socket = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
        auth: {
          userId: session.user.id,
          sessionId: session.user.email,
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
        setConnected(true);
        setError(null);
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });

      socket.on('message_received', (payload: any) => {
        setMessages((prev) => [...prev, payload]);
      });

      socket.on('message_updated', (payload: any) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.message_id === payload.messageId
              ? { ...msg, message_text: payload.messageText, is_edited: payload.isEdited }
              : msg
          )
        );
      });

      socket.on('message_removed', (payload: any) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.message_id === payload.messageId
              ? { ...msg, is_deleted: payload.isDeleted }
              : msg
          )
        );
      });

      socket.on('user_typing', (payload: TypingUser) => {
        setTypingUsers((prev) => {
          const updated = new Set(prev);
          if (payload.isTyping) {
            updated.add(payload.userId);
          } else {
            updated.delete(payload.userId);
          }
          return updated;
        });
      });

      socket.on('user_online', (payload: OnlineUser) => {
        setOnlineUsers((prev) => new Map(prev).set(payload.userId, payload));
      });

      socket.on('user_offline', (payload: OnlineUser) => {
        setOnlineUsers((prev) => {
          const updated = new Map(prev);
          updated.delete(payload.userId);
          return updated;
        });
      });

      socket.on('user_joined', (payload: any) => {
        console.log(`User ${payload.userName} joined conversation ${payload.conversationId}`);
      });

      socket.on('user_left', (payload: any) => {
        console.log(`User ${payload.userName} left conversation ${payload.conversationId}`);
      });

      socket.on('error', (error: any) => {
        console.error('Socket error:', error);
        setError(error.message || 'Socket error occurred');
      });

      socketRef.current = socket;
    } catch (err) {
      console.error('Error initializing socket:', err);
      setError('Failed to connect socket');
    }
  }, [session?.user?.id, session?.user?.email]);

  /**
   * Disconnect socket
   */
  const disconnect = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.disconnect();
    }
    setConnected(false);
  }, []);

  /**
   * Join a conversation
   */
  const joinConversation = useCallback((convId: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_conversation', convId);
    }
  }, []);

  /**
   * Leave a conversation
   */
  const leaveConversation = useCallback((convId: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave_conversation', convId);
    }
  }, []);

  /**
   * Send typing indicator
   */
  const setTyping = useCallback(
    (convId: number, isTyping: boolean) => {
      if (socketRef.current?.connected && session?.user) {
        socketRef.current.emit('user_typing', {
          conversationId: convId,
          userId: session.user.id,
          userName: session.user.name,
          isTyping,
        });
      }
    },
    [session?.user]
  );

  /**
   * Emit new message to conversation
   */
  const broadcastNewMessage = useCallback((messagePayload: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('new_message', messagePayload);
    }
  }, []);

  /**
   * Emit message edit
   */
  const broadcastEditMessage = useCallback((conversationId: number, messageId: number, messageText: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('message_edited', {
        conversationId,
        messageId,
        messageText,
      });
    }
  }, []);

  /**
   * Emit message deletion
   */
  const broadcastDeleteMessage = useCallback((conversationId: number, messageId: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('message_deleted', {
        conversationId,
        messageId,
      });
    }
  }, []);

  /**
   * Emit read receipt
   */
  const broadcastReadReceipt = useCallback((conversationId: number, messageId: number) => {
    if (socketRef.current?.connected && session?.user?.id) {
      socketRef.current.emit('message_read', {
        conversationId,
        messageId,
        userId: session.user.id,
        readAt: new Date().toISOString(),
      });
    }
  }, [session?.user?.id]);

  /**
   * Auto-connect on mount if session exists
   */
  useEffect(() => {
    if (autoConnect && session?.user?.id) {
      connect();
    }

    return () => {
      // Don't disconnect on unmount - socket should persist for app lifetime
    };
  }, [autoConnect, session?.user?.id, connect]);

  /**
   * Auto-join conversation if provided
   */
  useEffect(() => {
    if (connected && conversationId) {
      joinConversation(conversationId);
    }
  }, [connected, conversationId, joinConversation]);

  return {
    // State
    connected,
    messages,
    typingUsers,
    onlineUsers,
    error,
    socket: socketRef.current,

    // Methods
    connect,
    disconnect,
    joinConversation,
    leaveConversation,
    setTyping,
    broadcastNewMessage,
    broadcastEditMessage,
    broadcastDeleteMessage,
    broadcastReadReceipt,

    // Utility
    addMessage: (msg: ChatMessage) => setMessages((prev) => [...prev, msg]),
    clearMessages: () => setMessages([]),
  };
}

export default useChat;
