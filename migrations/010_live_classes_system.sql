-- Migration: Live Classes and Zoom Integration
-- Date: November 5, 2024
-- Description: Adds tables for managing live classes, Zoom meetings, recordings, and attendee tracking

-- Live classes/sessions table
CREATE TABLE IF NOT EXISTS live_classes (
  class_id BIGSERIAL PRIMARY KEY,
  course_id BIGINT NOT NULL,
  teacher_id BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_start TIMESTAMP NOT NULL,
  scheduled_end TIMESTAMP NOT NULL,
  actual_start TIMESTAMP,
  actual_end TIMESTAMP,
  zoom_meeting_id VARCHAR(50) UNIQUE,
  zoom_meeting_url VARCHAR(500),
  zoom_start_url VARCHAR(500),
  zoom_join_url VARCHAR(500),
  password VARCHAR(50),
  max_participants INT DEFAULT 100,
  status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, in_progress, ended, cancelled
  is_recorded BOOLEAN DEFAULT FALSE,
  recording_id VARCHAR(100),
  recording_url VARCHAR(500),
  recording_size_mb INT,
  is_public_recording BOOLEAN DEFAULT FALSE,
  meeting_settings JSONB, -- Store Zoom meeting settings (auto_recording, waiting_room, etc.)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES profiles(id) ON DELETE SET NULL
);

-- Live class participants/attendees
CREATE TABLE IF NOT EXISTS live_class_participants (
  participant_id BIGSERIAL PRIMARY KEY,
  class_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  role VARCHAR(20) DEFAULT 'participant', -- host, co_host, participant
  join_time TIMESTAMP,
  leave_time TIMESTAMP,
  duration_minutes INT DEFAULT 0, -- calculated duration in the class
  user_name VARCHAR(255), -- name at time of joining (from Zoom data)
  user_email VARCHAR(255), -- email at time of joining
  status VARCHAR(20) DEFAULT 'not_joined', -- not_joined, joined, left
  is_screen_shared BOOLEAN DEFAULT FALSE,
  is_hand_raised BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES live_classes(class_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL,
  UNIQUE(class_id, user_id)
);

-- Live class recordings table (for tracking multiple recordings per class)
CREATE TABLE IF NOT EXISTS live_class_recordings (
  recording_id BIGSERIAL PRIMARY KEY,
  class_id BIGINT NOT NULL,
  zoom_recording_id VARCHAR(100) UNIQUE,
  file_name VARCHAR(255),
  file_size_mb INT,
  file_url VARCHAR(500),
  file_type VARCHAR(50), -- video, audio, transcript, chat, etc.
  recording_type VARCHAR(20), -- shared_screen_with_speaker_view, speaker_view, gallery_view, etc.
  recording_start TIMESTAMP,
  recording_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES live_classes(class_id) ON DELETE CASCADE
);

-- Recording access control (who can view recordings)
CREATE TABLE IF NOT EXISTS recording_access (
  access_id BIGSERIAL PRIMARY KEY,
  recording_id BIGINT NOT NULL,
  user_id BIGINT,
  role VARCHAR(20), -- public, enrolled_students, specific_user
  access_level VARCHAR(20) DEFAULT 'view', -- view, download, edit
  access_expires_at TIMESTAMP, -- null for no expiration
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recording_id) REFERENCES live_class_recordings(recording_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL
);

-- Live class interactions (chat, Q&A, polls)
CREATE TABLE IF NOT EXISTS live_class_interactions (
  interaction_id BIGSERIAL PRIMARY KEY,
  class_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  interaction_type VARCHAR(20), -- chat, question, poll_response, reaction
  content TEXT NOT NULL, -- message or poll answer
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES live_classes(class_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL
);

-- Live class resources (shared during class)
CREATE TABLE IF NOT EXISTS live_class_resources (
  resource_id BIGSERIAL PRIMARY KEY,
  class_id BIGINT NOT NULL,
  resource_name VARCHAR(255) NOT NULL,
  resource_type VARCHAR(50), -- slides, document, link, video, etc.
  resource_url VARCHAR(500) NOT NULL,
  shared_by BIGINT,
  shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES live_classes(class_id) ON DELETE CASCADE,
  FOREIGN KEY (shared_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- Zoom webhook events (for tracking meeting updates)
CREATE TABLE IF NOT EXISTS zoom_webhook_events (
  event_id BIGSERIAL PRIMARY KEY,
  class_id BIGINT,
  zoom_meeting_id VARCHAR(50),
  event_type VARCHAR(100), -- meeting.started, meeting.ended, recording.completed, etc.
  event_data JSONB, -- Full event payload from Zoom
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES live_classes(class_id) ON DELETE SET NULL
);

-- Zoom API credentials and settings (per organization)
CREATE TABLE IF NOT EXISTS zoom_credentials (
  credential_id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT,
  zoom_account_id VARCHAR(100) UNIQUE,
  client_id VARCHAR(255) NOT NULL,
  client_secret VARCHAR(255) NOT NULL, -- Should be encrypted in production
  access_token VARCHAR(500),
  refresh_token VARCHAR(500),
  token_expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  last_sync TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_live_classes_course ON live_classes(course_id);
CREATE INDEX idx_live_classes_teacher ON live_classes(teacher_id);
CREATE INDEX idx_live_classes_status ON live_classes(status);
CREATE INDEX idx_live_classes_scheduled_start ON live_classes(scheduled_start);
CREATE INDEX idx_live_classes_zoom_meeting ON live_classes(zoom_meeting_id);

CREATE INDEX idx_live_participants_class ON live_class_participants(class_id);
CREATE INDEX idx_live_participants_user ON live_class_participants(user_id);
CREATE INDEX idx_live_participants_status ON live_class_participants(status);
CREATE INDEX idx_live_participants_join_time ON live_class_participants(join_time);

CREATE INDEX idx_recordings_class ON live_class_recordings(class_id);
CREATE INDEX idx_recordings_zoom_id ON live_class_recordings(zoom_recording_id);

CREATE INDEX idx_recording_access_recording ON recording_access(recording_id);
CREATE INDEX idx_recording_access_user ON recording_access(user_id);

CREATE INDEX idx_interactions_class ON live_class_interactions(class_id);
CREATE INDEX idx_interactions_user ON live_class_interactions(user_id);
CREATE INDEX idx_interactions_type ON live_class_interactions(interaction_type);

CREATE INDEX idx_resources_class ON live_class_resources(class_id);
CREATE INDEX idx_resources_shared_by ON live_class_resources(shared_by);

CREATE INDEX idx_webhook_events_class ON zoom_webhook_events(class_id);
CREATE INDEX idx_webhook_events_type ON zoom_webhook_events(event_type);
CREATE INDEX idx_webhook_events_processed ON zoom_webhook_events(processed);

-- Grant appropriate permissions
ALTER TABLE live_classes OWNER TO postgres;
ALTER TABLE live_class_participants OWNER TO postgres;
ALTER TABLE live_class_recordings OWNER TO postgres;
ALTER TABLE recording_access OWNER TO postgres;
ALTER TABLE live_class_interactions OWNER TO postgres;
ALTER TABLE live_class_resources OWNER TO postgres;
ALTER TABLE zoom_webhook_events OWNER TO postgres;
ALTER TABLE zoom_credentials OWNER TO postgres;
