/**
 * Conversation Details and Management API
 * Endpoint: GET/PUT /api/messages/conversations/[conversationId]
 * Manage conversation settings and participants
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * GET /api/messages/conversations/[conversationId]
 * Get conversation details with participants and settings
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

    // Verify user is participant
    const participantCheck = await query(
      `SELECT * FROM conversation_participants
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, session.id]
    );

    if (participantCheck.rowCount === 0) {
      return NextResponse.json(
        { error: 'You are not a participant in this conversation', code: 'NOT_PARTICIPANT' },
        { status: 403 }
      );
    }

    // Get conversation details
    const convResult = await query(
      `SELECT * FROM conversations WHERE conversation_id = $1`,
      [conversationId]
    );

    if (convResult.rowCount === 0) {
      return NextResponse.json(
        { error: 'Conversation not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const conversation = convResult.rows[0];

    // Get all participants
    const participantsResult = await query(
      `SELECT cp.participant_id, cp.user_id, cp.role, cp.is_muted, cp.is_pinned,
              cp.last_read_at, cp.joined_at, p.user_name, p.email, p.avatar_url
       FROM conversation_participants cp
       JOIN profiles p ON cp.user_id = p.id
       WHERE cp.conversation_id = $1
       ORDER BY cp.joined_at ASC`,
      [conversationId]
    );

    // Get message count
    const messageCountResult = await query(
      `SELECT COUNT(*) as total_messages
       FROM messages WHERE conversation_id = $1 AND is_deleted = false`,
      [conversationId]
    );

    return NextResponse.json({
      success: true,
      data: {
        conversation: {
          ...conversation,
          total_messages: parseInt(messageCountResult.rows[0].total_messages),
        },
        participants: participantsResult.rows,
        participant_count: participantsResult.rowCount,
        current_user_role: participantCheck.rows[0].role,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching conversation:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch conversation',
        code: 'FETCH_ERROR',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/messages/conversations/[conversationId]
 * Update conversation settings
 *
 * Body:
 * - title: Update conversation title
 * - description: Update conversation description
 * - isMuted: Mute/unmute notifications for current user
 * - isPinned: Pin/unpin conversation for current user
 * - addParticipants: Array of user IDs to add
 * - removeParticipants: Array of user IDs to remove
 */
export async function PUT(
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
    const {
      title,
      description,
      isMuted,
      isPinned,
      addParticipants,
      removeParticipants,
    } = await request.json();

    // Verify user is participant with admin/owner role
    const participantCheck = await query(
      `SELECT role FROM conversation_participants
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, session.id]
    );

    if (participantCheck.rowCount === 0) {
      return NextResponse.json(
        { error: 'You are not a participant in this conversation', code: 'NOT_PARTICIPANT' },
        { status: 403 }
      );
    }

    const userRole = participantCheck.rows[0].role;

    // Update conversation details (only owner/admin can do this)
    if ((title || description) && !['owner', 'admin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Only conversation owner/admin can change title or description', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    if (title || description) {
      await query(
        `UPDATE conversations
         SET title = COALESCE($1, title), description = COALESCE($2, description), updated_at = NOW()
         WHERE conversation_id = $3`,
        [title || null, description || null, conversationId]
      );
    }

    // Update user's conversation settings
    if (isMuted !== undefined || isPinned !== undefined) {
      await query(
        `UPDATE conversation_participants
         SET is_muted = COALESCE($1, is_muted),
             is_pinned = COALESCE($2, is_pinned),
             updated_at = NOW()
         WHERE conversation_id = $3 AND user_id = $4`,
        [
          isMuted !== undefined ? isMuted : null,
          isPinned !== undefined ? isPinned : null,
          conversationId,
          session.id,
        ]
      );
    }

    // Add participants (owner/admin only)
    if (addParticipants && addParticipants.length > 0 && ['owner', 'admin'].includes(userRole)) {
      for (const userId of addParticipants) {
        await query(
          `INSERT INTO conversation_participants
           (conversation_id, user_id, role)
           VALUES ($1, $2, 'member')
           ON CONFLICT (conversation_id, user_id) DO NOTHING`,
          [conversationId, userId]
        );
      }
    }

    // Remove participants (owner/admin only)
    if (removeParticipants && removeParticipants.length > 0 && ['owner', 'admin'].includes(userRole)) {
      for (const userId of removeParticipants) {
        await query(
          `DELETE FROM conversation_participants
           WHERE conversation_id = $1 AND user_id = $2 AND role != 'owner'`,
          [conversationId, userId]
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Conversation updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating conversation:', error);

    return NextResponse.json(
      {
        error: 'Failed to update conversation',
        code: 'UPDATE_ERROR',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
