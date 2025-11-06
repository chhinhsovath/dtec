# Quick Start Reference - DGTech Teacher Dashboard

**Last Updated:** November 5, 2025

---

## Quick Overview (2-Minute Read)

### Your Project Status
- **UI Framework**: Mantine v8.3.6 - READY TO USE
- **Database**: PostgreSQL with assessment tables - READY
- **API Patterns**: Established and tested - READY
- **Components**: Reusable, bilingual - READY
- **Ready to build**: Quiz, Assessment, Grade modules - GO!

### File You Just Got
- Full exploration in: `/CODEBASE_EXPLORATION.md`
- This quick reference: `/QUICK_START_REFERENCE.md`

---

## 1. How to Use Mantine UI (Copy-Paste Ready)

```typescript
'use client';
import { Container, Title, Button, Group, Stack, Paper } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';

export default function MyPage() {
  return (
    <Container size="xl" py="xl">
      <Group justify="space-between">
        <Title order={1}>My Page Title</Title>
        <Button leftSection={<IconPlus size={16} />}>Add New</Button>
      </Group>
      
      <Stack gap="md" mt="xl">
        <Paper shadow="sm" p="lg">
          <p>Content here</p>
        </Paper>
      </Stack>
    </Container>
  );
}
```

---

## 2. How to Create a Form Modal (Copy-Paste Ready)

```typescript
import { useState } from 'react';
import { FormModal, FormField } from '@/app/components/FormModal';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function MyPage() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  
  const formFields: FormField[] = [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
      placeholder: 'Enter title...'
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      rows: 4
    },
    {
      name: 'course_id',
      label: 'Course',
      type: 'select',
      required: true,
      options: courses.map(c => ({ value: c.id, label: c.name }))
    }
  ];
  
  const handleSubmit = async (formData: Record<string, any>) => {
    const response = await fetch('/api/teacher/resource', {
      method: 'POST',
      headers: { 'x-teacher-id': teacherId },
      body: JSON.stringify(formData)
    });
    const result = await response.json();
    // Update state
  };
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Create</Button>
      <FormModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
        title="Create Resource"
        fields={formFields}
        t={t}
      />
    </>
  );
}
```

---

## 3. How to Fetch Data from Teacher API

```typescript
const fetchData = async (teacherId: string) => {
  try {
    const response = await fetch('/api/teacher/quizzes', {
      headers: { 'x-teacher-id': teacherId }
    });
    
    if (!response.ok) throw new Error('Failed to fetch');
    
    const data = await response.json();
    // data.quizzes contains your items
    // data.success = true/false
    // data.error contains error message if any
    
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

## 4. How to Create an API Route

**File**: `/app/api/teacher/quizzes/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

// GET: List teacher's quizzes
export async function GET(request: NextRequest) {
  try {
    const teacherId = request.headers.get('x-teacher-id');
    
    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID required', code: 'MISSING_TEACHER_ID' },
        { status: 400 }
      );
    }
    
    const result = await query(`
      SELECT q.*, c.name as course_name
      FROM quizzes q
      JOIN courses c ON q.course_id = c.id
      JOIN teacher_courses tc ON c.id = tc.course_id
      WHERE tc.teacher_id = $1
      ORDER BY q.created_at DESC
    `, [teacherId]);
    
    return NextResponse.json({
      success: true,
      quizzes: result.rows,
      total: result.rows.length
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: 500 }
    );
  }
}

// POST: Create new quiz
export async function POST(request: NextRequest) {
  try {
    const teacherId = request.headers.get('x-teacher-id');
    const { courseId, title, quizType } = await request.json();
    
    if (!teacherId || !courseId || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const result = await query(`
      INSERT INTO quizzes (course_id, title, quiz_type, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [courseId, title, quizType, teacherId]);
    
    return NextResponse.json({
      success: true,
      quiz: result.rows[0]
    }, { status: 201 });
    
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

---

## 5. Database Tables You Can Use Immediately

### Quizzes
```sql
SELECT id, course_id, title, quiz_type, total_questions, is_published
FROM quizzes WHERE course_id = $1
```

### Quiz Questions
```sql
SELECT id, quiz_id, question_text, question_type, points, order_position
FROM quiz_questions WHERE quiz_id = $1
```

### Quiz Answer Options
```sql
SELECT id, question_id, option_text, is_correct, order_position
FROM quiz_answer_options WHERE question_id = $1
```

### Student Quiz Attempts
```sql
SELECT id, quiz_id, student_id, status, total_score, percentage_score
FROM student_quiz_attempts WHERE quiz_id = $1
```

### Assessments
```sql
SELECT id, course_id, title, assessment_type, status, total_points
FROM assessments WHERE course_id = $1
```

### Grades
```sql
SELECT id, submission_id, student_id, score, max_score, percentage
FROM grades WHERE student_id = $1
```

---

## 6. How to Make a Page with Table & Search

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Container, Title, TextInput, Table, Pagination, Group, Badge } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  
  useEffect(() => {
    // Fetch data on mount
  }, []);
  
  // Filter on client
  const filtered = quizzes.filter(q => 
    q.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  return (
    <Container size="xl" py="xl">
      <Title order={1} mb="xl">Quizzes</Title>
      
      <TextInput
        placeholder="Search..."
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setCurrentPage(1);
        }}
        leftSection={<IconSearch size={16} />}
        mb="lg"
      />
      
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Title</Table.Th>
            <Table.Th>Type</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {paginated.map((quiz) => (
            <Table.Tr key={quiz.id}>
              <Table.Td>{quiz.title}</Table.Td>
              <Table.Td>{quiz.quiz_type}</Table.Td>
              <Table.Td>
                <Badge color={quiz.is_published ? 'green' : 'yellow'}>
                  {quiz.is_published ? 'Published' : 'Draft'}
                </Badge>
              </Table.Td>
              <Table.Td>Edit | Delete</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      
      {Math.ceil(filtered.length / itemsPerPage) > 1 && (
        <Group justify="center" mt="xl">
          <Pagination
            value={currentPage}
            onChange={setCurrentPage}
            total={Math.ceil(filtered.length / itemsPerPage)}
          />
        </Group>
      )}
    </Container>
  );
}
```

---

## 7. Folder Structure to Create

```
app/dashboard/teacher/
├── quizzes/
│   ├── page.tsx                    (Migrate from Shadcn to Mantine)
│   ├── [quizId]/
│   │   ├── edit/page.tsx          (Quiz editor)
│   │   └── submissions/page.tsx    (Grade submissions)
│   └── components/
│       ├── QuizListTable.tsx
│       ├── QuestionEditor.tsx
│       └── QuizSettings.tsx

app/api/teacher/
├── quizzes/
│   ├── route.ts                   (GET quizzes, POST create)
│   └── [quizId]/
│       ├── route.ts               (GET detail, PUT update, DELETE)
│       └── submissions/route.ts    (GET attempts, POST grade)
```

---

## 8. Internationalization (i18n) Quick Guide

```typescript
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function MyComponent() {
  const { t, language, changeLanguage } = useTranslation();
  
  return (
    <>
      <Title>{t('quiz.title')}</Title>
      <p>{t('quiz.description')}</p>
      
      <Button onClick={() => changeLanguage('en')}>English</Button>
      <Button onClick={() => changeLanguage('km')}>ខ្មែរ</Button>
    </>
  );
}

// Your translation files would have:
// {
//   "quiz": {
//     "title": "Quizzes",
//     "description": "Create and manage quizzes"
//   }
// }
```

---

## 9. Common API Response Patterns

### Success Response
```json
{
  "success": true,
  "quiz": { ... },
  "quizzes": [ ... ],
  "total": 10
}
```

### Error Response
```json
{
  "error": "Quiz not found",
  "code": "QUIZ_NOT_FOUND",
  "detail": "Quiz with id abc123 does not exist"
}
```

### Always Check Response
```typescript
if (!response.ok) {
  const error = await response.json();
  console.error(error.code, error.message);
  throw new Error(error.message);
}
const result = await response.json();
```

---

## 10. Key Files for Reference

| Task | File |
|------|------|
| Add Mantine component | `/app/providers.tsx` |
| Mantine theme config | `/app/providers.tsx` |
| Form modal template | `/app/components/FormModal.tsx` |
| Example page | `/app/dashboard/teacher/assignments/page.tsx` |
| Example API | `/app/api/teacher/assignments/route.ts` |
| Authentication | `/lib/auth/client-auth.ts` |
| Translations | `/lib/i18n/useTranslation.ts` |
| Database query | `/lib/database.ts` |

---

## 11. Development Checklist

Before starting a new feature:

- [ ] Design page layout (wireframe in your head)
- [ ] Identify which database tables needed
- [ ] Plan API routes (GET, POST, PUT, DELETE)
- [ ] Create reusable Mantine components
- [ ] Build pages (pages/components)
- [ ] Build API routes
- [ ] Add i18n translations
- [ ] Test with sample data
- [ ] Handle loading/error states
- [ ] Add pagination if list > 20 items

---

## 12. Do's and Don'ts

### Do's
- Use FormModal for all forms
- Use Mantine components consistently
- Check teacher ID in API routes
- Always add bilingual labels
- Paginate long lists
- Show loading states
- Handle errors gracefully
- Use snake_case in database queries

### Don'ts
- Don't use Shadcn UI (use Mantine instead)
- Don't skip error handling in API routes
- Don't hardcode strings (use i18n)
- Don't forget to check response.ok
- Don't make API calls without teacherId
- Don't use camelCase in database fields
- Don't forget RLS policies for new tables

---

## 13. Next 5 Steps to Build Quizzes

1. **Migrate** `/app/dashboard/teacher/quizzes/page.tsx` to Mantine
2. **Create** `/app/api/teacher/quizzes/route.ts` (GET + POST)
3. **Create** Quiz editor page at `/app/dashboard/teacher/quizzes/[quizId]/edit/page.tsx`
4. **Create** Components: `QuestionEditor.tsx`, `QuizSettings.tsx`
5. **Create** Quiz details API routes for detailed operations

---

## Help?

Full reference: `/CODEBASE_EXPLORATION.md`
Database schema: `/migrations/005_subject_and_quizzes.sql`
Example pages: `/app/dashboard/teacher/assignments/page.tsx`

Good luck building!
