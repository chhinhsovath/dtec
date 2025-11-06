-- Phase 3: Learning Materials/E-Library
-- This migration adds support for teachers to upload course materials and students to access them

-- Create course_materials table
CREATE TABLE IF NOT EXISTS course_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  material_type VARCHAR(50) NOT NULL, -- lecture_notes, textbook, slides, video, reference, assignment
  file_url VARCHAR(255) NOT NULL,
  file_size_mb DECIMAL(10, 2),
  file_type VARCHAR(50), -- pdf, docx, pptx, mp4, etc.
  order_position INTEGER DEFAULT 0, -- for ordering materials within course
  is_published BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP
);

-- Create material_access_logs table (for tracking student views)
CREATE TABLE IF NOT EXISTS material_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES course_materials(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  duration_seconds INTEGER, -- how long they viewed/accessed
  download_count INTEGER DEFAULT 0
);

-- Create course_announcements table
CREATE TABLE IF NOT EXISTS course_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  announcement_type VARCHAR(50) DEFAULT 'info', -- info, warning, important
  pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_course_materials_course ON course_materials(course_id);
CREATE INDEX IF NOT EXISTS idx_course_materials_uploaded_by ON course_materials(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_course_materials_type ON course_materials(material_type);
CREATE INDEX IF NOT EXISTS idx_course_materials_published ON course_materials(is_published);
CREATE INDEX IF NOT EXISTS idx_material_access_material ON material_access_logs(material_id);
CREATE INDEX IF NOT EXISTS idx_material_access_student ON material_access_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_announcements_course ON course_announcements(course_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created_by ON course_announcements(created_by);
CREATE INDEX IF NOT EXISTS idx_announcements_pinned ON course_announcements(pinned);

COMMIT;
