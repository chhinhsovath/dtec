/**
 * Conversation List Component
 * Displays all conversations for the user with unread count badges
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useChat } from '@/lib/hooks/useChat';

interface Conversation {
  conversation_id: number;
  conversation_type: string;
  title?: string;
  description?: string;
  is_active: boolean;
  last_message?: {
    message_id: number;
    message_text: string;
    sender_name: string;
    created_at: string;
  };
  unread_count: number;
  is_muted: boolean;
  is_pinned: boolean;
  updated_at: string;
}

interface ConversationListProps {
  selectedId?: number;
  onSelect?: (id: number) => void;
}

export function ConversationList({ selectedId, onSelect }: ConversationListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { connected } = useChat();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'direct' | 'course' | 'group'>('all');
  const [searchText, setSearchText] = useState('');

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('type', filter);
      }
      params.append('limit', '50');

      const response = await fetch(`/api/messages/conversations?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to fetch conversations');

      const data = await response.json();
      setConversations(data.data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchConversations();
    }
  }, [session?.user?.id, filter]);

  const handleSelectConversation = (convId: number) => {
    onSelect?.(convId);
    router.push(`/messages/${convId}`);
  };

  const getConversationTitle = (conv: Conversation): string => {
    if (conv.title) return conv.title;
    if (conv.conversation_type === 'direct') {
      return conv.last_message?.sender_name || 'Direct Message';
    }
    return `${conv.conversation_type.charAt(0).toUpperCase() + conv.conversation_type.slice(1)} Conversation`;
  };

  const getLastMessagePreview = (conv: Conversation): string => {
    if (!conv.last_message) return 'No messages yet';
    const text = conv.last_message.message_text;
    return text.length > 50 ? `${text.substring(0, 50)}...` : text;
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffMinutes < 1) return 'now';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!searchText) return true;
    const title = getConversationTitle(conv).toLowerCase();
    return title.includes(searchText.toLowerCase());
  });

  // Sort: pinned first, then by updated date
  const sortedConversations = [...filteredConversations].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) {
      return a.is_pinned ? -1 : 1;
    }
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Messages</h1>

        {/* Search */}
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Filter Tabs */}
        <div className="flex gap-2 mt-3 overflow-x-auto">
          {(['all', 'direct', 'course', 'group'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors ${
                filter === type
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            <p>Loading conversations...</p>
          </div>
        ) : sortedConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p>No conversations yet</p>
          </div>
        ) : (
          sortedConversations.map((conv) => (
            <button
              key={conv.conversation_id}
              onClick={() => handleSelectConversation(conv.conversation_id)}
              className={`w-full px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left ${
                selectedId === conv.conversation_id ? 'bg-blue-50' : ''
              } ${conv.is_muted ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {getConversationTitle(conv)}
                    </h3>
                    {conv.is_pinned && <span className="text-yellow-500">📌</span>}
                  </div>
                  <p className="text-sm text-gray-600 truncate mt-1">
                    {getLastMessagePreview(conv)}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1 ml-2">
                  <span className="text-xs text-gray-500">
                    {formatTime(conv.updated_at)}
                  </span>
                  {conv.unread_count > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-500 text-white text-xs rounded-full font-semibold">
                      {conv.unread_count > 99 ? '99+' : conv.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* New Conversation Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => router.push('/messages/new')}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
        >
          New Message
        </button>
      </div>
    </div>
  );
}

export default ConversationList;
