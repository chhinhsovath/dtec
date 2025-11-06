import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/courses
 * Fetch courses with optional filtering
 *
 * Query Parameters:
 * - institutionId: Filter by institution
 * - search: Search courses by name or code
 * - limit: Number of results to return (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const institutionId = request.nextUrl.searchParams.get('institutionId');
    const search = request.nextUrl.searchParams.get('search');
    const limit = request.nextUrl.searchParams.get('limit') || '50';

    let sql = 'SELECT * FROM courses WHERE 1=1';
    const params: unknown[] = [];

    if (institutionId) {
      sql += ` AND institution_id = $${params.length + 1}`;
      params.push(institutionId);
    }

    if (search) {
      sql += ` AND (name ILIKE $${params.length + 1} OR code ILIKE $${params.length + 2})`;
      params.push(`%${search}%`);
      params.push(`%${search}%`);
    }

    sql += ` ORDER BY created_at DESC LIMIT ${parseInt(limit)}`;

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rowCount || 0,
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch courses',
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
 * POST /api/courses
 * Create a new course
 *
 * Request Body:
 * {
 *   institutionId: string (UUID)
 *   code: string
 *   name: string
 *   description?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.institutionId || !body.code || !body.name) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          meta: {
            code: 'VALIDATION_ERROR',
            required: ['institutionId', 'code', 'name'],
          },
        },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO courses (institution_id, code, name, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [body.institutionId, body.code, body.name, body.description || null]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Course created successfully',
        data: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      {
        error: 'Failed to create course',
        meta: {
          code: 'CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
