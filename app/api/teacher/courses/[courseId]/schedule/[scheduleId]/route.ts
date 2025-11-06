import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * PUT /api/teacher/courses/[courseId]/schedule/[scheduleId]
 * Update a schedule entry
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { courseId: string; scheduleId: string } }
) {
  try {
    const teacherId = request.headers.get('x-teacher-id');
    const body = await request.json();

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID required', code: 'MISSING_TEACHER_ID' },
        { status: 400 }
      );
    }

    const { courseId, scheduleId } = params;
    const { day, time, location } = body;

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

    // Verify schedule belongs to this course
    const scheduleCheck = await query(
      `SELECT 1 FROM course_schedules WHERE id = $1 AND course_id = $2`,
      [scheduleId, courseId]
    );

    if (scheduleCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Schedule not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const result = await query(`
      UPDATE course_schedules
      SET day = $1, time = $2, location = $3
      WHERE id = $4
      RETURNING id, course_id, day, time, location, created_at
    `, [day, time, location || null, scheduleId]);

    return NextResponse.json({
      success: true,
      message: 'Schedule updated successfully',
      schedule: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error updating schedule:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to update schedule',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teacher/courses/[courseId]/schedule/[scheduleId]
 * Delete a schedule entry
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { courseId: string; scheduleId: string } }
) {
  try {
    const teacherId = request.headers.get('x-teacher-id');

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID required', code: 'MISSING_TEACHER_ID' },
        { status: 400 }
      );
    }

    const { courseId, scheduleId } = params;

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

    // Verify schedule belongs to this course
    const scheduleCheck = await query(
      `SELECT 1 FROM course_schedules WHERE id = $1 AND course_id = $2`,
      [scheduleId, courseId]
    );

    if (scheduleCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Schedule not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    await query(
      `DELETE FROM course_schedules WHERE id = $1`,
      [scheduleId]
    );

    return NextResponse.json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to delete schedule',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}
