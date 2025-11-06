-- Add password_hash column to profiles table
-- This migration adds password authentication support to the profiles table

ALTER TABLE profiles ADD COLUMN password_hash VARCHAR(255);

-- Create seed data with test user credentials for development
-- Email: teacher@test.com
-- Password: password123
-- Password hash (SHA256): ef92b778bafe771e89245d171bafcd62f4d4141c608f2814eef2d5411b8f9aaf

INSERT INTO profiles (id, email, full_name, role, password_hash, created_at, updated_at)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'teacher@test.com', 'Teacher User', 'teacher', 'ef92b778bafe771e89245d171bafcd62f4d4141c608f2814eef2d5411b8f9aaf', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'student@test.com', 'Student User', 'student', 'ef92b778bafe771e89245d171bafcd62f4d4141c608f2814eef2d5411b8f9aaf', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440003', 'admin@test.com', 'Admin User', 'admin', 'ef92b778bafe771e89245d171bafcd62f4d4141c608f2814eef2d5411b8f9aaf', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;
