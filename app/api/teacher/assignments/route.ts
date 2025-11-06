import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/teacher/assignments
 * Fetch assignments for teacher's courses
 */
export async function GET(request: NextRequest) {
  try {
    const teacherId = request.headers.get('x-teacher-id');
    const courseId = request.nextUrl.searchParams.get('courseId');

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID required', code: 'MISSING_TEACHER_ID' },
        { status: 400 }
      );
    }

    let whereClause = 'WHERE tc.teacher_id = $1';
    let params: any[] = [teacherId];

    if (courseId) {
      whereClause += ' AND a.course_id = $2';
      params.push(courseId);
    }

    const result = await query(`
      SELECT
        a.id,
        a.course_id,
        a.title,
        a.description,
        'assignment' as assignment_type,
        a.max_score,
        a.due_date,
        a.status,
        a.created_at,
        a.updated_at,
        c.code as course_code,
        c.name as course_title,
        COUNT(DISTINCT s.id) as submission_count
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      JOIN teacher_courses tc ON c.id = tc.course_id
      LEFT JOIN assignment_submissions s ON a.id = s.assignment_id
      ${whereClause}
      GROUP BY a.id, a.course_id, a.title, a.description,
               a.max_score, a.due_date, a.status, a.created_at, a.updated_at,
               c.code, c.name
      ORDER BY a.due_date DESC
    `, params);

    return NextResponse.json({
      success: true,
      assignments: result.rows,
      total: result.rows.length
    });
  } catch (error: any) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch assignments',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teacher/assignments
 * Create a new assignment
 */
export async function POST(request: NextRequest) {
  try {
    const teacherId = request.headers.get('x-teacher-id');
    const body = await request.json();
    const { courseId, title, description, assignmentType, maxScore, dueDate } = body;

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID required', code: 'MISSING_TEACHER_ID' },
        { status: 400 }
      );
    }

    if (!courseId || !title || !maxScore) {
      return NextResponse.json(
        { error: 'Course ID, title, and max score are required', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    // Verify teacher has access to this course
    const accessResult = await query(`
      SELECT tc.id FROM teacher_courses tc
      WHERE tc.teacher_id = $1 AND tc.course_id = $2
    `, [teacherId, courseId]);

    if (accessResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Access denied', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const result = await query(`
      INSERT INTO assignments (course_id, teacher_id, title, description, max_score, due_date, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW(), NOW())
      RETURNING *
    `, [courseId, teacherId, title, description || null, maxScore, dueDate || null]);

    return NextResponse.json({
      success: true,
      message: 'Assignment created successfully',
      assignment: result.rows[0]
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating assignment:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to create assignment',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}
