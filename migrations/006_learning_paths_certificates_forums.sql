-- Phase 5A: Learning Paths, Certificates, and Discussion Forums
-- Coursera-like features for professional learning

-- =====================================================
-- LEARNING PATHS SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  difficulty_level VARCHAR(20) DEFAULT 'intermediate', -- beginner, intermediate, advanced
  estimated_hours INTEGER,
  learning_objectives TEXT[], -- array of learning objectives
  category VARCHAR(100),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_published BOOLEAN DEFAULT false,
  thumbnail_url VARCHAR(512),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name)
);

CREATE TABLE IF NOT EXISTS path_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  sequence_order INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT true,
  prerequisite_course_id UUID REFERENCES courses(id) ON DELETE SET NULL, -- course that must be completed first
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(path_id, course_id)
);

CREATE TABLE IF NOT EXISTS student_path_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  enrolled_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_date TIMESTAMP,
  completed_date TIMESTAMP,
  completed_courses INTEGER DEFAULT 0,
  total_courses INTEGER DEFAULT 0,
  progress_percentage DECIMAL(5, 2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'enrolled', -- enrolled, in_progress, completed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, path_id)
);

-- =====================================================
-- CERTIFICATES AND BADGES SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  path_id UUID REFERENCES learning_paths(id) ON DELETE SET NULL,
  certificate_type VARCHAR(50) NOT NULL, -- course, path, specialization
  certificate_number VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  issued_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expiry_date TIMESTAMP,
  is_valid BOOLEAN DEFAULT true,
  verification_code VARCHAR(50) UNIQUE,
  certificate_url VARCHAR(512), -- PDF URL
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_name VARCHAR(100) NOT NULL,
  badge_description TEXT,
  badge_image_url VARCHAR(512),
  badge_category VARCHAR(50), -- skill, achievement, engagement
  earned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS badge_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  image_url VARCHAR(512),
  criteria_type VARCHAR(50) NOT NULL, -- score_threshold, courses_completed, streak
  criteria_value INTEGER, -- score needed, number of courses, days
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- DISCUSSION FORUMS SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  order_position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  is_marked_solution BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS forum_post_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) NOT NULL, -- upvote, downvote
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS forum_reply_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reply_id UUID NOT NULL REFERENCES forum_replies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(reply_id, user_id)
);

CREATE TABLE IF NOT EXISTS forum_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id)
);

-- =====================================================
-- PREREQUISITE TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS course_prerequisites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  prerequisite_course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  minimum_score DECIMAL(5, 2), -- minimum grade needed to proceed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(course_id, prerequisite_course_id)
);

-- =====================================================
-- STUDENT RECOMMENDATIONS (for personalization)
-- =====================================================

CREATE TABLE IF NOT EXISTS course_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  reason VARCHAR(100), -- based_on_interest, based_on_performance, trending, recommended_by_teacher
  recommendation_score DECIMAL(5, 2), -- confidence score 0-100
  is_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, course_id)
);

-- =====================================================
-- ENGAGEMENT TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS student_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  forum_posts_count INTEGER DEFAULT 0,
  forum_replies_count INTEGER DEFAULT 0,
  assignments_submitted INTEGER DEFAULT 0,
  quizzes_attempted INTEGER DEFAULT 0,
  videos_watched INTEGER DEFAULT 0,
  total_time_minutes INTEGER DEFAULT 0,
  last_activity TIMESTAMP,
  engagement_score DECIMAL(5, 2) DEFAULT 0, -- 0-100
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_learning_paths_published ON learning_paths(is_published);
CREATE INDEX IF NOT EXISTS idx_learning_paths_category ON learning_paths(category);
CREATE INDEX IF NOT EXISTS idx_path_courses_path ON path_courses(path_id);
CREATE INDEX IF NOT EXISTS idx_student_path_progress_student ON student_path_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_path_progress_path ON student_path_progress(path_id);
CREATE INDEX IF NOT EXISTS idx_student_path_progress_status ON student_path_progress(status);
CREATE INDEX IF NOT EXISTS idx_certificates_student ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course ON certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_path ON certificates(path_id);
CREATE INDEX IF NOT EXISTS idx_student_badges_student ON student_badges(student_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_category ON forum_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_user ON forum_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created ON forum_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_forum_replies_post ON forum_replies(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_user ON forum_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_course_recommendations_student ON course_recommendations(student_id);
CREATE INDEX IF NOT EXISTS idx_student_engagement_student ON student_engagement(student_id);
CREATE INDEX IF NOT EXISTS idx_student_engagement_course ON student_engagement(student_id, course_id);

-- =====================================================
-- PHASE 6A: FORUM MODERATION SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS forum_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(20) NOT NULL, -- 'post' or 'reply'
  content_id UUID NOT NULL,
  reported_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, reviewed, resolved, dismissed
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  UNIQUE(content_type, content_id, reported_by) -- prevent duplicate reports
);

CREATE TABLE IF NOT EXISTS forum_moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'pin', 'unpin', 'lock', 'unlock', 'delete', 'mark_solution'
  content_type VARCHAR(20) NOT NULL, -- 'post' or 'reply'
  content_id UUID NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for moderation
CREATE INDEX IF NOT EXISTS idx_forum_reports_status ON forum_reports(status);
CREATE INDEX IF NOT EXISTS idx_forum_reports_content ON forum_reports(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_forum_reports_created ON forum_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_forum_moderation_logs_moderator ON forum_moderation_logs(moderator_id);
CREATE INDEX IF NOT EXISTS idx_forum_moderation_logs_content ON forum_moderation_logs(content_type, content_id);

-- =====================================================
-- PHASE 6C: NOTIFICATIONS SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL, -- 'forum_reply', 'certificate_issued', 'path_completed', 'quiz_graded'
  title VARCHAR(255) NOT NULL,
  message TEXT,
  related_type VARCHAR(20), -- 'post', 'certificate', 'path', 'quiz'
  related_id UUID,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  action_url VARCHAR(512),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  forum_replies BOOLEAN DEFAULT true,
  certificates BOOLEAN DEFAULT true,
  path_milestones BOOLEAN DEFAULT true,
  quiz_grades BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  in_app_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  email VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  sent_at TIMESTAMP,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_created ON notification_queue(created_at);

COMMIT;
