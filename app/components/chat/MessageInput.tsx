/**
 * Message Input Component
 * Handles message composition, typing indicators, and file uploads
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useChat } from '@/lib/hooks/useChat';

interface MessageInputProps {
  conversationId: number;
  onSendMessage: (text: string, attachments?: any[]) => Promise<void>;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
}

export function MessageInput({
  conversationId,
  onSendMessage,
  onTyping,
  disabled = false,
}: MessageInputProps) {
  const { data: session } = useSession();
  const { setTyping } = useChat();
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Handle typing indicator
  useEffect(() => {
    if (!session?.user?.id) return;

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (message.length > 0) {
      setTyping(conversationId, true);
      onTyping?.(true);

      // Stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(conversationId, false);
        onTyping?.(false);
      }, 3000);
    } else {
      setTyping(conversationId, false);
      onTyping?.(false);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, conversationId, session?.user?.id, setTyping, onTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() && attachments.length === 0) {
      return;
    }

    try {
      setSending(true);
      await onSendMessage(message, attachments);
      setMessage('');
      setAttachments([]);
      setTyping(conversationId, false);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    try {
      setUploading(true);
      const formData = new FormData();

      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      // Upload files to your file service (e.g., S3, Cloudinary, or local storage)
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('File upload failed');
      }

      const uploadedFiles = await response.json();
      setAttachments((prev) => [...prev, ...uploadedFiles.files]);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t border-gray-200 p-4 bg-white">
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((att, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded">
              <span className="text-xs font-medium text-gray-700">{att.file_name}</span>
              <button
                type="button"
                onClick={() => handleRemoveAttachment(idx)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Message input form */}
      <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
        {/* File upload button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || disabled}
          className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
          title="Attach files"
        >
          📎
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
        />

        {/* Message input */}
        <div className="flex-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              // Send on Ctrl+Enter or Cmd+Enter
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                handleSendMessage(e);
              }
            }}
            disabled={disabled}
            placeholder="Type a message... (Ctrl+Enter to send)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-24"
            rows={1}
            style={{
              height: 'auto',
              maxHeight: '96px',
            }}
          />
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={sending || uploading || disabled || (!message.trim() && attachments.length === 0)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {sending ? '⏳' : '📤'}
        </button>
      </form>

      {/* Help text */}
      <p className="text-xs text-gray-500 mt-2">
        Press Ctrl+Enter to send, Enter for new line
      </p>
    </div>
  );
}

export default MessageInput;
