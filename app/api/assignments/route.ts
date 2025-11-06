import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/assignments
 * Fetch assignments with optional filtering
 *
 * Query Parameters:
 * - courseId: Filter by course
 * - teacherId: Filter by teacher
 * - status: Filter by status (active, closed, archived)
 */
export async function GET(request: NextRequest) {
  try {
    const courseId = request.nextUrl.searchParams.get('courseId');
    const teacherId = request.nextUrl.searchParams.get('teacherId');
    const status = request.nextUrl.searchParams.get('status');

    let sql = 'SELECT * FROM assignments WHERE 1=1';
    const params: unknown[] = [];

    if (courseId) {
      sql += ` AND course_id = $${params.length + 1}`;
      params.push(courseId);
    }

    if (teacherId) {
      sql += ` AND teacher_id = $${params.length + 1}`;
      params.push(teacherId);
    }

    if (status) {
      sql += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    sql += ' ORDER BY due_date ASC';

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rowCount || 0,
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch assignments',
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
 * POST /api/assignments
 * Create a new assignment
 *
 * Request Body:
 * {
 *   courseId: string (UUID)
 *   teacherId: string (UUID)
 *   title: string
 *   description?: string
 *   dueDate: string (ISO 8601 timestamp)
 *   maxScore?: number (default: 100)
 *   status?: string (default: 'active')
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.courseId || !body.teacherId || !body.title || !body.dueDate) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          meta: {
            code: 'VALIDATION_ERROR',
            required: ['courseId', 'teacherId', 'title', 'dueDate'],
          },
        },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO assignments (course_id, teacher_id, title, description, due_date, max_score, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        body.courseId,
        body.teacherId,
        body.title,
        body.description || null,
        body.dueDate,
        body.maxScore || 100,
        body.status || 'active',
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Assignment created successfully',
        data: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating assignment:', error);
    return NextResponse.json(
      {
        error: 'Failed to create assignment',
        meta: {
          code: 'CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
