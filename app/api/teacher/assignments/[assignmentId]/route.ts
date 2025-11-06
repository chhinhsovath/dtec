import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/teacher/assignments/[assignmentId]
 * Get assignment details with submissions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
    const teacherId = request.headers.get('x-teacher-id');
    const assignmentId = params.assignmentId;

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

    // Get assignment details
    const assignmentResult = await query(`
      SELECT * FROM assignments WHERE id = $1
    `, [assignmentId]);

    if (assignmentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Assignment not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Get submissions
    const submissionsResult = await query(`
      SELECT
        s.id,
        s.student_id,
        s.assignment_id,
        s.submission_file,
        s.submission_text,
        s.submitted_at,
        s.score,
        s.feedback,
        p.full_name,
        p.email,
        st.student_number
      FROM assignment_submissions s
      JOIN students st ON s.student_id = st.id
      JOIN profiles p ON st.user_id = p.id
      WHERE s.assignment_id = $1
      ORDER BY s.submitted_at DESC
    `, [assignmentId]);

    return NextResponse.json({
      success: true,
      assignment: assignmentResult.rows[0],
      submissions: submissionsResult.rows,
      submissionCount: submissionsResult.rows.length
    });
  } catch (error: any) {
    console.error('Error fetching assignment:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch assignment',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/teacher/assignments/[assignmentId]
 * Update assignment
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
    const teacherId = request.headers.get('x-teacher-id');
    const assignmentId = params.assignmentId;
    const body = await request.json();
    const { title, description, maxScore, dueDate, assignmentType } = body;

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
      UPDATE assignments
      SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        max_score = COALESCE($3, max_score),
        due_date = COALESCE($4, due_date),
        assignment_type = COALESCE($5, assignment_type),
        updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `, [title, description, maxScore, dueDate, assignmentType, assignmentId]);

    return NextResponse.json({
      success: true,
      message: 'Assignment updated successfully',
      assignment: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error updating assignment:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to update assignment',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teacher/assignments/[assignmentId]
 * Delete assignment (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
    const teacherId = request.headers.get('x-teacher-id');
    const assignmentId = params.assignmentId;

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

    // Soft delete - just set status
    const result = await query(`
      UPDATE assignments
      SET status = 'deleted', updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [assignmentId]);

    return NextResponse.json({
      success: true,
      message: 'Assignment deleted successfully',
      assignment: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to delete assignment',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}
