-- Migration: Parent/Guardian Portal System
-- Date: November 5, 2024
-- Description: Adds tables for parent/guardian access to student progress, grades, and communication

-- Parent-student relationships (who is responsible for which student)
CREATE TABLE IF NOT EXISTS parent_student_relationships (
  relationship_id BIGSERIAL PRIMARY KEY,
  parent_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  relationship_type VARCHAR(50), -- mother, father, guardian, legal_guardian, caregiver
  is_primary BOOLEAN DEFAULT FALSE, -- primary contact for notifications
  can_view_grades BOOLEAN DEFAULT TRUE,
  can_view_attendance BOOLEAN DEFAULT TRUE,
  can_view_assignments BOOLEAN DEFAULT TRUE,
  can_view_behavior BOOLEAN DEFAULT TRUE,
  can_communicate BOOLEAN DEFAULT TRUE,
  consent_signed BOOLEAN DEFAULT FALSE,
  consent_date TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending', -- pending, active, inactive
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  UNIQUE(parent_id, student_id)
);

-- Parent dashboard widgets/preferences (what parent wants to see)
CREATE TABLE IF NOT EXISTS parent_preferences (
  preference_id BIGSERIAL PRIMARY KEY,
  parent_id BIGINT NOT NULL,
  widget_type VARCHAR(50), -- grades_summary, attendance_alert, assignment_due, behavior_report, announcements
  is_enabled BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  alert_threshold INT, -- e.g., if grade below 60%, show alert
  notification_frequency VARCHAR(20), -- immediate, daily, weekly
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Student progress summary (for quick parent overview)
CREATE TABLE IF NOT EXISTS parent_student_summary (
  summary_id BIGSERIAL PRIMARY KEY,
  parent_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  overall_gpa DECIMAL(3, 2),
  attendance_percentage INT,
  pending_assignments INT,
  overdue_assignments INT,
  behavior_score INT, -- 0-100
  last_login TIMESTAMP, -- student's last login
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  UNIQUE(parent_id, student_id)
);

-- Parent-student messaging (separate from general chat for more structured communication)
CREATE TABLE IF NOT EXISTS parent_messages (
  message_id BIGSERIAL PRIMARY KEY,
  parent_id BIGINT NOT NULL,
  teacher_id BIGINT,
  student_id BIGINT NOT NULL,
  message_text TEXT NOT NULL,
  message_type VARCHAR(20), -- message, concern, praise, question
  topic VARCHAR(100), -- subject of message
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  replied_at TIMESTAMP,
  reply_text TEXT,
  replied_by BIGINT,
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES profiles(id) ON DELETE SET NULL,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (replied_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- Parent notifications (alerts and important updates)
CREATE TABLE IF NOT EXISTS parent_notifications (
  notification_id BIGSERIAL PRIMARY KEY,
  parent_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  notification_type VARCHAR(50), -- low_grade, attendance_alert, missing_assignment, behavior_incident, announcement
  title VARCHAR(255) NOT NULL,
  description TEXT,
  related_entity_id BIGINT, -- assignment_id, announcement_id, etc.
  related_entity_type VARCHAR(50), -- assignment, announcement, grade, attendance, behavior
  severity VARCHAR(20) DEFAULT 'info', -- info, warning, critical
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  action_url VARCHAR(500), -- link to related content
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- Parent access logs (audit trail for parent portal access)
CREATE TABLE IF NOT EXISTS parent_access_logs (
  log_id BIGSERIAL PRIMARY KEY,
  parent_id BIGINT NOT NULL,
  student_id BIGINT,
  action_type VARCHAR(100), -- view_grades, view_attendance, view_assignment, message_teacher, etc.
  resource_type VARCHAR(50), -- grade, attendance, assignment, message, etc.
  resource_id BIGINT,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE SET NULL
);

-- Parent documents (certificates, report cards, etc. shared with parents)
CREATE TABLE IF NOT EXISTS parent_documents (
  document_id BIGSERIAL PRIMARY KEY,
  parent_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  document_type VARCHAR(50), -- report_card, certificate, transcript, progress_report, permission_form
  file_name VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_size_mb INT,
  description TEXT,
  issued_date DATE,
  is_signed BOOLEAN DEFAULT FALSE,
  signed_at TIMESTAMP,
  signed_by BIGINT,
  requires_action BOOLEAN DEFAULT FALSE,
  action_deadline DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (signed_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- Parent event invitations (school events parent should attend)
CREATE TABLE IF NOT EXISTS parent_event_invitations (
  invitation_id BIGSERIAL PRIMARY KEY,
  parent_id BIGINT NOT NULL,
  student_id BIGINT,
  event_id BIGINT, -- reference to school events
  event_name VARCHAR(255) NOT NULL,
  event_date TIMESTAMP NOT NULL,
  event_location VARCHAR(255),
  description TEXT,
  rsvp_status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, declined, maybe
  rsvp_date TIMESTAMP,
  number_of_attendees INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX idx_parent_student_rel_parent ON parent_student_relationships(parent_id);
CREATE INDEX idx_parent_student_rel_student ON parent_student_relationships(student_id);
CREATE INDEX idx_parent_student_rel_status ON parent_student_relationships(status);

CREATE INDEX idx_parent_prefs_parent ON parent_preferences(parent_id);
CREATE INDEX idx_parent_prefs_widget ON parent_preferences(widget_type);

CREATE INDEX idx_parent_summary_parent ON parent_student_summary(parent_id);
CREATE INDEX idx_parent_summary_student ON parent_student_summary(student_id);
CREATE INDEX idx_parent_summary_updated ON parent_student_summary(last_updated);

CREATE INDEX idx_parent_messages_parent ON parent_messages(parent_id);
CREATE INDEX idx_parent_messages_student ON parent_messages(student_id);
CREATE INDEX idx_parent_messages_teacher ON parent_messages(teacher_id);
CREATE INDEX idx_parent_messages_type ON parent_messages(message_type);
CREATE INDEX idx_parent_messages_created ON parent_messages(created_at);

CREATE INDEX idx_parent_notif_parent ON parent_notifications(parent_id);
CREATE INDEX idx_parent_notif_student ON parent_notifications(student_id);
CREATE INDEX idx_parent_notif_type ON parent_notifications(notification_type);
CREATE INDEX idx_parent_notif_read ON parent_notifications(is_read);
CREATE INDEX idx_parent_notif_created ON parent_notifications(created_at);

CREATE INDEX idx_parent_access_parent ON parent_access_logs(parent_id);
CREATE INDEX idx_parent_access_action ON parent_access_logs(action_type);
CREATE INDEX idx_parent_access_created ON parent_access_logs(created_at);

CREATE INDEX idx_parent_docs_parent ON parent_documents(parent_id);
CREATE INDEX idx_parent_docs_student ON parent_documents(student_id);
CREATE INDEX idx_parent_docs_type ON parent_documents(document_type);

CREATE INDEX idx_parent_events_parent ON parent_event_invitations(parent_id);
CREATE INDEX idx_parent_events_status ON parent_event_invitations(rsvp_status);
CREATE INDEX idx_parent_events_date ON parent_event_invitations(event_date);

-- Grant appropriate permissions
ALTER TABLE parent_student_relationships OWNER TO postgres;
ALTER TABLE parent_preferences OWNER TO postgres;
ALTER TABLE parent_student_summary OWNER TO postgres;
ALTER TABLE parent_messages OWNER TO postgres;
ALTER TABLE parent_notifications OWNER TO postgres;
ALTER TABLE parent_access_logs OWNER TO postgres;
ALTER TABLE parent_documents OWNER TO postgres;
ALTER TABLE parent_event_invitations OWNER TO postgres;
