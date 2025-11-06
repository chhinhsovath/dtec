import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * POST /api/teacher/assignments/[assignmentId]/questions/[questionId]/link-h5p
 * Link H5P content to a question
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { assignmentId: string; questionId: string } }
) {
  try {
    const teacherId = request.headers.get('x-teacher-id');
    const { assignmentId, questionId } = params;
    const body = await request.json();
    const { h5pContentId, displayMode, height, width } = body;

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID required', code: 'MISSING_TEACHER_ID' },
        { status: 400 }
      );
    }

    if (!h5pContentId) {
      return NextResponse.json(
        { error: 'H5P content ID is required', code: 'MISSING_H5P_CONTENT_ID' },
        { status: 400 }
      );
    }

    // Verify teacher owns the assignment
    const assignmentCheck = await query(
      `
      SELECT a.id FROM assignments a
      JOIN courses c ON a.course_id = c.id
      JOIN teacher_courses tc ON c.id = tc.course_id
      WHERE a.id = $1 AND tc.teacher_id = $2
      `,
      [assignmentId, teacherId]
    );

    if (assignmentCheck.rowCount === 0) {
      return NextResponse.json(
        { error: 'Assignment not found or access denied', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verify question exists and belongs to assignment
    const questionCheck = await query(
      `
      SELECT id FROM assignment_questions
      WHERE id = $1 AND assignment_id = $2
      `,
      [questionId, assignmentId]
    );

    if (questionCheck.rowCount === 0) {
      return NextResponse.json(
        { error: 'Question not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verify H5P content exists and belongs to teacher
    const h5pCheck = await query(
      `SELECT id FROM h5p_content WHERE id = $1 AND teacher_id = $2`,
      [h5pContentId, teacherId]
    );

    if (h5pCheck.rowCount === 0) {
      return NextResponse.json(
        { error: 'H5P content not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Link H5P content to question
    const result = await query(
      `
      INSERT INTO h5p_in_assignments
      (question_id, h5p_content_id, display_mode, height, width, created_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (question_id, h5p_content_id)
      DO UPDATE SET
        display_mode = COALESCE($3, h5p_in_assignments.display_mode),
        height = COALESCE($4, h5p_in_assignments.height),
        width = COALESCE($5, h5p_in_assignments.width)
      RETURNING *
      `,
      [
        questionId,
        h5pContentId,
        displayMode || 'embedded',
        height || 400,
        width || null
      ]
    );

    // Increment usage count for H5P content
    await query(
      `UPDATE h5p_content SET usage_count = usage_count + 1 WHERE id = $1`,
      [h5pContentId]
    );

    return NextResponse.json({
      success: true,
      message: 'H5P content linked to question successfully',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error linking H5P content:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to link H5P content',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teacher/assignments/[assignmentId]/questions/[questionId]/link-h5p/[linkId]
 * Unlink H5P content from a question
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { assignmentId: string; questionId: string } }
) {
  try {
    const teacherId = request.headers.get('x-teacher-id');
    const { assignmentId, questionId } = params;
    const body = await request.json();
    const { h5pContentId } = body;

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID required', code: 'MISSING_TEACHER_ID' },
        { status: 400 }
      );
    }

    if (!h5pContentId) {
      return NextResponse.json(
        { error: 'H5P content ID is required', code: 'MISSING_H5P_CONTENT_ID' },
        { status: 400 }
      );
    }

    // Verify teacher owns the assignment
    const assignmentCheck = await query(
      `
      SELECT a.id FROM assignments a
      JOIN courses c ON a.course_id = c.id
      JOIN teacher_courses tc ON c.id = tc.course_id
      WHERE a.id = $1 AND tc.teacher_id = $2
      `,
      [assignmentId, teacherId]
    );

    if (assignmentCheck.rowCount === 0) {
      return NextResponse.json(
        { error: 'Assignment not found or access denied', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete the link
    const result = await query(
      `
      DELETE FROM h5p_in_assignments
      WHERE question_id = $1 AND h5p_content_id = $2
      RETURNING id
      `,
      [questionId, h5pContentId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Link not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Decrement usage count for H5P content
    await query(
      `UPDATE h5p_content SET usage_count = GREATEST(0, usage_count - 1) WHERE id = $1`,
      [h5pContentId]
    );

    return NextResponse.json({
      success: true,
      message: 'H5P content unlinked from question successfully'
    });
  } catch (error: any) {
    console.error('Error unlinking H5P content:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to unlink H5P content',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}
