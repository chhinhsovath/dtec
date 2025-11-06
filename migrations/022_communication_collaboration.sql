-- Phase 5: Communication & Collaboration
-- Tables for messaging, forums, announcements, and notifications

-- Direct messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE, -- Optional, for course-specific messages
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Discussion forums
CREATE TABLE IF NOT EXISTS forums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  title_km VARCHAR(255),
  description TEXT,
  description_km TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Forum posts/threads
CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_id UUID NOT NULL REFERENCES forums(id) ON DELETE CASCADE,
  parent_post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE, -- For nested replies
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255),
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Forum post likes/reactions
CREATE TABLE IF NOT EXISTS forum_post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type VARCHAR(50) DEFAULT 'like', -- like, helpful, etc.
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(post_id, user_id, reaction_type)
);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  title_km VARCHAR(255),
  content TEXT NOT NULL,
  content_km TEXT,
  is_important BOOLEAN DEFAULT false,
  published_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL, -- message, assignment, grade, announcement, etc.
  title VARCHAR(255) NOT NULL,
  title_km VARCHAR(255),
  message TEXT,
  message_km TEXT,
  related_id UUID, -- ID of the related object (message, assignment, etc.)
  related_type VARCHAR(50), -- message, assessment, grade, etc.
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  in_app_notifications BOOLEAN DEFAULT true,
  message_notifications BOOLEAN DEFAULT true,
  forum_notifications BOOLEAN DEFAULT true,
  announcement_notifications BOOLEAN DEFAULT true,
  grade_notifications BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_course_id ON messages(course_id);
CREATE INDEX idx_forums_course_id ON forums(course_id);
CREATE INDEX idx_forum_posts_forum_id ON forum_posts(forum_id);
CREATE INDEX idx_forum_posts_user_id ON forum_posts(user_id);
CREATE INDEX idx_announcements_course_id ON announcements(course_id);
CREATE INDEX idx_announcements_institution_id ON announcements(institution_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- RLS Policies
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow viewing own messages
CREATE POLICY messages_select ON messages FOR SELECT USING (
  sender_id = auth.uid() OR receiver_id = auth.uid()
);

-- Allow viewing forum posts
CREATE POLICY forum_posts_select ON forum_posts FOR SELECT USING (
  auth.uid() IS NOT NULL
);

-- Allow viewing announcements
CREATE POLICY announcements_select ON announcements FOR SELECT USING (
  auth.uid() IS NOT NULL
);

-- Allow viewing own notifications
CREATE POLICY notifications_select ON notifications FOR SELECT USING (
  user_id = auth.uid()
);
