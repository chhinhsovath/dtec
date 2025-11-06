import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/teacher/assessments/[assessmentId]/questions/[questionId]
 * Get question with options
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { assessmentId: string; questionId: string } }
) {
  try {
    const teacherId = request.headers.get('x-teacher-id');

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID required', code: 'MISSING_TEACHER_ID' },
        { status: 400 }
      );
    }

    const { assessmentId, questionId } = params;

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

    // Get question
    const questionResult = await query(`
      SELECT
        id, assessment_id, question_text, question_type, points, order_position,
        explanation, created_at, updated_at
      FROM questions
      WHERE id = $1 AND assessment_id = $2
    `, [questionId, assessmentId]);

    if (questionResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Question not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Get options if multiple choice
    let options = [];
    const optionsResult = await query(`
      SELECT id, question_id, option_text, is_correct, order_position, created_at, updated_at
      FROM question_options
      WHERE question_id = $1
      ORDER BY order_position ASC
    `, [questionId]);

    options = optionsResult.rows;

    return NextResponse.json({
      success: true,
      question: {
        ...questionResult.rows[0],
        options
      }
    });
  } catch (error: any) {
    console.error('Error fetching question:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch question',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/teacher/assessments/[assessmentId]/questions/[questionId]
 * Update a question
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { assessmentId: string; questionId: string } }
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

    const { assessmentId, questionId } = params;
    const { questionText, points, explanation, options } = body;

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
      UPDATE questions
      SET question_text = $1, points = $2, explanation = $3, updated_at = NOW()
      WHERE id = $4 AND assessment_id = $5
      RETURNING id, assessment_id, question_text, question_type, points, order_position, explanation, created_at, updated_at
    `, [questionText, points, explanation, questionId, assessmentId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Question not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Update options if provided
    if (options && Array.isArray(options)) {
      // Delete existing options
      await query(`DELETE FROM question_options WHERE question_id = $1`, [questionId]);

      // Insert new options
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
      message: 'Question updated successfully',
      question: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to update question',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teacher/assessments/[assessmentId]/questions/[questionId]
 * Delete a question
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { assessmentId: string; questionId: string } }
) {
  try {
    const teacherId = request.headers.get('x-teacher-id');

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID required', code: 'MISSING_TEACHER_ID' },
        { status: 400 }
      );
    }

    const { assessmentId, questionId } = params;

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

    await query(
      `DELETE FROM questions WHERE id = $1 AND assessment_id = $2`,
      [questionId, assessmentId]
    );

    return NextResponse.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to delete question',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}
