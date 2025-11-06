import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/forum-posts/[id]
 * Fetch specific post with replies
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;

    // Increment view count
    await query(
      `UPDATE forum_posts SET view_count = view_count + 1 WHERE id = $1`,
      [postId]
    );

    const postResult = await query(
      `SELECT
        fp.*,
        p.first_name,
        p.last_name,
        p.email
      FROM forum_posts fp
      LEFT JOIN profiles p ON fp.user_id = p.id
      WHERE fp.id = $1`,
      [postId]
    );

    if (postResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Post not found', meta: { code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    const repliesResult = await query(
      `SELECT
        fr.*,
        p.first_name,
        p.last_name,
        p.email,
        COUNT(DISTINCT frv.id) as upvote_count
      FROM forum_replies fr
      LEFT JOIN profiles p ON fr.user_id = p.id
      LEFT JOIN forum_reply_votes frv ON fr.id = frv.reply_id AND frv.vote_type = 'upvote'
      WHERE fr.post_id = $1
      GROUP BY fr.id, p.id
      ORDER BY fr.is_marked_solution DESC, fr.upvotes DESC, fr.created_at ASC`,
      [postId]
    );

    return NextResponse.json({
      success: true,
      data: {
        ...postResult.rows[0],
        replies: repliesResult.rows,
      },
    });
  } catch (error) {
    console.error('Error fetching forum post:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch forum post',
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
 * PUT /api/forum-posts/[id]
 * Update post (admin/author only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;
    const body = await request.json();

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (body.title !== undefined) {
      updates.push(`title = $${paramCount}`);
      values.push(body.title);
      paramCount++;
    }

    if (body.content !== undefined) {
      updates.push(`content = $${paramCount}`);
      values.push(body.content);
      paramCount++;
    }

    if (body.isPinned !== undefined) {
      updates.push(`is_pinned = $${paramCount}`);
      values.push(body.isPinned);
      paramCount++;
    }

    if (body.isLocked !== undefined) {
      updates.push(`is_locked = $${paramCount}`);
      values.push(body.isLocked);
      paramCount++;
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update', meta: { code: 'NO_UPDATES' } },
        { status: 400 }
      );
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(postId);

    const result = await query(
      `UPDATE forum_posts SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Post not found', meta: { code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Post updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating forum post:', error);
    return NextResponse.json(
      {
        error: 'Failed to update forum post',
        meta: {
          code: 'UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/forum-posts/[id]
 * Delete post (admin/author only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;

    const result = await query(
      'DELETE FROM forum_posts WHERE id = $1 RETURNING *',
      [postId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Post not found', meta: { code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting forum post:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete forum post',
        meta: {
          code: 'DELETE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
