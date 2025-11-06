import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * PUT /api/teacher/materials/[id]
 * Update a material
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
    const { title, type } = body;

    // Verify teacher owns this material
    const ownership = await query(`
      SELECT cm.id FROM course_materials cm
      JOIN courses c ON c.id = cm.course_id
      JOIN teacher_courses tc ON tc.course_id = c.id
      WHERE cm.id = $1 AND tc.teacher_id = $2
    `, [id, teacherId]);

    if (ownership.rows.length === 0) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    const result = await query(`
      UPDATE course_materials
      SET title = $1, type = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING id, course_id, title, file_url, type, created_at, updated_at
    `, [title, type, id]);

    return NextResponse.json({
      success: true,
      message: 'Material updated successfully',
      material: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error updating material:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to update material',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teacher/materials/[id]
 * Delete a material
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

    // Verify teacher owns this material
    const ownership = await query(`
      SELECT cm.id FROM course_materials cm
      JOIN courses c ON c.id = cm.course_id
      JOIN teacher_courses tc ON tc.course_id = c.id
      WHERE cm.id = $1 AND tc.teacher_id = $2
    `, [id, teacherId]);

    if (ownership.rows.length === 0) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    await query(
      `DELETE FROM course_materials WHERE id = $1`,
      [id]
    );

    return NextResponse.json({
      success: true,
      message: 'Material deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting material:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to delete material',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}
