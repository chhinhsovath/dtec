# 🚀 Phase 2 Quick Start - Assignment System

## Overview

This guide will get you building the **Assignment System** (Phase 2.1) in the next 3-4 weeks.

**This is THE most important feature** to make TEC LMS a real learning platform.

---

## 📋 What You'll Build

Teachers will be able to:
- ✅ Create assignments with due dates
- ✅ View student submissions
- ✅ Grade submissions
- ✅ Provide feedback

Students will be able to:
- ✅ See assignments for their courses
- ✅ Submit work
- ✅ Check their grades
- ✅ View teacher feedback

---

## 🎯 Week-by-Week Plan

### **Week 1: Database & API Foundation**

#### Task 1.1: Create Database Migration
**File**: `migrations/002_assignment_system.sql`

```sql
-- Create assignments table
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date TIMESTAMP NOT NULL,
  max_score DECIMAL(5,2) DEFAULT 100,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create submissions table
CREATE TABLE assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  submission_text TEXT,
  file_url VARCHAR(255),
  submitted_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'draft', -- draft, submitted, graded
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(assignment_id, student_id)
);

-- Create grades table
CREATE TABLE grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_submission_id UUID NOT NULL REFERENCES assignment_submissions(id) ON DELETE CASCADE,
  score DECIMAL(5,2),
  feedback TEXT,
  graded_at TIMESTAMP,
  graded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_assignments_course ON assignments(course_id);
CREATE INDEX idx_assignments_teacher ON assignments(teacher_id);
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX idx_submissions_student ON assignment_submissions(student_id);
CREATE INDEX idx_submissions_status ON assignment_submissions(status);
CREATE INDEX idx_grades_submission ON grades(assignment_submission_id);
```

**Execution**:
```bash
# Connect to your database and run the migration
psql -h 157.10.73.52 -U admin -d dtech -f migrations/002_assignment_system.sql
```

---

#### Task 1.2: Create API Endpoints (Backend)

**Create**: `app/api/assignments/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { getSession } from '@/lib/auth/postgres-auth';

// GET /api/assignments - List assignments
export async function GET(request: NextRequest) {
  try {
    const session = getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const studentId = searchParams.get('studentId');

    let sql = 'SELECT * FROM assignments WHERE 1=1';
    const params: any[] = [];

    if (courseId) {
      sql += ' AND course_id = $' + (params.length + 1);
      params.push(courseId);
    }

    const result = await query(sql + ' ORDER BY due_date DESC', params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}

// POST /api/assignments - Create assignment
export async function POST(request: NextRequest) {
  try {
    const session = getSession();
    if (session?.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { courseId, title, description, dueDate, maxScore } = await request.json();

    const result = await query(
      `INSERT INTO assignments (course_id, teacher_id, title, description, due_date, max_score)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [courseId, session.id, title, description, dueDate, maxScore || 100]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating assignment:', error);
    return NextResponse.json(
      { error: 'Failed to create assignment' },
      { status: 500 }
    );
  }
}
```

**Create**: `app/api/assignments/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { getSession } from '@/lib/auth/postgres-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await query(
      'SELECT * FROM assignments WHERE id = $1',
      [params.id]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch assignment' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSession();
    if (session?.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { title, description, dueDate, maxScore, status } = await request.json();

    const result = await query(
      `UPDATE assignments
       SET title = $1, description = $2, due_date = $3, max_score = $4, status = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [title, description, dueDate, maxScore, status, params.id]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update assignment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSession();
    if (session?.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await query('DELETE FROM assignments WHERE id = $1', [params.id]);
    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete assignment' },
      { status: 500 }
    );
  }
}
```

**Create**: `app/api/submissions/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { getSession } from '@/lib/auth/postgres-auth';

// POST /api/submissions - Submit assignment
export async function POST(request: NextRequest) {
  try {
    const session = getSession();
    if (session?.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { assignmentId, submissionText } = await request.json();

    // Get student ID from session
    const studentResult = await query(
      'SELECT id FROM students WHERE user_id = $1',
      [session.id]
    );

    if (!studentResult.rows[0]) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const studentId = studentResult.rows[0].id;

    const result = await query(
      `INSERT INTO assignment_submissions (assignment_id, student_id, submission_text, submitted_at, status)
       VALUES ($1, $2, $3, NOW(), 'submitted')
       ON CONFLICT (assignment_id, student_id)
       DO UPDATE SET submission_text = $3, submitted_at = NOW(), status = 'submitted'
       RETURNING *`,
      [assignmentId, studentId, submissionText]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error submitting:', error);
    return NextResponse.json(
      { error: 'Failed to submit assignment' },
      { status: 500 }
    );
  }
}

// GET /api/submissions - Get submissions for teacher
export async function GET(request: NextRequest) {
  try {
    const session = getSession();
    if (session?.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');

    const result = await query(
      `SELECT s.*, p.full_name as student_name, p.email as student_email
       FROM assignment_submissions s
       JOIN students st ON s.student_id = st.id
       JOIN profiles p ON st.user_id = p.id
       WHERE s.assignment_id = $1
       ORDER BY s.submitted_at DESC`,
      [assignmentId]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}
```

**Create**: `app/api/grades/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { getSession } from '@/lib/auth/postgres-auth';

// POST /api/grades - Grade submission
export async function POST(request: NextRequest) {
  try {
    const session = getSession();
    if (session?.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { submissionId, score, feedback } = await request.json();

    // Update submission status
    await query(
      'UPDATE assignment_submissions SET status = $1 WHERE id = $2',
      ['graded', submissionId]
    );

    // Create or update grade
    const result = await query(
      `INSERT INTO grades (assignment_submission_id, score, feedback, graded_by, graded_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [submissionId, score, feedback, session.id]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error grading:', error);
    return NextResponse.json(
      { error: 'Failed to grade submission' },
      { status: 500 }
    );
  }
}
```

---

### **Week 2: Teacher Features (Frontend)**

#### Task 2.1: Create Assignment Component

**Create**: `app/dashboard/teacher/assignments/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth/postgres-auth';
import { Plus, Edit, Trash } from 'lucide-react';

export default function AssignmentManagement() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const session = getSession();

  useEffect(() => {
    if (!session || session.role !== 'teacher') {
      router.push('/auth/login');
      return;
    }
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      const response = await fetch('/api/assignments');
      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Assignments</h1>
          <button
            onClick={() => router.push('/dashboard/teacher/assignments/create')}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            Create Assignment
          </button>
        </div>

        <div className="grid gap-4">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">{assignment.title}</h2>
                  <p className="text-gray-600 mt-1">{assignment.description}</p>
                  <div className="mt-4 text-sm text-gray-500">
                    <p>Due: {new Date(assignment.due_date).toLocaleDateString()}</p>
                    <p>Max Score: {assignment.max_score}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      router.push(
                        `/dashboard/teacher/assignments/${assignment.id}/submissions`
                      )
                    }
                    className="text-blue-600 hover:text-blue-700"
                  >
                    View Submissions
                  </button>
                  <button className="text-gray-600 hover:text-gray-700">
                    <Edit className="h-5 w-5" />
                  </button>
                  <button className="text-red-600 hover:text-red-700">
                    <Trash className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

### **Week 3: Student Features (Frontend)**

#### Task 3.1: Student Assignment View

**Create**: `app/dashboard/student/assignments/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth/postgres-auth';

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const session = getSession();

  useEffect(() => {
    if (!session || session.role !== 'student') {
      router.push('/auth/login');
      return;
    }
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      // Fetch student's enrolled courses
      const response = await fetch('/api/assignments');
      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Assignments</h1>

        <div className="grid gap-4">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
            >
              <h2 className="text-xl font-bold">{assignment.title}</h2>
              <p className="text-gray-600 mt-2">{assignment.description}</p>
              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Due: {new Date(assignment.due_date).toLocaleDateString()}
                </div>
                <button
                  onClick={() =>
                    router.push(`/dashboard/student/assignments/${assignment.id}/submit`)
                  }
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Submit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

### **Week 4: Polish & Testing**

- [ ] Test all assignment creation flows
- [ ] Test student submissions
- [ ] Test grading functionality
- [ ] Add error handling
- [ ] Add confirmation dialogs
- [ ] Test with multiple users
- [ ] Performance testing
- [ ] User acceptance testing

---

## 🛠️ Implementation Checklist

### Database
- [ ] Create migration file
- [ ] Run migration
- [ ] Verify tables with `\dt` in psql
- [ ] Test sample INSERT queries

### API Endpoints
- [ ] POST /api/assignments
- [ ] GET /api/assignments
- [ ] PUT /api/assignments/:id
- [ ] DELETE /api/assignments/:id
- [ ] POST /api/submissions
- [ ] GET /api/submissions
- [ ] POST /api/grades

### Frontend Components
- [ ] Teacher assignment list
- [ ] Create assignment form
- [ ] View submissions page
- [ ] Grading interface
- [ ] Student assignment list
- [ ] Submit assignment form
- [ ] View grade/feedback

### Testing
- [ ] API tests (Postman/curl)
- [ ] Component tests
- [ ] End-to-end flow tests
- [ ] Error case tests

---

## 📊 Success Metrics

By end of Week 4:

- ✅ Teachers can create 5 assignments
- ✅ Students can submit to all assignments
- ✅ Teachers can grade all submissions
- ✅ Students see their grades
- ✅ No errors in browser console
- ✅ All features work on mobile view

---

## 🎯 Next Steps After Phase 2.1

1. **Phase 2.2**: Communication System (Announcements, Messages)
2. **Phase 2.3**: Course Content Management
3. **Phase 3**: Analytics & Reporting

---

## 📚 References

- Assignment API Docs: See IMPLEMENTATION_ROADMAP.md
- Database Schema: See migrations/002_assignment_system.sql
- TypeScript Types: See types/database.types.ts

---

## 🚀 Ready to Start?

```bash
# 1. Create migration file
touch migrations/002_assignment_system.sql

# 2. Copy the SQL schema above into the file

# 3. Run migration
psql -h 157.10.73.52 -U admin -d dtech -f migrations/002_assignment_system.sql

# 4. Start building the API endpoints

# 5. Build the frontend components

# 6. Test everything!
```

**Estimated Time**: 3-4 weeks
**Difficulty**: Medium
**Impact**: HUGE (Makes TEC LMS actually useful for teaching!)

---

Good luck! 🎓
