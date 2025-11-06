import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/enrollments
 * Fetch enrollments with optional filtering
 *
 * Query Parameters:
 * - courseId: Filter by course
 * - studentId: Filter by student
 * - status: Filter by enrollment status
 */
export async function GET(request: NextRequest) {
  try {
    const courseId = request.nextUrl.searchParams.get('courseId');
    const studentId = request.nextUrl.searchParams.get('studentId');
    const status = request.nextUrl.searchParams.get('status');

    let sql = `SELECT
      e.*,
      c.code as course_code,
      c.name as course_name,
      p.full_name as student_name,
      p.email
     FROM enrollments e
     LEFT JOIN courses c ON e.course_id = c.id
     LEFT JOIN students s ON e.student_id = s.id
     LEFT JOIN profiles p ON s.user_id = p.id
     WHERE 1=1`;

    const params: unknown[] = [];

    if (courseId) {
      sql += ` AND e.course_id = $${params.length + 1}`;
      params.push(courseId);
    }

    if (studentId) {
      sql += ` AND e.student_id = $${params.length + 1}`;
      params.push(studentId);
    }

    if (status) {
      sql += ` AND e.status = $${params.length + 1}`;
      params.push(status);
    }

    sql += ' ORDER BY e.enrollment_date DESC';

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rowCount || 0,
    });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch enrollments',
        meta: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/enrollments
 * Enroll a student in a course
 *
 * Request Body:
 * {
 *   courseId: string (UUID)
 *   studentId: string (UUID)
 *   status?: string (default: 'active')
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.courseId || !body.studentId) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          meta: {
            code: 'VALIDATION_ERROR',
            required: ['courseId', 'studentId'],
          },
        },
        { status: 400 }
      );
    }

    // Check if enrollment already exists
    const existing = await query(
      'SELECT id FROM enrollments WHERE course_id = $1 AND student_id = $2',
      [body.courseId, body.studentId]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        {
          error: 'Student is already enrolled in this course',
          meta: { code: 'ALREADY_ENROLLED' },
        },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO enrollments (course_id, student_id, status, enrollment_date)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       RETURNING *`,
      [body.courseId, body.studentId, body.status || 'active']
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Student enrolled successfully',
        data: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating enrollment:', error);
    return NextResponse.json(
      {
        error: 'Failed to enroll student',
        meta: {
          code: 'CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
