import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/teacher/assessments/[assessmentId]/questions
 * Fetch questions for an assessment
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { assessmentId: string } }
) {
  try {
    const teacherId = request.headers.get('x-teacher-id');

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID required', code: 'MISSING_TEACHER_ID' },
        { status: 400 }
      );
    }

    const { assessmentId } = params;

    // Verify teacher owns the assessment
    const assessment = await query(
      `SELECT 1 FROM assessments WHERE id = $1 AND teacher_id = $2`,
      [assessmentId, teacherId]
    );

    if (assessment.rows.length === 0) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    const result = await query(`
      SELECT
        q.id,
        q.assessment_id,
        q.question_text,
        q.question_type,
        q.points,
        q.order_position,
        q.explanation,
        q.created_at,
        q.updated_at
      FROM questions q
      WHERE q.assessment_id = $1
      ORDER BY q.order_position ASC
    `, [assessmentId]);

    return NextResponse.json({
      success: true,
      questions: result.rows,
      total: result.rows.length
    });
  } catch (error: any) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch questions',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teacher/assessments/[assessmentId]/questions
 * Create a new question
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { assessmentId: string } }
) {
  try {
    const teacherId = request.headers.get('x-teacher-id');
    const body = await request.json();

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID required', code: 'MISSING_TEACHER_ID' },
        { status: 400 }
      );
    }

    const { assessmentId } = params;
    const { questionText, questionType, points = 1, explanation, options } = body;

    if (!questionText || !questionType) {
      return NextResponse.json(
        { error: 'Question text and type are required', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    // Verify teacher owns the assessment
    const assessment = await query(
      `SELECT 1 FROM assessments WHERE id = $1 AND teacher_id = $2`,
      [assessmentId, teacherId]
    );

    if (assessment.rows.length === 0) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    // Get the next order position
    const positionResult = await query(
      `SELECT MAX(order_position) as max_pos FROM questions WHERE assessment_id = $1`,
      [assessmentId]
    );
    const nextPosition = (positionResult.rows[0]?.max_pos || 0) + 1;

    // Insert question
    const questionResult = await query(`
      INSERT INTO questions
      (assessment_id, question_text, question_type, points, order_position, explanation, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING id, assessment_id, question_text, question_type, points, order_position, explanation, created_at, updated_at
    `, [assessmentId, questionText, questionType, points, nextPosition, explanation || null]);

    const questionId = questionResult.rows[0].id;

    // If multiple choice, insert options
    if (questionType === 'multiple_choice' && options && Array.isArray(options)) {
      for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        await query(`
          INSERT INTO question_options
          (question_id, option_text, is_correct, order_position, created_at, updated_at)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
        `, [questionId, opt.text, opt.isCorrect || false, i + 1]);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Question created successfully',
      question: questionResult.rows[0]
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to create question',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}
