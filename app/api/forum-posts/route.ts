import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/forum-posts
 * Fetch forum posts with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const categoryId = request.nextUrl.searchParams.get('categoryId');
    const courseId = request.nextUrl.searchParams.get('courseId');
    const userId = request.nextUrl.searchParams.get('userId');
    const limit = request.nextUrl.searchParams.get('limit') || '20';
    const offset = request.nextUrl.searchParams.get('offset') || '0';

    let sql = `SELECT
                fp.*,
                p.first_name,
                p.last_name,
                p.email,
                COUNT(DISTINCT fr.id) as reply_count,
                COUNT(DISTINCT fpv.id) as upvote_count,
                fc.name as category_name
              FROM forum_posts fp
              LEFT JOIN profiles p ON fp.user_id = p.id
              LEFT JOIN forum_replies fr ON fp.id = fr.post_id
              LEFT JOIN forum_post_votes fpv ON fp.id = fpv.post_id AND fpv.vote_type = 'upvote'
              LEFT JOIN forum_categories fc ON fp.category_id = fc.id
              WHERE 1=1`;
    const params: unknown[] = [];

    if (categoryId) {
      sql += ` AND fp.category_id = $${params.length + 1}`;
      params.push(categoryId);
    }

    if (userId) {
      sql += ` AND fp.user_id = $${params.length + 1}`;
      params.push(userId);
    }

    sql += ` GROUP BY fp.id, p.id, fc.id
             ORDER BY fp.is_pinned DESC, fp.created_at DESC
             LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rowCount || 0,
    });
  } catch (error) {
    console.error('Error fetching forum posts:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch forum posts',
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
 * POST /api/forum-posts
 * Create a new forum post
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.categoryId || !body.userId || !body.title || !body.content) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          meta: {
            code: 'VALIDATION_ERROR',
            required: ['categoryId', 'userId', 'title', 'content'],
          },
        },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO forum_posts (
        category_id, user_id, title, content, is_pinned, is_locked, view_count, reply_count, upvotes
      ) VALUES ($1, $2, $3, $4, $5, $6, 0, 0, 0)
      RETURNING *`,
      [
        body.categoryId,
        body.userId,
        body.title,
        body.content,
        body.isPinned || false,
        body.isLocked || false,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Forum post created successfully',
        data: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating forum post:', error);
    return NextResponse.json(
      {
        error: 'Failed to create forum post',
        meta: {
          code: 'CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
