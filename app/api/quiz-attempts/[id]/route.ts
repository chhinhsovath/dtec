import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/quiz-attempts/[id]
 * Fetch a specific quiz attempt with all answers
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const attemptId = params.id;

    const attemptResult = await query(
      `SELECT * FROM student_quiz_attempts WHERE id = $1`,
      [attemptId]
    );

    if (attemptResult.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Quiz attempt not found',
          meta: { code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    const answersResult = await query(
      `SELECT
        sqa.*,
        qq.question_text,
        qq.question_type,
        qq.points,
        qao.option_text as selected_option_text
      FROM student_quiz_answers sqa
      LEFT JOIN quiz_questions qq ON sqa.question_id = qq.id
      LEFT JOIN quiz_answer_options qao ON sqa.selected_option_id = qao.id
      WHERE sqa.attempt_id = $1
      ORDER BY qq.order_position ASC`,
      [attemptId]
    );

    return NextResponse.json({
      success: true,
      data: {
        ...attemptResult.rows[0],
        answers: answersResult.rows,
      },
    });
  } catch (error) {
    console.error('Error fetching quiz attempt:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch quiz attempt',
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
 * PUT /api/quiz-attempts/[id]/submit
 * Submit quiz answers and calculate auto-grade
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const attemptId = params.id;
    const body = await request.json();

    // Get attempt details
    const attemptResult = await query(
      `SELECT a.*, q.total_points, q.passing_score, q.id as quiz_id
       FROM student_quiz_attempts a
       LEFT JOIN quizzes q ON a.quiz_id = q.id
       WHERE a.id = $1`,
      [attemptId]
    );

    if (attemptResult.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Quiz attempt not found',
          meta: { code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    const attempt = attemptResult.rows[0];

    // Validate not already submitted
    if (attempt.status !== 'in_progress') {
      return NextResponse.json(
        {
          error: 'Quiz attempt already submitted',
          meta: { code: 'ALREADY_SUBMITTED' },
        },
        { status: 400 }
      );
    }

    // Process answers and calculate score
    let totalScore = 0;
    const answers = body.answers || []; // Array of { questionId, selectedOptionId, answerText }

    for (const answer of answers) {
      const questionResult = await query(
        `SELECT * FROM quiz_questions WHERE id = $1`,
        [answer.questionId]
      );

      if (questionResult.rows.length === 0) continue;

      const question = questionResult.rows[0];
      let pointsEarned = 0;
      let isCorrect = false;
      let feedback = '';

      // Auto-grade based on question type
      if (question.question_type === 'multiple_choice' || question.question_type === 'true_false') {
        // Check if selected option is correct
        if (answer.selectedOptionId) {
          const optionResult = await query(
            `SELECT * FROM quiz_answer_options WHERE id = $1`,
            [answer.selectedOptionId]
          );

          if (optionResult.rows.length > 0) {
            const option = optionResult.rows[0];
            isCorrect = option.is_correct;
            pointsEarned = isCorrect ? question.points : 0;
            feedback = option.feedback || '';
          }
        }
      } else if (question.question_type === 'essay' || question.question_type === 'short_answer') {
        // Manual grading required - record 0 points initially
        pointsEarned = 0;
        isCorrect = false;
        feedback = 'Pending manual grading';
      }

      // Record student answer
      await query(
        `INSERT INTO student_quiz_answers (
          attempt_id, question_id, selected_option_id, answer_text,
          is_correct, points_earned, feedback
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          attemptId,
          answer.questionId,
          answer.selectedOptionId || null,
          answer.answerText || null,
          isCorrect,
          pointsEarned,
          feedback,
        ]
      );

      totalScore += pointsEarned;
    }

    // Calculate percentage and determine if passed
    const maxScore = attempt.total_points || 100;
    const percentageScore = (totalScore / maxScore) * 100;
    const passed = attempt.passing_score ? percentageScore >= attempt.passing_score : percentageScore >= 60;

    // Calculate time spent
    const endTime = new Date();
    const startTime = new Date(attempt.start_time);
    const timeSpentSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    // Update attempt with results
    const updateResult = await query(
      `UPDATE student_quiz_attempts
       SET status = $1, end_time = CURRENT_TIMESTAMP, total_score = $2,
           percentage_score = $3, passed = $4, time_spent_seconds = $5
       WHERE id = $6
       RETURNING *`,
      ['submitted', totalScore, percentageScore, passed, timeSpentSeconds, attemptId]
    );

    // Create grade entry for the quiz
    await query(
      `INSERT INTO grades (student_id, course_id, quiz_attempt_id, score, max_score, grade_type, created_at, updated_at)
       SELECT $1, q.course_id, $2, $3, q.total_points, 'quiz', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
       FROM quizzes q
       WHERE q.id = $4`,
      [attempt.student_id, attemptId, totalScore, attempt.quiz_id]
    );

    return NextResponse.json({
      success: true,
      message: 'Quiz submitted successfully',
      data: {
        ...updateResult.rows[0],
        totalScore,
        percentageScore,
        passed,
      },
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    return NextResponse.json(
      {
        error: 'Failed to submit quiz',
        meta: {
          code: 'SUBMISSION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/quiz-attempts/[id]
 * Abandon quiz attempt
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const attemptId = params.id;

    const result = await query(
      `UPDATE student_quiz_attempts
       SET status = 'abandoned', end_time = CURRENT_TIMESTAMP
       WHERE id = $1 AND status = 'in_progress'
       RETURNING *`,
      [attemptId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Quiz attempt not found or already submitted',
          meta: { code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Quiz attempt abandoned',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error abandoning quiz:', error);
    return NextResponse.json(
      {
        error: 'Failed to abandon quiz',
        meta: {
          code: 'DELETE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
