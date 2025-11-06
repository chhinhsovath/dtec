import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/teacher/assignments/[assignmentId]/submissions/[submissionId]
 * Get submission details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { assignmentId: string; submissionId: string } }
) {
  try {
    const teacherId = request.headers.get('x-teacher-id');
    const assignmentId = params.assignmentId;
    const submissionId = params.submissionId;

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID required', code: 'MISSING_TEACHER_ID' },
        { status: 400 }
      );
    }

    // Verify teacher has access to this assignment
    const accessResult = await query(`
      SELECT a.id FROM assignments a
      JOIN courses c ON a.course_id = c.id
      JOIN teacher_courses tc ON c.id = tc.course_id
      WHERE tc.teacher_id = $1 AND a.id = $2
    `, [teacherId, assignmentId]);

    if (accessResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Access denied', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const result = await query(`
      SELECT
        s.*,
        p.full_name,
        p.email,
        st.student_number,
        a.max_score,
        a.title as assignment_title
      FROM assignment_submissions s
      JOIN students st ON s.student_id = st.id
      JOIN profiles p ON st.user_id = p.id
      JOIN assignments a ON s.assignment_id = a.id
      WHERE s.id = $1 AND s.assignment_id = $2
    `, [submissionId, assignmentId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Submission not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      submission: result.rows[0]
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
 * PUT /api/teacher/assignments/[assignmentId]/submissions/[submissionId]
 * Grade a submission
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { assignmentId: string; submissionId: string } }
) {
  try {
    const teacherId = request.headers.get('x-teacher-id');
    const assignmentId = params.assignmentId;
    const submissionId = params.submissionId;
    const body = await request.json();
    const { score, feedback } = body;

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID required', code: 'MISSING_TEACHER_ID' },
        { status: 400 }
      );
    }

    if (score === undefined) {
      return NextResponse.json(
        { error: 'Score is required', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    // Verify teacher has access to this assignment
    const accessResult = await query(`
      SELECT a.id FROM assignments a
      JOIN courses c ON a.course_id = c.id
      JOIN teacher_courses tc ON c.id = tc.course_id
      WHERE tc.teacher_id = $1 AND a.id = $2
    `, [teacherId, assignmentId]);

    if (accessResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Access denied', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const result = await query(`
      UPDATE assignment_submissions
      SET
        score = $1,
        feedback = $2,
        graded_at = NOW(),
        graded_by = $3
      WHERE id = $4 AND assignment_id = $5
      RETURNING *
    `, [score, feedback || null, teacherId, submissionId, assignmentId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Submission not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Submission graded successfully',
      submission: result.rows[0]
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
