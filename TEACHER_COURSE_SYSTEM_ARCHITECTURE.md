# Teacher Course Creation System - Complete Architecture

**Status:** Planning Phase
**Target:** Build complete teacher/course/assessment system with H5P
**Timeline:** Phased implementation starting NOW

---

## 🎯 System Overview

### Architecture: Integrated Pedagogy LMS

```
TIER 1: TEACHER TRAINING (Existing - Graduate Student)
├─ Graduate Student learns to teach
├─ Logs teaching hours (at practicum school)
├─ Submits portfolio evidence
├─ Gets assessed on 10 competencies
├─ Completes training → Gets certified
└─ Dashboard: Progress, competencies, mentorship

                    ⬇️ (Same person can do both)

TIER 2: COURSE CREATION (New - Teacher)
├─ Teacher creates online courses
├─ Adds H5P interactive content (top 10 types)
├─ Designs assessments/quizzes
├─ Creates assignments
├─ Grades student work
└─ Dashboard: My courses, student progress, analytics

                    ⬇️

TIER 3: STUDENT LEARNING (New - Learner)
├─ Student enrolls in courses
├─ Completes lessons
├─ Interacts with H5P activities
├─ Takes quizzes/assessments
├─ Submits assignments
├─ Views grades
└─ Dashboard: My courses, progress, grades
```

### User Roles (Updated)

```
1. GRADUATE STUDENT (Existing)
   └─ Training program: logs hours, portfolio, assessments

2. TEACHER (New)
   └─ Course creation: manage courses, H5P, assessments, grading

3. STUDENT (New)
   └─ Course learning: enroll, take courses, submit work

4. MENTOR (Existing)
   └─ Assessment: evaluate graduate students

5. COORDINATOR (Existing)
   └─ Program management: oversee training, issue certs

6. ADMIN (Existing)
   └─ System management: users, roles, settings
```

**Note:** Graduate Student role can ALSO have Teacher role (dual role)

---

## 📊 Top 10 H5P Content Types for Pedagogy

### Why These 10?

These are the most useful for pedagogy/adult education:

| # | Type | Use Case | Pedagogy Example |
|---|------|----------|------------------|
| 1 | **Interactive Video** | Embed quizzes in videos | Model lesson teaching, show classroom scenarios |
| 2 | **Quiz (Multiple Choice)** | Knowledge assessment | Test understanding of teaching methods |
| 3 | **Branching Scenario** | Decision-making practice | "Student misbehaves - what do you do?" |
| 4 | **Presentation (Slides)** | Lecture/overview content | Presentation of curriculum topics |
| 5 | **Drag & Drop** | Interactive learning | Match teaching strategies to student needs |
| 6 | **Flashcards** | Memorization | Key vocabulary, teaching terminology |
| 7 | **Timeline** | Sequence learning | Historical development of pedagogical approaches |
| 8 | **Image Hotspots** | Interactive exploration | Annotate classroom photos, label teaching strategies |
| 9 | **Fill in the Blanks** | Practice & assessment | Complete teaching principles, lesson plans |
| 10 | **Course Presentation** | Structured lessons | Multi-slide interactive course material |

### Implementation Plan

Each content type will have:
- ✅ Create interface (easy form-based creation)
- ✅ Edit functionality
- ✅ Preview before publish
- ✅ Embed in course
- ✅ Track student responses
- ✅ Generate reports

---

## 🗄️ Database Schema (New Tables Needed)

```sql
-- COURSES
CREATE TABLE courses (
  course_id UUID PRIMARY KEY,
  teacher_id UUID REFERENCES profiles(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject_area VARCHAR(100),
  level ENUM('beginner', 'intermediate', 'advanced'),
  duration_hours INT,
  status ENUM('draft', 'published', 'archived'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  published_at TIMESTAMP
);

-- COURSE LESSONS/SECTIONS
CREATE TABLE course_lessons (
  lesson_id UUID PRIMARY KEY,
  course_id UUID REFERENCES courses(course_id),
  lesson_number INT,
  title VARCHAR(255),
  description TEXT,
  order_position INT,
  created_at TIMESTAMP
);

-- COURSE MATERIALS (Text, PDF, Links)
CREATE TABLE course_materials (
  material_id UUID PRIMARY KEY,
  lesson_id UUID REFERENCES course_lessons(lesson_id),
  type ENUM('text', 'file', 'link', 'h5p'),
  content TEXT,
  file_url VARCHAR,
  position INT,
  created_at TIMESTAMP
);

-- H5P CONTENT
CREATE TABLE h5p_content (
  h5p_id UUID PRIMARY KEY,
  course_id UUID REFERENCES courses(course_id),
  lesson_id UUID REFERENCES course_lessons(lesson_id),
  content_type ENUM(
    'interactive_video',
    'quiz_mc',
    'branching_scenario',
    'presentation',
    'drag_drop',
    'flashcards',
    'timeline',
    'image_hotspots',
    'fill_blanks',
    'course_presentation'
  ),
  title VARCHAR(255),
  content_json JSONB,  -- H5P configuration
  h5p_library_id VARCHAR,  -- H5P library reference
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- ASSIGNMENTS
CREATE TABLE assignments (
  assignment_id UUID PRIMARY KEY,
  course_id UUID REFERENCES courses(course_id),
  title VARCHAR(255),
  description TEXT,
  due_date TIMESTAMP,
  instructions TEXT,
  max_score INT,
  created_at TIMESTAMP
);

-- STUDENT SUBMISSIONS
CREATE TABLE student_submissions (
  submission_id UUID PRIMARY KEY,
  assignment_id UUID REFERENCES assignments(assignment_id),
  student_id UUID REFERENCES profiles(id),
  submitted_at TIMESTAMP,
  file_url VARCHAR,
  text_content TEXT,
  score INT,
  feedback TEXT,
  status ENUM('pending', 'submitted', 'graded', 'returned'),
  created_at TIMESTAMP
);

-- QUIZZES (H5P-based or custom)
CREATE TABLE quizzes (
  quiz_id UUID PRIMARY KEY,
  course_id UUID REFERENCES courses(course_id),
  title VARCHAR(255),
  h5p_id UUID REFERENCES h5p_content(h5p_id),
  passing_score INT,
  attempts_allowed INT,
  created_at TIMESTAMP
);

-- QUIZ ATTEMPTS
CREATE TABLE quiz_attempts (
  attempt_id UUID PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(quiz_id),
  student_id UUID REFERENCES profiles(id),
  score INT,
  max_score INT,
  answers JSONB,
  attempted_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- COURSE ENROLLMENT
CREATE TABLE course_enrollments (
  enrollment_id UUID PRIMARY KEY,
  course_id UUID REFERENCES courses(course_id),
  student_id UUID REFERENCES profiles(id),
  enrolled_at TIMESTAMP,
  completed_at TIMESTAMP,
  status ENUM('active', 'completed', 'dropped'),
  progress_percentage INT DEFAULT 0
);

-- H5P INTERACTIONS (Track student engagement with H5P content)
CREATE TABLE h5p_interactions (
  interaction_id UUID PRIMARY KEY,
  h5p_id UUID REFERENCES h5p_content(h5p_id),
  student_id UUID REFERENCES profiles(id),
  interaction_type VARCHAR(50),
  response JSONB,
  score INT,
  time_spent_seconds INT,
  created_at TIMESTAMP
);

-- GRADEBOOK (Summary of all grades per student per course)
CREATE TABLE gradebook (
  gradebook_id UUID PRIMARY KEY,
  course_id UUID REFERENCES courses(course_id),
  student_id UUID REFERENCES profiles(id),
  quiz_average DECIMAL(5,2),
  assignment_average DECIMAL(5,2),
  participation_score INT,
  final_grade DECIMAL(5,2),
  letter_grade VARCHAR(2),
  updated_at TIMESTAMP
);
```

---

## 📄 Pages to Build (9 Features)

### PHASE 1: Teacher Dashboard & Course Management

#### 1. Teacher Dashboard `/dashboard/teacher`
- Quick stats: Active courses, enrolled students, pending grades
- Recent activity feed
- Today's deadlines (due assignments/quizzes)
- Links to: My Courses, Create Course, Students, Grades

#### 2. Course Management `/dashboard/teacher/courses`
- List all courses (draft, published, archived)
- Create new course (modal)
- Edit course details
- Duplicate course (template)
- Archive/delete course
- Publish course
- View course analytics

#### 3. Course Editor `/dashboard/teacher/courses/[id]`
- Course settings (title, description, level, duration)
- Lessons/sections management
  - Add/reorder/delete lessons
  - For each lesson: add materials, H5P, assignments
- Preview course
- Student enrollment list
- Course analytics

### PHASE 2: H5P Content Creation

#### 4. H5P Content Library `/dashboard/teacher/h5p-library`
- Browse all H5P content types
- Create new H5P (select type → builder)
- Edit existing H5P
- Reusable library (use same H5P in multiple courses)
- Preview H5P
- Export/import H5P

#### 5. H5P Type Builders (Modal forms for each type)
- **Interactive Video** - Upload video, embed quizzes
- **Quiz (MC)** - Add questions, answers, scoring
- **Branching Scenario** - Create decision tree scenarios
- **Presentation** - Create slide deck
- **Drag & Drop** - Create matching/categorizing activities
- **Flashcards** - Create card pairs
- **Timeline** - Create timeline events
- **Image Hotspots** - Upload image, add interactive spots
- **Fill in Blanks** - Create cloze activities
- **Course Presentation** - Create structured multi-slide content

### PHASE 3: Assessment & Grading

#### 6. Assessments & Quizzes `/dashboard/teacher/assessments`
- View all quizzes/assignments
- Create assignment (title, description, due date, max points)
- Create quiz (link to H5P quiz)
- View student responses
- Grade submissions
- Provide feedback

#### 7. Gradebook `/dashboard/teacher/gradebook`
- View all students
- Show grades: quizzes, assignments, participation
- Calculate course grade
- Filter by assignment/quiz
- Export grades (CSV, Excel)
- Message students (low grades, missing work)

### PHASE 4: Student Experience

#### 8. Student Courses Dashboard `/dashboard/student/courses` (ENHANCED)
- Browse available courses
- Enroll in course
- My courses (active, completed)
- Course progress bar
- View grades
- Sort by subject, difficulty, progress

#### 9. Course Learning View `/dashboard/student/courses/[id]`
- View course materials
- Lessons checklist (track completion)
- H5P content interactions (quizzes, scenarios, videos)
- View assignment submissions
- View quiz scores
- See feedback from teacher
- Overall course grade

---

## 🔌 API Routes Needed

```
COURSES
GET    /api/teacher/courses                - List my courses
POST   /api/teacher/courses                - Create course
PUT    /api/teacher/courses/[id]           - Update course
DELETE /api/teacher/courses/[id]           - Delete course
POST   /api/teacher/courses/[id]/publish   - Publish course
GET    /api/teacher/courses/[id]/analytics - Course analytics

LESSONS
POST   /api/teacher/courses/[id]/lessons           - Add lesson
PUT    /api/teacher/courses/[id]/lessons/[lessonId] - Update lesson
DELETE /api/teacher/courses/[id]/lessons/[lessonId] - Delete lesson

H5P CONTENT
POST   /api/h5p/create/[type]              - Create H5P content
PUT    /api/h5p/[id]                       - Update H5P
GET    /api/h5p/[id]                       - Get H5P
DELETE /api/h5p/[id]                       - Delete H5P
GET    /api/h5p/library                    - List H5P library

MATERIALS
POST   /api/lessons/[id]/materials         - Add material to lesson
DELETE /api/materials/[id]                 - Delete material

ASSIGNMENTS
POST   /api/assignments                    - Create assignment
PUT    /api/assignments/[id]               - Update assignment
DELETE /api/assignments/[id]               - Delete assignment
POST   /api/assignments/[id]/submit        - Submit assignment
PUT    /api/assignments/[id]/grade         - Grade assignment

QUIZZES
POST   /api/quizzes                        - Create quiz
GET    /api/quizzes/[id]                   - Get quiz
POST   /api/quizzes/[id]/attempt           - Start quiz attempt
PUT    /api/quizzes/[id]/submit            - Submit quiz attempt

ENROLLMENTS
POST   /api/student/courses/[id]/enroll    - Enroll in course
GET    /api/student/courses                - List enrolled courses
GET    /api/student/courses/[id]/progress  - Get course progress

H5P INTERACTIONS
POST   /api/h5p/[id]/interact              - Track H5P interaction
GET    /api/h5p/[id]/results               - Get H5P results

GRADEBOOK
GET    /api/teacher/gradebook              - View grades
GET    /api/student/grades                 - View my grades
```

---

## 🎨 UI Components Needed (Mantine)

```
NEW COMPONENTS:
├─ CourseCard - Display course (title, teacher, students, progress)
├─ LessonPanel - Sidebar with lessons checklist
├─ H5pBuilder - Form builder for each H5P type
├─ H5pPlayer - Embed and play H5P content
├─ QuizInterface - Display quiz questions, handle responses
├─ AssignmentSubmission - File upload, text input
├─ GradeInput - Score input with feedback field
├─ ProgressBar - Show course/lesson completion
├─ ScenarioTree - Visual branching scenario editor
├─ TimelineBuilder - Create timeline events
└─ ImageAnnotator - Add hotspots to images

ENHANCED COMPONENTS:
├─ StudentDashboard - Add "My Courses" section
└─ GraduateStudentProfile - Show if also has Teacher role
```

---

## 🔐 Role-Based Access Control

```
TEACHER can:
✅ Create courses
✅ Manage course content (lessons, materials, H5P)
✅ Create assessments & quizzes
✅ Grade student work
✅ View course analytics & gradebook
✅ Message students
❌ View other teacher's courses

STUDENT can:
✅ Browse courses
✅ Enroll in courses
✅ View course content
✅ Complete H5P activities
✅ Submit assignments
✅ Take quizzes
✅ View grades & feedback
❌ Create/edit courses

GRADUATE STUDENT can:
✅ (All STUDENT permissions)
✅ (All TEACHER permissions - dual role!)
✅ Log teaching hours (training)
✅ Submit portfolio
✅ View mentor assessments

COORDINATOR/ADMIN:
✅ View all courses
✅ Monitor platform usage
✅ Manage users & roles
```

---

## 📋 Implementation Phases

### PHASE 1: Core Course System (Week 1-2)
- [ ] Add TEACHER role
- [ ] Build Teacher Dashboard
- [ ] Build Course Management (CRUD)
- [ ] Build Lesson/Material Editor
- [ ] Basic course structure

### PHASE 2: H5P Integration (Week 2-3)
- [ ] Integrate H5P library
- [ ] Build H5P content builders (10 types)
- [ ] Create H5P player
- [ ] Track H5P interactions
- [ ] Build H5P library/reusable content

### PHASE 3: Assessment System (Week 3-4)
- [ ] Build Assignment creation & submission
- [ ] Build Quiz creation & attempts
- [ ] Build Grading interface
- [ ] Build Gradebook
- [ ] Auto-calculate grades

### PHASE 4: Student Experience (Week 4-5)
- [ ] Build Student courses dashboard
- [ ] Build Course learning view
- [ ] Build H5P interaction interface
- [ ] Build Progress tracking
- [ ] Build Grade viewing

### PHASE 5: Analytics & Polish (Week 5-6)
- [ ] Course analytics dashboard
- [ ] Student progress reports
- [ ] Teacher effectiveness metrics
- [ ] Messaging system
- [ ] Performance optimization

---

## 🛠️ Technology Stack

```
Frontend:
✅ Next.js 14 (App Router)
✅ React + TypeScript
✅ Mantine UI v7
✅ Tabler Icons

Backend:
✅ Next.js API Routes
✅ PostgreSQL database
✅ H5P library (via NPM or CDN)

Integration:
✅ H5P (content types)
✅ File upload (assignments, materials)
✅ PDF generation (certificates, reports)
✅ Email notifications

Bilingual:
✅ English + Khmer (i18n)
```

---

## 📊 Success Metrics

### For Teachers:
- [ ] Create course in < 5 minutes
- [ ] Add H5P content in < 2 minutes
- [ ] Grade 10 assignments in < 10 minutes
- [ ] View class analytics at a glance

### For Students:
- [ ] Enroll in course in < 30 seconds
- [ ] Complete H5P activity smoothly
- [ ] Submit assignment easily
- [ ] View grades immediately after submission

### For Platform:
- [ ] 50+ courses published
- [ ] 100+ H5P content pieces created
- [ ] 1000+ students enrolled
- [ ] 10,000+ quiz attempts
- [ ] Real-time progress tracking

---

## 🚀 Start Building Strategy

**IMMEDIATE (This session):**
1. ✅ Add TEACHER role to system
2. ✅ Build Teacher Dashboard
3. ✅ Build basic Course Management
4. ✅ Set up H5P integration basics

**NEXT SESSION:**
1. Build H5P builders (top 10 types)
2. Build assessment system
3. Integrate student learning views

---

## 📝 Notes

- H5P is open-source and free to use
- H5P content can be exported/imported
- All H5P data can be stored as JSON in database
- Teacher can reuse H5P content across courses
- Student interactions tracked for analytics
- Grades auto-calculated from quizzes/assignments

---

**Created:** November 6, 2025
**Status:** Ready to implement
**Estimated Total Time:** 5-6 weeks for complete system
**Start:** Immediately with Teacher Dashboard + basic H5P
