import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/quizzes/[id]
 * Fetch a specific quiz with full details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quizId = params.id;

    const result = await query(
      `SELECT
        q.*,
        c.name as course_name,
        cm.title as module_title,
        p.email as created_by_email,
        COUNT(qq.id) as total_questions
      FROM quizzes q
      LEFT JOIN courses c ON q.course_id = c.id
      LEFT JOIN course_modules cm ON q.module_id = cm.id
      LEFT JOIN profiles p ON q.created_by = p.id
      LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
      WHERE q.id = $1
      GROUP BY q.id, c.id, cm.id, p.id`,
      [quizId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Quiz not found',
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
    console.error('Error fetching quiz:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch quiz',
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
 * PUT /api/quizzes/[id]
 * Update a quiz
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quizId = params.id;
    const body = await request.json();

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    // Allowed fields to update
    const allowedFields: { [key: string]: string } = {
      title: 'title',
      description: 'description',
      quizType: 'quiz_type',
      totalPoints: 'total_points',
      passingScore: 'passing_score',
      timeLimitMinutes: 'time_limit_minutes',
      showAnswersAfterSubmit: 'show_answers_after_submit',
      showScoreImmediately: 'show_score_immediately',
      shuffleQuestions: 'shuffle_questions',
      randomSelection: 'random_selection',
      numberOfRandomQuestions: 'number_of_random_questions',
      dueDate: 'due_date',
      availableFrom: 'available_from',
      availableUntil: 'available_until',
      isPublished: 'is_published',
      allowReview: 'allow_review',
      attemptsAllowed: 'attempts_allowed',
    };

    for (const [key, dbField] of Object.entries(allowedFields)) {
      if (body[key] !== undefined) {
        updates.push(`${dbField} = $${paramCount}`);
        values.push(body[key]);
        paramCount++;
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(
        {
          error: 'No fields to update',
          meta: { code: 'NO_UPDATES' },
        },
        { status: 400 }
      );
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(quizId);

    const result = await query(
      `UPDATE quizzes SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Quiz not found',
          meta: { code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Quiz updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating quiz:', error);
    return NextResponse.json(
      {
        error: 'Failed to update quiz',
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
 * DELETE /api/quizzes/[id]
 * Delete a quiz and all associated questions and attempts
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quizId = params.id;

    const result = await query(
      'DELETE FROM quizzes WHERE id = $1 RETURNING *',
      [quizId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Quiz not found',
          meta: { code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Quiz deleted successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete quiz',
        meta: {
          code: 'DELETE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
