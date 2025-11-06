import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/teacher/resources
 * Fetch all resources for teacher's courses
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

    // If courseId is provided, fetch only that course's resources
    if (courseId) {
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
        SELECT
          cm.id,
          cm.course_id,
          cm.title,
          cm.description,
          cm.material_type,
          cm.file_url,
          cm.file_size_mb,
          cm.file_type,
          cm.is_published,
          cm.view_count,
          cm.created_at,
          cm.updated_at,
          c.name as course_title
        FROM course_materials cm
        JOIN courses c ON cm.course_id = c.id
        WHERE cm.course_id = $1
        ORDER BY cm.created_at DESC
      `, [courseId]);

      return NextResponse.json({
        success: true,
        data: result.rows,
        total: result.rows.length,
      });
    }

    // Otherwise, fetch all resources for teacher's courses
    const result = await query(`
      SELECT DISTINCT
        cm.id,
        cm.course_id,
        cm.title,
        cm.description,
        cm.material_type,
        cm.file_url,
        cm.file_size_mb,
        cm.file_type,
        cm.is_published,
        cm.view_count,
        cm.created_at,
        cm.updated_at,
        c.name as course_title
      FROM course_materials cm
      JOIN courses c ON cm.course_id = c.id
      JOIN teacher_courses tc ON c.id = tc.course_id
      WHERE tc.teacher_id = $1
      ORDER BY cm.created_at DESC
      LIMIT 1000
    `, [teacherId]);

    return NextResponse.json({
      success: true,
      data: result.rows,
      total: result.rows.length,
    });
  } catch (error: any) {
    console.error('Error fetching resources:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch resources',
        code: error.code,
        detail: error.detail,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teacher/resources
 * Create new resource
 */
export async function POST(request: NextRequest) {
  try {
    const teacherId = request.headers.get('x-teacher-id');
    const body = await request.json();
    const { course_id, title, description, material_type, file_url, file_type, is_published } = body;

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID required', code: 'MISSING_TEACHER_ID' },
        { status: 400 }
      );
    }

    if (!course_id || !title || !material_type || !file_url) {
      return NextResponse.json(
        { error: 'Course ID, Title, Type, and File URL are required', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    // Verify teacher has access to this course
    const accessResult = await query(`
      SELECT tc.id FROM teacher_courses tc
      WHERE tc.teacher_id = $1 AND tc.course_id = $2
    `, [teacherId, course_id]);

    if (accessResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Access denied', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Insert resource
    const result = await query(`
      INSERT INTO course_materials
      (course_id, uploaded_by, title, description, material_type, file_url, file_type, is_published, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `, [course_id, teacherId, title, description || null, material_type, file_url, file_type || null, is_published !== false]);

    const resource = result.rows[0];

    // Get course title
    const courseResult = await query(`
      SELECT name FROM courses WHERE id = $1
    `, [course_id]);

    return NextResponse.json({
      success: true,
      message: 'Resource created successfully',
      data: {
        ...resource,
        course_title: courseResult.rows[0]?.name || 'Unknown',
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating resource:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to create resource',
        code: error.code,
        detail: error.detail,
      },
      { status: 500 }
    );
  }
}
