-- Phase 7: Reporting & Analytics
-- Tables for comprehensive reporting, dashboards, and data analysis

-- Report templates
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  name_km VARCHAR(255),
  report_type VARCHAR(50) NOT NULL, -- student_performance, course_effectiveness, attendance, grades, enrollment
  description TEXT,
  description_km TEXT,
  template_config JSONB, -- Configuration for the report
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Generated reports
CREATE TABLE IF NOT EXISTS generated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES report_templates(id) ON DELETE SET NULL,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  report_title VARCHAR(255) NOT NULL,
  report_title_km VARCHAR(255),
  report_type VARCHAR(50) NOT NULL,
  report_data JSONB, -- Actual report data
  filters JSONB, -- Filters used to generate the report
  generated_at TIMESTAMP DEFAULT NOW(),
  generated_by UUID REFERENCES profiles(id),
  file_url VARCHAR(500), -- URL to downloadable report file
  created_at TIMESTAMP DEFAULT NOW()
);

-- Dashboard configurations
CREATE TABLE IF NOT EXISTS dashboard_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  dashboard_type VARCHAR(50) NOT NULL, -- student, teacher, admin
  widget_config JSONB, -- Configuration of widgets displayed
  layout_config JSONB, -- Layout of dashboard
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, dashboard_type)
);

-- Dashboard widgets (pre-built charts/stats)
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_config_id UUID REFERENCES dashboard_configs(id) ON DELETE CASCADE,
  widget_type VARCHAR(50) NOT NULL, -- student_count, course_progress, grades, attendance, etc.
  widget_title VARCHAR(255),
  widget_title_km VARCHAR(255),
  widget_config JSONB,
  order_index INTEGER,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Analytics events (for comprehensive tracking)
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- login, course_view, assignment_submit, etc.
  event_data JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Course performance metrics
CREATE TABLE IF NOT EXISTS course_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  total_students INTEGER DEFAULT 0,
  average_grade DECIMAL(5, 2),
  completion_rate DECIMAL(5, 2),
  attendance_rate DECIMAL(5, 2),
  dropout_count INTEGER DEFAULT 0,
  calculated_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Student performance metrics
CREATE TABLE IF NOT EXISTS student_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  overall_gpa DECIMAL(4, 2),
  courses_completed INTEGER DEFAULT 0,
  courses_in_progress INTEGER DEFAULT 0,
  average_completion_time DECIMAL(8, 2),
  calculated_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Data exports history
CREATE TABLE IF NOT EXISTS data_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_type VARCHAR(50) NOT NULL, -- student_list, grades, attendance, etc.
  export_format VARCHAR(20) NOT NULL, -- csv, xlsx, pdf, json
  filters JSONB, -- Filters applied
  file_url VARCHAR(500),
  file_size_bytes INTEGER,
  record_count INTEGER,
  requested_by UUID REFERENCES profiles(id),
  requested_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  expires_at TIMESTAMP -- When the file will be deleted
);

-- Indexes
CREATE INDEX idx_report_templates_institution_id ON report_templates(institution_id);
CREATE INDEX idx_generated_reports_institution_id ON generated_reports(institution_id);
CREATE INDEX idx_generated_reports_generated_at ON generated_reports(generated_at);
CREATE INDEX idx_dashboard_configs_user_id ON dashboard_configs(user_id);
CREATE INDEX idx_dashboard_widgets_dashboard_config_id ON dashboard_widgets(dashboard_config_id);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX idx_course_metrics_course_id ON course_metrics(course_id);
CREATE INDEX idx_student_metrics_student_id ON student_metrics(student_id);
CREATE INDEX idx_data_exports_requested_at ON data_exports(requested_at);

-- RLS Policies
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow admins to view all reports and templates
CREATE POLICY report_templates_select ON report_templates FOR SELECT USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Allow admins to view all generated reports
CREATE POLICY generated_reports_select ON generated_reports FOR SELECT USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'teacher')
);

-- Allow users to view own dashboard configs
CREATE POLICY dashboard_configs_select ON dashboard_configs FOR SELECT USING (
  user_id = auth.uid()
);

-- Allow admins to view analytics
CREATE POLICY analytics_events_select ON analytics_events FOR SELECT USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
