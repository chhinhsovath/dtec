import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/quiz-attempts
 * Fetch quiz attempts with filtering by quiz, student, or status
 */
export async function GET(request: NextRequest) {
  try {
    const quizId = request.nextUrl.searchParams.get('quizId');
    const studentId = request.nextUrl.searchParams.get('studentId');
    const status = request.nextUrl.searchParams.get('status');
    const limit = request.nextUrl.searchParams.get('limit') || '100';

    let sql = `SELECT
                a.*,
                q.title as quiz_title,
                p.email as student_email,
                p.first_name,
                p.last_name
              FROM student_quiz_attempts a
              LEFT JOIN quizzes q ON a.quiz_id = q.id
              LEFT JOIN profiles p ON a.student_id = p.id
              WHERE 1=1`;
    const params: unknown[] = [];

    if (quizId) {
      sql += ` AND a.quiz_id = $${params.length + 1}`;
      params.push(quizId);
    }

    if (studentId) {
      sql += ` AND a.student_id = $${params.length + 1}`;
      params.push(studentId);
    }

    if (status) {
      sql += ` AND a.status = $${params.length + 1}`;
      params.push(status);
    }

    sql += ` ORDER BY a.start_time DESC LIMIT ${parseInt(limit)}`;

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rowCount || 0,
    });
  } catch (error) {
    console.error('Error fetching quiz attempts:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch quiz attempts',
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
 * POST /api/quiz-attempts
 * Start a new quiz attempt
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.quizId || !body.studentId) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          meta: {
            code: 'VALIDATION_ERROR',
            required: ['quizId', 'studentId'],
          },
        },
        { status: 400 }
      );
    }

    // Check if student has already attempted this quiz
    const existingAttempts = await query(
      `SELECT COUNT(*) as count FROM student_quiz_attempts
       WHERE quiz_id = $1 AND student_id = $2`,
      [body.quizId, body.studentId]
    );

    const attemptCount = parseInt(existingAttempts.rows[0].count) + 1;

    // Get quiz to check attempts limit
    const quizResult = await query(
      `SELECT attempts_allowed FROM quizzes WHERE id = $1`,
      [body.quizId]
    );

    if (quizResult.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Quiz not found',
          meta: { code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    const quiz = quizResult.rows[0];
    if (quiz.attempts_allowed > 0 && attemptCount > quiz.attempts_allowed) {
      return NextResponse.json(
        {
          error: 'Maximum attempts exceeded',
          meta: { code: 'ATTEMPTS_EXCEEDED' },
        },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO student_quiz_attempts (
        quiz_id, student_id, attempt_number, start_time, status
      ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4)
      RETURNING *`,
      [body.quizId, body.studentId, attemptCount, 'in_progress']
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Quiz attempt started',
        data: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating quiz attempt:', error);
    return NextResponse.json(
      {
        error: 'Failed to start quiz attempt',
        meta: {
          code: 'CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
