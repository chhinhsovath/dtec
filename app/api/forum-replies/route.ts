import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/forum-replies
 * Fetch replies for a specific post
 */
export async function GET(request: NextRequest) {
  try {
    const postId = request.nextUrl.searchParams.get('postId');

    if (!postId) {
      return NextResponse.json(
        {
          error: 'postId parameter is required',
          meta: { code: 'MISSING_PARAM' },
        },
        { status: 400 }
      );
    }

    const result = await query(
      `SELECT
        fr.*,
        p.first_name,
        p.last_name,
        p.email
      FROM forum_replies fr
      LEFT JOIN profiles p ON fr.user_id = p.id
      WHERE fr.post_id = $1
      ORDER BY fr.is_marked_solution DESC, fr.upvotes DESC, fr.created_at ASC`,
      [postId]
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rowCount || 0,
    });
  } catch (error) {
    console.error('Error fetching forum replies:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch forum replies',
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
 * POST /api/forum-replies
 * Create a new forum reply
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.postId || !body.userId || !body.content) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          meta: {
            code: 'VALIDATION_ERROR',
            required: ['postId', 'userId', 'content'],
          },
        },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO forum_replies (post_id, user_id, content, upvotes, is_marked_solution)
       VALUES ($1, $2, $3, 0, false)
       RETURNING *`,
      [body.postId, body.userId, body.content]
    );

    // Update post reply count
    await query(
      `UPDATE forum_posts SET reply_count = reply_count + 1 WHERE id = $1`,
      [body.postId]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Reply created successfully',
        data: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating forum reply:', error);
    return NextResponse.json(
      {
        error: 'Failed to create forum reply',
        meta: {
          code: 'CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
