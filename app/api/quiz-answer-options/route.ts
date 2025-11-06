import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/quiz-answer-options
 * Fetch answer options for a specific question
 */
export async function GET(request: NextRequest) {
  try {
    const questionId = request.nextUrl.searchParams.get('questionId');

    if (!questionId) {
      return NextResponse.json(
        {
          error: 'questionId parameter is required',
          meta: { code: 'MISSING_PARAM' },
        },
        { status: 400 }
      );
    }

    const result = await query(
      `SELECT * FROM quiz_answer_options WHERE question_id = $1 ORDER BY order_position ASC`,
      [questionId]
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rowCount || 0,
    });
  } catch (error) {
    console.error('Error fetching answer options:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch answer options',
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
 * POST /api/quiz-answer-options
 * Create a new answer option for a question
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.questionId || !body.optionText) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          meta: {
            code: 'VALIDATION_ERROR',
            required: ['questionId', 'optionText'],
          },
        },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO quiz_answer_options (
        question_id, option_text, is_correct, order_position, feedback
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        body.questionId,
        body.optionText,
        body.isCorrect || false,
        body.orderPosition || 0,
        body.feedback || null,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Answer option created successfully',
        data: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating answer option:', error);
    return NextResponse.json(
      {
        error: 'Failed to create answer option',
        meta: {
          code: 'CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
