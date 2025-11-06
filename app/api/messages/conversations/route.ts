/**
 * Conversations Management API
 * Endpoint: GET/POST /api/messages/conversations
 * Manage user conversations and create new chats
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * GET /api/messages/conversations
 * Get all conversations for the current user with unread counts
 *
 * Query parameters:
 * - type: Filter by conversation type (direct, course, group, announcement)
 * - courseId: Filter by course (optional)
 * - archived: Include archived conversations (default: false)
 * - limit: Number of results (default: 50, max: 100)
 * - offset: Pagination offset (default: 0)
 */
export async function GET(request: Request) {
  const session = await getSession();

  if (!session || !session?.id) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const courseId = searchParams.get('courseId');
  const archived = searchParams.get('archived') === 'true';
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    // Build filters
    let whereClause = `cp.user_id = $1`;
    const params: any[] = [session.id];

    if (type) {
      whereClause += ` AND c.conversation_type = $${params.length + 1}`;
      params.push(type);
    }

    if (courseId) {
      whereClause += ` AND c.course_id = $${params.length + 1}`;
      params.push(parseInt(courseId));
    }

    if (!archived) {
      whereClause += ` AND c.archived_at IS NULL`;
    }

    // Get conversations with unread count and last message
    const result = await query(
      `SELECT
        c.conversation_id,
        c.conversation_type,
        c.course_id,
        c.title,
        c.description,
        c.is_active,
        c.created_at,
        c.updated_at,
        cp.role,
        cp.is_muted,
        cp.is_pinned,
        cp.last_read_at,
        (SELECT COUNT(*) FROM messages m
         WHERE m.conversation_id = c.conversation_id
         AND m.created_at > COALESCE(cp.last_read_at, cp.joined_at)
         AND m.sender_id != $1 AND m.is_deleted = false) as unread_count,
        (SELECT ROW_TO_JSON(msg_row) FROM (
          SELECT m.message_id, m.message_text, m.sender_id,
                 p.user_name as sender_name, m.created_at
          FROM messages m
          LEFT JOIN profiles p ON m.sender_id = p.id
          WHERE m.conversation_id = c.conversation_id
          AND m.is_deleted = false
          ORDER BY m.created_at DESC
          LIMIT 1
        ) msg_row) as last_message
       FROM conversations c
       JOIN conversation_participants cp ON c.conversation_id = cp.conversation_id
       WHERE ${whereClause}
       ORDER BY cp.is_pinned DESC, c.updated_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
      limit,
      offset,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching conversations:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch conversations',
        code: 'FETCH_ERROR',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/messages/conversations
 * Create a new conversation
 *
 * Body:
 * - conversationType: 'direct' | 'course' | 'group' | 'announcement'
 * - participantIds: Array of user IDs to add (for group/direct)
 * - courseId: Course ID (for course conversations)
 * - title: Conversation title (optional, required for group)
 * - description: Conversation description (optional)
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
      conversationType,
      participantIds,
      courseId,
      title,
      description,
    } = await request.json();

    // Validate required fields
    if (!conversationType) {
      return NextResponse.json(
        { error: 'conversationType is required', code: 'MISSING_PARAM' },
        { status: 400 }
      );
    }

    // Validate conversation type
    const validTypes = ['direct', 'course', 'group', 'announcement'];
    if (!validTypes.includes(conversationType)) {
      return NextResponse.json(
        {
          error: `Invalid conversation type. Must be one of: ${validTypes.join(', ')}`,
          code: 'INVALID_TYPE',
        },
        { status: 400 }
      );
    }

    // Type-specific validation
    if (conversationType === 'direct') {
      if (!participantIds || participantIds.length !== 1) {
        return NextResponse.json(
          { error: 'Direct conversation requires exactly 1 participant', code: 'INVALID_PARTICIPANTS' },
          { status: 400 }
        );
      }

      // Check for existing direct conversation
      const existing = await query(
        `SELECT c.conversation_id FROM conversations c
         JOIN conversation_participants cp1 ON c.conversation_id = cp1.conversation_id
         JOIN conversation_participants cp2 ON c.conversation_id = cp2.conversation_id
         WHERE c.conversation_type = 'direct'
         AND cp1.user_id = $1 AND cp2.user_id = $2`,
        [session.id, participantIds[0]]
      );

      if (existing.rowCount > 0) {
        return NextResponse.json({
          success: true,
          data: { conversation_id: existing.rows[0].conversation_id },
          message: 'Existing direct conversation returned',
        });
      }
    } else if (conversationType === 'course') {
      if (!courseId) {
        return NextResponse.json(
          { error: 'Course conversation requires courseId', code: 'MISSING_PARAM' },
          { status: 400 }
        );
      }
    } else if (conversationType === 'group') {
      if (!title) {
        return NextResponse.json(
          { error: 'Group conversation requires title', code: 'MISSING_PARAM' },
          { status: 400 }
        );
      }
      if (!participantIds || participantIds.length === 0) {
        return NextResponse.json(
          { error: 'Group conversation requires at least 1 participant', code: 'MISSING_PARAM' },
          { status: 400 }
        );
      }
    }

    // Create conversation
    const convResult = await query(
      `INSERT INTO conversations
       (conversation_type, course_id, title, description, created_by, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING *`,
      [conversationType, courseId || null, title || null, description || null, session.id]
    );

    const conversation = convResult.rows[0];

    // Add creator as owner
    await query(
      `INSERT INTO conversation_participants
       (conversation_id, user_id, role)
       VALUES ($1, $2, 'owner')`,
      [conversation.conversation_id, session.id]
    );

    // Add other participants
    if (participantIds && participantIds.length > 0) {
      for (const participantId of participantIds) {
        await query(
          `INSERT INTO conversation_participants
           (conversation_id, user_id, role)
           VALUES ($1, $2, 'member')
           ON CONFLICT (conversation_id, user_id) DO NOTHING`,
          [conversation.conversation_id, participantId]
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          conversation_id: conversation.conversation_id,
          conversation_type: conversation.conversation_type,
          title: conversation.title,
          description: conversation.description,
          created_at: conversation.created_at,
        },
        message: 'Conversation created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating conversation:', error);

    return NextResponse.json(
      {
        error: 'Failed to create conversation',
        code: 'CREATE_ERROR',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
