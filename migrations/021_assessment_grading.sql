-- Phase 4: Assessment & Grading System
-- Tables for quizzes, exams, automated grading, and grade management

-- Assessments
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  title_km VARCHAR(255),
  description TEXT,
  description_km TEXT,
  assessment_type VARCHAR(50) NOT NULL, -- quiz, assignment, exam, project
  due_date TIMESTAMP,
  total_points INTEGER DEFAULT 100,
  is_graded BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'draft', -- draft, published, closed
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Questions
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_text_km TEXT,
  question_type VARCHAR(50) NOT NULL, -- multiple_choice, short_answer, essay
  points INTEGER DEFAULT 1,
  order_index INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Question options (for multiple choice)
CREATE TABLE IF NOT EXISTS question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  option_text_km TEXT,
  is_correct BOOLEAN DEFAULT false,
  order_index INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Student submissions
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  submitted_at TIMESTAMP,
  answers JSONB, -- Stores all answers in JSON format
  status VARCHAR(50) DEFAULT 'in_progress', -- in_progress, submitted, graded
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(assessment_id, student_id)
);

-- Grades
CREATE TABLE IF NOT EXISTS grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  score DECIMAL(5, 2),
  max_score INTEGER DEFAULT 100,
  percentage DECIMAL(5, 2),
  grade_letter VARCHAR(2), -- A, B, C, D, F
  feedback TEXT,
  feedback_km TEXT,
  graded_by UUID REFERENCES profiles(id),
  graded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Grade scales (for different grading systems)
CREATE TABLE IF NOT EXISTS grade_scales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  name_km VARCHAR(100),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Grade scale entries (A: 90-100, B: 80-89, etc.)
CREATE TABLE IF NOT EXISTS grade_scale_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_scale_id UUID NOT NULL REFERENCES grade_scales(id) ON DELETE CASCADE,
  grade_letter VARCHAR(2) NOT NULL,
  min_percentage DECIMAL(5, 2) NOT NULL,
  max_percentage DECIMAL(5, 2) NOT NULL,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_assessments_course_id ON assessments(course_id);
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_questions_assessment_id ON questions(assessment_id);
CREATE INDEX idx_submissions_assessment_id ON submissions(assessment_id);
CREATE INDEX idx_submissions_student_id ON submissions(student_id);
CREATE INDEX idx_grades_assessment_id ON grades(assessment_id);
CREATE INDEX idx_grades_student_id ON grades(student_id);
CREATE INDEX idx_grades_course_id ON grades(course_id);

-- RLS Policies
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

-- Allow viewing published assessments
CREATE POLICY assessments_select ON assessments FOR SELECT USING (
  status = 'published' OR created_by = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Allow viewing own submissions
CREATE POLICY submissions_select ON submissions FOR SELECT USING (
  student_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'teacher')
);

-- Allow students to view own grades
CREATE POLICY grades_select ON grades FOR SELECT USING (
  student_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'teacher')
);
