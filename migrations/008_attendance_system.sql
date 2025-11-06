-- Migration: Attendance Tracking System
-- Date: November 5, 2024
-- Description: Adds tables for attendance tracking, QR codes, and statistics

-- Class sessions table (instances of scheduled classes)
CREATE TABLE IF NOT EXISTS class_sessions (
  session_id BIGSERIAL PRIMARY KEY,
  course_id BIGINT NOT NULL,
  class_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  topic VARCHAR(255),
  qr_code_token VARCHAR(100) UNIQUE,
  qr_code_expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_by BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- Attendance records (student marking per session)
CREATE TABLE IF NOT EXISTS attendance_records (
  attendance_id BIGSERIAL PRIMARY KEY,
  class_session_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  course_id BIGINT NOT NULL,
  marked_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'absent', -- present, absent, late, excused
  marked_by BIGINT, -- teacher_id who marked
  marking_method VARCHAR(20), -- qr_code, manual, mobile, auto
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  marked_via_device VARCHAR(100), -- device info for tracking
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_session_id) REFERENCES class_sessions(session_id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
  FOREIGN KEY (marked_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- Attendance exemptions (excused absences)
CREATE TABLE IF NOT EXISTS attendance_exemptions (
  exemption_id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL,
  class_session_id BIGINT,
  course_id BIGINT,
  reason VARCHAR(255) NOT NULL,
  exemption_date DATE NOT NULL,
  approved_by BIGINT,
  approval_status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  evidence_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (class_session_id) REFERENCES class_sessions(session_id) ON DELETE SET NULL,
  FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- Attendance statistics (cached for performance)
CREATE TABLE IF NOT EXISTS attendance_statistics (
  stat_id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL,
  course_id BIGINT NOT NULL,
  total_classes INT DEFAULT 0,
  classes_attended INT DEFAULT 0,
  classes_absent INT DEFAULT 0,
  classes_late INT DEFAULT 0,
  classes_excused INT DEFAULT 0,
  attendance_percentage DECIMAL(5, 2) DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
  UNIQUE(student_id, course_id)
);

-- Create indexes for performance
CREATE INDEX idx_class_sessions_course ON class_sessions(course_id);
CREATE INDEX idx_class_sessions_date ON class_sessions(class_date);
CREATE INDEX idx_class_sessions_active ON class_sessions(is_active);
CREATE INDEX idx_class_sessions_qr_token ON class_sessions(qr_code_token);

CREATE INDEX idx_attendance_records_student ON attendance_records(student_id);
CREATE INDEX idx_attendance_records_course ON attendance_records(course_id);
CREATE INDEX idx_attendance_records_session ON attendance_records(class_session_id);
CREATE INDEX idx_attendance_records_status ON attendance_records(status);
CREATE INDEX idx_attendance_records_created ON attendance_records(created_at);

CREATE INDEX idx_attendance_exemptions_student ON attendance_exemptions(student_id);
CREATE INDEX idx_attendance_exemptions_status ON attendance_exemptions(approval_status);
CREATE INDEX idx_attendance_exemptions_date ON attendance_exemptions(exemption_date);

CREATE INDEX idx_attendance_statistics_student ON attendance_statistics(student_id);
CREATE INDEX idx_attendance_statistics_course ON attendance_statistics(course_id);

-- Grant appropriate permissions
ALTER TABLE class_sessions OWNER TO postgres;
ALTER TABLE attendance_records OWNER TO postgres;
ALTER TABLE attendance_exemptions OWNER TO postgres;
ALTER TABLE attendance_statistics OWNER TO postgres;
