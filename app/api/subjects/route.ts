import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/subjects
 * Fetch all subjects
 */
export async function GET(request: NextRequest) {
  try {
    const limit = request.nextUrl.searchParams.get('limit') || '100';
    const search = request.nextUrl.searchParams.get('search');

    let sql = `SELECT * FROM subjects WHERE 1=1`;
    const params: unknown[] = [];

    if (search) {
      sql += ` AND (name ILIKE $${params.length + 1} OR code ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
      params.push(`%${search}%`);
    }

    const limitNum = parseInt(limit);
    sql += ` ORDER BY name ASC LIMIT ${limitNum}`;

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rowCount || 0,
    });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch subjects',
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
 * POST /api/subjects
 * Create a new subject
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.code) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          meta: {
            code: 'VALIDATION_ERROR',
            required: ['name', 'code'],
          },
        },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO subjects (name, code, description, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [body.name, body.code, body.description || null, body.createdBy || null]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Subject created successfully',
        data: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating subject:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check for unique constraint violation
    if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
      return NextResponse.json(
        {
          error: 'Subject name or code already exists',
          meta: { code: 'DUPLICATE_ERROR' },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to create subject',
        meta: {
          code: 'CREATE_ERROR',
          message: errorMessage,
        },
      },
      { status: 500 }
    );
  }
}
