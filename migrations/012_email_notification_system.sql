-- Migration: Email Notification System
-- Date: November 2024
-- Description: Complete email notification system with SendGrid integration, templates, and queue management

-- Email Templates table
CREATE TABLE IF NOT EXISTS email_templates (
  template_id BIGSERIAL PRIMARY KEY,
  template_name VARCHAR(100) NOT NULL UNIQUE,
  template_key VARCHAR(100) NOT NULL UNIQUE,
  subject_template TEXT NOT NULL,
  body_html_template TEXT NOT NULL,
  body_text_template TEXT NOT NULL,
  variables_json JSONB,
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, deprecated
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification Queue table
CREATE TABLE IF NOT EXISTS notification_queue (
  queue_id BIGSERIAL PRIMARY KEY,
  recipient_id BIGINT NOT NULL,
  template_id BIGINT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  variables_json JSONB,
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, sent, failed, bounced
  priority INT DEFAULT 5, -- 1 (highest) to 10 (lowest)
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  sendgrid_message_id VARCHAR(255),
  error_message TEXT,
  sent_at TIMESTAMP,
  failed_at TIMESTAMP,
  scheduled_for TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipient_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES email_templates(template_id) ON DELETE SET NULL
);

-- Email Analytics table
CREATE TABLE IF NOT EXISTS email_analytics (
  analytics_id BIGSERIAL PRIMARY KEY,
  queue_id BIGINT NOT NULL,
  template_id BIGINT,
  recipient_id BIGINT NOT NULL,
  recipient_email VARCHAR(255),
  template_name VARCHAR(100),
  status VARCHAR(20),
  priority INT,
  sent_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  bounced_at TIMESTAMP,
  complained_at TIMESTAMP,
  unsubscribed_at TIMESTAMP,
  delivery_time_ms INT, -- time in milliseconds
  events_json JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (queue_id) REFERENCES notification_queue(queue_id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES email_templates(template_id) ON DELETE SET NULL,
  FOREIGN KEY (recipient_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Email Unsubscribes table
CREATE TABLE IF NOT EXISTS email_unsubscribes (
  unsubscribe_id BIGSERIAL PRIMARY KEY,
  recipient_id BIGINT NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  notification_type VARCHAR(100),
  reason TEXT,
  unsubscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipient_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Email Bounce Log table
CREATE TABLE IF NOT EXISTS email_bounce_log (
  bounce_id BIGSERIAL PRIMARY KEY,
  queue_id BIGINT,
  recipient_email VARCHAR(255) NOT NULL,
  bounce_type VARCHAR(20), -- hard, soft, complaint
  bounce_reason TEXT,
  sendgrid_event_id VARCHAR(255),
  bounced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (queue_id) REFERENCES notification_queue(queue_id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX idx_notification_queue_status ON notification_queue(status);
CREATE INDEX idx_notification_queue_recipient ON notification_queue(recipient_id);
CREATE INDEX idx_notification_queue_template ON notification_queue(template_id);
CREATE INDEX idx_notification_queue_scheduled ON notification_queue(scheduled_for);
CREATE INDEX idx_notification_queue_priority ON notification_queue(priority, scheduled_for);
CREATE INDEX idx_notification_queue_created ON notification_queue(created_at);
CREATE INDEX idx_notification_queue_retry ON notification_queue(retry_count, status);

CREATE INDEX idx_email_analytics_queue ON email_analytics(queue_id);
CREATE INDEX idx_email_analytics_recipient ON email_analytics(recipient_id);
CREATE INDEX idx_email_analytics_template ON email_analytics(template_name);
CREATE INDEX idx_email_analytics_status ON email_analytics(status);
CREATE INDEX idx_email_analytics_sent ON email_analytics(sent_at);
CREATE INDEX idx_email_analytics_created ON email_analytics(created_at);

CREATE INDEX idx_email_templates_status ON email_templates(status);
CREATE INDEX idx_email_templates_key ON email_templates(template_key);

CREATE INDEX idx_email_unsubscribes_recipient ON email_unsubscribes(recipient_id);
CREATE INDEX idx_email_unsubscribes_email ON email_unsubscribes(recipient_email);

CREATE INDEX idx_bounce_log_email ON email_bounce_log(recipient_email);
CREATE INDEX idx_bounce_log_queue ON email_bounce_log(queue_id);

-- Insert default email templates
INSERT INTO email_templates (template_name, template_key, subject_template, body_html_template, body_text_template, variables_json, status)
VALUES
(
  'Welcome Email',
  'welcome_email',
  'Welcome to TEC LMS, {{user_name}}!',
  '<h1>Welcome to TEC LMS</h1><p>Dear {{user_name}},</p><p>Welcome to Technology Enhanced Classroom. Your account has been created successfully.</p><p>Email: {{email}}</p><p>Role: {{role}}</p><p><a href="{{dashboard_url}}">Go to Dashboard</a></p>',
  'Welcome to TEC LMS\nDear {{user_name}},\nWelcome to Technology Enhanced Classroom.\nYour account has been created successfully.\nEmail: {{email}}\nRole: {{role}}\nGo to Dashboard: {{dashboard_url}}',
  '{"variables": ["user_name", "email", "role", "dashboard_url"]}',
  'active'
),
(
  'Grade Notification',
  'grade_notification',
  'New Grade Posted: {{course_name}}',
  '<h1>New Grade Posted</h1><p>Dear {{student_name}},</p><p>A new grade has been posted for {{course_name}}.</p><p>Assignment: {{assignment_name}}</p><p>Score: {{score}}/{{max_score}} ({{percentage}}%)</p><p>Feedback: {{feedback}}</p>',
  'New Grade Posted\nDear {{student_name}},\nAssignment: {{assignment_name}}\nScore: {{score}}/{{max_score}} ({{percentage}}%)\nFeedback: {{feedback}}',
  '{"variables": ["student_name", "course_name", "assignment_name", "score", "max_score", "percentage", "feedback"]}',
  'active'
),
(
  'Attendance Alert',
  'attendance_alert',
  'Attendance Alert: {{student_name}}',
  '<h1>Attendance Alert</h1><p>Dear {{parent_name}},</p><p>{{student_name}} has an attendance rate of {{attendance_percentage}}%, which is below the threshold of {{threshold}}%.</p><p>Current Absences: {{absent_count}} days</p><p><a href="{{attendance_url}}">View Attendance</a></p>',
  'Attendance Alert\nDear {{parent_name}},\n{{student_name}} attendance is {{attendance_percentage}}%\nAbsences: {{absent_count}} days\nView: {{attendance_url}}',
  '{"variables": ["parent_name", "student_name", "attendance_percentage", "threshold", "absent_count", "attendance_url"]}',
  'active'
),
(
  'Assignment Submission Reminder',
  'assignment_reminder',
  'Assignment Due Soon: {{assignment_name}}',
  '<h1>Assignment Submission Reminder</h1><p>Dear {{student_name}},</p><p>Your assignment "{{assignment_name}}" is due in {{days_remaining}} days.</p><p>Due Date: {{due_date}}</p><p>Course: {{course_name}}</p><p><a href="{{submission_url}}">Submit Assignment</a></p>',
  'Assignment Due Soon\nDear {{student_name}},\n"{{assignment_name}}" is due in {{days_remaining}} days.\nDue: {{due_date}}\nCourse: {{course_name}}',
  '{"variables": ["student_name", "assignment_name", "days_remaining", "due_date", "course_name", "submission_url"]}',
  'active'
),
(
  'System Announcement',
  'system_announcement',
  'Important Announcement: {{announcement_title}}',
  '<h1>{{announcement_title}}</h1><p>Dear {{recipient_name}},</p><p>{{announcement_content}}</p><p>Posted by: {{sender_name}}</p><p>Date: {{posted_date}}</p>',
  '{{announcement_title}}\nDear {{recipient_name}},\n{{announcement_content}}\nPosted by: {{sender_name}}\nDate: {{posted_date}}',
  '{"variables": ["announcement_title", "recipient_name", "announcement_content", "sender_name", "posted_date"]}',
  'active'
);

-- Grant permissions
ALTER TABLE email_templates OWNER TO postgres;
ALTER TABLE notification_queue OWNER TO postgres;
ALTER TABLE email_analytics OWNER TO postgres;
ALTER TABLE email_unsubscribes OWNER TO postgres;
ALTER TABLE email_bounce_log OWNER TO postgres;
