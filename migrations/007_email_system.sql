-- Migration: Email Notification System
-- Date: November 5, 2024
-- Description: Adds tables for email delivery, templates, and analytics

-- Email queue table for tracking email delivery
CREATE TABLE IF NOT EXISTS notification_queue (
  queue_id BIGSERIAL PRIMARY KEY,
  notification_id BIGINT,
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  template_name VARCHAR(100),
  template_data JSONB,
  status VARCHAR(50) DEFAULT 'pending', -- pending, sent, bounced, failed, delivered
  sendgrid_message_id VARCHAR(255),
  send_attempts INT DEFAULT 0,
  last_attempt_at TIMESTAMP,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  error_message TEXT,
  error_code VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
);

-- Email templates table
CREATE TABLE IF NOT EXISTS email_templates (
  template_id BIGSERIAL PRIMARY KEY,
  template_name VARCHAR(100) UNIQUE NOT NULL,
  template_type VARCHAR(50), -- forum_reply, certificate_issued, quiz_graded, path_milestone, attendance_alert, live_class_starts
  subject_template VARCHAR(255) NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  variables JSONB, -- Variables like {{student_name}}, {{course_name}}
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email delivery analytics
CREATE TABLE IF NOT EXISTS email_analytics (
  analytics_id BIGSERIAL PRIMARY KEY,
  template_name VARCHAR(100),
  notification_type VARCHAR(50),
  total_sent INT DEFAULT 0,
  total_delivered INT DEFAULT 0,
  total_bounced INT DEFAULT 0,
  total_failed INT DEFAULT 0,
  delivery_rate DECIMAL(5,2), -- Percentage
  bounce_rate DECIMAL(5,2),
  open_rate DECIMAL(5,2),
  click_rate DECIMAL(5,2),
  date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_notification_queue_status ON notification_queue(status);
CREATE INDEX idx_notification_queue_created ON notification_queue(created_at);
CREATE INDEX idx_notification_queue_email ON notification_queue(recipient_email);
CREATE INDEX idx_notification_queue_template ON notification_queue(template_name);
CREATE INDEX idx_email_templates_name ON email_templates(template_name);
CREATE INDEX idx_email_templates_type ON email_templates(template_type);
CREATE INDEX idx_email_analytics_date ON email_analytics(date);
CREATE INDEX idx_email_analytics_template ON email_analytics(template_name);

-- Insert default email templates
INSERT INTO email_templates (template_name, template_type, subject_template, html_content, text_content) VALUES
(
  'forum_reply',
  'forum_reply',
  'New reply to your discussion: {{thread_title}}',
  '<h2>New Reply in {{course_name}}</h2><p>Hi {{student_name}},</p><p><strong>{{replier_name}}</strong> replied to your discussion:</p><blockquote>{{reply_text}}</blockquote><p><a href="{{discussion_link}}">View Discussion</a></p>',
  'New reply to your discussion {{thread_title}} from {{replier_name}} in {{course_name}}'
),
(
  'certificate_issued',
  'certificate_issued',
  'Congratulations! You earned a certificate in {{course_name}}',
  '<h2>Certificate Earned! 🏆</h2><p>Hi {{student_name}},</p><p>Congratulations on completing <strong>{{course_name}}</strong>!</p><p>Your certificate is ready to download and share.</p><p><a href="{{certificate_link}}">View Certificate</a></p>',
  'You have earned a certificate for completing {{course_name}}'
),
(
  'quiz_graded',
  'quiz_graded',
  'Your quiz {{quiz_name}} has been graded',
  '<h2>Quiz Graded</h2><p>Hi {{student_name}},</p><p>Your quiz <strong>{{quiz_name}}</strong> in {{course_name}} has been graded.</p><p><strong>Score: {{score}}/{{total_points}}</strong> ({{percentage}}%)</p><p><a href="{{quiz_link}}">View Details</a></p>',
  'Your quiz {{quiz_name}} has been graded with score {{score}}/{{total_points}}'
),
(
  'path_milestone',
  'path_milestone',
  'Milestone achieved in {{path_name}}!',
  '<h2>Path Milestone 🎯</h2><p>Hi {{student_name}},</p><p>You have completed {{completed_courses}} courses in {{path_name}}!</p><p>Great progress! Keep it up!</p><p><a href="{{path_link}}">Continue Learning</a></p>',
  'You have reached a milestone in {{path_name}} with {{completed_courses}} courses completed'
),
(
  'attendance_alert',
  'attendance_alert',
  'Attendance reminder for {{class_name}}',
  '<h2>Mark Your Attendance</h2><p>Hi {{student_name}},</p><p><strong>{{class_name}}</strong> class is happening in 15 minutes.</p><p>Please mark your attendance: <a href="{{attendance_link}}">Mark Present</a></p>',
  'Reminder: {{class_name}} class is starting soon. Please mark your attendance.'
),
(
  'live_class_starts',
  'live_class_starts',
  'Live class {{class_name}} is starting now!',
  '<h2>Live Class Starting 🎥</h2><p>Hi {{student_name}},</p><p><strong>{{class_name}}</strong> by {{teacher_name}} is starting now!</p><p><a href="{{class_link}}">Join Class</a></p>',
  'Live class {{class_name}} is starting now. Click to join.'
);

-- Grant appropriate permissions
ALTER TABLE notification_queue OWNER TO postgres;
ALTER TABLE email_templates OWNER TO postgres;
ALTER TABLE email_analytics OWNER TO postgres;
