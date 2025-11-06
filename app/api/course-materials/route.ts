import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/course-materials
 * Fetch course materials with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const courseId = request.nextUrl.searchParams.get('courseId');
    const materialType = request.nextUrl.searchParams.get('materialType');
    const published = request.nextUrl.searchParams.get('published') === 'true';
    const limit = request.nextUrl.searchParams.get('limit') || '100';

    let sql = `SELECT
      m.*,
      c.name as course_name,
      p.first_name, p.last_name
     FROM course_materials m
     LEFT JOIN courses c ON m.course_id = c.id
     LEFT JOIN profiles p ON m.uploaded_by = p.id
     WHERE 1=1`;

    const params: unknown[] = [];

    if (courseId) {
      sql += ' AND m.course_id = $' + (params.length + 1);
      params.push(courseId);
    }

    if (materialType) {
      sql += ' AND m.material_type = $' + (params.length + 1);
      params.push(materialType);
    }

    if (published) {
      sql += ' AND m.is_published = true';
    }

    const limitNum = parseInt(limit);
    sql += ' ORDER BY m.order_position ASC, m.created_at DESC LIMIT ' + limitNum;

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rowCount || 0,
    });
  } catch (error) {
    console.error('Error fetching course materials:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch course materials',
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
 * POST /api/course-materials
 * Create a new course material
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.courseId || !body.title || !body.fileUrl || !body.materialType) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          meta: {
            code: 'VALIDATION_ERROR',
            required: ['courseId', 'title', 'fileUrl', 'materialType'],
          },
        },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO course_materials
       (course_id, uploaded_by, title, description, material_type, file_url, file_size_mb, file_type, order_position, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        body.courseId,
        body.uploadedBy,
        body.title,
        body.description || null,
        body.materialType,
        body.fileUrl,
        body.fileSizeMb || null,
        body.fileType || null,
        body.orderPosition || 0,
        body.isPublished !== false,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Course material created successfully',
        data: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating course material:', error);
    return NextResponse.json(
      {
        error: 'Failed to create course material',
        meta: {
          code: 'CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
