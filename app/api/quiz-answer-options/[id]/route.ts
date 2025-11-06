import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/quiz-answer-options/[id]
 * Fetch a specific answer option
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const optionId = params.id;

    const result = await query(
      `SELECT * FROM quiz_answer_options WHERE id = $1`,
      [optionId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Answer option not found',
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
    console.error('Error fetching answer option:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch answer option',
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
 * PUT /api/quiz-answer-options/[id]
 * Update an answer option
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const optionId = params.id;
    const body = await request.json();

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    const allowedFields: { [key: string]: string } = {
      optionText: 'option_text',
      isCorrect: 'is_correct',
      orderPosition: 'order_position',
      feedback: 'feedback',
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

    values.push(optionId);

    const result = await query(
      `UPDATE quiz_answer_options SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Answer option not found',
          meta: { code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Answer option updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating answer option:', error);
    return NextResponse.json(
      {
        error: 'Failed to update answer option',
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
 * DELETE /api/quiz-answer-options/[id]
 * Delete an answer option
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const optionId = params.id;

    const result = await query(
      'DELETE FROM quiz_answer_options WHERE id = $1 RETURNING *',
      [optionId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Answer option not found',
          meta: { code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Answer option deleted successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting answer option:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete answer option',
        meta: {
          code: 'DELETE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
