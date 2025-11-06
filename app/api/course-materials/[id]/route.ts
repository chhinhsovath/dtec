import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/course-materials/[id]
 * Fetch a specific course material
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const materialId = params.id;

    const result = await query(
      `SELECT m.*,
              c.name as course_name,
              p.first_name, p.last_name
       FROM course_materials m
       LEFT JOIN courses c ON m.course_id = c.id
       LEFT JOIN profiles p ON m.uploaded_by = p.id
       WHERE m.id = $1`,
      [materialId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Course material not found',
          meta: { code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching course material:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch course material',
        meta: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/course-materials/[id]
 * Update a course material
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const materialId = params.id;
    const body = await request.json();

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (body.title !== undefined) {
      updates.push(`title = $${paramCount}`);
      values.push(body.title);
      paramCount++;
    }

    if (body.description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(body.description || null);
      paramCount++;
    }

    if (body.materialType !== undefined) {
      updates.push(`material_type = $${paramCount}`);
      values.push(body.materialType);
      paramCount++;
    }

    if (body.fileUrl !== undefined) {
      updates.push(`file_url = $${paramCount}`);
      values.push(body.fileUrl);
      paramCount++;
    }

    if (body.fileSizeMb !== undefined) {
      updates.push(`file_size_mb = $${paramCount}`);
      values.push(body.fileSizeMb || null);
      paramCount++;
    }

    if (body.fileType !== undefined) {
      updates.push(`file_type = $${paramCount}`);
      values.push(body.fileType || null);
      paramCount++;
    }

    if (body.orderPosition !== undefined) {
      updates.push(`order_position = $${paramCount}`);
      values.push(body.orderPosition);
      paramCount++;
    }

    if (body.isPublished !== undefined) {
      updates.push(`is_published = $${paramCount}`);
      values.push(body.isPublished);
      paramCount++;
      if (body.isPublished && !body.publishedAt) {
        updates.push(`published_at = CURRENT_TIMESTAMP`);
      }
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updates.length === 1) {
      return NextResponse.json(
        {
          error: 'No fields to update',
          meta: { code: 'NO_UPDATES' },
        },
        { status: 400 }
      );
    }

    values.push(materialId);

    const result = await query(
      `UPDATE course_materials SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Course material not found',
          meta: { code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Course material updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating course material:', error);
    return NextResponse.json(
      {
        error: 'Failed to update course material',
        meta: {
          code: 'UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/course-materials/[id]
 * Delete a course material
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const materialId = params.id;

    const result = await query(
      'DELETE FROM course_materials WHERE id = $1 RETURNING *',
      [materialId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Course material not found',
          meta: { code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Course material deleted successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting course material:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete course material',
        meta: {
          code: 'DELETE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
