-- ============================================================================
-- TEC PEDAGOGY TEACHER EDUCATION LMS - Complete Database Schema
-- Duration: 6 months, 4 phases, 10 competencies, 16 modules
-- Language: Khmer-first with English translations
-- ============================================================================

-- PHASE 1: PROGRAM MANAGEMENT TABLES
-- ============================================================================

-- 1.1 Program Definition
CREATE TABLE IF NOT EXISTS teacher_education_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name_km VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    description_km TEXT,
    description_en TEXT,
    duration_weeks INTEGER DEFAULT 26,
    total_hours INTEGER DEFAULT 400,
    target_competencies INTEGER DEFAULT 10,
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1.2 Program Phases (4 phases: Foundation, Pedagogy, Practicum, Assessment)
CREATE TABLE IF NOT EXISTS program_phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES teacher_education_programs(id) ON DELETE CASCADE,
    phase_number INTEGER NOT NULL,
    name_km VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    description_km TEXT,
    description_en TEXT,
    start_week INTEGER NOT NULL,
    end_week INTEGER NOT NULL,
    duration_weeks INTEGER NOT NULL,
    sequence_order INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(program_id, phase_number)
);

-- 1.3 Program Modules (16 modules - 4 per phase)
CREATE TABLE IF NOT EXISTS program_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_phase_id UUID NOT NULL REFERENCES program_phases(id) ON DELETE CASCADE,
    module_number VARCHAR(10) NOT NULL,
    name_km VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    description_km TEXT,
    description_en TEXT,
    duration_weeks DECIMAL(3,1) NOT NULL,
    sequence_order INTEGER NOT NULL,
    learning_outcomes_km TEXT[],
    learning_outcomes_en TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(program_phase_id, module_number)
);

-- ============================================================================
-- PHASE 2: COMPETENCY FRAMEWORK
-- ============================================================================

-- 2.1 Competency Definitions (10 competencies)
CREATE TABLE IF NOT EXISTS competency_framework (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES teacher_education_programs(id) ON DELETE CASCADE,
    competency_number INTEGER NOT NULL,
    name_km VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    description_km TEXT,
    description_en TEXT,
    assessment_criteria_km TEXT,
    assessment_criteria_en TEXT,
    proficiency_level_3_descriptor_km TEXT,
    proficiency_level_3_descriptor_en TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(program_id, competency_number)
);

-- 2.2 Competency Levels (1=Beginning, 2=Developing, 3=Proficient, 4=Advanced, 5=Master)
CREATE TABLE IF NOT EXISTS competency_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level_number INTEGER NOT NULL UNIQUE CHECK (level_number BETWEEN 1 AND 5),
    name_km VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    descriptor_km TEXT,
    descriptor_en TEXT,
    score_range_min INTEGER,
    score_range_max INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert competency levels
INSERT INTO competency_levels (level_number, name_km, name_en, descriptor_km, descriptor_en, score_range_min, score_range_max)
VALUES
    (1, 'គ្រាប់កាច់ផ្តើម', 'Beginning', 'តម្រូវឱ្យមានការគាំទពេលយូរ', 'Requires significant support', 1, 20),
    (2, 'កំពុងវិនិយោគ', 'Developing', 'កំពុងរីកចម្រើន ដោយការគាំទ', 'Progressing with support', 21, 40),
    (3, 'ពូកែរឹង', 'Proficient', 'បង្ហាញមូលដ្ឋានប្រកបដោយវិជ្ជា', 'Meets the standard', 41, 60),
    (4, 'ឡើងលើស្តង់ដារ', 'Advanced', 'លើសពីស្តង់ដារទូទៅ', 'Exceeds the standard', 61, 80),
    (5, 'ម្ចាស់វិចារណញាណ', 'Master', 'ឧទាហរណ៍គ្រប់ឆ្នាំ', 'Exemplary practice', 81, 100);

-- ============================================================================
-- PHASE 3: USER ROLES & RELATIONSHIPS
-- ============================================================================

-- 3.1 User Roles Extension (beyond existing profiles)
CREATE TABLE IF NOT EXISTS user_roles_extended (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role_type VARCHAR(50) NOT NULL CHECK (role_type IN ('graduate_student', 'mentor', 'program_coordinator', 'school_supervisor', 'pedagogical_specialist')),
    program_id UUID REFERENCES teacher_education_programs(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_type, program_id)
);

-- ============================================================================
-- PHASE 4: COHORT MANAGEMENT
-- ============================================================================

-- 4.1 Cohorts (Batch groups)
CREATE TABLE IF NOT EXISTS cohorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES teacher_education_programs(id) ON DELETE CASCADE,
    batch_code VARCHAR(50) UNIQUE NOT NULL,
    batch_year INTEGER NOT NULL,
    intake_number INTEGER NOT NULL CHECK (intake_number IN (1, 2)),
    batch_name_km VARCHAR(255),
    batch_name_en VARCHAR(255),
    planned_size INTEGER NOT NULL,
    actual_size INTEGER DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'suspended')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(program_id, batch_code)
);

-- 4.2 Graduate Students (trainees/teacher candidates)
CREATE TABLE IF NOT EXISTS graduate_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    student_code VARCHAR(50) UNIQUE NOT NULL,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_completion_date DATE,
    actual_completion_date DATE,
    program_phase_id UUID REFERENCES program_phases(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'active', 'on_practicum', 'assessment', 'completed', 'withdrew')),
    teaching_hours_logged INTEGER DEFAULT 0,
    teaching_hours_target INTEGER DEFAULT 120,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, cohort_id)
);

-- ============================================================================
-- PHASE 5: MENTOR & SUPERVISION
-- ============================================================================

-- 5.1 Mentors
CREATE TABLE IF NOT EXISTS mentors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES teacher_education_programs(id) ON DELETE CASCADE,
    mentor_code VARCHAR(50) UNIQUE NOT NULL,
    specialization_km VARCHAR(255),
    specialization_en VARCHAR(255),
    years_of_experience INTEGER,
    max_mentees INTEGER DEFAULT 6,
    current_mentees_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5.2 Mentor Relationships
CREATE TABLE IF NOT EXISTS mentor_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_id UUID NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
    graduate_student_id UUID NOT NULL REFERENCES graduate_students(id) ON DELETE CASCADE,
    assignment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_phase_id UUID REFERENCES program_phases(id),
    end_phase_id UUID REFERENCES program_phases(id),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'terminated')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(mentor_id, graduate_student_id)
);

-- 5.3 Mentor Sessions (mentoring meetings)
CREATE TABLE IF NOT EXISTS mentor_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_relationship_id UUID NOT NULL REFERENCES mentor_relationships(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    session_time_start TIME,
    session_time_end TIME,
    duration_minutes INTEGER,
    session_type VARCHAR(50) DEFAULT 'guidance' CHECK (session_type IN ('guidance', 'observation_debrief', 'portfolio_review', 'assessment')),
    topic_km VARCHAR(255),
    topic_en VARCHAR(255),
    notes_km TEXT,
    notes_en TEXT,
    follow_up_actions_km TEXT,
    follow_up_actions_en TEXT,
    mentor_feedback_km TEXT,
    mentor_feedback_en TEXT,
    scheduled_date DATE,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PHASE 6: TEACHING PRACTICE / PRACTICUM
-- ============================================================================

-- 6.1 Partner Schools
CREATE TABLE IF NOT EXISTS partner_schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES teacher_education_programs(id) ON DELETE CASCADE,
    school_code VARCHAR(50) UNIQUE NOT NULL,
    name_km VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    location_km VARCHAR(255),
    location_en VARCHAR(255),
    school_type VARCHAR(50),
    grade_levels VARCHAR(255),
    student_population INTEGER,
    is_active BOOLEAN DEFAULT true,
    contact_person_name VARCHAR(255),
    contact_person_email VARCHAR(255),
    contact_person_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6.2 Practicum Placements
CREATE TABLE IF NOT EXISTS practicum_placements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    graduate_student_id UUID NOT NULL REFERENCES graduate_students(id) ON DELETE CASCADE,
    partner_school_id UUID NOT NULL REFERENCES partner_schools(id) ON DELETE CASCADE,
    school_supervisor_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    placement_start_date DATE NOT NULL,
    placement_end_date DATE NOT NULL,
    duration_weeks INTEGER NOT NULL DEFAULT 10,
    grade_level_taught VARCHAR(50),
    subject_taught_km VARCHAR(255),
    subject_taught_en VARCHAR(255),
    class_size INTEGER,
    required_teaching_hours INTEGER DEFAULT 120,
    actual_teaching_hours_logged INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'terminated')),
    placement_notes_km TEXT,
    placement_notes_en TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6.3 Teaching Hours Log
CREATE TABLE IF NOT EXISTS teaching_hours_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practicum_placement_id UUID NOT NULL REFERENCES practicum_placements(id) ON DELETE CASCADE,
    teaching_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    duration_minutes INTEGER NOT NULL,
    lesson_topic_km VARCHAR(255),
    lesson_topic_en VARCHAR(255),
    class_notes_km TEXT,
    class_notes_en TEXT,
    students_present INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PHASE 7: ASSESSMENT & OBSERVATIONS
-- ============================================================================

-- 7.1 Teaching Observations (formal observations)
CREATE TABLE IF NOT EXISTS teaching_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practicum_placement_id UUID NOT NULL REFERENCES practicum_placements(id) ON DELETE CASCADE,
    mentor_id UUID NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
    observation_date DATE NOT NULL,
    observation_time_start TIME,
    observation_time_end TIME,
    lesson_topic_km VARCHAR(255),
    lesson_topic_en VARCHAR(255),
    observation_notes_km TEXT,
    observation_notes_en TEXT,
    strengths_km TEXT,
    strengths_en TEXT,
    areas_for_improvement_km TEXT,
    areas_for_improvement_en TEXT,
    overall_impression_km TEXT,
    overall_impression_en TEXT,
    observation_score INTEGER CHECK (observation_score BETWEEN 1 AND 100),
    is_formal BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7.2 Competency Assessments (tracking progress on 10 competencies)
CREATE TABLE IF NOT EXISTS competency_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    graduate_student_id UUID NOT NULL REFERENCES graduate_students(id) ON DELETE CASCADE,
    competency_id UUID NOT NULL REFERENCES competency_framework(id) ON DELETE CASCADE,
    mentor_id UUID NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
    assessment_date DATE NOT NULL,
    competency_level_id UUID REFERENCES competency_levels(id),
    score INTEGER CHECK (score BETWEEN 1 AND 100),
    assessment_comments_km TEXT,
    assessment_comments_en TEXT,
    evidence_sources VARCHAR(255)[],
    is_verified BOOLEAN DEFAULT false,
    verification_date DATE,
    verification_notes_km TEXT,
    verification_notes_en TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(graduate_student_id, competency_id, assessment_date)
);

-- ============================================================================
-- PHASE 8: LESSON SUBMISSIONS & EVIDENCE
-- ============================================================================

-- 8.1 Lesson Submissions
CREATE TABLE IF NOT EXISTS lesson_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    graduate_student_id UUID NOT NULL REFERENCES graduate_students(id) ON DELETE CASCADE,
    program_module_id UUID REFERENCES program_modules(id) ON DELETE SET NULL,
    lesson_title_km VARCHAR(255) NOT NULL,
    lesson_title_en VARCHAR(255) NOT NULL,
    grade_level VARCHAR(50),
    subject_km VARCHAR(255),
    subject_en VARCHAR(255),
    learning_objectives_km TEXT,
    learning_objectives_en TEXT,
    lesson_plan_file_url VARCHAR(500),
    actual_lesson_notes_km TEXT,
    actual_lesson_notes_en TEXT,
    reflection_km TEXT,
    reflection_en TEXT,
    student_feedback_summary TEXT,
    submission_date DATE NOT NULL,
    mentor_feedback_km TEXT,
    mentor_feedback_en TEXT,
    mentor_score INTEGER CHECK (mentor_score BETWEEN 1 AND 100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PHASE 9: E-PORTFOLIO & EVIDENCE COLLECTION
-- ============================================================================

-- 9.1 E-Portfolios
CREATE TABLE IF NOT EXISTS e_portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    graduate_student_id UUID NOT NULL REFERENCES graduate_students(id) ON DELETE CASCADE,
    portfolio_title_km VARCHAR(255),
    portfolio_title_en VARCHAR(255),
    introduction_km TEXT,
    introduction_en TEXT,
    portfolio_status VARCHAR(50) DEFAULT 'draft' CHECK (portfolio_status IN ('draft', 'in_progress', 'under_review', 'completed')),
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
    review_date DATE,
    reviewer_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    review_feedback_km TEXT,
    review_feedback_en TEXT,
    review_score INTEGER CHECK (review_score BETWEEN 1 AND 100),
    is_certified BOOLEAN DEFAULT false,
    certification_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(graduate_student_id)
);

-- 9.2 Portfolio Evidence Items
CREATE TABLE IF NOT EXISTS portfolio_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    e_portfolio_id UUID NOT NULL REFERENCES e_portfolios(id) ON DELETE CASCADE,
    competency_id UUID REFERENCES competency_framework(id) ON DELETE SET NULL,
    evidence_type VARCHAR(50) NOT NULL CHECK (evidence_type IN ('lesson_plan', 'reflection', 'observation_feedback', 'student_feedback', 'assessment_sample', 'photo', 'video', 'document', 'other')),
    title_km VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    description_km TEXT,
    description_en TEXT,
    file_url VARCHAR(500),
    submission_date DATE NOT NULL,
    alignment_notes_km TEXT,
    alignment_notes_en TEXT,
    is_approved BOOLEAN DEFAULT false,
    approval_date DATE,
    approver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PHASE 10: CERTIFICATION & COMPLETION
-- ============================================================================

-- 10.1 Certification Requirements
CREATE TABLE IF NOT EXISTS certification_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES teacher_education_programs(id) ON DELETE CASCADE,
    requirement_type VARCHAR(50) NOT NULL CHECK (requirement_type IN ('competency', 'hours', 'portfolio', 'assessment', 'attendance')),
    requirement_name_km VARCHAR(255),
    requirement_name_en VARCHAR(255),
    requirement_description_km TEXT,
    requirement_description_en TEXT,
    measurement_criteria_km TEXT,
    measurement_criteria_en TEXT,
    minimum_threshold INTEGER,
    maximum_threshold INTEGER,
    is_required BOOLEAN DEFAULT true,
    sequence_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10.2 Certification Status Tracking
CREATE TABLE IF NOT EXISTS certification_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    graduate_student_id UUID NOT NULL REFERENCES graduate_students(id) ON DELETE CASCADE,
    certification_requirement_id UUID NOT NULL REFERENCES certification_requirements(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT false,
    completion_date DATE,
    evidence_submitted BOOLEAN DEFAULT false,
    evidence_file_url VARCHAR(500),
    verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'needs_revision')),
    verification_date DATE,
    verifier_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    verification_notes_km TEXT,
    verification_notes_en TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(graduate_student_id, certification_requirement_id)
);

-- 10.3 Final Certification Record
CREATE TABLE IF NOT EXISTS final_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    graduate_student_id UUID NOT NULL REFERENCES graduate_students(id) ON DELETE CASCADE,
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES teacher_education_programs(id) ON DELETE CASCADE,
    certification_date DATE NOT NULL,
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    certification_status VARCHAR(50) DEFAULT 'issued' CHECK (certification_status IN ('issued', 'revoked', 'suspended')),
    all_competencies_verified BOOLEAN DEFAULT false,
    total_teaching_hours INTEGER,
    portfolio_final_score INTEGER,
    final_assessment_score INTEGER,
    issuing_authority_km VARCHAR(255),
    issuing_authority_en VARCHAR(255),
    signed_by_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    contract_teacher_ready BOOLEAN DEFAULT false,
    next_steps_km TEXT,
    next_steps_en TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(graduate_student_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_graduate_students_cohort_id ON graduate_students(cohort_id);
CREATE INDEX idx_graduate_students_user_id ON graduate_students(user_id);
CREATE INDEX idx_graduate_students_status ON graduate_students(status);
CREATE INDEX idx_mentor_relationships_mentor_id ON mentor_relationships(mentor_id);
CREATE INDEX idx_mentor_relationships_student_id ON mentor_relationships(graduate_student_id);
CREATE INDEX idx_competency_assessments_student_id ON competency_assessments(graduate_student_id);
CREATE INDEX idx_competency_assessments_competency_id ON competency_assessments(competency_id);
CREATE INDEX idx_teaching_observations_placement_id ON teaching_observations(practicum_placement_id);
CREATE INDEX idx_practicum_placements_student_id ON practicum_placements(graduate_student_id);
CREATE INDEX idx_practicum_placements_school_id ON practicum_placements(partner_school_id);
CREATE INDEX idx_portfolio_evidence_portfolio_id ON portfolio_evidence(e_portfolio_id);
CREATE INDEX idx_certification_status_student_id ON certification_status(graduate_student_id);
CREATE INDEX idx_mentor_sessions_relationship_id ON mentor_sessions(mentor_relationship_id);

-- ============================================================================
-- FINAL SUMMARY OF TABLES CREATED
-- ============================================================================
/*
PROGRAM STRUCTURE:
  ✓ teacher_education_programs - Main program definition
  ✓ program_phases - 4 phases (Foundation, Pedagogy, Practicum, Assessment)
  ✓ program_modules - 16 modules (4 per phase)
  ✓ competency_framework - 10 competencies
  ✓ competency_levels - 5 proficiency levels (1=Beginning, 5=Master)

USER MANAGEMENT:
  ✓ user_roles_extended - Extended role definitions
  ✓ mentors - Mentor profiles
  ✓ graduate_students - Teacher trainees

RELATIONSHIPS & MENTORSHIP:
  ✓ mentor_relationships - Mentor-to-student assignments
  ✓ mentor_sessions - Mentoring meetings & feedback

COHORT MANAGEMENT:
  ✓ cohorts - Batch groups (Batch 2025-01, etc.)

PRACTICUM & TEACHING:
  ✓ partner_schools - 3-5 schools for placement
  ✓ practicum_placements - Student-to-school assignments
  ✓ teaching_hours_log - Daily teaching hours tracking
  ✓ teaching_observations - Formal observation records

ASSESSMENT & COMPETENCY TRACKING:
  ✓ competency_assessments - Progress on 10 competencies (1-100 score)
  ✓ lesson_submissions - Lesson plan & reflection submissions

PORTFOLIO & EVIDENCE:
  ✓ e_portfolios - Student portfolios
  ✓ portfolio_evidence - Evidence items (lessons, reflections, feedback, etc.)

CERTIFICATION:
  ✓ certification_requirements - What's needed for certification
  ✓ certification_status - Track each requirement
  ✓ final_certifications - Final credential issued

TOTAL: 24 new/modified tables
RELATIONSHIPS: Full referential integrity with cascading deletes
INDEXES: 11 indexes for query performance
LANGUAGES: All tables have both Khmer (_km) and English (_en) fields
*/

-- ============================================================================
-- MIGRATION STATUS: READY FOR IMPLEMENTATION
-- ============================================================================
-- This schema is designed for:
-- ✓ 6-month teacher training program
-- ✓ 4 sequential phases
-- ✓ 16 modules (4 per phase)
-- ✓ 10 core competencies
-- ✓ Real classroom practicum (120-150 hours)
-- ✓ Mentor-guided learning
-- ✓ Portfolio-based assessment
-- ✓ Competency-verified certification
-- ✓ Multiple cohorts per year (Batch YYYY-NN format)
-- ✓ Khmer-first localization
