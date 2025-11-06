import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/teacher/courses/[courseId]
 * Get single course details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const teacherId = request.headers.get('x-teacher-id');
    const courseId = params.courseId;

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID required', code: 'MISSING_TEACHER_ID' },
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
      SELECT
        c.id,
        c.code,
        c.name as title,
        c.description,
        c.created_at,
        c.updated_at,
        COUNT(DISTINCT e.id) as student_count
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id
      WHERE c.id = $1
      GROUP BY c.id
    `, [courseId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Course not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      course: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch course',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/teacher/courses/[courseId]
 * Update course
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const teacherId = request.headers.get('x-teacher-id');
    const courseId = params.courseId;
    const body = await request.json();

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID required', code: 'MISSING_TEACHER_ID' },
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

    const { title, code, description } = body;

    const result = await query(`
      UPDATE courses
      SET
        name = COALESCE($1, name),
        code = COALESCE($2, code),
        description = COALESCE($3, description),
        updated_at = NOW()
      WHERE id = $4
      RETURNING id, code, name as title, description, created_at, updated_at
    `, [title, code, description, courseId]);

    return NextResponse.json({
      success: true,
      message: 'Course updated successfully',
      course: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to update course',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teacher/courses/[courseId]
 * Delete course (soft delete by setting status to inactive)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const teacherId = request.headers.get('x-teacher-id');
    const courseId = params.courseId;

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID required', code: 'MISSING_TEACHER_ID' },
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

    // Soft delete - set status to inactive
    const result = await query(`
      UPDATE courses
      SET status = 'inactive', updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [courseId]);

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully',
      course: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to delete course',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}
