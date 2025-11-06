/**
 * Edit Message API
 * Endpoint: PUT /api/messages/edit
 * Edit an existing message
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * PUT /api/messages/edit
 * Edit a message (only original sender can edit)
 *
 * Body:
 * - messageId: ID of message to edit
 * - messageText: New message text
 */
export async function PUT(request: Request) {
  const session = await getSession();

  if (!session || !session?.id) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
      { status: 401 }
    );
  }

  try {
    const { messageId, messageText } = await request.json();

    // Validate required fields
    if (!messageId || !messageText) {
      return NextResponse.json(
        { error: 'messageId and messageText are required', code: 'MISSING_PARAM' },
        { status: 400 }
      );
    }

    // Get message and verify ownership
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

    // Verify sender
    if (message.sender_id !== session.id) {
      return NextResponse.json(
        { error: 'You can only edit your own messages', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    // Cannot edit deleted messages
    if (message.is_deleted) {
      return NextResponse.json(
        { error: 'Cannot edit a deleted message', code: 'MESSAGE_DELETED' },
        { status: 400 }
      );
    }

    // Update message
    const updateResult = await query(
      `UPDATE messages
       SET message_text = $1, is_edited = true, edited_at = NOW(), updated_at = NOW()
       WHERE message_id = $2
       RETURNING *`,
      [messageText, messageId]
    );

    const updatedMessage = updateResult.rows[0];

    return NextResponse.json({
      success: true,
      data: {
        message_id: updatedMessage.message_id,
        message_text: updatedMessage.message_text,
        is_edited: updatedMessage.is_edited,
        edited_at: updatedMessage.edited_at,
        updated_at: updatedMessage.updated_at,
      },
      message: 'Message edited successfully',
    });
  } catch (error: any) {
    console.error('Error editing message:', error);

    return NextResponse.json(
      {
        error: 'Failed to edit message',
        code: 'EDIT_ERROR',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
