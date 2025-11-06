-- Demo Data for TEC LMS

-- Fixed IDs for consistent testing
-- Institution
-- 550e8400-e29b-41d4-a716-446655440000 = TEC (already created)

-- User IDs (Profiles)
-- 11111111-1111-1111-1111-111111111111 = alice@test.com
-- 22222222-2222-2222-2222-222222222222 = bob@test.com
-- 33333333-3333-3333-3333-333333333333 = charlie@test.com
-- 44444444-4444-4444-4444-444444444444 = diana@test.com
-- 55555555-5555-5555-5555-555555555555 = teacher@test.com
-- 66666666-6666-6666-6666-666666666666 = admin@test.com

-- Student IDs
-- 77777777-7777-7777-7777-777777777777 = alice (student)
-- 88888888-8888-8888-8888-888888888888 = bob (student)
-- 99999999-9999-9999-9999-999999999999 = charlie (student)
-- aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa = diana (student)

-- Course IDs
-- bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb = Web Development
-- cccccccc-cccc-cccc-cccc-cccccccccccc = Database Design
-- dddddddd-dddd-dddd-dddd-dddddddddddd = Mobile App
-- eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee = Cloud Computing

-- Insert User Profiles
INSERT INTO profiles (id, email, full_name, role) VALUES
('11111111-1111-1111-1111-111111111111', 'alice@test.com', 'Alice Johnson', 'student'),
('22222222-2222-2222-2222-222222222222', 'bob@test.com', 'Bob Smith', 'student'),
('33333333-3333-3333-3333-333333333333', 'charlie@test.com', 'Charlie Brown', 'student'),
('44444444-4444-4444-4444-444444444444', 'diana@test.com', 'Diana Prince', 'student'),
('55555555-5555-5555-5555-555555555555', 'teacher@test.com', 'Teacher Williams', 'teacher'),
('66666666-6666-6666-6666-666666666666', 'admin@test.com', 'Admin Davis', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert User Institution Relationships
INSERT INTO user_institutions (user_id, institution_id) VALUES
('11111111-1111-1111-1111-111111111111', '550e8400-e29b-41d4-a716-446655440000'),
('22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000'),
('33333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440000'),
('44444444-4444-4444-4444-444444444444', '550e8400-e29b-41d4-a716-446655440000'),
('55555555-5555-5555-5555-555555555555', '550e8400-e29b-41d4-a716-446655440000'),
('66666666-6666-6666-6666-666666666666', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT (user_id, institution_id) DO NOTHING;

-- Insert Courses
INSERT INTO courses (id, code, name, description, institution_id) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'CS101', 'Web Development', 'Learn modern web development with HTML, CSS, and JavaScript', '550e8400-e29b-41d4-a716-446655440000'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'CS102', 'Database Design', 'Master relational databases and SQL', '550e8400-e29b-41d4-a716-446655440000'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'CS103', 'Mobile Application Development', 'Build mobile apps for iOS and Android', '550e8400-e29b-41d4-a716-446655440000'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'CS104', 'Cloud Computing Fundamentals', 'Understand cloud services and deployment', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT (code) DO NOTHING;

-- Insert Students
INSERT INTO students (id, user_id, student_id, institution_id) VALUES
('77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', 'STU001', '550e8400-e29b-41d4-a716-446655440000'),
('88888888-8888-8888-8888-888888888888', '22222222-2222-2222-2222-222222222222', 'STU002', '550e8400-e29b-41d4-a716-446655440000'),
('99999999-9999-9999-9999-999999999999', '33333333-3333-3333-3333-333333333333', 'STU003', '550e8400-e29b-41d4-a716-446655440000'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 'STU004', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT (student_id) DO NOTHING;

-- Insert Teacher Course Assignments
INSERT INTO teacher_courses (teacher_id, course_id) VALUES
('55555555-5555-5555-5555-555555555555', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
('55555555-5555-5555-5555-555555555555', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
('55555555-5555-5555-5555-555555555555', 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
('55555555-5555-5555-5555-555555555555', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee')
ON CONFLICT (teacher_id, course_id) DO NOTHING;

-- Insert Enrollments (Each student in 2 courses)
INSERT INTO enrollments (student_id, course_id, status) VALUES
-- Alice in Web Dev and Database
('77777777-7777-7777-7777-777777777777', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'active'),
('77777777-7777-7777-7777-777777777777', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'active'),
-- Bob in Database and Mobile
('88888888-8888-8888-8888-888888888888', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'active'),
('88888888-8888-8888-8888-888888888888', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'active'),
-- Charlie in Web Dev and Cloud
('99999999-9999-9999-9999-999999999999', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'active'),
('99999999-9999-9999-9999-999999999999', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'active'),
-- Diana in Mobile and Cloud
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'active'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'active')
ON CONFLICT (student_id, course_id) DO NOTHING;

-- Insert Academic Records (GPA for Fall 2024)
INSERT INTO academic_records (student_id, course_id, semester, year, grade, gpa) VALUES
-- Alice (GPA: 3.75)
('77777777-7777-7777-7777-777777777777', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Fall', 2024, 3.8, 3.75),
('77777777-7777-7777-7777-777777777777', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Fall', 2024, 3.7, 3.75),
-- Bob (GPA: 3.45)
('88888888-8888-8888-8888-888888888888', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Fall', 2024, 3.4, 3.45),
('88888888-8888-8888-8888-888888888888', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Fall', 2024, 3.5, 3.45),
-- Charlie (GPA: 3.65)
('99999999-9999-9999-9999-999999999999', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Fall', 2024, 3.6, 3.65),
('99999999-9999-9999-9999-999999999999', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Fall', 2024, 3.7, 3.65),
-- Diana (GPA: 3.50)
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Fall', 2024, 3.5, 3.50),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Fall', 2024, 3.5, 3.50);

-- ============================================================================
-- FEATURE 1: EMAIL NOTIFICATION SYSTEM - DEMO DATA
-- ============================================================================

-- Demo Email Queue Entries (various statuses)
INSERT INTO notification_queue (recipient_id, template_id, subject, body_html, body_text, recipient_email, recipient_name, status, priority, retry_count, max_retries, created_at)
VALUES
-- Pending emails
(1, 1, 'Welcome to TEC LMS, Alice Johnson!', '<h1>Welcome to TEC LMS</h1><p>Dear Alice Johnson,</p><p>Welcome to Technology Enhanced Classroom. Your account has been created successfully.</p><p>Email: alice@test.com</p><p>Role: student</p>', 'Welcome to TEC LMS\nDear Alice Johnson,\nWelcome to Technology Enhanced Classroom.\nYour account has been created successfully.\nEmail: alice@test.com\nRole: student', 'alice@test.com', 'Alice Johnson', 'pending', 5, 0, 3, NOW() - INTERVAL '2 days'),
(2, 1, 'Welcome to TEC LMS, Bob Smith!', '<h1>Welcome to TEC LMS</h1><p>Dear Bob Smith,</p><p>Welcome to Technology Enhanced Classroom. Your account has been created successfully.</p><p>Email: bob@test.com</p><p>Role: student</p>', 'Welcome to TEC LMS\nDear Bob Smith,\nWelcome to Technology Enhanced Classroom.\nYour account has been created successfully.\nEmail: bob@test.com\nRole: student', 'bob@test.com', 'Bob Smith', 'pending', 5, 0, 3, NOW() - INTERVAL '1 day'),
-- Sent emails
(3, 2, 'New Grade Posted: Web Development', '<h1>New Grade Posted</h1><p>Dear Charlie Brown,</p><p>A new grade has been posted for Web Development.</p><p>Assignment: Midterm Project</p><p>Score: 95/100 (95%)</p><p>Feedback: Excellent work!</p>', 'New Grade Posted\nDear Charlie Brown,\nAssignment: Midterm Project\nScore: 95/100 (95%)\nFeedback: Excellent work!', 'charlie@test.com', 'Charlie Brown', 'sent', 8, 0, 3, NOW() - INTERVAL '3 days'),
(1, 2, 'New Grade Posted: Database Design', '<h1>New Grade Posted</h1><p>Dear Alice Johnson,</p><p>A new grade has been posted for Database Design.</p><p>Assignment: SQL Project</p><p>Score: 88/100 (88%)</p><p>Feedback: Good understanding of normalization.</p>', 'New Grade Posted\nDear Alice Johnson,\nAssignment: SQL Project\nScore: 88/100 (88%)\nFeedback: Good understanding of normalization.', 'alice@test.com', 'Alice Johnson', 'sent', 7, 0, 3, NOW() - INTERVAL '4 hours'),
-- Failed email
(4, 3, 'Attendance Alert: Diana Prince', '<h1>Attendance Alert</h1><p>Dear Parent,</p><p>Diana Prince has an attendance rate of 75%, which is below the threshold of 80%.</p><p>Current Absences: 3 days</p>', 'Attendance Alert\nDear Parent,\nDiana Prince attendance is 75%\nAbsences: 3 days', 'diana@test.com', 'Diana Prince', 'failed', 9, 2, 3, NOW() - INTERVAL '6 hours'),
-- Bounced email
(2, 4, 'Assignment Due Soon: Database Project', '<h1>Assignment Submission Reminder</h1><p>Dear Bob Smith,</p><p>Your assignment \"Database Project\" is due in 2 days.</p><p>Due Date: November 10, 2024</p><p>Course: Database Design</p>', 'Assignment Due Soon\nDear Bob Smith,\n\"Database Project\" is due in 2 days.\nDue: November 10, 2024\nCourse: Database Design', 'bob@test.com', 'Bob Smith', 'bounced', 6, 1, 3, NOW() - INTERVAL '2 hours');

-- ============================================================================
-- FEATURE 2: ATTENDANCE TRACKING SYSTEM - DEMO DATA
-- ============================================================================

-- Demo Class Sessions
INSERT INTO class_sessions (course_id, class_date, start_time, end_time, topic, room_location, instructor_id, max_attendees, qr_code_token, qr_code_expires_at, created_by, created_at)
VALUES
-- Web Development Sessions
(1, '2024-11-04', '09:00:00', '10:30:00', 'HTML & CSS Basics', 'Room 101', 5, 30, 'QR_WEB_001_20241104', NOW() + INTERVAL '2 days', 5, NOW() - INTERVAL '1 week'),
(1, '2024-11-05', '09:00:00', '10:30:00', 'JavaScript Fundamentals', 'Room 101', 5, 30, 'QR_WEB_002_20241105', NOW() + INTERVAL '2 days', 5, NOW() - INTERVAL '6 days'),
(1, '2024-11-06', '09:00:00', '10:30:00', 'DOM Manipulation', 'Room 101', 5, 30, 'QR_WEB_003_20241106', NOW() + INTERVAL '2 days', 5, NOW() - INTERVAL '5 days'),
-- Database Sessions
(2, '2024-11-04', '11:00:00', '12:30:00', 'Database Design Principles', 'Room 102', 5, 25, 'QR_DB_001_20241104', NOW() + INTERVAL '2 days', 5, NOW() - INTERVAL '1 week'),
(2, '2024-11-05', '11:00:00', '12:30:00', 'SQL Basics', 'Room 102', 5, 25, 'QR_DB_002_20241105', NOW() + INTERVAL '2 days', 5, NOW() - INTERVAL '6 days'),
(2, '2024-11-06', '11:00:00', '12:30:00', 'Normalization', 'Room 102', 5, 25, 'QR_DB_003_20241106', NOW() + INTERVAL '2 days', 5, NOW() - INTERVAL '5 days');

-- Demo Attendance Records (various statuses)
INSERT INTO attendance_records (session_id, student_id, status, marking_method, marked_by, check_in_time, check_out_time, location_latitude, location_longitude, notes, created_at, marked_at)
VALUES
-- Web Dev Session 1 (2024-11-04)
(1, 1, 'present', 'qr_code', 5, NOW() - INTERVAL '1 week' + INTERVAL '9 hours', NOW() - INTERVAL '1 week' + INTERVAL '10 hours 30 minutes', 11.5564, 104.9282, 'Marked via QR code', NOW() - INTERVAL '1 week', NOW() - INTERVAL '1 week'),
(1, 2, 'present', 'qr_code', 5, NOW() - INTERVAL '1 week' + INTERVAL '9 hours 2 minutes', NOW() - INTERVAL '1 week' + INTERVAL '10 hours 25 minutes', 11.5564, 104.9282, 'Marked via QR code', NOW() - INTERVAL '1 week', NOW() - INTERVAL '1 week'),
(1, 3, 'late', 'manual', 5, NOW() - INTERVAL '1 week' + INTERVAL '9 hours 15 minutes', NOW() - INTERVAL '1 week' + INTERVAL '10 hours 30 minutes', 11.5564, 104.9282, 'Arrived 15 minutes late', NOW() - INTERVAL '1 week', NOW() - INTERVAL '1 week'),
(1, 4, 'absent', 'manual', 5, NULL, NULL, NULL, NULL, 'Did not attend class', NOW() - INTERVAL '1 week', NOW() - INTERVAL '1 week'),
-- Web Dev Session 2 (2024-11-05)
(2, 1, 'present', 'qr_code', 5, NOW() - INTERVAL '6 days' + INTERVAL '9 hours', NOW() - INTERVAL '6 days' + INTERVAL '10 hours 30 minutes', 11.5564, 104.9282, 'Marked via QR code', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
(2, 2, 'absent', 'manual', 5, NULL, NULL, NULL, NULL, 'Not present', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
(2, 3, 'present', 'qr_code', 5, NOW() - INTERVAL '6 days' + INTERVAL '9 hours 1 minute', NOW() - INTERVAL '6 days' + INTERVAL '10 hours 28 minutes', 11.5564, 104.9282, 'Marked via QR code', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
(2, 4, 'excused', 'manual', 5, NULL, NULL, NULL, NULL, 'Medical appointment', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
-- Web Dev Session 3 (2024-11-06)
(3, 1, 'present', 'qr_code', 5, NOW() - INTERVAL '5 days' + INTERVAL '9 hours', NOW() - INTERVAL '5 days' + INTERVAL '10 hours 30 minutes', 11.5564, 104.9282, 'Marked via QR code', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
(3, 2, 'late', 'manual', 5, NOW() - INTERVAL '5 days' + INTERVAL '9 hours 10 minutes', NOW() - INTERVAL '5 days' + INTERVAL '10 hours 30 minutes', 11.5564, 104.9282, '10 minutes late', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
(3, 3, 'present', 'mobile', 5, NOW() - INTERVAL '5 days' + INTERVAL '9 hours 3 minutes', NOW() - INTERVAL '5 days' + INTERVAL '10 hours 27 minutes', 11.5564, 104.9282, 'Mobile check-in', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
(3, 4, 'present', 'qr_code', 5, NOW() - INTERVAL '5 days' + INTERVAL '9 hours 5 minutes', NOW() - INTERVAL '5 days' + INTERVAL '10 hours 29 minutes', 11.5564, 104.9282, 'Marked via QR code', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
-- Database Session 1 (2024-11-04)
(4, 1, 'present', 'qr_code', 5, NOW() - INTERVAL '1 week' + INTERVAL '11 hours', NOW() - INTERVAL '1 week' + INTERVAL '12 hours 30 minutes', 11.5564, 104.9282, 'Marked via QR code', NOW() - INTERVAL '1 week', NOW() - INTERVAL '1 week'),
(4, 2, 'present', 'qr_code', 5, NOW() - INTERVAL '1 week' + INTERVAL '11 hours 1 minute', NOW() - INTERVAL '1 week' + INTERVAL '12 hours 28 minutes', 11.5564, 104.9282, 'Marked via QR code', NOW() - INTERVAL '1 week', NOW() - INTERVAL '1 week'),
(4, 3, 'absent', 'manual', 5, NULL, NULL, NULL, NULL, 'Did not attend', NOW() - INTERVAL '1 week', NOW() - INTERVAL '1 week'),
-- Database Session 2 (2024-11-05)
(5, 1, 'absent', 'manual', 5, NULL, NULL, NULL, NULL, 'Not present', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
(5, 2, 'present', 'qr_code', 5, NOW() - INTERVAL '6 days' + INTERVAL '11 hours', NOW() - INTERVAL '6 days' + INTERVAL '12 hours 30 minutes', 11.5564, 104.9282, 'Marked via QR code', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
(5, 3, 'late', 'manual', 5, NOW() - INTERVAL '6 days' + INTERVAL '11 hours 12 minutes', NOW() - INTERVAL '6 days' + INTERVAL '12 hours 25 minutes', 11.5564, 104.9282, '12 minutes late', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
-- Database Session 3 (2024-11-06)
(6, 1, 'present', 'mobile', 5, NOW() - INTERVAL '5 days' + INTERVAL '11 hours 2 minutes', NOW() - INTERVAL '5 days' + INTERVAL '12 hours 28 minutes', 11.5564, 104.9282, 'Mobile check-in', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
(6, 2, 'present', 'qr_code', 5, NOW() - INTERVAL '5 days' + INTERVAL '11 hours', NOW() - INTERVAL '5 days' + INTERVAL '12 hours 30 minutes', 11.5564, 104.9282, 'Marked via QR code', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
(6, 3, 'present', 'qr_code', 5, NOW() - INTERVAL '5 days' + INTERVAL '11 hours 1 minute', NOW() - INTERVAL '5 days' + INTERVAL '12 hours 29 minutes', 11.5564, 104.9282, 'Marked via QR code', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days');

-- Demo Attendance Statistics
INSERT INTO attendance_statistics (student_id, course_id, total_classes, present_count, absent_count, late_count, excused_count, attendance_percentage)
VALUES
-- Alice: Web Dev 3/3 present, Database 2/3 present
(1, 1, 3, 3, 0, 0, 0, 100.00),
(1, 2, 3, 2, 1, 0, 0, 66.67),
-- Bob: Web Dev 1/3 present + 1 late + 1 absent, Database 1/3 present + 1 late + 1 absent
(2, 1, 3, 1, 1, 1, 0, 66.67),
(2, 2, 3, 1, 1, 1, 0, 66.67),
-- Charlie: Web Dev 2/3 present + 1 absent, Database 1/3 present + 1 late + 1 absent
(3, 1, 3, 2, 1, 0, 0, 66.67),
(3, 2, 3, 1, 1, 1, 0, 66.67),
-- Diana: Web Dev 1/3 present + 1 excused + 1 absent, Database sessions not enrolled
(4, 1, 3, 1, 1, 0, 1, 66.67);

-- Demo QR Code Tokens
INSERT INTO qr_code_tokens (session_id, token_string, expires_at)
VALUES
(1, 'QR_WEB_001_20241104', NOW() + INTERVAL '2 days'),
(2, 'QR_WEB_002_20241105', NOW() + INTERVAL '2 days'),
(3, 'QR_WEB_003_20241106', NOW() + INTERVAL '2 days'),
(4, 'QR_DB_001_20241104', NOW() + INTERVAL '2 days'),
(5, 'QR_DB_002_20241105', NOW() + INTERVAL '2 days'),
(6, 'QR_DB_003_20241106', NOW() + INTERVAL '2 days');

-- Demo Attendance Alerts (for low attendance)
INSERT INTO attendance_alerts (student_id, course_id, attendance_percentage, alert_threshold, alert_type, is_sent)
VALUES
(2, 1, 66.67, 80, 'warning', true),
(2, 2, 66.67, 80, 'warning', true),
(3, 1, 66.67, 80, 'warning', true),
(3, 2, 66.67, 80, 'warning', true),
(4, 1, 66.67, 80, 'warning', true);

-- Insert Attendance Records (Last 4 weeks)
INSERT INTO attendance (student_id, course_id, attendance_date, status) VALUES
-- Alice's attendance (28 days, mostly present)
('77777777-7777-7777-7777-777777777777', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', CURRENT_DATE - INTERVAL '27 days', 'present'),
('77777777-7777-7777-7777-777777777777', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', CURRENT_DATE - INTERVAL '26 days', 'present'),
('77777777-7777-7777-7777-777777777777', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', CURRENT_DATE - INTERVAL '25 days', 'present'),
('77777777-7777-7777-7777-777777777777', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', CURRENT_DATE - INTERVAL '24 days', 'absent'),
('77777777-7777-7777-7777-777777777777', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', CURRENT_DATE - INTERVAL '23 days', 'present'),
('77777777-7777-7777-7777-777777777777', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', CURRENT_DATE - INTERVAL '22 days', 'late'),
('77777777-7777-7777-7777-777777777777', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', CURRENT_DATE - INTERVAL '21 days', 'present'),
('77777777-7777-7777-7777-777777777777', 'cccccccc-cccc-cccc-cccc-cccccccccccc', CURRENT_DATE - INTERVAL '20 days', 'present'),
('77777777-7777-7777-7777-777777777777', 'cccccccc-cccc-cccc-cccc-cccccccccccc', CURRENT_DATE - INTERVAL '19 days', 'present'),
('77777777-7777-7777-7777-777777777777', 'cccccccc-cccc-cccc-cccc-cccccccccccc', CURRENT_DATE - INTERVAL '18 days', 'present'),
-- Bob's attendance
('88888888-8888-8888-8888-888888888888', 'cccccccc-cccc-cccc-cccc-cccccccccccc', CURRENT_DATE - INTERVAL '17 days', 'present'),
('88888888-8888-8888-8888-888888888888', 'cccccccc-cccc-cccc-cccc-cccccccccccc', CURRENT_DATE - INTERVAL '16 days', 'present'),
('88888888-8888-8888-8888-888888888888', 'cccccccc-cccc-cccc-cccc-cccccccccccc', CURRENT_DATE - INTERVAL '15 days', 'absent'),
('88888888-8888-8888-8888-888888888888', 'cccccccc-cccc-cccc-cccc-cccccccccccc', CURRENT_DATE - INTERVAL '14 days', 'present'),
('88888888-8888-8888-8888-888888888888', 'dddddddd-dddd-dddd-dddd-dddddddddddd', CURRENT_DATE - INTERVAL '13 days', 'present'),
('88888888-8888-8888-8888-888888888888', 'dddddddd-dddd-dddd-dddd-dddddddddddd', CURRENT_DATE - INTERVAL '12 days', 'present'),
('88888888-8888-8888-8888-888888888888', 'dddddddd-dddd-dddd-dddd-dddddddddddd', CURRENT_DATE - INTERVAL '11 days', 'late'),
('88888888-8888-8888-8888-888888888888', 'dddddddd-dddd-dddd-dddd-dddddddddddd', CURRENT_DATE - INTERVAL '10 days', 'present'),
-- Charlie's attendance
('99999999-9999-9999-9999-999999999999', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', CURRENT_DATE - INTERVAL '9 days', 'present'),
('99999999-9999-9999-9999-999999999999', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', CURRENT_DATE - INTERVAL '8 days', 'present'),
('99999999-9999-9999-9999-999999999999', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', CURRENT_DATE - INTERVAL '7 days', 'present'),
('99999999-9999-9999-9999-999999999999', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', CURRENT_DATE - INTERVAL '6 days', 'present'),
('99999999-9999-9999-9999-999999999999', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', CURRENT_DATE - INTERVAL '5 days', 'present'),
('99999999-9999-9999-9999-999999999999', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', CURRENT_DATE - INTERVAL '4 days', 'present'),
('99999999-9999-9999-9999-999999999999', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', CURRENT_DATE - INTERVAL '3 days', 'absent'),
('99999999-9999-9999-9999-999999999999', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', CURRENT_DATE - INTERVAL '2 days', 'present'),
-- Diana's attendance
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'dddddddd-dddd-dddd-dddd-dddddddddddd', CURRENT_DATE - INTERVAL '1 days', 'present'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'dddddddd-dddd-dddd-dddd-dddddddddddd', CURRENT_DATE, 'present'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', CURRENT_DATE - INTERVAL '2 days', 'present'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', CURRENT_DATE - INTERVAL '1 days', 'present'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', CURRENT_DATE, 'present')
ON CONFLICT (student_id, course_id, attendance_date) DO NOTHING;

-- Verify data
SELECT 'Users Created' as status, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'Courses', COUNT(*) FROM courses
UNION ALL
SELECT 'Students', COUNT(*) FROM students
UNION ALL
SELECT 'Enrollments', COUNT(*) FROM enrollments
UNION ALL
SELECT 'Academic Records', COUNT(*) FROM academic_records
UNION ALL
SELECT 'Attendance Records', COUNT(*) FROM attendance;
