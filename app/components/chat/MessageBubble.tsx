/**
 * Message Bubble Component
 * Renders individual message with edit/delete options and read receipts
 */

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useChat } from '@/lib/hooks/useChat';

interface MessageBubbleProps {
  message: {
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
    read_count?: number;
  };
  isOwn: boolean;
  onEdit?: (id: number, text: string) => void;
  onDelete?: (id: number) => void;
}

export function MessageBubble({ message, isOwn, onEdit, onDelete }: MessageBubbleProps) {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.message_text);
  const [showMenu, setShowMenu] = useState(false);
  const { broadcastReadReceipt } = useChat();

  const handleEdit = async () => {
    if (editText.trim() && editText !== message.message_text) {
      onEdit?.(message.message_id, editText);
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (confirm('Delete this message?')) {
      onDelete?.(message.message_id);
    }
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // System message
  if (message.message_type === 'system') {
    return (
      <div className="flex justify-center py-2">
        <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {message.message_text}
        </span>
      </div>
    );
  }

  // Deleted message
  if (message.is_deleted) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
        <div className="text-xs text-gray-400 italic">This message was deleted</div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3 group`}>
      {/* Avatar for other users */}
      {!isOwn && (
        <div className="flex-shrink-0 mr-2">
          {message.sender_avatar ? (
            <Image
              src={message.sender_avatar}
              alt={message.sender_name}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold">
              {message.sender_name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}

      <div
        className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-xs lg:max-w-md`}
      >
        {/* Sender name for group chats */}
        {!isOwn && (
          <span className="text-xs font-semibold text-gray-600 mb-1">
            {message.sender_name}
          </span>
        )}

        {/* Message bubble */}
        <div
          className={`px-3 py-2 rounded-lg ${
            isOwn
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-900'
          }`}
        >
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-gray-900 text-sm"
              />
              <div className="flex gap-2 text-xs">
                <button
                  onClick={handleEdit}
                  className="px-2 py-1 bg-green-500 text-white rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditText(message.message_text);
                  }}
                  className="px-2 py-1 bg-gray-400 text-white rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm break-words">{message.message_text}</p>

              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-2 flex flex-col gap-1">
                  {message.attachments.map((att: any) => (
                    <a
                      key={att.attachment_id}
                      href={att.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-xs underline ${
                        isOwn ? 'text-blue-200' : 'text-blue-600'
                      }`}
                    >
                      📎 {att.file_name}
                    </a>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Message meta */}
        <div
          className={`text-xs text-gray-500 mt-1 flex gap-2 ${
            isOwn ? 'flex-row-reverse' : ''
          }`}
        >
          <span>{formatTime(message.created_at)}</span>
          {message.is_edited && <span className="italic">(edited)</span>}
          {isOwn && message.read_count !== undefined && (
            <span className="text-xs">✓✓ {message.read_count > 0 ? 'Read' : 'Sent'}</span>
          )}
        </div>
      </div>

      {/* Action menu for own messages */}
      {isOwn && !isEditing && (
        <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="px-2 py-1 bg-gray-300 rounded text-gray-700 text-xs hover:bg-gray-400"
          >
            ⋮
          </button>
          {showMenu && (
            <div className="absolute bg-white border border-gray-300 rounded shadow-lg z-10">
              <button
                onClick={() => {
                  setIsEditing(true);
                  setShowMenu(false);
                }}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  handleDelete();
                  setShowMenu(false);
                }}
                className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MessageBubble;
