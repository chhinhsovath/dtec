/**
 * Delete Message API
 * Endpoint: DELETE /api/messages/delete
 * Soft-delete a message (for audit trail)
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * DELETE /api/messages/delete
 * Soft-delete a message (only original sender or admins can delete)
 *
 * Body:
 * - messageId: ID of message to delete
 */
export async function DELETE(request: Request) {
  const session = await getSession();

  if (!session || !session?.id) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
      { status: 401 }
    );
  }

  try {
    const { messageId } = await request.json();

    // Validate required fields
    if (!messageId) {
      return NextResponse.json(
        { error: 'messageId is required', code: 'MISSING_PARAM' },
        { status: 400 }
      );
    }

    // Get message
    const messageCheck = await query(
      `SELECT message_id, sender_id, conversation_id, is_deleted
       FROM messages WHERE message_id = $1`,
      [messageId]
    );

    if (messageCheck.rowCount === 0) {
      return NextResponse.json(
        { error: 'Message not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const message = messageCheck.rows[0];

    // Check permissions: sender or admin/teacher
    const canDelete =
      message.sender_id === session.id ||
      ['admin', 'teacher'].includes(session.role || '');

    if (!canDelete) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this message', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    // Soft delete message
    const deleteResult = await query(
      `UPDATE messages
       SET is_deleted = true, deleted_at = NOW(), deleted_by = $1, updated_at = NOW()
       WHERE message_id = $2
       RETURNING message_id, is_deleted, deleted_at`,
      [session.id, messageId]
    );

    return NextResponse.json({
      success: true,
      data: deleteResult.rows[0],
      message: 'Message deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting message:', error);

    return NextResponse.json(
      {
        error: 'Failed to delete message',
        code: 'DELETE_ERROR',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
