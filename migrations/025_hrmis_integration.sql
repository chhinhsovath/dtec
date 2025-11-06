-- Phase 8: HRMIS Integration & Advanced Features
-- Tables for API integrations, external system connections, and advanced AI features

-- API integrations
CREATE TABLE IF NOT EXISTS api_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  service_name VARCHAR(100) NOT NULL, -- hrmis, google_classroom, zoom, etc.
  api_endpoint VARCHAR(500),
  api_key_encrypted VARCHAR(500), -- Encrypted API key
  is_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP,
  sync_status VARCHAR(50), -- success, failed, in_progress
  sync_error_message TEXT,
  configuration JSONB, -- Additional configuration for the integration
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  UNIQUE(institution_id, service_name)
);

-- Integration sync logs
CREATE TABLE IF NOT EXISTS integration_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES api_integrations(id) ON DELETE CASCADE,
  sync_type VARCHAR(50), -- full, incremental, specific
  records_processed INTEGER DEFAULT 0,
  records_succeeded INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  status VARCHAR(50), -- running, completed, failed
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI/ML models
CREATE TABLE IF NOT EXISTS ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  model_type VARCHAR(50) NOT NULL, -- student_performance_prediction, recommendation_engine, etc.
  model_name VARCHAR(255),
  model_version VARCHAR(50),
  model_status VARCHAR(50), -- active, training, archived
  accuracy_score DECIMAL(5, 2),
  last_trained TIMESTAMP,
  is_enabled BOOLEAN DEFAULT false,
  configuration JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AI predictions/recommendations
CREATE TABLE IF NOT EXISTS ai_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  model_id UUID REFERENCES ai_models(id) ON DELETE SET NULL,
  prediction_type VARCHAR(50), -- dropout_risk, performance_prediction, course_recommendation
  prediction_value DECIMAL(5, 2),
  confidence_score DECIMAL(5, 2),
  recommendation TEXT,
  recommendation_km TEXT,
  is_actionable BOOLEAN DEFAULT false,
  actioned_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- External user mappings (for HRMIS sync)
CREATE TABLE IF NOT EXISTS external_user_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES api_integrations(id) ON DELETE CASCADE,
  external_user_id VARCHAR(255) NOT NULL,
  external_user_data JSONB, -- Cached external user data
  is_synced BOOLEAN DEFAULT true,
  last_synced TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(profile_id, integration_id)
);

-- System audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action_type VARCHAR(50) NOT NULL, -- create, update, delete, login, export, etc.
  resource_type VARCHAR(50), -- user, course, grade, etc.
  resource_id UUID,
  changes JSONB, -- Before/after changes
  ip_address VARCHAR(50),
  user_agent TEXT,
  status VARCHAR(50), -- success, failed
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- System settings & configurations
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  setting_key VARCHAR(100) NOT NULL,
  setting_value VARCHAR(500),
  setting_type VARCHAR(50), -- string, boolean, integer, json
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(institution_id, setting_key)
);

-- Custom fields (flexible data storage)
CREATE TABLE IF NOT EXISTS custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL, -- student, course, etc.
  field_name VARCHAR(100) NOT NULL,
  field_name_km VARCHAR(100),
  field_type VARCHAR(50) NOT NULL, -- text, number, date, dropdown, etc.
  field_options JSONB, -- For dropdowns, radio buttons, etc.
  is_required BOOLEAN DEFAULT false,
  order_index INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  UNIQUE(institution_id, entity_type, field_name)
);

-- Custom field values (stores custom field data for entities)
CREATE TABLE IF NOT EXISTS custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_field_id UUID NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  field_value TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Mobile app tokens (for mobile app authentication)
CREATE TABLE IF NOT EXISTS mobile_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL,
  device_type VARCHAR(50), -- ios, android, etc.
  app_version VARCHAR(20),
  fcm_token VARCHAR(500), -- Firebase Cloud Messaging token for push notifications
  is_active BOOLEAN DEFAULT true,
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Push notifications
CREATE TABLE IF NOT EXISTS push_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  title_km VARCHAR(255),
  body TEXT,
  body_km TEXT,
  action_url VARCHAR(500),
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_api_integrations_institution_id ON api_integrations(institution_id);
CREATE INDEX idx_api_integrations_service_name ON api_integrations(service_name);
CREATE INDEX idx_integration_sync_logs_integration_id ON integration_sync_logs(integration_id);
CREATE INDEX idx_integration_sync_logs_completed_at ON integration_sync_logs(completed_at);
CREATE INDEX idx_ai_models_institution_id ON ai_models(institution_id);
CREATE INDEX idx_ai_predictions_student_id ON ai_predictions(student_id);
CREATE INDEX idx_ai_predictions_prediction_type ON ai_predictions(prediction_type);
CREATE INDEX idx_external_user_mappings_profile_id ON external_user_mappings(profile_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_system_settings_institution_id ON system_settings(institution_id);
CREATE INDEX idx_custom_fields_institution_id ON custom_fields(institution_id);
CREATE INDEX idx_mobile_tokens_user_id ON mobile_tokens(user_id);
CREATE INDEX idx_push_notifications_user_id ON push_notifications(user_id);

-- RLS Policies
ALTER TABLE api_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage integrations
CREATE POLICY api_integrations_select ON api_integrations FOR SELECT USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Allow viewing own AI predictions
CREATE POLICY ai_predictions_select ON ai_predictions FOR SELECT USING (
  student_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'teacher')
);

-- Allow admins to view audit logs
CREATE POLICY audit_logs_select ON audit_logs FOR SELECT USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Allow viewing own system settings
CREATE POLICY system_settings_select ON system_settings FOR SELECT USING (
  is_public = true OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
