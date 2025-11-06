import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/teacher/h5p-content/[contentId]
 * Get specific H5P content
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { contentId: string } }
) {
  try {
    const teacherId = request.headers.get('x-teacher-id');
    const { contentId } = params;

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID required', code: 'MISSING_TEACHER_ID' },
        { status: 400 }
      );
    }

    const result = await query(
      `
      SELECT *
      FROM h5p_content
      WHERE id = $1 AND teacher_id = $2
      `,
      [contentId, teacherId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'H5P content not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
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
 * PUT /api/teacher/h5p-content/[contentId]
 * Update H5P content
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { contentId: string } }
) {
  try {
    const teacherId = request.headers.get('x-teacher-id');
    const { contentId } = params;
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

    // Verify teacher owns this content
    const ownershipCheck = await query(
      `SELECT id FROM h5p_content WHERE id = $1 AND teacher_id = $2`,
      [contentId, teacherId]
    );

    if (ownershipCheck.rowCount === 0) {
      return NextResponse.json(
        { error: 'H5P content not found or access denied', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Validate h5pJson if provided
    let parsedJson;
    if (h5pJson) {
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
    }

    // Update H5P content
    const result = await query(
      `
      UPDATE h5p_content
      SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        h5p_type = COALESCE($3, h5p_type),
        h5p_json = COALESCE($4, h5p_json),
        course_id = COALESCE($5, course_id),
        is_published = COALESCE($6, is_published),
        is_reusable = COALESCE($7, is_reusable),
        h5p_library_version = COALESCE($8, h5p_library_version),
        h5p_thumbnail_url = COALESCE($9, h5p_thumbnail_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *
      `,
      [
        title || null,
        description || null,
        h5pType || null,
        parsedJson ? JSON.stringify(parsedJson) : null,
        courseId || null,
        isPublished !== undefined ? isPublished : null,
        isReusable !== undefined ? isReusable : null,
        h5pLibraryVersion || null,
        h5pThumbnailUrl || null,
        contentId
      ]
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error updating H5P content:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to update H5P content',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teacher/h5p-content/[contentId]
 * Delete H5P content
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { contentId: string } }
) {
  try {
    const teacherId = request.headers.get('x-teacher-id');
    const { contentId } = params;

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID required', code: 'MISSING_TEACHER_ID' },
        { status: 400 }
      );
    }

    // Verify teacher owns this content
    const ownershipCheck = await query(
      `SELECT id FROM h5p_content WHERE id = $1 AND teacher_id = $2`,
      [contentId, teacherId]
    );

    if (ownershipCheck.rowCount === 0) {
      return NextResponse.json(
        { error: 'H5P content not found or access denied', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete H5P content (cascading will delete related links and responses)
    const result = await query(
      `DELETE FROM h5p_content WHERE id = $1 RETURNING id`,
      [contentId]
    );

    return NextResponse.json({
      success: true,
      message: 'H5P content deleted successfully',
      data: { deletedId: result.rows[0].id }
    });
  } catch (error: any) {
    console.error('Error deleting H5P content:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to delete H5P content',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}
