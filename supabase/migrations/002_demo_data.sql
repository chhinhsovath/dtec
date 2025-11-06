-- TEC LMS Demo Data Migration
-- This file populates the database with realistic demo data for testing
-- Safe to run multiple times (uses INSERT ... ON CONFLICT for idempotency)
-- Created: November 4, 2024

BEGIN;

-- =====================================================
-- 1. CREATE TEST USERS IN AUTH SCHEMA
-- =====================================================
-- Note: These UUIDs are fixed for consistency across environments

-- Admin User
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'admin@test.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Teacher User
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
    '22222222-2222-2222-2222-222222222222'::uuid,
    'teacher@test.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Student 1
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
    '33333333-3333-3333-3333-333333333333'::uuid,
    'alice@test.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Student 2
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
    '44444444-4444-4444-4444-444444444444'::uuid,
    'bob@test.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Student 3
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
    '55555555-5555-5555-5555-555555555555'::uuid,
    'charlie@test.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Student 4
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
    '66666666-6666-6666-6666-666666666666'::uuid,
    'diana@test.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- 2. CREATE INSTITUTION
-- =====================================================

INSERT INTO institutions (id, name, settings, created_at, updated_at)
VALUES (
    'aaaaaaaa-bbbb-cccc-dddd-aaaaaaaaaaaa'::uuid,
    'Technology Enhanced Classroom (TEC)',
    '{"country": "Cambodia", "language": "Khmer"}',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. CREATE USER PROFILES
-- =====================================================

-- Admin Profile (trigger should create this, but explicit for safety)
INSERT INTO profiles (id, user_id, first_name, last_name, avatar_url, role, created_at, updated_at)
VALUES (
    'bbbb1111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'John',
    'Admin',
    NULL,
    'admin',
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET
    first_name = 'John',
    last_name = 'Admin',
    role = 'admin';

-- Teacher Profile
INSERT INTO profiles (id, user_id, first_name, last_name, avatar_url, role, created_at, updated_at)
VALUES (
    'bbbb2222-2222-2222-2222-222222222222'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    'Sarah',
    'Teacher',
    NULL,
    'teacher',
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET
    first_name = 'Sarah',
    last_name = 'Teacher',
    role = 'teacher';

-- Student 1 Profile (Alice)
INSERT INTO profiles (id, user_id, first_name, last_name, avatar_url, role, created_at, updated_at)
VALUES (
    'bbbb3333-3333-3333-3333-333333333333'::uuid,
    '33333333-3333-3333-3333-333333333333'::uuid,
    'Alice',
    'Johnson',
    NULL,
    'student',
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET
    first_name = 'Alice',
    last_name = 'Johnson',
    role = 'student';

-- Student 2 Profile (Bob)
INSERT INTO profiles (id, user_id, first_name, last_name, avatar_url, role, created_at, updated_at)
VALUES (
    'bbbb4444-4444-4444-4444-444444444444'::uuid,
    '44444444-4444-4444-4444-444444444444'::uuid,
    'Bob',
    'Smith',
    NULL,
    'student',
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET
    first_name = 'Bob',
    last_name = 'Smith',
    role = 'student';

-- Student 3 Profile (Charlie)
INSERT INTO profiles (id, user_id, first_name, last_name, avatar_url, role, created_at, updated_at)
VALUES (
    'bbbb5555-5555-5555-5555-555555555555'::uuid,
    '55555555-5555-5555-5555-555555555555'::uuid,
    'Charlie',
    'Brown',
    NULL,
    'student',
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET
    first_name = 'Charlie',
    last_name = 'Brown',
    role = 'student';

-- Student 4 Profile (Diana)
INSERT INTO profiles (id, user_id, first_name, last_name, avatar_url, role, created_at, updated_at)
VALUES (
    'bbbb6666-6666-6666-6666-666666666666'::uuid,
    '66666666-6666-6666-6666-666666666666'::uuid,
    'Diana',
    'Davis',
    NULL,
    'student',
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET
    first_name = 'Diana',
    last_name = 'Davis',
    role = 'student';

-- =====================================================
-- 4. CREATE USER-INSTITUTION RELATIONSHIPS
-- =====================================================

INSERT INTO user_institutions (id, user_id, institution_id, role, created_at)
VALUES
    ('cccc1111-1111-1111-1111-111111111111'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'aaaaaaaa-bbbb-cccc-dddd-aaaaaaaaaaaa'::uuid, 'admin', NOW()),
    ('cccc2222-2222-2222-2222-222222222222'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'aaaaaaaa-bbbb-cccc-dddd-aaaaaaaaaaaa'::uuid, 'instructor', NOW()),
    ('cccc3333-3333-3333-3333-333333333333'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'aaaaaaaa-bbbb-cccc-dddd-aaaaaaaaaaaa'::uuid, 'student', NOW()),
    ('cccc4444-4444-4444-4444-444444444444'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, 'aaaaaaaa-bbbb-cccc-dddd-aaaaaaaaaaaa'::uuid, 'student', NOW()),
    ('cccc5555-5555-5555-5555-555555555555'::uuid, '55555555-5555-5555-5555-555555555555'::uuid, 'aaaaaaaa-bbbb-cccc-dddd-aaaaaaaaaaaa'::uuid, 'student', NOW()),
    ('cccc6666-6666-6666-6666-666666666666'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 'aaaaaaaa-bbbb-cccc-dddd-aaaaaaaaaaaa'::uuid, 'student', NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. CREATE STUDENT RECORDS
-- =====================================================

INSERT INTO students (id, user_id, student_number, enrollment_date, created_at, updated_at)
VALUES
    ('dddd3333-3333-3333-3333-333333333333'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'S0001', '2024-01-15', NOW(), NOW()),
    ('dddd4444-4444-4444-4444-444444444444'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, 'S0002', '2024-01-15', NOW(), NOW()),
    ('dddd5555-5555-5555-5555-555555555555'::uuid, '55555555-5555-5555-5555-555555555555'::uuid, 'S0003', '2024-01-15', NOW(), NOW()),
    ('dddd6666-6666-6666-6666-666666666666'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 'S0004', '2024-01-15', NOW(), NOW())
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- 6. CREATE COURSES
-- =====================================================

INSERT INTO courses (id, title, description, credits, institution_id, created_at, updated_at)
VALUES
    ('eeee1111-1111-1111-1111-111111111111'::uuid, 'Introduction to Web Development', 'Learn the fundamentals of HTML, CSS, and JavaScript for building modern websites.', 3, 'aaaaaaaa-bbbb-cccc-dddd-aaaaaaaaaaaa'::uuid, NOW(), NOW()),
    ('eeee2222-2222-2222-2222-222222222222'::uuid, 'Advanced Database Design', 'Master relational database design, normalization, and optimization techniques.', 4, 'aaaaaaaa-bbbb-cccc-dddd-aaaaaaaaaaaa'::uuid, NOW(), NOW()),
    ('eeee3333-3333-3333-3333-333333333333'::uuid, 'Mobile App Development', 'Develop cross-platform mobile applications using modern frameworks.', 3, 'aaaaaaaa-bbbb-cccc-dddd-aaaaaaaaaaaa'::uuid, NOW(), NOW()),
    ('eeee4444-4444-4444-4444-444444444444'::uuid, 'Cloud Computing Fundamentals', 'Explore cloud platforms, deployment, and scalability concepts.', 3, 'aaaaaaaa-bbbb-cccc-dddd-aaaaaaaaaaaa'::uuid, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 7. CREATE COURSE SCHEDULES
-- =====================================================

INSERT INTO course_schedules (id, course_id, day, time, location, created_at)
VALUES
    ('ffff1111-1111-1111-1111-111111111111'::uuid, 'eeee1111-1111-1111-1111-111111111111'::uuid, 'Monday', '09:00:00', 'Room 101', NOW()),
    ('ffff1111-2222-2222-2222-111111111111'::uuid, 'eeee1111-1111-1111-1111-111111111111'::uuid, 'Wednesday', '09:00:00', 'Room 101', NOW()),
    ('ffff1111-3333-3333-3333-111111111111'::uuid, 'eeee1111-1111-1111-1111-111111111111'::uuid, 'Friday', '14:00:00', 'Room 101', NOW()),
    ('ffff2222-1111-1111-1111-222222222222'::uuid, 'eeee2222-2222-2222-2222-222222222222'::uuid, 'Tuesday', '10:00:00', 'Room 202', NOW()),
    ('ffff2222-2222-2222-2222-222222222222'::uuid, 'eeee2222-2222-2222-2222-222222222222'::uuid, 'Thursday', '10:00:00', 'Room 202', NOW()),
    ('ffff2222-3333-3333-3333-222222222222'::uuid, 'eeee2222-2222-2222-2222-222222222222'::uuid, 'Saturday', '11:00:00', 'Room 202', NOW()),
    ('ffff3333-1111-1111-1111-333333333333'::uuid, 'eeee3333-3333-3333-3333-333333333333'::uuid, 'Monday', '13:00:00', 'Lab 301', NOW()),
    ('ffff3333-2222-2222-2222-333333333333'::uuid, 'eeee3333-3333-3333-3333-333333333333'::uuid, 'Wednesday', '13:00:00', 'Lab 301', NOW()),
    ('ffff4444-1111-1111-1111-444444444444'::uuid, 'eeee4444-4444-4444-4444-444444444444'::uuid, 'Tuesday', '15:00:00', 'Room 303', NOW()),
    ('ffff4444-2222-2222-2222-444444444444'::uuid, 'eeee4444-4444-4444-4444-444444444444'::uuid, 'Thursday', '15:00:00', 'Room 303', NOW())
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 8. CREATE COURSE MATERIALS
-- =====================================================

INSERT INTO course_materials (id, course_id, title, file_url, type, created_at, updated_at)
VALUES
    ('gggg1111-1111-1111-1111-111111111111'::uuid, 'eeee1111-1111-1111-1111-111111111111'::uuid, 'HTML Basics', '/materials/html-basics.pdf', 'PDF', NOW(), NOW()),
    ('gggg1111-2222-2222-2222-111111111111'::uuid, 'eeee1111-1111-1111-1111-111111111111'::uuid, 'CSS Guide', '/materials/css-guide.pdf', 'PDF', NOW(), NOW()),
    ('gggg1111-3333-3333-3333-111111111111'::uuid, 'eeee1111-1111-1111-1111-111111111111'::uuid, 'JavaScript Intro', '/materials/js-intro.pdf', 'PDF', NOW(), NOW()),
    ('gggg2222-1111-1111-1111-222222222222'::uuid, 'eeee2222-2222-2222-2222-222222222222'::uuid, 'Database Design Principles', '/materials/db-design.pdf', 'PDF', NOW(), NOW()),
    ('gggg2222-2222-2222-2222-222222222222'::uuid, 'eeee2222-2222-2222-2222-222222222222'::uuid, 'SQL Tutorial', '/materials/sql-tutorial.pdf', 'PDF', NOW(), NOW()),
    ('gggg3333-1111-1111-1111-333333333333'::uuid, 'eeee3333-3333-3333-3333-333333333333'::uuid, 'Mobile Development Intro', '/materials/mobile-intro.pdf', 'PDF', NOW(), NOW()),
    ('gggg4444-1111-1111-1111-444444444444'::uuid, 'eeee4444-4444-4444-4444-444444444444'::uuid, 'Cloud Basics', '/materials/cloud-basics.pdf', 'PDF', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 9. CREATE ENROLLMENTS
-- =====================================================

INSERT INTO enrollments (id, student_id, course_id, status, created_at, updated_at)
VALUES
    -- Alice enrollments
    ('hhhh1111-1111-1111-1111-111111111111'::uuid, 'dddd3333-3333-3333-3333-333333333333'::uuid, 'eeee1111-1111-1111-1111-111111111111'::uuid, 'active', NOW(), NOW()),
    ('hhhh1111-1111-1111-1111-111111111112'::uuid, 'dddd3333-3333-3333-3333-333333333333'::uuid, 'eeee2222-2222-2222-2222-222222222222'::uuid, 'active', NOW(), NOW()),
    -- Bob enrollments
    ('hhhh2222-1111-1111-1111-111111111111'::uuid, 'dddd4444-4444-4444-4444-444444444444'::uuid, 'eeee1111-1111-1111-1111-111111111111'::uuid, 'active', NOW(), NOW()),
    ('hhhh2222-1111-1111-1111-111111111112'::uuid, 'dddd4444-4444-4444-4444-444444444444'::uuid, 'eeee3333-3333-3333-3333-333333333333'::uuid, 'active', NOW(), NOW()),
    -- Charlie enrollments
    ('hhhh3333-1111-1111-1111-111111111111'::uuid, 'dddd5555-5555-5555-5555-555555555555'::uuid, 'eeee2222-2222-2222-2222-222222222222'::uuid, 'active', NOW(), NOW()),
    ('hhhh3333-1111-1111-1111-111111111112'::uuid, 'dddd5555-5555-5555-5555-555555555555'::uuid, 'eeee4444-4444-4444-4444-444444444444'::uuid, 'active', NOW(), NOW()),
    -- Diana enrollments
    ('hhhh4444-1111-1111-1111-111111111111'::uuid, 'dddd6666-6666-6666-6666-666666666666'::uuid, 'eeee1111-1111-1111-1111-111111111111'::uuid, 'active', NOW(), NOW()),
    ('hhhh4444-1111-1111-1111-111111111112'::uuid, 'dddd6666-6666-6666-6666-666666666666'::uuid, 'eeee3333-3333-3333-3333-333333333333'::uuid, 'active', NOW(), NOW())
ON CONFLICT (student_id, course_id) DO NOTHING;

-- =====================================================
-- 10. CREATE TEACHER-COURSE ASSIGNMENTS
-- =====================================================

INSERT INTO teacher_courses (id, teacher_id, course_id, role, created_at)
VALUES
    ('iiii1111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'eeee1111-1111-1111-1111-111111111111'::uuid, 'instructor', NOW()),
    ('iiii2222-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'eeee2222-2222-2222-2222-222222222222'::uuid, 'instructor', NOW()),
    ('iiii3333-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'eeee3333-3333-3333-3333-333333333333'::uuid, 'instructor', NOW()),
    ('iiii4444-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'eeee4444-4444-4444-4444-444444444444'::uuid, 'instructor', NOW())
ON CONFLICT (teacher_id, course_id) DO NOTHING;

-- =====================================================
-- 11. CREATE ACADEMIC RECORDS
-- =====================================================

INSERT INTO academic_records (id, student_id, semester, gpa, created_at, updated_at)
VALUES
    ('jjjj3333-1111-1111-1111-333333333333'::uuid, 'dddd3333-3333-3333-3333-333333333333'::uuid, 'Fall 2024', 3.75, NOW(), NOW()),
    ('jjjj3333-2222-2222-2222-333333333333'::uuid, 'dddd3333-3333-3333-3333-333333333333'::uuid, 'Spring 2025', 3.85, NOW(), NOW()),
    ('jjjj4444-1111-1111-1111-444444444444'::uuid, 'dddd4444-4444-4444-4444-444444444444'::uuid, 'Fall 2024', 3.45, NOW(), NOW()),
    ('jjjj4444-2222-2222-2222-444444444444'::uuid, 'dddd4444-4444-4444-4444-444444444444'::uuid, 'Spring 2025', 3.55, NOW(), NOW()),
    ('jjjj5555-1111-1111-1111-555555555555'::uuid, 'dddd5555-5555-5555-5555-555555555555'::uuid, 'Fall 2024', 3.65, NOW(), NOW()),
    ('jjjj5555-2222-2222-2222-555555555555'::uuid, 'dddd5555-5555-5555-5555-555555555555'::uuid, 'Spring 2025', 3.72, NOW(), NOW()),
    ('jjjj6666-1111-1111-1111-666666666666'::uuid, 'dddd6666-6666-6666-6666-666666666666'::uuid, 'Fall 2024', 3.50, NOW(), NOW()),
    ('jjjj6666-2222-2222-2222-666666666666'::uuid, 'dddd6666-6666-6666-6666-666666666666'::uuid, 'Spring 2025', 3.60, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 12. CREATE ATTENDANCE RECORDS
-- =====================================================
-- Generate attendance for the last 4 weeks

INSERT INTO attendance (id, student_id, session_id, status, date, created_at)
VALUES
    -- Week 1 (Oct 28 - Nov 3)
    ('kkkk3333-1111-1111-1111-111111111111'::uuid, 'dddd3333-3333-3333-3333-333333333333'::uuid, 'session-001', 'present', '2024-10-28', NOW()),
    ('kkkk3333-1111-1111-1111-111111111112'::uuid, 'dddd3333-3333-3333-3333-333333333333'::uuid, 'session-002', 'present', '2024-10-30', NOW()),
    ('kkkk3333-1111-1111-1111-111111111113'::uuid, 'dddd3333-3333-3333-3333-333333333333'::uuid, 'session-003', 'present', '2024-11-01', NOW()),

    -- Week 2 (Nov 4 - Nov 10)
    ('kkkk3333-2222-2222-2222-111111111111'::uuid, 'dddd3333-3333-3333-3333-333333333333'::uuid, 'session-004', 'present', '2024-11-04', NOW()),
    ('kkkk3333-2222-2222-2222-111111111112'::uuid, 'dddd3333-3333-3333-3333-333333333333'::uuid, 'session-005', 'late', '2024-11-06', NOW()),
    ('kkkk3333-2222-2222-2222-111111111113'::uuid, 'dddd3333-3333-3333-3333-333333333333'::uuid, 'session-006', 'present', '2024-11-08', NOW()),

    -- Week 3 & 4 for Bob
    ('kkkk4444-1111-1111-1111-111111111111'::uuid, 'dddd4444-4444-4444-4444-444444444444'::uuid, 'session-001', 'present', '2024-10-28', NOW()),
    ('kkkk4444-1111-1111-1111-111111111112'::uuid, 'dddd4444-4444-4444-4444-444444444444'::uuid, 'session-002', 'absent', '2024-10-30', NOW()),
    ('kkkk4444-1111-1111-1111-111111111113'::uuid, 'dddd4444-4444-4444-4444-444444444444'::uuid, 'session-003', 'present', '2024-11-01', NOW()),
    ('kkkk4444-2222-2222-2222-111111111111'::uuid, 'dddd4444-4444-4444-4444-444444444444'::uuid, 'session-004', 'present', '2024-11-04', NOW()),
    ('kkkk4444-2222-2222-2222-111111111112'::uuid, 'dddd4444-4444-4444-4444-444444444444'::uuid, 'session-005', 'present', '2024-11-06', NOW()),
    ('kkkk4444-2222-2222-2222-111111111113'::uuid, 'dddd4444-4444-4444-4444-444444444444'::uuid, 'session-006', 'present', '2024-11-08', NOW()),

    -- Week 3 & 4 for Charlie
    ('kkkk5555-1111-1111-1111-111111111111'::uuid, 'dddd5555-5555-5555-5555-555555555555'::uuid, 'session-001', 'present', '2024-10-28', NOW()),
    ('kkkk5555-1111-1111-1111-111111111112'::uuid, 'dddd5555-5555-5555-5555-555555555555'::uuid, 'session-002', 'present', '2024-10-30', NOW()),
    ('kkkk5555-1111-1111-1111-111111111113'::uuid, 'dddd5555-5555-5555-5555-555555555555'::uuid, 'session-003', 'present', '2024-11-01', NOW()),
    ('kkkk5555-2222-2222-2222-111111111111'::uuid, 'dddd5555-5555-5555-5555-555555555555'::uuid, 'session-004', 'late', '2024-11-04', NOW()),
    ('kkkk5555-2222-2222-2222-111111111112'::uuid, 'dddd5555-5555-5555-5555-555555555555'::uuid, 'session-005', 'present', '2024-11-06', NOW()),
    ('kkkk5555-2222-2222-2222-111111111113'::uuid, 'dddd5555-5555-5555-5555-555555555555'::uuid, 'session-006', 'present', '2024-11-08', NOW()),

    -- Week 3 & 4 for Diana
    ('kkkk6666-1111-1111-1111-111111111111'::uuid, 'dddd6666-6666-6666-6666-666666666666'::uuid, 'session-001', 'present', '2024-10-28', NOW()),
    ('kkkk6666-1111-1111-1111-111111111112'::uuid, 'dddd6666-6666-6666-6666-666666666666'::uuid, 'session-002', 'present', '2024-10-30', NOW()),
    ('kkkk6666-1111-1111-1111-111111111113'::uuid, 'dddd6666-6666-6666-6666-666666666666'::uuid, 'session-003', 'absent', '2024-11-01', NOW()),
    ('kkkk6666-2222-2222-2222-111111111111'::uuid, 'dddd6666-6666-6666-6666-666666666666'::uuid, 'session-004', 'present', '2024-11-04', NOW()),
    ('kkkk6666-2222-2222-2222-111111111112'::uuid, 'dddd6666-6666-6666-6666-666666666666'::uuid, 'session-005', 'present', '2024-11-06', NOW()),
    ('kkkk6666-2222-2222-2222-111111111113'::uuid, 'dddd6666-6666-6666-6666-666666666666'::uuid, 'session-006', 'present', '2024-11-08', NOW())
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES (Run separately)
-- =====================================================

-- Count total records
SELECT
    (SELECT COUNT(*) FROM profiles) as profiles,
    (SELECT COUNT(*) FROM institutions) as institutions,
    (SELECT COUNT(*) FROM students) as students,
    (SELECT COUNT(*) FROM courses) as courses,
    (SELECT COUNT(*) FROM enrollments) as enrollments,
    (SELECT COUNT(*) FROM attendance) as attendance,
    (SELECT COUNT(*) FROM academic_records) as academic_records;

-- List all demo users
SELECT email, role FROM profiles JOIN auth.users ON profiles.user_id = auth.users.id ORDER BY email;

-- Show courses with student count
SELECT c.title, COUNT(e.id) as student_count
FROM courses c
LEFT JOIN enrollments e ON c.id = e.course_id
GROUP BY c.id, c.title;
