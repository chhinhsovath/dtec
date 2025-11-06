-- Phase 1 & Phase 2: Assignment Questions, Responses, and H5P Integration
-- Database migration for interactive assignments with embedded questions and H5P support

-- ============================================================================
-- PHASE 1: ASSIGNMENT QUESTIONS & RESPONSES
-- ============================================================================

-- Assignment Questions Table
-- Stores all questions belonging to an assignment
CREATE TABLE IF NOT EXISTS assignment_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('multiple_choice', 'short_answer', 'essay', 'h5p')),
    question_text TEXT NOT NULL,
    question_description TEXT,
    points DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    required BOOLEAN DEFAULT TRUE,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assignment_id, question_number)
);

-- Question Options Table
-- Stores MCQ options for multiple choice questions
CREATE TABLE IF NOT EXISTS question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES assignment_questions(id) ON DELETE CASCADE,
    option_number INTEGER NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    explanation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(question_id, option_number)
);

-- Assignment Responses Table
-- Stores student responses to assignment questions
CREATE TABLE IF NOT EXISTS assignment_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    submission_id UUID NOT NULL REFERENCES assignment_submissions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES assignment_questions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,

    -- Response data depends on question type
    response_text TEXT, -- For short_answer and essay
    selected_option_id UUID REFERENCES question_options(id) ON DELETE SET NULL, -- For MCQ
    h5p_response_data JSONB, -- For H5P responses (raw interaction data)

    -- Scoring
    score DECIMAL(5,2),
    is_auto_graded BOOLEAN DEFAULT FALSE,
    teacher_feedback TEXT,

    -- Metadata
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    graded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(submission_id, question_id)
);

-- ============================================================================
-- PHASE 2: H5P INTEGRATION
-- ============================================================================

-- H5P Content Library Table
-- Stores reusable H5P content created by teachers
CREATE TABLE IF NOT EXISTS h5p_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,

    title VARCHAR(255) NOT NULL,
    description TEXT,
    h5p_type VARCHAR(100) NOT NULL, -- e.g., 'H5P.Quiz', 'H5P.InteractiveVideo', 'H5P.DragQuestion'

    -- H5P Content Structure
    h5p_json JSONB NOT NULL, -- Complete H5P content JSON
    h5p_library_version VARCHAR(50), -- Library version info
    h5p_thumbnail_url VARCHAR(500),

    -- Visibility
    is_published BOOLEAN DEFAULT FALSE,
    is_reusable BOOLEAN DEFAULT TRUE,

    -- Tracking
    usage_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- H5P in Assignments Junction Table
-- Links H5P content to specific assignment questions
CREATE TABLE IF NOT EXISTS h5p_in_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES assignment_questions(id) ON DELETE CASCADE,
    h5p_content_id UUID NOT NULL REFERENCES h5p_content(id) ON DELETE CASCADE,

    -- Display settings
    display_mode VARCHAR(50) DEFAULT 'embedded', -- 'embedded', 'popup', 'fullscreen'
    height INTEGER DEFAULT 400,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(question_id, h5p_content_id)
);

-- H5P Responses Table
-- Stores detailed student interactions with H5P content
CREATE TABLE IF NOT EXISTS h5p_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    h5p_content_id UUID NOT NULL REFERENCES h5p_content(id) ON DELETE CASCADE,
    assignment_response_id UUID NOT NULL REFERENCES assignment_responses(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,

    -- Interaction data
    interaction_data JSONB NOT NULL, -- Complete H5P interaction details
    raw_score DECIMAL(5,2), -- Score from H5P
    max_score DECIMAL(5,2), -- Maximum possible score
    attempt_number INTEGER DEFAULT 1,

    -- Timing
    time_spent_seconds INTEGER,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_assignment_questions_assignment ON assignment_questions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_questions_type ON assignment_questions(question_type);
CREATE INDEX IF NOT EXISTS idx_question_options_question ON question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_assignment_responses_assignment ON assignment_responses(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_responses_submission ON assignment_responses(submission_id);
CREATE INDEX IF NOT EXISTS idx_assignment_responses_question ON assignment_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_assignment_responses_student ON assignment_responses(student_id);
CREATE INDEX IF NOT EXISTS idx_h5p_content_teacher ON h5p_content(teacher_id);
CREATE INDEX IF NOT EXISTS idx_h5p_content_published ON h5p_content(is_published);
CREATE INDEX IF NOT EXISTS idx_h5p_in_assignments_question ON h5p_in_assignments(question_id);
CREATE INDEX IF NOT EXISTS idx_h5p_responses_h5p_content ON h5p_responses(h5p_content_id);
CREATE INDEX IF NOT EXISTS idx_h5p_responses_student ON h5p_responses(student_id);

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View: Assignment Question Summary with Options
CREATE OR REPLACE VIEW v_assignment_questions_with_options AS
SELECT
    aq.id as question_id,
    aq.assignment_id,
    aq.question_number,
    aq.question_type,
    aq.question_text,
    aq.points,
    json_agg(json_build_object(
        'id', qo.id,
        'option_number', qo.option_number,
        'option_text', qo.option_text,
        'is_correct', qo.is_correct
    ) ORDER BY qo.option_number) FILTER (WHERE qo.id IS NOT NULL) as options
FROM assignment_questions aq
LEFT JOIN question_options qo ON aq.id = qo.question_id
GROUP BY aq.id, aq.assignment_id, aq.question_number, aq.question_type,
         aq.question_text, aq.points;

-- View: Student Assignment Progress
CREATE OR REPLACE VIEW v_student_assignment_progress AS
SELECT
    sub.student_id,
    sub.assignment_id,
    COUNT(DISTINCT aq.id) as total_questions,
    COUNT(DISTINCT CASE WHEN ar.response_text IS NOT NULL OR ar.selected_option_id IS NOT NULL OR ar.h5p_response_data IS NOT NULL THEN ar.id END) as answered_questions,
    COUNT(DISTINCT CASE WHEN ar.score IS NOT NULL THEN ar.id END) as graded_questions,
    SUM(CASE WHEN ar.score IS NOT NULL THEN ar.score ELSE 0 END) as total_score,
    SUM(aq.points) as total_possible_points
FROM assignment_submissions sub
JOIN assignment_questions aq ON sub.assignment_id = aq.assignment_id
LEFT JOIN assignment_responses ar ON sub.id = ar.submission_id AND aq.id = ar.question_id
GROUP BY sub.student_id, sub.assignment_id;

COMMIT;
