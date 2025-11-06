import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/course-modules/[id]
 * Fetch a specific course module
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const moduleId = params.id;

    const result = await query(
      `SELECT * FROM course_modules WHERE id = $1`,
      [moduleId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Module not found',
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
    console.error('Error fetching course module:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch course module',
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
 * PUT /api/course-modules/[id]
 * Update a course module
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const moduleId = params.id;
    const body = await request.json();

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    const allowedFields: { [key: string]: string } = {
      title: 'title',
      description: 'description',
      orderPosition: 'order_position',
      durationDays: 'duration_days',
      learningObjectives: 'learning_objectives',
    };

    for (const [key, dbField] of Object.entries(allowedFields)) {
      if (body[key] !== undefined) {
        const value =
          key === 'learningObjectives'
            ? JSON.stringify(body[key])
            : body[key];
        updates.push(`${dbField} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(
        {
          error: 'No fields to update',
          meta: { code: 'NO_UPDATES' },
        },
        { status: 400 }
      );
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(moduleId);

    const result = await query(
      `UPDATE course_modules SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Module not found',
          meta: { code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Module updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating course module:', error);
    return NextResponse.json(
      {
        error: 'Failed to update course module',
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
 * DELETE /api/course-modules/[id]
 * Delete a course module
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const moduleId = params.id;

    const result = await query(
      'DELETE FROM course_modules WHERE id = $1 RETURNING *',
      [moduleId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Module not found',
          meta: { code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Module deleted successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting course module:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete course module',
        meta: {
          code: 'DELETE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
