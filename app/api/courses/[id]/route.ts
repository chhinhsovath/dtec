import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/courses/[id]
 * Fetch a specific course with enrollment and teacher info
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = params.id;

    const result = await query(
      `SELECT
        c.*,
        COUNT(DISTINCT e.student_id) as enrollment_count,
        COUNT(DISTINCT tc.teacher_id) as teacher_count
       FROM courses c
       LEFT JOIN enrollments e ON c.id = e.course_id
       LEFT JOIN teacher_courses tc ON c.id = tc.course_id
       WHERE c.id = $1
       GROUP BY c.id`,
      [courseId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Course not found',
          meta: { code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch course',
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
 * PUT /api/courses/[id]
 * Update a course
 *
 * Request Body (all fields optional):
 * {
 *   code?: string
 *   name?: string
 *   description?: string
 * }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = params.id;
    const body = await request.json();

    // Build update query dynamically
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (body.code !== undefined) {
      updates.push(`code = $${paramCount}`);
      values.push(body.code);
      paramCount++;
    }

    if (body.name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(body.name);
      paramCount++;
    }

    if (body.description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(body.description);
      paramCount++;
    }

    // Always update updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updates.length === 1) {
      return NextResponse.json(
        {
          error: 'No fields to update',
          meta: { code: 'NO_UPDATES' },
        },
        { status: 400 }
      );
    }

    values.push(courseId);

    const result = await query(
      `UPDATE courses SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Course not found',
          meta: { code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Course updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      {
        error: 'Failed to update course',
        meta: {
          code: 'UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/courses/[id]
 * Delete a course (all enrollments and enrollments will be deleted via CASCADE)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = params.id;

    const result = await query('DELETE FROM courses WHERE id = $1 RETURNING *', [
      courseId,
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Course not found',
          meta: { code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete course',
        meta: {
          code: 'DELETE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
