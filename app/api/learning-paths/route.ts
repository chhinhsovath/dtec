import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/learning-paths
 * Fetch all learning paths with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const category = request.nextUrl.searchParams.get('category');
    const difficulty = request.nextUrl.searchParams.get('difficulty');
    const published = request.nextUrl.searchParams.get('published');
    const limit = request.nextUrl.searchParams.get('limit') || '100';

    let sql = `SELECT
                lp.*,
                COUNT(DISTINCT pc.id) as total_courses,
                COUNT(DISTINCT spp.id) as total_students,
                AVG(spp.progress_percentage) as avg_student_progress
              FROM learning_paths lp
              LEFT JOIN path_courses pc ON lp.id = pc.path_id
              LEFT JOIN student_path_progress spp ON lp.id = spp.path_id
              WHERE 1=1`;
    const params: unknown[] = [];

    if (category) {
      sql += ` AND lp.category = $${params.length + 1}`;
      params.push(category);
    }

    if (difficulty) {
      sql += ` AND lp.difficulty_level = $${params.length + 1}`;
      params.push(difficulty);
    }

    if (published !== null) {
      sql += ` AND lp.is_published = $${params.length + 1}`;
      params.push(published === 'true');
    }

    sql += ` GROUP BY lp.id
             ORDER BY lp.created_at DESC
             LIMIT ${parseInt(limit)}`;

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rowCount || 0,
    });
  } catch (error) {
    console.error('Error fetching learning paths:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch learning paths',
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
 * POST /api/learning-paths
 * Create a new learning path
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.createdBy) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          meta: {
            code: 'VALIDATION_ERROR',
            required: ['name', 'createdBy'],
          },
        },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO learning_paths (
        name, description, difficulty_level, estimated_hours,
        learning_objectives, category, created_by, is_published, thumbnail_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        body.name,
        body.description || null,
        body.difficultyLevel || 'intermediate',
        body.estimatedHours || null,
        body.learningObjectives ? JSON.stringify(body.learningObjectives) : null,
        body.category || null,
        body.createdBy,
        body.isPublished || false,
        body.thumbnailUrl || null,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Learning path created successfully',
        data: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating learning path:', error);
    return NextResponse.json(
      {
        error: 'Failed to create learning path',
        meta: {
          code: 'CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
