/**
 * Chat Window Component
 * Main chat interface combining messages, input, and conversation details
 */

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useChat } from '@/lib/hooks/useChat';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';

interface ChatWindowProps {
  conversationId: number;
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const { data: session } = useSession();
  const {
    connected,
    messages,
    typingUsers,
    broadcastNewMessage,
    broadcastEditMessage,
    broadcastDeleteMessage,
    joinConversation,
    leaveConversation,
  } = useChat({ conversationId });

  const [conversation, setConversation] = useState<any>(null);
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typingIndicator, setTypingIndicator] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Fetch conversation details
  useEffect(() => {
    const fetchConversation = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/messages/conversations/${conversationId}`);
        if (!response.ok) throw new Error('Failed to fetch conversation');

        const data = await response.json();
        setConversation(data.data.conversation);
      } catch (error) {
        console.error('Error fetching conversation:', error);
      } finally {
        setLoading(false);
      }
    };

    if (conversationId && session?.user?.id) {
      fetchConversation();
    }
  }, [conversationId, session?.user?.id]);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `/api/messages/${conversationId}?limit=50&markAsRead=true`
        );
        if (!response.ok) throw new Error('Failed to fetch messages');

        const data = await response.json();
        setConversationMessages(data.data || []);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    if (conversationId && session?.user?.id) {
      fetchMessages();
    }
  }, [conversationId, session?.user?.id]);

  // Join conversation on WebSocket when connected
  useEffect(() => {
    if (connected && conversationId) {
      joinConversation(conversationId);
    }

    return () => {
      leaveConversation(conversationId);
    };
  }, [connected, conversationId, joinConversation, leaveConversation]);

  // Update typing indicator
  useEffect(() => {
    if (typingUsers.size === 0) {
      setTypingIndicator('');
    } else if (typingUsers.size === 1) {
      const userId = Array.from(typingUsers)[0];
      setTypingIndicator(`${userId} is typing...`);
    } else {
      setTypingIndicator(`${typingUsers.size} people are typing...`);
    }
  }, [typingUsers]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages, messages, typingIndicator]);

  // Combine fetched messages with real-time messages
  const allMessages = [...conversationMessages, ...messages];

  const handleSendMessage = async (text: string, attachments?: any[]) => {
    if (!text.trim() && (!attachments || attachments.length === 0)) {
      return;
    }

    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          messageText: text,
          messageType: attachments && attachments.length > 0 ? 'file' : 'text',
          attachments: attachments || [],
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();
      const messagePayload = data.data;

      // Broadcast via WebSocket
      broadcastNewMessage({
        messageId: messagePayload.message_id,
        conversationId,
        senderId: messagePayload.sender_id,
        senderName: messagePayload.sender.name,
        senderAvatar: messagePayload.sender.avatar,
        messageText: messagePayload.message_text,
        messageType: messagePayload.message_type,
        attachments: messagePayload.attachments,
        createdAt: messagePayload.created_at,
      });

      // Add to local state
      setConversationMessages((prev) => [...prev, messagePayload]);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  const handleEditMessage = async (messageId: number, text: string) => {
    try {
      const response = await fetch('/api/messages/edit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, messageText: text }),
      });

      if (!response.ok) throw new Error('Failed to edit message');

      const data = await response.json();

      // Update local state
      setConversationMessages((prev) =>
        prev.map((msg) =>
          msg.message_id === messageId
            ? { ...msg, message_text: text, is_edited: true }
            : msg
        )
      );

      // Broadcast via WebSocket
      broadcastEditMessage(conversationId, messageId, text);
    } catch (error) {
      console.error('Error editing message:', error);
      alert('Failed to edit message');
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    try {
      const response = await fetch('/api/messages/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      });

      if (!response.ok) throw new Error('Failed to delete message');

      // Update local state
      setConversationMessages((prev) =>
        prev.map((msg) =>
          msg.message_id === messageId
            ? { ...msg, is_deleted: true }
            : msg
        )
      );

      // Broadcast via WebSocket
      broadcastDeleteMessage(conversationId, messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading conversation...</p>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Conversation not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <h2 className="text-xl font-bold text-gray-900">
          {conversation.title || 'Conversation'}
        </h2>
        {conversation.description && (
          <p className="text-sm text-gray-600 mt-1">{conversation.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <span className={`inline-block w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="text-xs text-gray-500">
            {connected ? 'Connected' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-6 bg-gray-50"
      >
        {allMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {allMessages.map((message) => (
              <MessageBubble
                key={message.message_id}
                message={message}
                isOwn={message.sender_id === session?.user?.id}
                onEdit={handleEditMessage}
                onDelete={handleDeleteMessage}
              />
            ))}

            {/* Typing indicator */}
            {typingIndicator && (
              <div className="text-xs text-gray-500 italic mt-4">
                {typingIndicator}
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <MessageInput
        conversationId={conversationId}
        onSendMessage={handleSendMessage}
        disabled={!connected}
      />
    </div>
  );
}

export default ChatWindow;
