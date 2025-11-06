-- Migration: Real-time Chat/Messaging System
-- Date: November 5, 2024
-- Description: Adds tables for conversations, messages, and real-time communication

-- Conversations (threads between users or in courses)
CREATE TABLE IF NOT EXISTS conversations (
  conversation_id BIGSERIAL PRIMARY KEY,
  conversation_type VARCHAR(20) NOT NULL, -- direct, course, group, announcement
  course_id BIGINT,
  title VARCHAR(255),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  archived_at TIMESTAMP,
  created_by BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- Conversation participants (who can access conversation)
CREATE TABLE IF NOT EXISTS conversation_participants (
  participant_id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  role VARCHAR(20) DEFAULT 'member', -- owner, admin, member
  is_muted BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  last_read_message_id BIGINT,
  last_read_at TIMESTAMP,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(conversation_id, user_id)
);

-- Messages (individual messages in conversations)
CREATE TABLE IF NOT EXISTS messages (
  message_id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL,
  sender_id BIGINT NOT NULL,
  message_text TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text', -- text, image, file, system
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  deleted_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE SET NULL,
  FOREIGN KEY (deleted_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- Message attachments (files, images sent in messages)
CREATE TABLE IF NOT EXISTS message_attachments (
  attachment_id BIGSERIAL PRIMARY KEY,
  message_id BIGINT NOT NULL,
  file_name VARCHAR(255),
  file_size INT,
  file_type VARCHAR(50),
  file_url VARCHAR(500),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES messages(message_id) ON DELETE CASCADE
);

-- Message read receipts (who has read which messages)
CREATE TABLE IF NOT EXISTS message_read_receipts (
  receipt_id BIGSERIAL PRIMARY KEY,
  message_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES messages(message_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(message_id, user_id)
);

-- Conversation search index (for full-text search capability)
CREATE TABLE IF NOT EXISTS conversation_search_index (
  search_id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL,
  message_id BIGINT,
  search_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE,
  FOREIGN KEY (message_id) REFERENCES messages(message_id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_conversations_type ON conversations(conversation_type);
CREATE INDEX idx_conversations_course ON conversations(course_id);
CREATE INDEX idx_conversations_active ON conversations(is_active);
CREATE INDEX idx_conversations_created ON conversations(created_at);

CREATE INDEX idx_participants_user ON conversation_participants(user_id);
CREATE INDEX idx_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX idx_participants_unread ON conversation_participants(user_id, last_read_at);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at);
CREATE INDEX idx_messages_type ON messages(message_type);
CREATE INDEX idx_messages_deleted ON messages(is_deleted);

CREATE INDEX idx_attachments_message ON message_attachments(message_id);

CREATE INDEX idx_read_receipts_message ON message_read_receipts(message_id);
CREATE INDEX idx_read_receipts_user ON message_read_receipts(user_id);

CREATE INDEX idx_search_conversation ON conversation_search_index(conversation_id);
CREATE INDEX idx_search_text ON conversation_search_index USING gin(to_tsvector('english', search_text));

-- Grant appropriate permissions
ALTER TABLE conversations OWNER TO postgres;
ALTER TABLE conversation_participants OWNER TO postgres;
ALTER TABLE messages OWNER TO postgres;
ALTER TABLE message_attachments OWNER TO postgres;
ALTER TABLE message_read_receipts OWNER TO postgres;
ALTER TABLE conversation_search_index OWNER TO postgres;
