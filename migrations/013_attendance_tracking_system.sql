-- Migration: Attendance Tracking System
-- Date: November 2024
-- Description: Complete attendance tracking with QR codes, marking, and statistics

-- Class Sessions table
CREATE TABLE IF NOT EXISTS class_sessions (
  session_id BIGSERIAL PRIMARY KEY,
  course_id BIGINT NOT NULL,
  class_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  topic VARCHAR(255),
  room_location VARCHAR(255),
  instructor_id BIGINT,
  max_attendees INT,
  qr_code_token VARCHAR(255) UNIQUE, -- unique token for QR code
  qr_code_expires_at TIMESTAMP,
  is_cancelled BOOLEAN DEFAULT FALSE,
  cancellation_reason TEXT,
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
  FOREIGN KEY (instructor_id) REFERENCES profiles(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- Attendance Records table
CREATE TABLE IF NOT EXISTS attendance_records (
  attendance_id BIGSERIAL PRIMARY KEY,
  session_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  status VARCHAR(20) DEFAULT 'absent', -- present, absent, late, excused
  marking_method VARCHAR(20), -- qr_code, manual, mobile, api
  marked_by BIGINT, -- who marked the attendance
  marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  location_latitude DECIMAL(10, 8),
  location_longitude DECIMAL(10, 8),
  distance_from_class DECIMAL(8, 2), -- in meters
  notes TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by BIGINT,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, student_id),
  FOREIGN KEY (session_id) REFERENCES class_sessions(session_id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (marked_by) REFERENCES profiles(id) ON DELETE SET NULL,
  FOREIGN KEY (verified_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- Attendance Statistics table (cached for performance)
CREATE TABLE IF NOT EXISTS attendance_statistics (
  statistic_id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL,
  course_id BIGINT,
  total_classes INT DEFAULT 0,
  present_count INT DEFAULT 0,
  absent_count INT DEFAULT 0,
  late_count INT DEFAULT 0,
  excused_count INT DEFAULT 0,
  attendance_percentage DECIMAL(5, 2) DEFAULT 0.00,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, course_id),
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE SET NULL
);

-- Attendance Exemptions table (for excused absences)
CREATE TABLE IF NOT EXISTS attendance_exemptions (
  exemption_id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL,
  course_id BIGINT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason VARCHAR(255) NOT NULL,
  exemption_type VARCHAR(50), -- illness, family, university_event, other
  supporting_document_url VARCHAR(500),
  is_approved BOOLEAN DEFAULT FALSE,
  approved_by BIGINT,
  approved_at TIMESTAMP,
  notes TEXT,
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by) REFERENCES profiles(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- Attendance Alerts table (for low attendance warnings)
CREATE TABLE IF NOT EXISTS attendance_alerts (
  alert_id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL,
  course_id BIGINT,
  attendance_percentage DECIMAL(5, 2),
  alert_threshold INT, -- e.g., 80 means alert when below 80%
  alert_type VARCHAR(50), -- warning, critical
  is_sent BOOLEAN DEFAULT FALSE,
  sent_to BIGINT, -- parent/guardian ID
  sent_at TIMESTAMP,
  acknowledged_by BIGINT,
  acknowledged_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE SET NULL,
  FOREIGN KEY (sent_to) REFERENCES profiles(id) ON DELETE SET NULL,
  FOREIGN KEY (acknowledged_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- QR Code Tokens table (for tracking used codes)
CREATE TABLE IF NOT EXISTS qr_code_tokens (
  token_id BIGSERIAL PRIMARY KEY,
  session_id BIGINT NOT NULL,
  token_string VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  FOREIGN KEY (session_id) REFERENCES class_sessions(session_id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_class_sessions_course ON class_sessions(course_id);
CREATE INDEX idx_class_sessions_date ON class_sessions(class_date);
CREATE INDEX idx_class_sessions_instructor ON class_sessions(instructor_id);
CREATE INDEX idx_class_sessions_qr_token ON class_sessions(qr_code_token);

CREATE INDEX idx_attendance_records_session ON attendance_records(session_id);
CREATE INDEX idx_attendance_records_student ON attendance_records(student_id);
CREATE INDEX idx_attendance_records_status ON attendance_records(status);
CREATE INDEX idx_attendance_records_marked_at ON attendance_records(marked_at);
CREATE INDEX idx_attendance_records_marking_method ON attendance_records(marking_method);
CREATE INDEX idx_attendance_records_composite ON attendance_records(student_id, status);

CREATE INDEX idx_attendance_statistics_student ON attendance_statistics(student_id);
CREATE INDEX idx_attendance_statistics_course ON attendance_statistics(course_id);
CREATE INDEX idx_attendance_statistics_percentage ON attendance_statistics(attendance_percentage);

CREATE INDEX idx_attendance_exemptions_student ON attendance_exemptions(student_id);
CREATE INDEX idx_attendance_exemptions_course ON attendance_exemptions(course_id);
CREATE INDEX idx_attendance_exemptions_dates ON attendance_exemptions(start_date, end_date);
CREATE INDEX idx_attendance_exemptions_approved ON attendance_exemptions(is_approved);

CREATE INDEX idx_attendance_alerts_student ON attendance_alerts(student_id);
CREATE INDEX idx_attendance_alerts_course ON attendance_alerts(course_id);
CREATE INDEX idx_attendance_alerts_sent ON attendance_alerts(is_sent);

CREATE INDEX idx_qr_tokens_session ON qr_code_tokens(session_id);
CREATE INDEX idx_qr_tokens_expires ON qr_code_tokens(expires_at);

-- Grant permissions
ALTER TABLE class_sessions OWNER TO postgres;
ALTER TABLE attendance_records OWNER TO postgres;
ALTER TABLE attendance_statistics OWNER TO postgres;
ALTER TABLE attendance_exemptions OWNER TO postgres;
ALTER TABLE attendance_alerts OWNER TO postgres;
ALTER TABLE qr_code_tokens OWNER TO postgres;
