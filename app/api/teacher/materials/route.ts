import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/teacher/materials
 * Fetch course materials for teacher's courses
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
        cm.id,
        cm.course_id,
        cm.title,
        cm.file_url,
        cm.type,
        cm.created_at,
        cm.updated_at,
        c.name as course_name
      FROM course_materials cm
      JOIN courses c ON c.id = cm.course_id
      JOIN teacher_courses tc ON tc.course_id = c.id
      WHERE tc.teacher_id = $1
    `;

    const params: any[] = [teacherId];

    if (courseId) {
      sql += ` AND cm.course_id = $2`;
      params.push(courseId);
    }

    sql += ` ORDER BY cm.created_at DESC`;

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      materials: result.rows,
      total: result.rows.length
    });
  } catch (error: any) {
    console.error('Error fetching materials:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch materials',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teacher/materials
 * Create a new course material (metadata only, file upload handled separately)
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

    const { courseId, title, fileUrl, type } = body;

    if (!courseId || !title || !fileUrl) {
      return NextResponse.json(
        { error: 'Course ID, title, and file URL are required', code: 'MISSING_FIELDS' },
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
      INSERT INTO course_materials (course_id, title, file_url, type, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING id, course_id, title, file_url, type, created_at, updated_at
    `, [courseId, title, fileUrl, type || 'document']);

    return NextResponse.json({
      success: true,
      message: 'Material created successfully',
      material: result.rows[0]
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating material:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to create material',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}
