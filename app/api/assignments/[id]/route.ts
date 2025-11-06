import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/assignments/[id]
 * Fetch a specific assignment with its submission count
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assignmentId = params.id;

    // Get assignment with submission count
    const result = await query(
      `SELECT
        a.*,
        COUNT(DISTINCT s.id) as submission_count,
        COUNT(DISTINCT CASE WHEN s.status = 'graded' THEN s.id END) as graded_count
       FROM assignments a
       LEFT JOIN assignment_submissions s ON a.id = s.assignment_id
       WHERE a.id = $1
       GROUP BY a.id`,
      [assignmentId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Assignment not found',
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
    console.error('Error fetching assignment:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch assignment',
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
 * PUT /api/assignments/[id]
 * Update an assignment
 *
 * Request Body (all fields optional):
 * {
 *   title?: string
 *   description?: string
 *   dueDate?: string
 *   maxScore?: number
 *   status?: string
 * }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assignmentId = params.id;
    const body = await request.json();

    // Build update query dynamically
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (body.title !== undefined) {
      updates.push(`title = $${paramCount}`);
      values.push(body.title);
      paramCount++;
    }

    if (body.description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(body.description);
      paramCount++;
    }

    if (body.dueDate !== undefined) {
      updates.push(`due_date = $${paramCount}`);
      values.push(body.dueDate);
      paramCount++;
    }

    if (body.maxScore !== undefined) {
      updates.push(`max_score = $${paramCount}`);
      values.push(body.maxScore);
      paramCount++;
    }

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

    values.push(assignmentId);

    const result = await query(
      `UPDATE assignments SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Assignment not found',
          meta: { code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Assignment updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating assignment:', error);
    return NextResponse.json(
      {
        error: 'Failed to update assignment',
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
 * DELETE /api/assignments/[id]
 * Delete an assignment (and all related submissions/grades due to CASCADE)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assignmentId = params.id;

    const result = await query(
      'DELETE FROM assignments WHERE id = $1 RETURNING *',
      [assignmentId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Assignment not found',
          meta: { code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Assignment deleted successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete assignment',
        meta: {
          code: 'DELETE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
