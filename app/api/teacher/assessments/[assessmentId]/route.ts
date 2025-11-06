import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/teacher/assessments/[assessmentId]
 * Get assessment details
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

    const result = await query(`
      SELECT
        a.id,
        a.course_id,
        a.title,
        a.description,
        a.assessment_type,
        a.total_points,
        a.due_date,
        a.allow_retakes,
        a.max_attempts,
        a.show_answers,
        a.shuffle_questions,
        a.time_limit_minutes,
        a.is_published,
        a.created_at,
        a.updated_at,
        c.name as course_name
      FROM assessments a
      JOIN courses c ON c.id = a.course_id
      WHERE a.id = $1 AND a.teacher_id = $2
    `, [assessmentId, teacherId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Assessment not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      assessment: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error fetching assessment:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch assessment',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/teacher/assessments/[assessmentId]
 * Update an assessment
 */
export async function PUT(
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
    const {
      title, description, totalPoints, dueDate, allowRetakes,
      maxAttempts, showAnswers, shuffleQuestions, timeLimitMinutes, isPublished
    } = body;

    // Verify teacher owns this assessment
    const ownership = await query(
      `SELECT 1 FROM assessments WHERE id = $1 AND teacher_id = $2`,
      [assessmentId, teacherId]
    );

    if (ownership.rows.length === 0) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    const result = await query(`
      UPDATE assessments
      SET
        title = $1,
        description = $2,
        total_points = $3,
        due_date = $4,
        allow_retakes = $5,
        max_attempts = $6,
        show_answers = $7,
        shuffle_questions = $8,
        time_limit_minutes = $9,
        is_published = $10,
        updated_at = NOW()
      WHERE id = $11
      RETURNING
        id, course_id, title, description, assessment_type, total_points,
        due_date, allow_retakes, max_attempts, show_answers, shuffle_questions,
        time_limit_minutes, is_published, created_at, updated_at
    `, [
      title, description, totalPoints, dueDate, allowRetakes,
      maxAttempts, showAnswers, shuffleQuestions, timeLimitMinutes, isPublished, assessmentId
    ]);

    return NextResponse.json({
      success: true,
      message: 'Assessment updated successfully',
      assessment: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error updating assessment:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to update assessment',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teacher/assessments/[assessmentId]
 * Delete an assessment and its questions
 */
export async function DELETE(
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

    // Verify teacher owns this assessment
    const ownership = await query(
      `SELECT 1 FROM assessments WHERE id = $1 AND teacher_id = $2`,
      [assessmentId, teacherId]
    );

    if (ownership.rows.length === 0) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    // Delete assessment (cascades to questions via foreign key)
    await query(
      `DELETE FROM assessments WHERE id = $1`,
      [assessmentId]
    );

    return NextResponse.json({
      success: true,
      message: 'Assessment deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting assessment:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to delete assessment',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}
