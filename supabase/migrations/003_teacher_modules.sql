-- Create enum types for assessments and grades
CREATE TYPE assessment_type AS ENUM ('quiz', 'assignment', 'exam');
CREATE TYPE submission_status AS ENUM ('pending', 'submitted', 'graded', 'returned');

-- Create course_announcements table
CREATE TABLE course_announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assessments table (quizzes, assignments, exams)
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    assessment_type assessment_type NOT NULL,
    total_points INTEGER DEFAULT 100,
    due_date TIMESTAMP WITH TIME ZONE,
    allow_retakes BOOLEAN DEFAULT false,
    max_attempts INTEGER DEFAULT 1,
    show_answers BOOLEAN DEFAULT false,
    shuffle_questions BOOLEAN DEFAULT false,
    time_limit_minutes INTEGER,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create questions table (quiz/exam questions)
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE NOT NULL,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL, -- 'multiple_choice', 'short_answer', 'essay'
    points INTEGER DEFAULT 1,
    order_position INTEGER NOT NULL,
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create question_options table (multiple choice options)
CREATE TABLE question_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    order_position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create submissions table (student responses)
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
    status submission_status DEFAULT 'pending',
    score DECIMAL(5, 2),
    max_score INTEGER,
    started_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    graded_at TIMESTAMP WITH TIME ZONE,
    time_spent_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(assessment_id, student_id)
);

-- Create submission_answers table (individual question responses)
CREATE TABLE submission_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
    answer_text TEXT,
    selected_option_id UUID REFERENCES question_options(id) ON DELETE SET NULL,
    points_earned DECIMAL(5, 2),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(submission_id, question_id)
);

-- Create grades table (final scores and feedback)
CREATE TABLE grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE NOT NULL,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    overall_score DECIMAL(5, 2) NOT NULL,
    letter_grade TEXT,
    feedback TEXT,
    graded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(submission_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_course_announcements_course_id ON course_announcements(course_id);
CREATE INDEX idx_course_announcements_teacher_id ON course_announcements(teacher_id);
CREATE INDEX idx_course_announcements_created_at ON course_announcements(created_at DESC);

CREATE INDEX idx_assessments_course_id ON assessments(course_id);
CREATE INDEX idx_assessments_teacher_id ON assessments(teacher_id);
CREATE INDEX idx_assessments_is_published ON assessments(is_published);
CREATE INDEX idx_assessments_due_date ON assessments(due_date);

CREATE INDEX idx_questions_assessment_id ON questions(assessment_id);
CREATE INDEX idx_questions_order_position ON questions(assessment_id, order_position);

CREATE INDEX idx_question_options_question_id ON question_options(question_id);
CREATE INDEX idx_question_options_order_position ON question_options(question_id, order_position);

CREATE INDEX idx_submissions_assessment_id ON submissions(assessment_id);
CREATE INDEX idx_submissions_student_id ON submissions(student_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at);

CREATE INDEX idx_submission_answers_submission_id ON submission_answers(submission_id);
CREATE INDEX idx_submission_answers_question_id ON submission_answers(question_id);

CREATE INDEX idx_grades_submission_id ON grades(submission_id);
CREATE INDEX idx_grades_teacher_id ON grades(teacher_id);
CREATE INDEX idx_grades_graded_at ON grades(graded_at DESC);

-- Enable Row Level Security
ALTER TABLE course_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course_announcements
CREATE POLICY "Teachers can manage announcements for their courses"
    ON course_announcements FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM teacher_courses
            WHERE teacher_courses.teacher_id = auth.uid()
            AND teacher_courses.course_id = course_announcements.course_id
        )
    );

CREATE POLICY "Students can view announcements for enrolled courses"
    ON course_announcements FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM enrollments
            JOIN students ON students.id = enrollments.student_id
            WHERE students.user_id = auth.uid()
            AND enrollments.course_id = course_announcements.course_id
        )
    );

-- RLS Policies for assessments
CREATE POLICY "Teachers can manage assessments for their courses"
    ON assessments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM teacher_courses
            WHERE teacher_courses.teacher_id = auth.uid()
            AND teacher_courses.course_id = assessments.course_id
        )
    );

CREATE POLICY "Students can view published assessments for enrolled courses"
    ON assessments FOR SELECT
    USING (
        is_published = true AND
        EXISTS (
            SELECT 1 FROM enrollments
            JOIN students ON students.id = enrollments.student_id
            WHERE students.user_id = auth.uid()
            AND enrollments.course_id = assessments.course_id
        )
    );

-- RLS Policies for questions
CREATE POLICY "Teachers can manage questions for their assessments"
    ON questions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM assessments
            JOIN teacher_courses ON teacher_courses.course_id = assessments.course_id
            WHERE teacher_courses.teacher_id = auth.uid()
            AND assessments.id = questions.assessment_id
        )
    );

CREATE POLICY "Students can view questions for assessments they can access"
    ON questions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM assessments
            WHERE assessments.is_published = true
            AND assessments.id = questions.assessment_id
            AND EXISTS (
                SELECT 1 FROM enrollments
                JOIN students ON students.id = enrollments.student_id
                WHERE students.user_id = auth.uid()
                AND enrollments.course_id = assessments.course_id
            )
        )
    );

-- RLS Policies for question_options
CREATE POLICY "Teachers can manage question options"
    ON question_options FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM questions
            JOIN assessments ON assessments.id = questions.assessment_id
            JOIN teacher_courses ON teacher_courses.course_id = assessments.course_id
            WHERE teacher_courses.teacher_id = auth.uid()
            AND questions.id = question_options.question_id
        )
    );

CREATE POLICY "Students can view options for accessible questions"
    ON question_options FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM questions
            JOIN assessments ON assessments.id = questions.assessment_id
            WHERE assessments.is_published = true
            AND questions.id = question_options.question_id
            AND EXISTS (
                SELECT 1 FROM enrollments
                JOIN students ON students.id = enrollments.student_id
                WHERE students.user_id = auth.uid()
                AND enrollments.course_id = assessments.course_id
            )
        )
    );

-- RLS Policies for submissions
CREATE POLICY "Teachers can view submissions for their assessments"
    ON submissions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM assessments
            JOIN teacher_courses ON teacher_courses.course_id = assessments.course_id
            WHERE teacher_courses.teacher_id = auth.uid()
            AND assessments.id = submissions.assessment_id
        )
    );

CREATE POLICY "Teachers can update submissions for grading"
    ON submissions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM assessments
            JOIN teacher_courses ON teacher_courses.course_id = assessments.course_id
            WHERE teacher_courses.teacher_id = auth.uid()
            AND assessments.id = submissions.assessment_id
        )
    );

CREATE POLICY "Students can view their own submissions"
    ON submissions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM students
            WHERE students.id = submissions.student_id
            AND students.user_id = auth.uid()
        )
    );

CREATE POLICY "Students can submit assessments for their courses"
    ON submissions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM students
            WHERE students.id = submissions.student_id
            AND students.user_id = auth.uid()
        )
    );

-- RLS Policies for submission_answers
CREATE POLICY "Teachers can view submission answers"
    ON submission_answers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM submissions
            JOIN assessments ON assessments.id = submissions.assessment_id
            JOIN teacher_courses ON teacher_courses.course_id = assessments.course_id
            WHERE teacher_courses.teacher_id = auth.uid()
            AND submissions.id = submission_answers.submission_id
        )
    );

CREATE POLICY "Students can manage their own submission answers"
    ON submission_answers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM submissions
            JOIN students ON students.id = submissions.student_id
            WHERE students.user_id = auth.uid()
            AND submissions.id = submission_answers.submission_id
        )
    );

-- RLS Policies for grades
CREATE POLICY "Teachers can manage grades for their assessments"
    ON grades FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM submissions
            JOIN assessments ON assessments.id = submissions.assessment_id
            JOIN teacher_courses ON teacher_courses.course_id = assessments.course_id
            WHERE teacher_courses.teacher_id = auth.uid()
            AND submissions.id = grades.submission_id
        )
    );

CREATE POLICY "Students can view grades for their submissions"
    ON grades FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM submissions
            JOIN students ON students.id = submissions.student_id
            WHERE students.user_id = auth.uid()
            AND submissions.id = grades.submission_id
        )
    );

-- Create triggers for updated_at
CREATE TRIGGER update_course_announcements_updated_at BEFORE UPDATE ON course_announcements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_question_options_updated_at BEFORE UPDATE ON question_options
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submission_answers_updated_at BEFORE UPDATE ON submission_answers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON grades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
