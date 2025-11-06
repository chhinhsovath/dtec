import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/quiz-questions/[id]
 * Fetch a specific quiz question with its answer options
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const questionId = params.id;

    const questionResult = await query(
      `SELECT * FROM quiz_questions WHERE id = $1`,
      [questionId]
    );

    if (questionResult.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Question not found',
          meta: { code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    const optionsResult = await query(
      `SELECT * FROM quiz_answer_options WHERE question_id = $1 ORDER BY order_position ASC`,
      [questionId]
    );

    return NextResponse.json({
      success: true,
      data: {
        ...questionResult.rows[0],
        options: optionsResult.rows,
      },
    });
  } catch (error) {
    console.error('Error fetching quiz question:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch quiz question',
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
 * PUT /api/quiz-questions/[id]
 * Update a quiz question
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const questionId = params.id;
    const body = await request.json();

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    const allowedFields: { [key: string]: string } = {
      questionText: 'question_text',
      questionType: 'question_type',
      points: 'points',
      orderPosition: 'order_position',
      difficultyLevel: 'difficulty_level',
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
    values.push(questionId);

    const result = await query(
      `UPDATE quiz_questions SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Question not found',
          meta: { code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Question updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating quiz question:', error);
    return NextResponse.json(
      {
        error: 'Failed to update quiz question',
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
 * DELETE /api/quiz-questions/[id]
 * Delete a quiz question and all related answer options and student answers
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const questionId = params.id;

    const result = await query(
      'DELETE FROM quiz_questions WHERE id = $1 RETURNING *',
      [questionId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Question not found',
          meta: { code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Question deleted successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting quiz question:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete quiz question',
        meta: {
          code: 'DELETE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
