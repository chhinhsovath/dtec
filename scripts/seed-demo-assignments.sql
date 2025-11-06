-- Seed Demo Assignments for teacher@demo.com

-- Get the teacher ID
WITH teacher AS (
  SELECT id FROM profiles WHERE email = 'teacher@demo.com'
),
-- Get courses assigned to this teacher
teacher_courses_data AS (
  SELECT DISTINCT tc.course_id, t.id as teacher_id
  FROM teacher_courses tc
  JOIN teacher t ON tc.teacher_id = t.id
  WHERE t.id IN (SELECT id FROM teacher)
)
-- Insert sample assignments
INSERT INTO assignments (course_id, teacher_id, title, description, max_score, due_date, status, created_at, updated_at)
VALUES
-- First course assignments
((SELECT course_id FROM teacher_courses_data LIMIT 1), (SELECT teacher_id FROM teacher_courses_data LIMIT 1),
 'Midterm Exam', 'Comprehensive exam covering chapters 1-5. Time limit: 2 hours.', 100, NOW() + INTERVAL '7 days', 'active', NOW(), NOW()),

((SELECT course_id FROM teacher_courses_data LIMIT 1), (SELECT teacher_id FROM teacher_courses_data LIMIT 1),
 'Final Project', 'Group project on course concepts. Presentation required.', 50, NOW() + INTERVAL '14 days', 'active', NOW(), NOW()),

((SELECT course_id FROM teacher_courses_data LIMIT 1), (SELECT teacher_id FROM teacher_courses_data LIMIT 1),
 'Weekly Quiz 1', 'Quiz on recent material. 30 minutes duration.', 20, NOW() + INTERVAL '3 days', 'active', NOW(), NOW()),

-- Second course assignments
((SELECT course_id FROM teacher_courses_data OFFSET 1 LIMIT 1), (SELECT teacher_id FROM teacher_courses_data LIMIT 1),
 'Quiz Chapter 2', 'Short quiz on chapter 2 concepts.', 25, NOW() + INTERVAL '5 days', 'active', NOW(), NOW()),

((SELECT course_id FROM teacher_courses_data OFFSET 1 LIMIT 1), (SELECT teacher_id FROM teacher_courses_data LIMIT 1),
 'Research Paper', 'Write a research paper on a topic of your choice.', 75, NOW() + INTERVAL '21 days', 'active', NOW(), NOW()),

-- Third course assignments (if exists)
((SELECT course_id FROM teacher_courses_data OFFSET 2 LIMIT 1), (SELECT teacher_id FROM teacher_courses_data LIMIT 1),
 'Class Presentation', 'Present on assigned topic to class.', 40, NOW() + INTERVAL '10 days', 'active', NOW(), NOW())
ON CONFLICT DO NOTHING;
