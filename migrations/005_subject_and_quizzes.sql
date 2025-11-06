-- Phase 4: Subject Management, Course Outline, and Quiz System
-- Adds subjects, course structure, quiz/exam system with auto-grading

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create course modules/sections
CREATE TABLE IF NOT EXISTS course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  order_position INTEGER DEFAULT 0,
  duration_days INTEGER,
  learning_objectives TEXT[], -- array of learning objectives
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create quizzes/exams
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES course_modules(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  quiz_type VARCHAR(50) NOT NULL, -- quiz, exam, practice, assignment
  total_questions INTEGER,
  total_points DECIMAL(10, 2),
  passing_score DECIMAL(10, 2),
  time_limit_minutes INTEGER, -- null = unlimited
  show_answers_after_submit BOOLEAN DEFAULT false,
  show_score_immediately BOOLEAN DEFAULT true,
  shuffle_questions BOOLEAN DEFAULT true,
  random_selection BOOLEAN DEFAULT false,
  number_of_random_questions INTEGER,
  due_date TIMESTAMP,
  available_from TIMESTAMP,
  available_until TIMESTAMP,
  is_published BOOLEAN DEFAULT false,
  allow_review BOOLEAN DEFAULT true,
  attempts_allowed INTEGER DEFAULT 1, -- 0 = unlimited
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create quiz questions
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL, -- multiple_choice, true_false, short_answer, essay
  points DECIMAL(10, 2) DEFAULT 1,
  order_position INTEGER DEFAULT 0,
  difficulty_level VARCHAR(20), -- easy, medium, hard
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create quiz answer options
CREATE TABLE IF NOT EXISTS quiz_answer_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  order_position INTEGER DEFAULT 0,
  feedback TEXT, -- feedback for this option
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create student quiz attempts
CREATE TABLE IF NOT EXISTS student_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  attempt_number INTEGER DEFAULT 1,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  total_score DECIMAL(10, 2),
  percentage_score DECIMAL(5, 2),
  passed BOOLEAN,
  status VARCHAR(50) DEFAULT 'in_progress', -- in_progress, submitted, graded
  time_spent_seconds INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create student quiz answers
CREATE TABLE IF NOT EXISTS student_quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES student_quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES quiz_answer_options(id) ON DELETE SET NULL,
  answer_text TEXT, -- for essay/short answer
  is_correct BOOLEAN,
  points_earned DECIMAL(10, 2),
  feedback TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update courses table to add subject_id
ALTER TABLE courses ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(code);
CREATE INDEX IF NOT EXISTS idx_courses_subject ON courses(subject_id);
CREATE INDEX IF NOT EXISTS idx_modules_course ON course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_course ON quizzes(course_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_module ON quizzes(module_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_answer_options_question ON quiz_answer_options(question_id);
CREATE INDEX IF NOT EXISTS idx_attempts_quiz ON student_quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_attempts_student ON student_quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_attempts_status ON student_quiz_attempts(status);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_attempt ON student_quiz_answers(attempt_id);

COMMIT;
