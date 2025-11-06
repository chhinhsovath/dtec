import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/teacher/submissions/[submissionId]
 * Get submission details with answers
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  try {
    const teacherId = request.headers.get('x-teacher-id');

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID required', code: 'MISSING_TEACHER_ID' },
        { status: 400 }
      );
    }

    const { submissionId } = params;

    // Get submission with assessment ownership check
    const submissionResult = await query(`
      SELECT
        s.id,
        s.assessment_id,
        s.student_id,
        s.status,
        s.score,
        s.max_score,
        s.started_at,
        s.submitted_at,
        s.graded_at,
        s.time_spent_minutes,
        s.created_at,
        s.updated_at,
        a.title as assessment_title,
        a.total_points,
        p.first_name,
        p.last_name,
        st.student_number
      FROM submissions s
      JOIN assessments a ON a.id = s.assessment_id
      JOIN students st ON st.id = s.student_id
      JOIN profiles p ON p.user_id = st.user_id
      WHERE s.id = $1 AND a.teacher_id = $2
    `, [submissionId, teacherId]);

    if (submissionResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Submission not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const submission = submissionResult.rows[0];

    // Get answers with questions
    const answersResult = await query(`
      SELECT
        sa.id,
        sa.submission_id,
        sa.question_id,
        sa.answer_text,
        sa.selected_option_id,
        sa.points_earned,
        sa.feedback,
        q.question_text,
        q.question_type,
        q.points,
        qo.option_text
      FROM submission_answers sa
      JOIN questions q ON q.id = sa.question_id
      LEFT JOIN question_options qo ON qo.id = sa.selected_option_id
      WHERE sa.submission_id = $1
      ORDER BY q.order_position ASC
    `, [submissionId]);

    return NextResponse.json({
      success: true,
      submission: {
        ...submission,
        answers: answersResult.rows
      }
    });
  } catch (error: any) {
    console.error('Error fetching submission:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch submission',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/teacher/submissions/[submissionId]/grade
 * Grade a submission
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { submissionId: string } }
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

    const { submissionId } = params;
    const { scores, feedback, overallScore, letterGrade } = body;

    // Verify teacher owns the assessment
    const ownership = await query(`
      SELECT s.id FROM submissions s
      JOIN assessments a ON a.id = s.assessment_id
      WHERE s.id = $1 AND a.teacher_id = $2
    `, [submissionId, teacherId]);

    if (ownership.rows.length === 0) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    // Update individual answer scores and feedback
    if (scores && typeof scores === 'object') {
      for (const [answerId, points] of Object.entries(scores)) {
        await query(`
          UPDATE submission_answers
          SET points_earned = $1, updated_at = NOW()
          WHERE id = $2
        `, [points, answerId]);
      }
    }

    // Calculate total score
    const scoreResult = await query(`
      SELECT COALESCE(SUM(points_earned), 0) as total_score
      FROM submission_answers
      WHERE submission_id = $1
    `, [submissionId]);

    const totalScore = scoreResult.rows[0]?.total_score || 0;

    // Update submission status and score
    const submissionResult = await query(`
      UPDATE submissions
      SET
        status = 'graded',
        score = $1,
        graded_at = NOW(),
        updated_at = NOW()
      WHERE id = $2
      RETURNING id, assessment_id, student_id, status, score, max_score, graded_at
    `, [totalScore, submissionId]);

    // Create or update grade record
    await query(`
      INSERT INTO grades (submission_id, teacher_id, overall_score, letter_grade, feedback, graded_at, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())
      ON CONFLICT (submission_id) DO UPDATE
      SET overall_score = $3, letter_grade = $4, feedback = $5, graded_at = NOW(), updated_at = NOW()
    `, [submissionId, teacherId, overallScore || totalScore, letterGrade || null, feedback || null]);

    return NextResponse.json({
      success: true,
      message: 'Submission graded successfully',
      submission: submissionResult.rows[0]
    });
  } catch (error: any) {
    console.error('Error grading submission:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to grade submission',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}
