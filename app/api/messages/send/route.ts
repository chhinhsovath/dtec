/**
 * Send Message API
 * Endpoint: POST /api/messages/send
 * Send a new message to a conversation
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * POST /api/messages/send
 * Send a new message to a conversation
 *
 * Body:
 * - conversationId: ID of conversation
 * - messageText: Text content of message
 * - messageType: 'text' | 'image' | 'file' | 'system' (default: 'text')
 * - attachments: Array of file objects (optional)
 *   - fileName: Name of file
 *   - fileSize: Size in bytes
 *   - fileType: MIME type
 *   - fileUrl: URL of file
 */
export async function POST(request: Request) {
  const session = await getSession();

  if (!session || !session?.id) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
      { status: 401 }
    );
  }

  try {
    const {
      conversationId,
      messageText,
      messageType = 'text',
      attachments = [],
    } = await request.json();

    // Validate required fields
    if (!conversationId || !messageText) {
      return NextResponse.json(
        { error: 'conversationId and messageText are required', code: 'MISSING_PARAM' },
        { status: 400 }
      );
    }

    // Validate message type
    const validTypes = ['text', 'image', 'file', 'system'];
    if (!validTypes.includes(messageType)) {
      return NextResponse.json(
        {
          error: `Invalid message type. Must be one of: ${validTypes.join(', ')}`,
          code: 'INVALID_TYPE',
        },
        { status: 400 }
      );
    }

    // Verify user is participant in conversation
    const participantCheck = await query(
      `SELECT participant_id FROM conversation_participants
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, session.id]
    );

    if (participantCheck.rowCount === 0) {
      return NextResponse.json(
        { error: 'You are not a participant in this conversation', code: 'NOT_PARTICIPANT' },
        { status: 403 }
      );
    }

    // Check if conversation is active
    const convCheck = await query(
      `SELECT is_active FROM conversations WHERE conversation_id = $1`,
      [conversationId]
    );

    if (convCheck.rowCount === 0 || !convCheck.rows[0].is_active) {
      return NextResponse.json(
        { error: 'Conversation is not active', code: 'CONVERSATION_INACTIVE' },
        { status: 400 }
      );
    }

    // Create message
    const messageResult = await query(
      `INSERT INTO messages
       (conversation_id, sender_id, message_text, message_type)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [conversationId, session.id, messageText, messageType]
    );

    const message = messageResult.rows[0];

    // Add attachments if provided
    if (attachments.length > 0) {
      for (const attachment of attachments) {
        await query(
          `INSERT INTO message_attachments
           (message_id, file_name, file_size, file_type, file_url)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            message.message_id,
            attachment.fileName,
            attachment.fileSize,
            attachment.fileType,
            attachment.fileUrl,
          ]
        );
      }
    }

    // Update conversation updated_at timestamp
    await query(
      `UPDATE conversations SET updated_at = NOW() WHERE conversation_id = $1`,
      [conversationId]
    );

    // Get sender info for response
    const senderInfo = await query(
      `SELECT id, user_name, email, avatar_url FROM profiles WHERE id = $1`,
      [session.id]
    );

    const sender = senderInfo.rows[0];

    // Get attachments for response
    const attachmentsResult = await query(
      `SELECT attachment_id, file_name, file_size, file_type, file_url
       FROM message_attachments WHERE message_id = $1`,
      [message.message_id]
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          message_id: message.message_id,
          conversation_id: message.conversation_id,
          sender_id: message.sender_id,
          sender: {
            id: sender.id,
            name: sender.user_name,
            email: sender.email,
            avatar: sender.avatar_url,
          },
          message_text: message.message_text,
          message_type: message.message_type,
          attachments: attachmentsResult.rows,
          is_edited: false,
          is_deleted: false,
          created_at: message.created_at,
          updated_at: message.updated_at,
        },
        message: 'Message sent successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error sending message:', error);

    return NextResponse.json(
      {
        error: 'Failed to send message',
        code: 'SEND_ERROR',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
