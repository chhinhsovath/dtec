/**
 * Get Messages API
 * Endpoint: GET /api/messages/[conversationId]
 * Retrieve messages from a specific conversation
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * GET /api/messages/[conversationId]
 * Get messages from a conversation with pagination
 *
 * Query parameters:
 * - limit: Number of messages (default: 50, max: 100)
 * - offset: Pagination offset (default: 0)
 * - markAsRead: Mark messages as read (default: true)
 */
export async function GET(
  request: Request,
  { params }: { params: { conversationId: string } }
) {
  const session = await getSession();

  if (!session || !session?.id) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
      { status: 401 }
    );
  }

  try {
    const conversationId = parseInt(params.conversationId);
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const markAsRead = searchParams.get('markAsRead') !== 'false';

    // Verify user is participant
    const participantCheck = await query(
      `SELECT participant_id, last_read_message_id FROM conversation_participants
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, session.id]
    );

    if (participantCheck.rowCount === 0) {
      return NextResponse.json(
        { error: 'You are not a participant in this conversation', code: 'NOT_PARTICIPANT' },
        { status: 403 }
      );
    }

    // Get messages
    const result = await query(
      `SELECT
        m.message_id,
        m.conversation_id,
        m.sender_id,
        p.user_name as sender_name,
        p.avatar_url as sender_avatar,
        m.message_text,
        m.message_type,
        m.is_edited,
        m.edited_at,
        m.is_deleted,
        m.deleted_at,
        m.deleted_by,
        m.created_at,
        m.updated_at,
        (SELECT COALESCE(JSON_AGG(JSON_BUILD_OBJECT(
          'attachment_id', attachment_id,
          'file_name', file_name,
          'file_size', file_size,
          'file_type', file_type,
          'file_url', file_url,
          'uploaded_at', uploaded_at
        )), '[]'::json) FROM message_attachments
         WHERE message_id = m.message_id) as attachments,
        (SELECT COUNT(*) FROM message_read_receipts
         WHERE message_id = m.message_id) as read_count
       FROM messages m
       LEFT JOIN profiles p ON m.sender_id = p.id
       WHERE m.conversation_id = $1 AND m.is_deleted = false
       ORDER BY m.created_at DESC
       LIMIT $2 OFFSET $3`,
      [conversationId, limit, offset]
    );

    // Mark messages as read if requested
    if (markAsRead && result.rowCount > 0) {
      const latestMessageId = result.rows[0].message_id;

      // Update participant's last_read info
      await query(
        `UPDATE conversation_participants
         SET last_read_message_id = $1, last_read_at = NOW()
         WHERE conversation_id = $2 AND user_id = $3`,
        [latestMessageId, conversationId, session.id]
      );

      // Add read receipt for latest message
      await query(
        `INSERT INTO message_read_receipts
         (message_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT (message_id, user_id) DO NOTHING`,
        [latestMessageId, session.id]
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows.reverse(), // Return oldest first
      count: result.rowCount,
      limit,
      offset,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching messages:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch messages',
        code: 'FETCH_ERROR',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
