import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/teacher/courses/[courseId]/schedule
 * Fetch schedule for a course
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const teacherId = request.headers.get('x-teacher-id');

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID required', code: 'MISSING_TEACHER_ID' },
        { status: 400 }
      );
    }

    const { courseId } = params;

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
      SELECT
        id,
        course_id,
        day,
        time,
        location,
        created_at
      FROM course_schedules
      WHERE course_id = $1
      ORDER BY CASE
        WHEN day = 'Monday' THEN 1
        WHEN day = 'Tuesday' THEN 2
        WHEN day = 'Wednesday' THEN 3
        WHEN day = 'Thursday' THEN 4
        WHEN day = 'Friday' THEN 5
        WHEN day = 'Saturday' THEN 6
        WHEN day = 'Sunday' THEN 7
      END, time ASC
    `, [courseId]);

    return NextResponse.json({
      success: true,
      schedules: result.rows,
      total: result.rows.length
    });
  } catch (error: any) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch schedules',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teacher/courses/[courseId]/schedule
 * Create a schedule entry
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } }
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

    const { courseId } = params;
    const { day, time, location } = body;

    if (!day || !time) {
      return NextResponse.json(
        { error: 'Day and time are required', code: 'MISSING_FIELDS' },
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
      INSERT INTO course_schedules (course_id, day, time, location, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, course_id, day, time, location, created_at
    `, [courseId, day, time, location || null]);

    return NextResponse.json({
      success: true,
      message: 'Schedule created successfully',
      schedule: result.rows[0]
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating schedule:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to create schedule',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}
