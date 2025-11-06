import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/teacher/announcements
 * Fetch announcements for teacher's courses
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

    let sql = `
      SELECT
        ca.id,
        ca.course_id,
        ca.title,
        ca.content,
        ca.is_pinned,
        ca.created_at,
        ca.updated_at,
        c.name as course_name
      FROM course_announcements ca
      JOIN courses c ON c.id = ca.course_id
      JOIN teacher_courses tc ON tc.course_id = c.id
      WHERE tc.teacher_id = $1
    `;

    const params: any[] = [teacherId];

    if (courseId) {
      sql += ` AND ca.course_id = $2`;
      params.push(courseId);
    }

    sql += ` ORDER BY ca.is_pinned DESC, ca.created_at DESC`;

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      announcements: result.rows,
      total: result.rows.length
    });
  } catch (error: any) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch announcements',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teacher/announcements
 * Create a new announcement
 */
export async function POST(request: NextRequest) {
  try {
    const teacherId = request.headers.get('x-teacher-id');
    const body = await request.json();

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID required', code: 'MISSING_TEACHER_ID' },
        { status: 400 }
      );
    }

    const { courseId, title, content, isPinned = false } = body;

    if (!courseId || !title || !content) {
      return NextResponse.json(
        { error: 'Course ID, title, and content are required', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    // Verify teacher owns the course
    const courseCheck = await query(
      `SELECT 1 FROM teacher_courses WHERE teacher_id = $1 AND course_id = $2`,
      [teacherId, courseId]
    );

    if (courseCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    const result = await query(`
      INSERT INTO course_announcements
      (course_id, teacher_id, title, content, is_pinned, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, course_id, title, content, is_pinned, created_at, updated_at
    `, [courseId, teacherId, title, content, isPinned]);

    return NextResponse.json({
      success: true,
      message: 'Announcement created successfully',
      announcement: result.rows[0]
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating announcement:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to create announcement',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}
