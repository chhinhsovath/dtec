import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * PUT /api/teacher/announcements/[id]
 * Update an announcement
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params;
    const { title, content, isPinned } = body;

    // Verify teacher owns this announcement
    const ownership = await query(
      `SELECT 1 FROM course_announcements WHERE id = $1 AND teacher_id = $2`,
      [id, teacherId]
    );

    if (ownership.rows.length === 0) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    const result = await query(`
      UPDATE course_announcements
      SET title = $1, content = $2, is_pinned = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING id, course_id, title, content, is_pinned, created_at, updated_at
    `, [title, content, isPinned, id]);

    return NextResponse.json({
      success: true,
      message: 'Announcement updated successfully',
      announcement: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error updating announcement:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to update announcement',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teacher/announcements/[id]
 * Delete an announcement
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teacherId = request.headers.get('x-teacher-id');

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID required', code: 'MISSING_TEACHER_ID' },
        { status: 400 }
      );
    }

    const { id } = params;

    // Verify teacher owns this announcement
    const ownership = await query(
      `SELECT 1 FROM course_announcements WHERE id = $1 AND teacher_id = $2`,
      [id, teacherId]
    );

    if (ownership.rows.length === 0) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    await query(
      `DELETE FROM course_announcements WHERE id = $1`,
      [id]
    );

    return NextResponse.json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to delete announcement',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}
