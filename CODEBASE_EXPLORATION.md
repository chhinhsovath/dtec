# DGTech Codebase Exploration Summary

**Generated:** November 5, 2025
**Project:** DGTech (LMS with Teacher Dashboard)
**Stack:** Next.js 14, TypeScript, Mantine UI, PostgreSQL, Supabase

---

## 1. MANTINE UI CONFIGURATION

### Status: ✅ FULLY INSTALLED & CONFIGURED

#### Installed Mantine Packages (v8.3.6+)
```json
"@mantine/core": "^8.3.6",
"@mantine/dates": "^8.3.6",
"@mantine/form": "^8.3.6",
"@mantine/hooks": "^8.3.6",
"@mantine/notifications": "^8.3.6",
"@tabler/icons-react": "^3.35.0",
"@emotion/react": "^11.14.0",
"@emotion/styled": "^11.14.1"
```

#### Mantine Provider Setup
**File:** `/app/providers.tsx`
- MantineProvider configured with:
  - Primary color: `cyan`
  - Font family: `Ubuntu Sans, Hanuman` (supports Khmer/English)
  - Notifications system enabled
  - Global styles imported
  - Ready to use all Mantine components

#### Import Pattern Used Throughout
```typescript
import {
  Container,
  Title,
  Text,
  Button,
  Paper,
  Group,
  Stack,
  Modal,
  TextInput,
  Textarea,
  Select,
  Table,
  Badge,
  ActionIcon,
  Loader,
  Center,
} from '@mantine/core';
import { IconBook, IconUsers, IconPlus } from '@tabler/icons-react';
```

---

## 2. CURRENT TEACHER DASHBOARD PAGES

### Existing Pages in `/app/dashboard/teacher/`

| Page | Status | Purpose | API Route |
|------|--------|---------|-----------|
| **page.tsx** | ✅ Complete | Teacher dashboard home | None |
| **courses/page.tsx** | ✅ Complete | List/create/manage courses | `/api/teacher/courses` |
| **assignments/page.tsx** | ✅ Complete | List/create/grade assignments | `/api/teacher/assignments` |
| **assignments/[id]/page.tsx** | ✅ Complete | Assignment detail page | - |
| **assignments/[id]/submissions/[submissionId]/page.tsx** | ✅ Complete | Grade submission | - |
| **grades/page.tsx** | ✅ Complete | View grades | `/api/teacher/grades` |
| **materials/page.tsx** | ✅ Complete | Upload course materials | `/api/teacher/materials` |
| **students/page.tsx** | ✅ Complete | View enrolled students | `/api/teacher/students` |
| **quizzes/page.tsx** | ⚠️ Hybrid (Shadcn/UI) | Quiz management | `/api/quizzes` |
| **layout.tsx** | ✅ Basic | Minimal layout wrapper | - |

**Note:** Most pages use Mantine UI. `quizzes/page.tsx` uses Shadcn UI components (needs migration to Mantine).

---

## 3. DATABASE SCHEMA ANALYSIS

### Assessment-Related Tables

#### Phase 1: Initial Schema (Supabase migrations)
File: `/supabase/migrations/001_initial_schema.sql`
- No assessment/quiz tables in initial schema
- Focus on basic course/student/teacher structure

#### Phase 4: Assessment & Grading (Exists)
File: `/migrations/021_assessment_grading.sql`

**Core Assessment Tables:**
```
assessments (id, course_id, title, description, assessment_type, status, ...)
├── questions (id, assessment_id, question_text, question_type, points, ...)
│   └── question_options (id, question_id, option_text, is_correct, ...)
├── submissions (id, assessment_id, student_id, answers JSONB, status, ...)
└── grades (id, submission_id, assessment_id, student_id, score, ...)
```

#### Quiz System Tables (Separate)
File: `/migrations/005_subject_and_quizzes.sql`

**Quiz Tables:**
```
quizzes (id, course_id, title, quiz_type, total_questions, ...)
├── quiz_questions (id, quiz_id, question_text, question_type, ...)
│   └── quiz_answer_options (id, question_id, option_text, is_correct, ...)
├── student_quiz_attempts (id, quiz_id, student_id, status, score, ...)
└── student_quiz_answers (id, attempt_id, question_id, answer_text, ...)
```

#### Grade Scale Tables
```
grade_scales (id, institution_id, name, is_default, ...)
└── grade_scale_entries (id, grade_scale_id, grade_letter, min_percentage, max_percentage, ...)
```

### Key Database Features
- Row Level Security (RLS) enabled on assessment tables
- Bilingual support: `title_km`, `description_km` fields
- Flexible JSONB for storing submission answers
- Multiple quiz types: quiz, exam, practice, assignment
- Auto-grading support for multiple choice
- Time tracking for quiz attempts
- Attempt limits configurable per quiz

### Foreign Key Relationships
```
assessments → courses → institutions
questions → assessments
submissions → assessments + student_id
grades → submissions + assessments + courses
```

---

## 4. EXISTING API PATTERNS

### Teacher API Routes
Location: `/app/api/teacher/`

#### Available Routes
```
GET    /api/teacher/courses              - List courses
POST   /api/teacher/courses              - Create course
GET    /api/teacher/courses/[courseId]   - Get course details
PUT    /api/teacher/courses/[courseId]   - Update course

GET    /api/teacher/assignments          - List assignments
POST   /api/teacher/assignments          - Create assignment
PUT    /api/teacher/assignments/[id]     - Update assignment
DELETE /api/teacher/assignments/[id]     - Delete assignment
GET    /api/teacher/assignments/[id]/submissions/[submissionId] - Grade

GET    /api/teacher/students             - List students
GET    /api/teacher/attendance           - Attendance records
GET    /api/teacher/grades               - Grade records
```

#### API Pattern Example
```typescript
// GET request pattern
const teacherId = request.headers.get('x-teacher-id');
const result = await query(`
  SELECT * FROM assignments
  JOIN courses c ON a.course_id = c.id
  JOIN teacher_courses tc ON c.id = tc.course_id
  WHERE tc.teacher_id = $1
`, [teacherId]);

return NextResponse.json({
  success: true,
  data: result.rows,
  error: error.message
}, { status: 200 | 400 | 403 | 500 });
```

#### Key Patterns
- Teacher ID passed via header: `x-teacher-id`
- Parameterized queries (prevents SQL injection)
- Detailed error responses with `code` and `detail`
- JOIN-heavy queries for related data
- Pagination support via query params
- Row-level access control at API level

---

## 5. COMPONENT PATTERNS & EXISTING COMPONENTS

### Mantine-Based Components

#### FormModal Component
**File:** `/app/components/FormModal.tsx`
```typescript
interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'date' | 'datetime-local';
  placeholder?: string;
  required?: boolean;
  rows?: number;
  options?: Array<{ value: string; label: string }>;
  pattern?: string;
  min?: number | string;
  max?: number | string;
}
```

Features:
- Built-in validation
- Error display per field
- Support for all major input types
- Internationalization support via `t()` function
- Loading state during submission
- Used in assignments, courses pages

#### MantinePageTemplate Component
**File:** `/app/components/MantinePageTemplate.tsx`
- Wrapper for consistent page styling
- Header with title and actions
- Container size management
- Background color standardization

#### Other Components
- `CourseFormModal.tsx` - Course creation/editing
- Custom Stat Cards (in dashboard pages)
- Tables with Mantine Table component
- Pagination with Mantine Pagination
- Search/Filter UI patterns

---

## 6. EXISTING CODE PATTERNS

### Page Component Pattern (Client-Side)
```typescript
'use client';

import { useState, useEffect } from 'react';
import { getSession, clearSession } from '@/lib/auth/client-auth';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Container, Group, Button, ... } from '@mantine/core';

export default function PageName() {
  const { t, language, changeLanguage, isLoaded } = useTranslation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkAuth = async () => {
      const session = getSession();
      if (!session || session.role !== 'teacher') {
        router.push('/auth/login');
        return;
      }
      // Fetch data
    };
    
    if (isLoaded) checkAuth();
  }, [isLoaded]);
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      {/* Content */}
    </div>
  );
}
```

### Data Fetching Pattern
```typescript
const fetchData = async (teacherId: string) => {
  const response = await fetch('/api/teacher/assignments', {
    headers: { 'x-teacher-id': teacherId }
  });
  const data = await response.json();
  setData(data.assignments || []);
};
```

### Search/Sort/Filter Pattern
```typescript
const filteredData = data.filter(item => {
  const matchesSearch = item.title.toLowerCase().includes(query);
  const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
  return matchesSearch && matchesStatus;
});

const sortedData = [...filtered].sort((a, b) => {
  // Sort logic
});

const paginatedData = sortedData.slice(
  (page - 1) * itemsPerPage,
  page * itemsPerPage
);
```

### Form Submission Pattern
```typescript
const handleSubmit = async (formData: Record<string, any>) => {
  const method = isEditing ? 'PUT' : 'POST';
  const url = isEditing ? `/api/teacher/resource/${id}` : '/api/teacher/resource';
  
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-teacher-id': teacherId
    },
    body: JSON.stringify(transformedData)
  });
  
  if (!response.ok) throw new Error('Failed');
  const result = await response.json();
  // Update state
};
```

### Internationalization Pattern
```typescript
const { t, language, changeLanguage, isLoaded } = useTranslation();

// Usage
<Title>{t('dashboard.teacher.title')}</Title>
<Button onClick={() => changeLanguage('en')}>EN</Button>
<Button onClick={() => changeLanguage('km')}>ខ្មែរ</Button>
```

---

## 7. DATABASE STRUCTURE SUMMARY

### Tables to Use for Quiz Features
```
✅ READY TO USE (already exist):
├── courses - Course information
├── enrollments - Student course enrollment
├── teacher_courses - Teacher-course relationships
├── quizzes - Quiz configuration
├── quiz_questions - Quiz questions
├── quiz_answer_options - Multiple choice options
├── student_quiz_attempts - Student quiz records
├── student_quiz_answers - Student answers
├── assessments - Assessment records
├── questions - Assessment questions
├── question_options - Assessment question options
├── submissions - Student assessment submissions
└── grades - Grading records

⚠️ NEED TO VERIFY/CREATE:
├── assignments - Assignment table (exists from API)
├── assignment_submissions - Submission tracking
└── course_materials - Course content
```

---

## 8. DIRECTORY STRUCTURE FOR NEW MODULES

### Recommended Structure for Teacher Features
```
app/dashboard/teacher/
├── quizzes/
│   ├── page.tsx                    - List quizzes (TO MIGRATE to Mantine)
│   ├── [quizId]/
│   │   ├── page.tsx               - Quiz detail/view
│   │   ├── edit/page.tsx          - Quiz editor
│   │   └── submissions/page.tsx    - View student submissions
│   │
│   ├── components/
│   │   ├── QuizListTable.tsx       - Reusable table
│   │   ├── QuestionEditor.tsx      - Question form
│   │   └── QuizPreview.tsx         - Preview component
│   │
│   └── api/
│       └── [handled in /app/api/teacher/]

├── assessments/
│   ├── page.tsx                    - List assessments
│   ├── [assessmentId]/
│   │   ├── page.tsx               - Assessment detail
│   │   ├── edit/page.tsx          - Assessment editor
│   │   └── submissions/page.tsx    - Student submissions
│   │
│   └── components/
│       ├── AssessmentForm.tsx
│       └── GradingPanel.tsx

└── grades/
    ├── page.tsx                    - Grade management
    ├── [studentId]/page.tsx        - Student grade details
    └── components/
        ├── GradeTable.tsx
        └── GradeScaleManager.tsx
```

### API Route Structure
```
app/api/teacher/
├── quizzes/
│   ├── route.ts                    - GET/POST quizzes
│   └── [quizId]/
│       ├── route.ts               - GET/PUT/DELETE specific quiz
│       └── submissions/route.ts    - GET student attempts
│
├── assessments/
│   ├── route.ts                    - GET/POST assessments
│   └── [assessmentId]/
│       ├── route.ts               - GET/PUT/DELETE
│       ├── grade/route.ts          - POST grades
│       └── submissions/route.ts    - GET/grade submissions
│
└── grades/
    ├── route.ts                    - GET all grades
    └── [studentId]/route.ts        - GET student grades
```

---

## 9. KEY FILE LOCATIONS REFERENCE

| Purpose | File Location |
|---------|---------------|
| Mantine Config | `/app/providers.tsx` |
| Root Layout | `/app/layout.tsx` |
| Teacher Home | `/app/dashboard/teacher/page.tsx` |
| Teacher Layout | `/app/dashboard/teacher/layout.tsx` |
| Form Component | `/app/components/FormModal.tsx` |
| API Query Function | `/lib/database.ts` |
| Auth Client | `/lib/auth/client-auth.ts` |
| i18n Hook | `/lib/i18n/useTranslation.ts` |
| DB Schema (initial) | `/supabase/migrations/001_initial_schema.sql` |
| DB Schema (quizzes) | `/migrations/005_subject_and_quizzes.sql` |
| DB Schema (assessments) | `/migrations/021_assessment_grading.sql` |
| Package Config | `/package.json` |
| TypeScript Config | `/tsconfig.json` |

---

## 10. RECOMMENDED NEXT STEPS

### For Building Quiz Management Module:
1. **Migrate** existing `quizzes/page.tsx` from Shadcn UI to Mantine UI
2. **Create** `/app/api/teacher/quizzes/` API routes for:
   - List teacher's quizzes
   - Create new quiz
   - Update quiz
   - Delete quiz
   - Get student attempts
   - Grade submissions

3. **Create** reusable Mantine components:
   - `QuizListTable.tsx` - Similar to assignments table
   - `QuestionEditor.tsx` - Question builder
   - `QuizSettings.tsx` - Quiz configuration
   - `SubmissionGrader.tsx` - Grading interface

4. **Implement** pages:
   - `/app/dashboard/teacher/quizzes/page.tsx` (refactored)
   - `/app/dashboard/teacher/quizzes/[quizId]/edit/page.tsx`
   - `/app/dashboard/teacher/quizzes/[quizId]/submissions/page.tsx`

5. **Add** i18n translations for quiz-related strings

### For Building Assessment Module:
Similar structure to quizzes but using `assessments` table instead

### For Grade Management:
Focus on grade recording and viewing, leverage existing `grades` table

---

## 11. TECHNOLOGY STACK SUMMARY

| Layer | Technology | Details |
|-------|-----------|---------|
| **Frontend** | Next.js 14 | App Router, Server/Client components |
| **UI Framework** | Mantine v8.3.6 | Components, Notifications, Forms, Dates |
| **Icons** | Tabler Icons | 1000+ icons, React components |
| **Styling** | Emotion | CSS-in-JS for Mantine |
| **Database** | PostgreSQL | Via Supabase RLS-enabled |
| **Query Client** | pg library | `/lib/database.ts` wrapper |
| **Auth** | Supabase Auth | Session-based via headers |
| **i18n** | Custom hook | English/Khmer support |
| **Type Safety** | TypeScript 5 | Full type coverage |
| **Testing** | Jest + Playwright | Unit and E2E coverage |

---

## 12. IMPORTANT NOTES

### Code Style Observations:
1. **Snake_case** used for database fields (PostgreSQL convention)
2. **PascalCase** for React components
3. **camelCase** for variables and functions
4. **Bilingual support** everywhere - English and Khmer
5. **Error handling** includes error codes for debugging
6. **Responsive design** using Mantine's responsive props

### Performance Considerations:
1. Large tables use pagination (15-20 items per page)
2. Search/filter done client-side after fetch
3. Sorting done client-side (suitable for current data sizes)
4. Authentication checked in useEffect
5. Loading states provided for all async operations

### Security Features:
1. Teacher ID verification via header
2. Role-based access control in API routes
3. SQL parameterized queries (no injection risk)
4. Supabase RLS for database-level security
5. Auth guard redirects unauthorized users

---

## Summary Table

| Aspect | Status | Notes |
|--------|--------|-------|
| **Mantine UI** | ✅ Installed & Ready | v8.3.6, fully configured |
| **Teacher Dashboard** | ⚠️ 90% Complete | Missing quizzes (has Shadcn) |
| **Database Tables** | ✅ Assessment Ready | Quiz, Assessment, Grades tables exist |
| **API Patterns** | ✅ Established | Teacher-scoped with x-teacher-id header |
| **Components** | ✅ Patterns Set | FormModal, Tables, Pagination |
| **Internationalization** | ✅ Active | English/Khmer throughout |
| **Project Ready** | ✅ Highly Ready | Can build advanced features immediately |

---

**Document generated for:** dgtech LMS teacher dashboard development
**Last updated:** November 5, 2025
