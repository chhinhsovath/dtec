import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/quiz-questions
 * Fetch quiz questions with filtering by quiz_id
 */
export async function GET(request: NextRequest) {
  try {
    const quizId = request.nextUrl.searchParams.get('quizId');
    const limit = request.nextUrl.searchParams.get('limit') || '1000';

    if (!quizId) {
      return NextResponse.json(
        {
          error: 'quizId parameter is required',
          meta: { code: 'MISSING_PARAM' },
        },
        { status: 400 }
      );
    }

    const result = await query(
      `SELECT qq.*,
              COUNT(qao.id) as total_options,
              SUM(CASE WHEN qao.is_correct THEN 1 ELSE 0 END) as correct_options
       FROM quiz_questions qq
       LEFT JOIN quiz_answer_options qao ON qq.id = qao.question_id
       WHERE qq.quiz_id = $1
       GROUP BY qq.id
       ORDER BY qq.order_position ASC
       LIMIT ${parseInt(limit)}`,
      [quizId]
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rowCount || 0,
    });
  } catch (error) {
    console.error('Error fetching quiz questions:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch quiz questions',
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
 * POST /api/quiz-questions
 * Create a new quiz question
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.quizId || !body.questionText || !body.questionType) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          meta: {
            code: 'VALIDATION_ERROR',
            required: ['quizId', 'questionText', 'questionType'],
          },
        },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO quiz_questions (
        quiz_id, question_text, question_type, points,
        order_position, difficulty_level
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        body.quizId,
        body.questionText,
        body.questionType,
        body.points || 1,
        body.orderPosition || 0,
        body.difficultyLevel || null,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Question created successfully',
        data: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating quiz question:', error);
    return NextResponse.json(
      {
        error: 'Failed to create quiz question',
        meta: {
          code: 'CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
