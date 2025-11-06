import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/teacher/h5p-content
 * List all H5P content created by teacher
 */
export async function GET(request: NextRequest) {
  try {
    const teacherId = request.headers.get('x-teacher-id');

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID required', code: 'MISSING_TEACHER_ID' },
        { status: 400 }
      );
    }

    // Get all H5P content created by this teacher
    const result = await query(
      `
      SELECT
        id,
        teacher_id,
        course_id,
        title,
        description,
        h5p_type,
        h5p_library_version,
        h5p_thumbnail_url,
        is_published,
        is_reusable,
        usage_count,
        view_count,
        created_at,
        updated_at
      FROM h5p_content
      WHERE teacher_id = $1
      ORDER BY created_at DESC
      `,
      [teacherId]
    );

    return NextResponse.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching H5P content:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch H5P content',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teacher/h5p-content
 * Create new H5P content
 */
export async function POST(request: NextRequest) {
  try {
    const teacherId = request.headers.get('x-teacher-id');
    const body = await request.json();

    const {
      title,
      description,
      h5pType,
      h5pJson,
      courseId,
      isPublished,
      isReusable,
      h5pLibraryVersion,
      h5pThumbnailUrl
    } = body;

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID required', code: 'MISSING_TEACHER_ID' },
        { status: 400 }
      );
    }

    if (!title || !h5pType || !h5pJson) {
      return NextResponse.json(
        { error: 'Title, h5p type, and h5p JSON are required', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    // Validate h5pJson is valid JSON
    let parsedJson;
    try {
      if (typeof h5pJson === 'string') {
        parsedJson = JSON.parse(h5pJson);
      } else {
        parsedJson = h5pJson;
      }
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid H5P JSON format', code: 'INVALID_JSON' },
        { status: 400 }
      );
    }

    // Insert new H5P content
    const result = await query(
      `
      INSERT INTO h5p_content
      (teacher_id, course_id, title, description, h5p_type, h5p_json,
       h5p_library_version, h5p_thumbnail_url, is_published, is_reusable, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
      `,
      [
        teacherId,
        courseId || null,
        title,
        description || null,
        h5pType,
        JSON.stringify(parsedJson),
        h5pLibraryVersion || null,
        h5pThumbnailUrl || null,
        isPublished !== undefined ? isPublished : true,
        isReusable !== undefined ? isReusable : true
      ]
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error creating H5P content:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to create H5P content',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}
