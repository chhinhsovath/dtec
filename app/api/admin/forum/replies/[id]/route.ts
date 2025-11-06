'use server';

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * PUT /api/admin/forum/replies/[id]
 * Teacher moderation endpoint for forum replies
 * Allows: mark_solution, delete replies
 *
 * Required body:
 * - moderatorId: UUID of teacher/admin
 * - action: 'mark_solution' | 'unmark_solution' | 'delete'
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

    if (!action || !['mark_solution', 'unmark_solution', 'delete'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: mark_solution, unmark_solution, or delete', code: 'INVALID_ACTION' },
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

    // Check if reply exists
    const replyCheck = await query(
      `SELECT id, post_id FROM forum_replies WHERE id = $1`,
      [id]
    );

    if (replyCheck.rowCount === 0) {
      return NextResponse.json(
        { error: 'Reply not found', code: 'REPLY_NOT_FOUND' },
        { status: 404 }
      );
    }

    const postId = replyCheck.rows[0].post_id;

    // Handle different actions
    let result;
    switch (action) {
      case 'mark_solution':
        // Mark this reply as solution
        result = await query(
          `UPDATE forum_replies SET is_marked_solution = true WHERE id = $1 RETURNING *`,
          [id]
        );
        break;
      case 'unmark_solution':
        // Unmark this reply as solution
        result = await query(
          `UPDATE forum_replies SET is_marked_solution = false WHERE id = $1 RETURNING *`,
          [id]
        );
        break;
      case 'delete':
        // Delete reply
        result = await query(
          `DELETE FROM forum_replies WHERE id = $1 RETURNING *`,
          [id]
        );
        // Decrement reply count on post
        await query(
          `UPDATE forum_posts SET reply_count = GREATEST(0, reply_count - 1) WHERE id = $1`,
          [postId]
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
       VALUES ($1, $2, 'reply', $3, $4)`,
      [moderatorId, action, id, reason || null]
    );

    return NextResponse.json(
      {
        success: true,
        message: `Reply action '${action}' completed successfully`,
        data: result.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forum moderation error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to moderate reply',
        code: 'MODERATION_ERROR',
      },
      { status: 500 }
    );
  }
}
