import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/enrollments/[id]
 * Fetch a specific enrollment with full details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const enrollmentId = params.id;

    const result = await query(
      `SELECT
        e.*,
        c.code as course_code,
        c.name as course_name,
        c.description as course_description,
        p.full_name as student_name,
        p.email
       FROM enrollments e
       LEFT JOIN courses c ON e.course_id = c.id
       LEFT JOIN students s ON e.student_id = s.id
       LEFT JOIN profiles p ON s.user_id = p.id
       WHERE e.id = $1`,
      [enrollmentId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Enrollment not found',
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
    console.error('Error fetching enrollment:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch enrollment',
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
 * PUT /api/enrollments/[id]
 * Update an enrollment
 *
 * Request Body (all fields optional):
 * {
 *   status?: string (active, inactive, completed)
 * }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const enrollmentId = params.id;
    const body = await request.json();

    // Build update query dynamically
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (body.status !== undefined) {
      updates.push(`status = $${paramCount}`);
      values.push(body.status);
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

    values.push(enrollmentId);

    const result = await query(
      `UPDATE enrollments SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Enrollment not found',
          meta: { code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Enrollment updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating enrollment:', error);
    return NextResponse.json(
      {
        error: 'Failed to update enrollment',
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
 * DELETE /api/enrollments/[id]
 * Remove a student from a course
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const enrollmentId = params.id;

    const result = await query(
      'DELETE FROM enrollments WHERE id = $1 RETURNING *',
      [enrollmentId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Enrollment not found',
          meta: { code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Enrollment deleted successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete enrollment',
        meta: {
          code: 'DELETE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
