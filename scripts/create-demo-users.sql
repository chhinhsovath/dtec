-- Demo Users for Development
-- Password: demo@123
-- SHA256 Hash: ad5561d2f2034f7a6b73ee5760cbc612cb04480866df0b322bc2af34e31bd3bc
--
-- Run this script against the dtech database to create demo users for testing
-- Usage: PGPASSWORD='P@ssw0rd' psql -h 157.10.73.52 -p 5432 -U admin -d dtech -f create-demo-users.sql

BEGIN;

-- Create demo users if they don't exist
INSERT INTO profiles (id, email, password_hash, full_name, role, created_at, updated_at)
VALUES
  ('student-demo-001', 'student@demo.com', 'ad5561d2f2034f7a6b73ee5760cbc612cb04480866df0b322bc2af34e31bd3bc', 'Demo Student', 'student', NOW(), NOW()),
  ('teacher-demo-001', 'teacher@demo.com', 'ad5561d2f2034f7a6b73ee5760cbc612cb04480866df0b322bc2af34e31bd3bc', 'Demo Teacher', 'teacher', NOW(), NOW()),
  ('admin-demo-001', 'admin@demo.com', 'ad5561d2f2034f7a6b73ee5760cbc612cb04480866df0b322bc2af34e31bd3bc', 'Demo Admin', 'admin', NOW(), NOW()),
  ('parent-demo-001', 'parent@demo.com', 'ad5561d2f2034f7a6b73ee5760cbc612cb04480866df0b322bc2af34e31bd3bc', 'Demo Parent', 'parent', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

COMMIT;

-- Verify the inserts
SELECT email, role, full_name FROM profiles WHERE email LIKE '%demo%' ORDER BY role;
