-- ============================================================================
-- DATA MIGRATION: K-12 School LMS → Pedagogy Teacher Training LMS
-- This script migrates existing data while preserving history
-- ============================================================================

-- STEP 1: CREATE DEFAULT PROGRAM
-- ============================================================================

INSERT INTO teacher_education_programs (
    code,
    name_km,
    name_en,
    description_km,
    description_en,
    duration_weeks,
    total_hours,
    target_competencies,
    institution_id,
    is_active
) SELECT
    'TEC-CERT-2025',
    'កម្មវិធីត្រៀមបង្រៀនគ្រូច្រៃលំង្វល់ TEC',
    'TEC Contract Teacher Training Program',
    'កម្មវិធីត្រៀមប្រាក់ធានាប្រកបដោយគុណលក្ខណ៍សម្រាប់គ្រូច្រៃលំង្វល់',
    'Comprehensive teacher training program designed to prepare contract teachers for Cambodian schools',
    26,
    400,
    10,
    id,
    true
FROM institutions
WHERE code = 'TEC' OR name LIKE '%TEC%'
LIMIT 1;

-- STEP 2: CREATE PROGRAM PHASES (4 phases)
-- ============================================================================

WITH program AS (
    SELECT id FROM teacher_education_programs WHERE code = 'TEC-CERT-2025'
)
INSERT INTO program_phases (
    program_id,
    phase_number,
    name_km,
    name_en,
    description_km,
    description_en,
    start_week,
    end_week,
    duration_weeks,
    sequence_order
) VALUES
(
    (SELECT id FROM program),
    1,
    'ដំណាក់កាលទី១៖ មូលដ្ឋាន',
    'Phase 1: Foundations',
    'សិក្សាទ្រឹស្តីគរណាគមន៍ និងការយល់ដឹងខ្លួនឯង',
    'Pedagogical theory and self-awareness development',
    1,
    6,
    6,
    1
),
(
    (SELECT id FROM program),
    2,
    'ដំណាក់កាលទី២៖ ក្បួនដាលបង្រៀន',
    'Phase 2: Pedagogy Intensive',
    'ក្បួនដាលបង្រៀនជាក់ស្តែង និងការគ្រប់គ្រងថ្នាក់រៀន',
    'Practical teaching methods and classroom management',
    7,
    12,
    6,
    2
),
(
    (SELECT id FROM program),
    3,
    'ដំណាក់កាលទី៣៖ អនុវត្តន៍ការបង្រៀន',
    'Phase 3: Teaching Practice',
    'អនុវត្តន៍ការបង្រៀនក្នុងថ្នាក់រៀនពិតប្រាកដនៅសាលាដែលមានកិច្ចព្រមព្រៀង',
    'Real classroom teaching experience in partner schools',
    13,
    22,
    10,
    3
),
(
    (SELECT id FROM program),
    4,
    'ដំណាក់កាលទី៤៖ ការវាយតម្លៃ និងឯកសារបញ្ជាក់',
    'Phase 4: Assessment & Certification',
    'ការវាយតម្លៃចុងក្រោយនិងឯកសារបញ្ជាក់គ្រូច្រៃលំង្វល់',
    'Final assessment and contract teacher certification',
    23,
    26,
    4,
    4
);

-- STEP 3: CREATE 10 COMPETENCIES
-- ============================================================================

WITH program AS (
    SELECT id FROM teacher_education_programs WHERE code = 'TEC-CERT-2025'
)
INSERT INTO competency_framework (
    program_id,
    competency_number,
    name_km,
    name_en,
    description_km,
    description_en,
    assessment_criteria_km,
    assessment_criteria_en,
    proficiency_level_3_descriptor_km,
    proficiency_level_3_descriptor_en
) VALUES
(
    (SELECT id FROM program), 1,
    'ការយល់ដឹងខ្លួនឯង ការឆ្លើយឆ្លង',
    'Self-Awareness & Reflection',
    'ទស្សនៈលម្អិតលម្អិតរបស់ខ្លួន ដែលឈានទៅការលើកកម្ពស់អក្សរសាស្ត្របស់សិស្ស',
    'Understanding oneself as a teacher and ability to reflect on practice',
    'Reflection journals, mentee feedback',
    'Reflection journals, mentor feedback',
    'បង្ហាញលក្ខណៈឆ្លើយឆ្លងលម្អិតលម្អិតនិងការលើកកម្ពស់រូបរាង',
    'Demonstrates consistent self-reflection and professional growth'
),
(
    (SELECT id FROM program), 2,
    'ចំណេះដឹងលម្អិត',
    'Subject Matter Knowledge',
    'ចម្ងាយក្នុងលម្អិតនូវមុខវិជ្ជាដែលបង្រៀន',
    'Deep understanding of subject matter being taught',
    'Written exam, lesson analysis',
    'Written assessment, lesson plan review',
    'បង្ហាញចំណេះដឹងលម្អិតលម្អិត ត្រឹមត្រូវ និងបច្ចុប្បន្នលម្អ',
    'Demonstrates accurate, comprehensive, and current subject knowledge'
),
(
    (SELECT id FROM program), 3,
    'ការរៀបចំឧបករណ៍សិក្សា',
    'Curriculum Design & Alignment',
    'ចម្លងឧបករណ៍សិក្សាតាមរយៈលក្ష្យ និងការវាយតម្លៃដែលរៀបចំបានល្អ',
    'Designing curriculum aligned with learning outcomes and assessments',
    'Lesson plans, learning objectives verification',
    'Lesson plans, learning objectives review',
    'បង្ហាញការរៀបចំឧបករណ៍ដែលទទួលបានលក្ష្យ កម្មវិធីសិក្សា នឹងការវាយតម្លៃ',
    'Demonstrates well-designed curriculum with clear alignment'
),
(
    (SELECT id FROM program), 4,
    'ក្បួនដាលបង្រៀនដែលមាន',
    'Effective Teaching Strategies',
    'អនុវត្តក្បួនដាលបង្រៀនដែលលើកកម្ពស់ការរៀនសូត្របង់ដើម',
    'Using evidence-based teaching strategies to engage learners',
    'Teaching observations, student outcomes',
    'Teaching observations, student engagement metrics',
    'អនុវត្តក្បួនដាលឯកលក្ខណ៍រៀនសូត្រដែលងាយស្រួល ល្អនិងឱ្យលទ្ធផល',
    'Uses variety of effective teaching strategies with positive results'
),
(
    (SELECT id FROM program), 5,
    'ការគ្រប់គ្រងថ្នាក់រៀន',
    'Classroom Management',
    'បង្កើតបរិយាកាសថ្នាក់រៀនប្រកបដោយសុវត្ថិភាព ក្របមិនលើង ដូចខ្លួនគ្នា',
    'Creating a positive, safe, and inclusive classroom environment',
    'Observation rubric, student feedback',
    'Observation ratings, student feedback surveys',
    'បង្កើតបរិយាកាសថ្នាក់រៀនសូលឡូដែលលើកកម្ពស់ការរៀនសូត្របង់ដើម',
    'Creates positive classroom environment with effective behavior management'
),
(
    (SELECT id FROM program), 6,
    'ការវាយតម្លៃសិស្ស',
    'Student Assessment',
    'ប្រើប្រាស់ការវាយតម្លៃលម្អិត រៀងរាល់ដងដើម្បីលើកកម្ពស់ការរៀនសូត្របង់ដើម',
    'Using varied assessment strategies to monitor and support learning',
    'Assessment design, grading alignment',
    'Assessment samples, grading consistency',
    'ប្រើប្រាស់វិធីវាយតម្លៃលម្អិតលម្អិតដែលផ្តល់នូវព័ត៌មាននិងលើកកម្ពស់ការរៀនសូត្របង់ដើម',
    'Uses varied assessment methods to inform instruction effectively'
),
(
    (SELECT id FROM program), 7,
    'ការឆ្លើយឆ្លងលម្អិត',
    'Differentiation & Inclusion',
    'សម្របស្របនឹងការបង្រៀនដែលឆ្លើយឆ្លងវិការណ៍នូវការរៀនលម្អិតលម្អិតដែលខុសគ្នា',
    'Providing differentiated instruction for diverse learners',
    'Lesson plan analysis, observation evidence',
    'Lesson plans, classroom observation data',
    'សម្របស្របនឹងការបង្រៀនលម្អិតដែលលើកកម្ពស់ការរៀនសូត្របង់ដើមរបស់សិស្សគ្រប់រូប',
    'Provides differentiated instruction for learners at different levels'
),
(
    (SELECT id FROM program), 8,
    'ការនិយាយយល់ដឹង',
    'Communication & Collaboration',
    'ទំនាក់ទំនងប្រកបដោយសមរម្យលម្អិត ដូចខ្លួនគ្នាមួយដងនឹងគ្រូបង្រៀនផ្សេងទៀត',
    'Communicating effectively with families and collaborating with colleagues',
    'Peer feedback, parent communication samples',
    'Communication logs, collaboration evidence',
    'ទំនាក់ទំនងប្រកបដោយសមរម្យលម្អិត ដូចខ្លួនគ្នាលើសពីរលានក្នុងក្រុម',
    'Communicates effectively with families and collaborates well with peers'
),
(
    (SELECT id FROM program), 9,
    'ស្មរតាមល្បឿន',
    'Professional Ethics & Conduct',
    'សារលើកកម្ពស់គុណលក្ខណ៍ស្រឡាញ់ដូចខ្លួនគ្នា ដូចលើកកម្ពស់សិស្សគ្រប់រូប',
    'Maintaining professional ethics and conduct in all interactions',
    'Mentor assessment, behavior documentation',
    'Mentor evaluations, conduct records',
    'សារលើកកម្ពស់គុណលក្ខណ៍ស្រឡាញ់ ដូចខ្លួនគ្នាលើសពីរលាននូវផលប័ត្រ',
    'Demonstrates professional ethics and integrity in practice'
),
(
    (SELECT id FROM program), 10,
    'ការប្រើប្រាស់បច្ចេកវិទ្យា',
    'Technology & Innovation',
    'ប្រើប្រាស់បច្ចេកវិទ្យាដូចខ្លួនគ្នាលើកកម្ពស់ការរៀនសូត្របង់ដើម',
    'Using technology effectively to enhance student learning',
    'Lesson samples with technology, digital portfolio',
    'Technology use in lessons, digital resources',
    'ប្រើប្រាស់បច្ចេកវិទ្យាលម្អិត ដូចខ្លួនគ្នាលើកកម្ពស់ការរៀនសូត្របង់ដើម',
    'Integrates technology appropriately to support learning'
);

-- STEP 4: CREATE FIRST COHORT (Batch 2025-01)
-- ============================================================================

WITH program AS (
    SELECT id FROM teacher_education_programs WHERE code = 'TEC-CERT-2025'
)
INSERT INTO cohorts (
    program_id,
    batch_code,
    batch_year,
    intake_number,
    batch_name_km,
    batch_name_en,
    planned_size,
    start_date,
    end_date,
    status
) VALUES
(
    (SELECT id FROM program),
    'Batch 2025-01',
    2025,
    1,
    'ក្រុម ២០២៥-០១',
    'Batch 2025-01',
    30,
    '2025-01-06',
    '2025-07-06',
    'planning'
);

-- STEP 5: CONVERT EXISTING STUDENTS TO GRADUATE STUDENTS
-- ============================================================================

WITH cohort AS (
    SELECT id FROM cohorts WHERE batch_code = 'Batch 2025-01'
),
phase1 AS (
    SELECT id FROM program_phases WHERE phase_number = 1
)
INSERT INTO graduate_students (
    user_id,
    cohort_id,
    student_code,
    enrollment_date,
    expected_completion_date,
    program_phase_id,
    status,
    teaching_hours_target
)
SELECT
    s.user_id,
    (SELECT id FROM cohort),
    COALESCE(s.student_id, 'GS-' || SUBSTRING(s.id::text, 1, 8)),
    COALESCE(s.created_at::date, CURRENT_DATE),
    (CURRENT_DATE + interval '26 weeks')::date,
    (SELECT id FROM phase1),
    'enrolled',
    120
FROM students s
WHERE s.user_id IN (
    SELECT id FROM profiles WHERE role = 'student'
)
ON CONFLICT DO NOTHING;

-- STEP 6: MIGRATE TEACHER ASSIGNMENTS TO MENTORS
-- ============================================================================

WITH program AS (
    SELECT id FROM teacher_education_programs WHERE code = 'TEC-CERT-2025'
)
INSERT INTO mentors (
    user_id,
    program_id,
    mentor_code,
    specialization_km,
    specialization_en,
    years_of_experience,
    max_mentees,
    is_active
)
SELECT
    p.id,
    (SELECT id FROM program),
    'MENTOR-' || SUBSTRING(p.id::text, 1, 8),
    'គ្រូបង្រៀនលម្អិត',
    'Subject Teacher',
    5,
    6,
    true
FROM profiles p
WHERE p.role = 'teacher'
ON CONFLICT DO NOTHING;

-- STEP 7: ARCHIVE OLD K-12 DATA (backup tables)
-- ============================================================================

-- Create archive tables for K-12 data (commented for safety)
-- ALTER TABLE courses RENAME TO courses_k12_backup;
-- ALTER TABLE enrollments RENAME TO enrollments_k12_backup;
-- ALTER TABLE academic_records RENAME TO academic_records_k12_backup;
-- ALTER TABLE attendance RENAME TO attendance_k12_backup;

-- STEP 8: VERIFICATION QUERIES
-- ============================================================================

-- Check migration status
SELECT
    'Program Created' as migration_step,
    COUNT(*) as count
FROM teacher_education_programs
WHERE code = 'TEC-CERT-2025'

UNION ALL

SELECT
    'Phases Created',
    COUNT(*)
FROM program_phases
WHERE program_id = (SELECT id FROM teacher_education_programs WHERE code = 'TEC-CERT-2025')

UNION ALL

SELECT
    'Competencies Created',
    COUNT(*)
FROM competency_framework
WHERE program_id = (SELECT id FROM teacher_education_programs WHERE code = 'TEC-CERT-2025')

UNION ALL

SELECT
    'Graduate Students Migrated',
    COUNT(*)
FROM graduate_students

UNION ALL

SELECT
    'Mentors Created',
    COUNT(*)
FROM mentors;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- ✓ Teacher Education Program created (TEC-CERT-2025)
-- ✓ 4 Program Phases created (Foundation, Pedagogy, Practicum, Assessment)
-- ✓ 10 Competencies created
-- ✓ First Cohort created (Batch 2025-01)
-- ✓ Existing students converted to graduate students
-- ✓ Existing teachers converted to mentors
-- ✓ Old K-12 data preserved (can be archived separately)
--
-- NEXT STEPS:
-- 1. Create partner schools (3-5 schools)
-- 2. Assign graduate students to mentors (1 mentor: 5-6 students)
-- 3. Create mentor relationships
-- 4. Set up practicum placements
-- 5. Begin Phase 1 modules
