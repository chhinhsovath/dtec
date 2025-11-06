'use server';

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/admin/forum/posts
 * List forum posts for moderation with filtering
 *
 * Query params:
 * - courseId: UUID (optional) - filter by course
 * - moderatorId: UUID (required) - moderator making request (must be teacher/admin)
 * - limit: number (default: 20)
 * - offset: number (default: 0)
 * - status: 'pinned' | 'locked' | 'all' (default: 'all')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const moderatorId = searchParams.get('moderatorId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const statusFilter = searchParams.get('status') || 'all';

    // Validate moderator
    if (!moderatorId) {
      return NextResponse.json(
        { error: 'Missing moderatorId', code: 'MISSING_MODERATOR_ID' },
        { status: 400 }
      );
    }

    const modCheck = await query(
      `SELECT id, role FROM profiles WHERE id = $1 AND role IN ('teacher', 'admin')`,
      [moderatorId]
    );

    if (modCheck.rowCount === 0) {
      return NextResponse.json(
        { error: 'Only teachers and admins can access moderation', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    // Build query with filters
    let whereClause = '1=1';
    const queryParams: any[] = [];

    if (courseId) {
      whereClause += ` AND c.id = $${queryParams.length + 1}`;
      queryParams.push(courseId);
    }

    if (statusFilter === 'pinned') {
      whereClause += ` AND fp.is_pinned = true`;
    } else if (statusFilter === 'locked') {
      whereClause += ` AND fp.is_locked = true`;
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM forum_posts fp
      LEFT JOIN forum_categories fc ON fp.category_id = fc.id
      LEFT JOIN courses c ON fc.course_id = c.id
      LEFT JOIN profiles p ON fp.user_id = p.id
      WHERE ${whereClause}
    `;

    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated posts
    queryParams.push(limit);
    queryParams.push(offset);

    const postsQuery = `
      SELECT
        fp.id,
        fp.title,
        fp.content,
        fp.is_pinned,
        fp.is_locked,
        fp.view_count,
        fp.reply_count,
        fp.upvotes,
        fp.created_at,
        fp.updated_at,
        p.first_name,
        p.last_name,
        p.email,
        c.name as course_name,
        fc.name as category_name
      FROM forum_posts fp
      LEFT JOIN forum_categories fc ON fp.category_id = fc.id
      LEFT JOIN courses c ON fc.course_id = c.id
      LEFT JOIN profiles p ON fp.user_id = p.id
      WHERE ${whereClause}
      ORDER BY fp.is_pinned DESC, fp.created_at DESC
      LIMIT $${queryParams.length - 1}
      OFFSET $${queryParams.length}
    `;

    const result = await query(postsQuery, queryParams);

    return NextResponse.json(
      {
        success: true,
        data: result.rows,
        pagination: {
          total,
          limit,
          offset,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forum moderation query error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch posts',
        code: 'QUERY_ERROR',
      },
      { status: 500 }
    );
  }
}
