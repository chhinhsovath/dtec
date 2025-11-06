import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * PUT /api/teacher/resources/[id]
 * Update a resource
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teacherId = request.headers.get('x-teacher-id');
    const resourceId = params.id;

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID required', code: 'MISSING_TEACHER_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, description, material_type, file_url, file_type, is_published } = body;

    if (!title && !material_type && !file_url && is_published === undefined && !description && !file_type) {
      return NextResponse.json(
        { error: 'At least one field must be provided to update', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    // Verify the teacher has access to this resource
    const verifyResult = await query(
      `
      SELECT cm.id FROM course_materials cm
      JOIN courses c ON cm.course_id = c.id
      JOIN teacher_courses tc ON c.id = tc.course_id
      WHERE cm.id = $1 AND tc.teacher_id = $2
      `,
      [resourceId, teacherId]
    );

    if (verifyResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Resource not found or access denied', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Build dynamic update query
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (title) {
      updateFields.push(`title = $${paramIndex}`);
      values.push(title);
      paramIndex++;
    }

    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      values.push(description || null);
      paramIndex++;
    }

    if (material_type) {
      updateFields.push(`material_type = $${paramIndex}`);
      values.push(material_type);
      paramIndex++;
    }

    if (file_url) {
      updateFields.push(`file_url = $${paramIndex}`);
      values.push(file_url);
      paramIndex++;
    }

    if (file_type) {
      updateFields.push(`file_type = $${paramIndex}`);
      values.push(file_type);
      paramIndex++;
    }

    if (is_published !== undefined) {
      updateFields.push(`is_published = $${paramIndex}`);
      values.push(is_published);
      paramIndex++;
    }

    updateFields.push(`updated_at = NOW()`);

    values.push(resourceId);

    const updateQuery = `
      UPDATE course_materials
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update resource', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    const resource = result.rows[0];

    // Fetch course details
    const courseResult = await query(
      `
      SELECT name FROM courses WHERE id = $1
      `,
      [resource.course_id]
    );

    return NextResponse.json({
      success: true,
      message: 'Resource updated successfully',
      data: {
        ...resource,
        course_title: courseResult.rows[0]?.name || 'Unknown',
      },
    });
  } catch (error: any) {
    console.error('Error updating resource:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to update resource',
        code: error.code,
        detail: error.detail,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teacher/resources/[id]
 * Delete a resource
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teacherId = request.headers.get('x-teacher-id');
    const resourceId = params.id;

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID required', code: 'MISSING_TEACHER_ID' },
        { status: 400 }
      );
    }

    // Verify the teacher has access to this resource
    const verifyResult = await query(
      `
      SELECT cm.id FROM course_materials cm
      JOIN courses c ON cm.course_id = c.id
      JOIN teacher_courses tc ON c.id = tc.course_id
      WHERE cm.id = $1 AND tc.teacher_id = $2
      `,
      [resourceId, teacherId]
    );

    if (verifyResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Resource not found or access denied', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete the resource
    const result = await query(
      `
      DELETE FROM course_materials WHERE id = $1
      RETURNING id
      `,
      [resourceId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete resource', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Resource deleted successfully',
      id: resourceId,
    });
  } catch (error: any) {
    console.error('Error deleting resource:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to delete resource',
        code: error.code,
        detail: error.detail,
      },
      { status: 500 }
    );
  }
}
