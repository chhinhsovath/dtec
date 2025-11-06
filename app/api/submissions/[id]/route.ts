import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/submissions/[id]
 * Fetch a specific submission with grade info
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const submissionId = params.id;

    const result = await query(
      `SELECT
        s.*,
        a.title as assignment_title,
        a.due_date,
        a.max_score,
        p.full_name as student_name,
        g.id as grade_id,
        g.score,
        g.feedback,
        g.graded_at,
        gp.full_name as graded_by_name
       FROM assignment_submissions s
       LEFT JOIN assignments a ON s.assignment_id = a.id
       LEFT JOIN students st ON s.student_id = st.id
       LEFT JOIN profiles p ON st.user_id = p.id
       LEFT JOIN grades g ON s.id = g.assignment_submission_id
       LEFT JOIN profiles gp ON g.graded_by = gp.id
       WHERE s.id = $1`,
      [submissionId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Submission not found',
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
    console.error('Error fetching submission:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch submission',
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
 * PUT /api/submissions/[id]
 * Update a submission (student can update before grading)
 *
 * Request Body (all fields optional):
 * {
 *   submissionText?: string
 *   fileUrl?: string
 *   status?: string (draft, submitted)
 * }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const submissionId = params.id;
    const body = await request.json();

    // Build update query dynamically
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (body.submissionText !== undefined) {
      updates.push(`submission_text = $${paramCount}`);
      values.push(body.submissionText);
      paramCount++;
    }

    if (body.fileUrl !== undefined) {
      updates.push(`file_url = $${paramCount}`);
      values.push(body.fileUrl);
      paramCount++;
    }

    if (body.status !== undefined && body.status !== 'graded') {
      // Don't allow students to change status to graded
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

    values.push(submissionId);

    const result = await query(
      `UPDATE assignment_submissions SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Submission not found',
          meta: { code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Submission updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating submission:', error);
    return NextResponse.json(
      {
        error: 'Failed to update submission',
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
 * DELETE /api/submissions/[id]
 * Delete a submission (only if not graded)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const submissionId = params.id;

    // Check if submission is graded
    const checkGrade = await query(
      'SELECT id FROM grades WHERE assignment_submission_id = $1',
      [submissionId]
    );

    if (checkGrade.rows.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete graded submission',
          meta: { code: 'SUBMISSION_GRADED' },
        },
        { status: 400 }
      );
    }

    const result = await query(
      'DELETE FROM assignment_submissions WHERE id = $1 RETURNING *',
      [submissionId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Submission not found',
          meta: { code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Submission deleted successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting submission:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete submission',
        meta: {
          code: 'DELETE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
