-- Phase 6: Learning Delivery & Progress Tracking
-- Tables for self-paced learning, progress tracking, and analytics

-- Learning modules
CREATE TABLE IF NOT EXISTS learning_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  title_km VARCHAR(255),
  description TEXT,
  description_km TEXT,
  content TEXT,
  content_km TEXT,
  module_type VARCHAR(50), -- lesson, assignment, quiz, video, reading
  order_index INTEGER NOT NULL,
  duration_minutes INTEGER,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Module resources
CREATE TABLE IF NOT EXISTS module_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
  resource_url VARCHAR(500) NOT NULL,
  resource_type VARCHAR(50), -- video, pdf, link, image, etc.
  title VARCHAR(255),
  description TEXT,
  order_index INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Student progress tracking
CREATE TABLE IF NOT EXISTS student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  completion_percentage INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  time_spent_minutes INTEGER DEFAULT 0,
  last_accessed TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, module_id)
);

-- Course progress (overall course completion)
CREATE TABLE IF NOT EXISTS course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  overall_completion_percentage INTEGER DEFAULT 0,
  modules_completed INTEGER DEFAULT 0,
  modules_total INTEGER DEFAULT 0,
  last_accessed TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- Learning analytics events
CREATE TABLE IF NOT EXISTS learning_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES learning_modules(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL, -- view, click, complete, submit, etc.
  activity_data JSONB, -- Additional data specific to activity
  duration_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Learning paths (personalized curriculum)
CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  name_km VARCHAR(255),
  description TEXT,
  description_km TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Learning path modules (sequence of modules for a path)
CREATE TABLE IF NOT EXISTS learning_path_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  is_optional BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Student learning path enrollment
CREATE TABLE IF NOT EXISTS student_learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  learning_path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  progress_percentage INTEGER DEFAULT 0,
  enrolled_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, learning_path_id)
);

-- Indexes
CREATE INDEX idx_learning_modules_course_id ON learning_modules(course_id);
CREATE INDEX idx_module_resources_module_id ON module_resources(module_id);
CREATE INDEX idx_student_progress_student_id ON student_progress(student_id);
CREATE INDEX idx_student_progress_module_id ON student_progress(module_id);
CREATE INDEX idx_student_progress_course_id ON student_progress(course_id);
CREATE INDEX idx_course_progress_student_id ON course_progress(student_id);
CREATE INDEX idx_course_progress_course_id ON course_progress(course_id);
CREATE INDEX idx_learning_analytics_student_id ON learning_analytics(student_id);
CREATE INDEX idx_learning_analytics_activity_type ON learning_analytics(activity_type);
CREATE INDEX idx_learning_path_modules_learning_path_id ON learning_path_modules(learning_path_id);
CREATE INDEX idx_student_learning_paths_student_id ON student_learning_paths(student_id);

-- RLS Policies
ALTER TABLE learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_analytics ENABLE ROW LEVEL SECURITY;

-- Allow viewing modules for enrolled students
CREATE POLICY learning_modules_select ON learning_modules FOR SELECT USING (
  auth.uid() IS NOT NULL
);

-- Allow viewing own progress
CREATE POLICY student_progress_select ON student_progress FOR SELECT USING (
  student_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'teacher')
);

-- Allow viewing own learning analytics
CREATE POLICY learning_analytics_select ON learning_analytics FOR SELECT USING (
  student_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'teacher')
);
