-- Phase 2.1: Assignment System Migration
-- This migration adds support for assignments, student submissions, and grading

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date TIMESTAMP NOT NULL,
  max_score DECIMAL(5,2) DEFAULT 100,
  status VARCHAR(50) DEFAULT 'active', -- active, closed, archived
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create assignment_submissions table
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  submission_text TEXT,
  file_url VARCHAR(255),
  submitted_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'draft', -- draft, submitted, graded
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(assignment_id, student_id)
);

-- Create grades table
CREATE TABLE IF NOT EXISTS grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_submission_id UUID NOT NULL REFERENCES assignment_submissions(id) ON DELETE CASCADE,
  score DECIMAL(5,2),
  feedback TEXT,
  graded_at TIMESTAMP,
  graded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assignments_course ON assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher ON assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);

CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON assignment_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON assignment_submissions(submitted_at);

CREATE INDEX IF NOT EXISTS idx_grades_submission ON grades(assignment_submission_id);
CREATE INDEX IF NOT EXISTS idx_grades_graded_by ON grades(graded_by);
CREATE INDEX IF NOT EXISTS idx_grades_graded_at ON grades(graded_at);

COMMIT;
