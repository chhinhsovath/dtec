-- Phase 2.2: Student Registration Workflow
-- This migration adds support for multi-step student registration with document uploads

-- Create registration_requests table
CREATE TABLE IF NOT EXISTS registration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  phone_number VARCHAR(20),
  address TEXT,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  id_document_url VARCHAR(255),
  transcript_url VARCHAR(255),
  proof_of_address_url VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, completed
  current_step INTEGER DEFAULT 1, -- 1: basic info, 2: documents, 3: review
  submitted_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for status and institution lookups
CREATE INDEX IF NOT EXISTS idx_registration_status ON registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_registration_institution ON registration_requests(institution_id);
CREATE INDEX IF NOT EXISTS idx_registration_email ON registration_requests(email);
CREATE INDEX IF NOT EXISTS idx_registration_submitted_at ON registration_requests(submitted_at);
CREATE INDEX IF NOT EXISTS idx_registration_reviewed_by ON registration_requests(reviewed_by);

COMMIT;
