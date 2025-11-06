import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/course-modules
 * Fetch course modules with filtering by course
 */
export async function GET(request: NextRequest) {
  try {
    const courseId = request.nextUrl.searchParams.get('courseId');
    const limit = request.nextUrl.searchParams.get('limit') || '100';

    let sql = `SELECT * FROM course_modules WHERE 1=1`;
    const params: unknown[] = [];

    if (courseId) {
      sql += ` AND course_id = $${params.length + 1}`;
      params.push(courseId);
    }

    sql += ` ORDER BY order_position ASC LIMIT ${parseInt(limit)}`;

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rowCount || 0,
    });
  } catch (error) {
    console.error('Error fetching course modules:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch course modules',
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
 * POST /api/course-modules
 * Create a new course module
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.courseId || !body.title) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          meta: {
            code: 'VALIDATION_ERROR',
            required: ['courseId', 'title'],
          },
        },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO course_modules (
        course_id, title, description, order_position,
        duration_days, learning_objectives
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        body.courseId,
        body.title,
        body.description || null,
        body.orderPosition || 0,
        body.durationDays || null,
        body.learningObjectives ? JSON.stringify(body.learningObjectives) : null,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Module created successfully',
        data: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating course module:', error);
    return NextResponse.json(
      {
        error: 'Failed to create course module',
        meta: {
          code: 'CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
