-- Phase 3: Course Management System
-- Tables for course creation, materials, schedules, and teacher assignments

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  title_km VARCHAR(255),
  description TEXT,
  description_km TEXT,
  credits INTEGER DEFAULT 3,
  semester INTEGER,
  academic_year VARCHAR(4),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Course schedules
CREATE TABLE IF NOT EXISTS course_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  day_of_week VARCHAR(10) NOT NULL, -- Monday, Tuesday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location VARCHAR(255),
  room_number VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Course materials
CREATE TABLE IF NOT EXISTS course_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  title_km VARCHAR(255),
  description TEXT,
  description_km TEXT,
  file_url VARCHAR(500),
  file_type VARCHAR(50),
  material_type VARCHAR(50), -- lecture, reading, video, document, etc.
  upload_date TIMESTAMP DEFAULT NOW(),
  order_index INTEGER,
  created_by UUID REFERENCES profiles(id)
);

-- Teacher course assignments
CREATE TABLE IF NOT EXISTS teacher_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'instructor', -- instructor, teaching_assistant
  assigned_date TIMESTAMP DEFAULT NOW(),
  UNIQUE(course_id, teacher_id)
);

-- Course prerequisites
CREATE TABLE IF NOT EXISTS course_prerequisites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  prerequisite_course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE(course_id, prerequisite_course_id)
);

-- Indexes for performance
CREATE INDEX idx_courses_institution_id ON courses(institution_id);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_course_schedules_course_id ON course_schedules(course_id);
CREATE INDEX idx_course_materials_course_id ON course_materials(course_id);
CREATE INDEX idx_teacher_courses_course_id ON teacher_courses(course_id);
CREATE INDEX idx_teacher_courses_teacher_id ON teacher_courses(teacher_id);
CREATE INDEX idx_course_prerequisites_course_id ON course_prerequisites(course_id);

-- RLS Policies
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_prerequisites ENABLE ROW LEVEL SECURITY;

-- Allow admins and teachers to view courses
CREATE POLICY courses_select ON courses FOR SELECT USING (
  auth.uid() IS NOT NULL
);

-- Allow admins to manage courses
CREATE POLICY courses_insert ON courses FOR INSERT WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'teacher')
);

CREATE POLICY courses_update ON courses FOR UPDATE USING (
  created_by = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Allow viewing course materials
CREATE POLICY course_materials_select ON course_materials FOR SELECT USING (
  auth.uid() IS NOT NULL
);

-- Allow viewing teacher course assignments
CREATE POLICY teacher_courses_select ON teacher_courses FOR SELECT USING (
  auth.uid() IS NOT NULL
);
