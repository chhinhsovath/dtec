import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/learning-paths/[id]
 * Fetch specific learning path with courses and progress
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pathId = params.id;

    const pathResult = await query(
      `SELECT * FROM learning_paths WHERE id = $1`,
      [pathId]
    );

    if (pathResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Learning path not found', meta: { code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    const coursesResult = await query(
      `SELECT
        pc.*,
        c.name as course_name,
        c.description as course_description,
        c.created_by
      FROM path_courses pc
      LEFT JOIN courses c ON pc.course_id = c.id
      WHERE pc.path_id = $1
      ORDER BY pc.sequence_order ASC`,
      [pathId]
    );

    return NextResponse.json({
      success: true,
      data: {
        ...pathResult.rows[0],
        courses: coursesResult.rows,
      },
    });
  } catch (error) {
    console.error('Error fetching learning path:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch learning path',
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
 * PUT /api/learning-paths/[id]
 * Update learning path
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pathId = params.id;
    const body = await request.json();

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    const allowedFields: { [key: string]: string } = {
      name: 'name',
      description: 'description',
      difficultyLevel: 'difficulty_level',
      estimatedHours: 'estimated_hours',
      learningObjectives: 'learning_objectives',
      category: 'category',
      isPublished: 'is_published',
      thumbnailUrl: 'thumbnail_url',
    };

    for (const [key, dbField] of Object.entries(allowedFields)) {
      if (body[key] !== undefined) {
        const value =
          key === 'learningObjectives' ? JSON.stringify(body[key]) : body[key];
        updates.push(`${dbField} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update', meta: { code: 'NO_UPDATES' } },
        { status: 400 }
      );
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(pathId);

    const result = await query(
      `UPDATE learning_paths SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Learning path not found', meta: { code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Learning path updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating learning path:', error);
    return NextResponse.json(
      {
        error: 'Failed to update learning path',
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
 * DELETE /api/learning-paths/[id]
 * Delete learning path
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pathId = params.id;

    const result = await query(
      'DELETE FROM learning_paths WHERE id = $1 RETURNING *',
      [pathId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Learning path not found', meta: { code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Learning path deleted successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting learning path:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete learning path',
        meta: {
          code: 'DELETE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
