import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/grades/[id]
 * Fetch a specific grade
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gradeId = params.id;

    const result = await query(
      `SELECT
        g.*,
        s.submission_text,
        s.submitted_at,
        a.title as assignment_title,
        a.max_score,
        p.full_name as student_name,
        gp.full_name as graded_by_name
       FROM grades g
       LEFT JOIN assignment_submissions s ON g.assignment_submission_id = s.id
       LEFT JOIN assignments a ON s.assignment_id = a.id
       LEFT JOIN students st ON s.student_id = st.id
       LEFT JOIN profiles p ON st.user_id = p.id
       LEFT JOIN profiles gp ON g.graded_by = gp.id
       WHERE g.id = $1`,
      [gradeId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Grade not found',
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
    console.error('Error fetching grade:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch grade',
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
 * PUT /api/grades/[id]
 * Update a grade
 *
 * Request Body (all fields optional):
 * {
 *   score?: number
 *   feedback?: string
 * }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gradeId = params.id;
    const body = await request.json();

    // Build update query dynamically
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (body.score !== undefined) {
      updates.push(`score = $${paramCount}`);
      values.push(body.score);
      paramCount++;
    }

    if (body.feedback !== undefined) {
      updates.push(`feedback = $${paramCount}`);
      values.push(body.feedback);
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

    values.push(gradeId);

    // If updating score, validate it against max_score
    if (body.score !== undefined) {
      const gradeCheck = await query(
        `SELECT g.id, a.max_score FROM grades g
         LEFT JOIN assignment_submissions s ON g.assignment_submission_id = s.id
         LEFT JOIN assignments a ON s.assignment_id = a.id
         WHERE g.id = $1`,
        [gradeId]
      );

      if (gradeCheck.rows.length === 0) {
        return NextResponse.json(
          {
            error: 'Grade not found',
            meta: { code: 'NOT_FOUND' },
          },
          { status: 404 }
        );
      }

      const maxScore = gradeCheck.rows[0].max_score || 100;
      if (body.score < 0 || body.score > maxScore) {
        return NextResponse.json(
          {
            error: `Score must be between 0 and ${maxScore}`,
            meta: {
              code: 'INVALID_SCORE',
              maxScore: maxScore,
            },
          },
          { status: 400 }
        );
      }
    }

    const result = await query(
      `UPDATE grades SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return NextResponse.json({
      success: true,
      message: 'Grade updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating grade:', error);
    return NextResponse.json(
      {
        error: 'Failed to update grade',
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
 * DELETE /api/grades/[id]
 * Delete a grade
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gradeId = params.id;

    const result = await query(
      'DELETE FROM grades WHERE id = $1 RETURNING *',
      [gradeId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Grade not found',
          meta: { code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    // Update submission status back to submitted (not graded)
    await query(
      `UPDATE assignment_submissions SET status = 'submitted', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [result.rows[0].assignment_submission_id]
    );

    return NextResponse.json({
      success: true,
      message: 'Grade deleted successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting grade:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete grade',
        meta: {
          code: 'DELETE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
