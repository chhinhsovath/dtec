'use server';

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * PUT /api/admin/forum/posts/[id]
 * Teacher moderation endpoint for forum posts
 * Allows: pin/unpin, lock/unlock, delete posts
 *
 * Required body:
 * - moderatorId: UUID of teacher/admin
 * - action: 'pin' | 'unpin' | 'lock' | 'unlock' | 'delete'
 * - reason: reason for action (optional)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { moderatorId, action, reason } = body;

    // Validate inputs
    if (!moderatorId) {
      return NextResponse.json(
        { error: 'Missing moderatorId', code: 'MISSING_MODERATOR_ID' },
        { status: 400 }
      );
    }

    if (!action || !['pin', 'unpin', 'lock', 'unlock', 'delete'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: pin, unpin, lock, unlock, or delete', code: 'INVALID_ACTION' },
        { status: 400 }
      );
    }

    // Check if moderator is teacher or admin
    const modCheck = await query(
      `SELECT id, role FROM profiles WHERE id = $1 AND role IN ('teacher', 'admin')`,
      [moderatorId]
    );

    if (modCheck.rowCount === 0) {
      return NextResponse.json(
        { error: 'Only teachers and admins can moderate forums', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    // Check if post exists
    const postCheck = await query(`SELECT id FROM forum_posts WHERE id = $1`, [id]);
    if (postCheck.rowCount === 0) {
      return NextResponse.json(
        { error: 'Post not found', code: 'POST_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Handle different actions
    let result;
    switch (action) {
      case 'pin':
        result = await query(
          `UPDATE forum_posts SET is_pinned = true WHERE id = $1 RETURNING *`,
          [id]
        );
        break;
      case 'unpin':
        result = await query(
          `UPDATE forum_posts SET is_pinned = false WHERE id = $1 RETURNING *`,
          [id]
        );
        break;
      case 'lock':
        result = await query(
          `UPDATE forum_posts SET is_locked = true WHERE id = $1 RETURNING *`,
          [id]
        );
        break;
      case 'unlock':
        result = await query(
          `UPDATE forum_posts SET is_locked = false WHERE id = $1 RETURNING *`,
          [id]
        );
        break;
      case 'delete':
        // Delete post (will cascade to replies due to ON DELETE CASCADE)
        result = await query(
          `DELETE FROM forum_posts WHERE id = $1 RETURNING *`,
          [id]
        );
        break;
      default:
        return NextResponse.json(
          { error: 'Unknown action', code: 'UNKNOWN_ACTION' },
          { status: 400 }
        );
    }

    // Log the moderation action
    await query(
      `INSERT INTO forum_moderation_logs (moderator_id, action, content_type, content_id, reason)
       VALUES ($1, $2, 'post', $3, $4)`,
      [moderatorId, action, id, reason || null]
    );

    return NextResponse.json(
      {
        success: true,
        message: `Post ${action}ned successfully`,
        data: result.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forum moderation error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to moderate post',
        code: 'MODERATION_ERROR',
      },
      { status: 500 }
    );
  }
}
