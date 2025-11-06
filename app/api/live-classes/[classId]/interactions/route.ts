/**
 * Live Class Interactions API
 * Endpoint: GET/POST /api/live-classes/[classId]/interactions
 * Manage chat messages, questions, and poll responses during live class
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/live-classes/[classId]/interactions
 * Get chat/interactions from a live class
 *
 * Query parameters:
 * - type: Filter by type (chat, question, poll_response, reaction)
 * - limit: Number of results (default: 50)
 * - offset: Pagination offset
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { classId: string } }
) {
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
      { status: 401 }
    );
  }

  try {
    const classId = parseInt(params.classId);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Verify user is participant or teacher
    const participantCheck = await query(
      `SELECT * FROM live_class_participants
       WHERE class_id = $1 AND user_id = $2`,
      [classId, userId]
    );

    if (participantCheck.rowCount === 0) {
      // Check if user is teacher
      const classCheck = await query(
        `SELECT teacher_id FROM live_classes WHERE class_id = $1`,
        [classId]
      );

      if (classCheck.rowCount === 0 || classCheck.rows[0].teacher_id !== userId) {
        return NextResponse.json(
          { error: 'No access to this class', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
    }

    // Build query
    let whereClause = `lci.class_id = $1`;
    const queryParams: any[] = [classId];

    if (type) {
      whereClause += ` AND lci.interaction_type = $${queryParams.length + 1}`;
      queryParams.push(type);
    }

    const result = await query(
      `SELECT
        lci.interaction_id,
        lci.class_id,
        lci.user_id,
        p.user_name,
        p.avatar_url,
        lci.interaction_type,
        lci.content,
        lci.is_anonymous,
        lci.created_at
       FROM live_class_interactions lci
       LEFT JOIN profiles p ON lci.user_id = p.id
       WHERE ${whereClause}
       ORDER BY lci.created_at DESC
       LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
      [...queryParams, limit, offset]
    );

    return NextResponse.json({
      success: true,
      data: result.rows.map((row: any) => ({
        ...row,
        user_name: row.is_anonymous ? 'Anonymous' : row.user_name,
      })),
      count: result.rowCount,
      limit,
      offset,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching interactions:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch interactions',
        code: 'FETCH_ERROR',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/live-classes/[classId]/interactions
 * Post a new interaction (chat message, question, etc.)
 *
 * Body:
 * - interactionType: 'chat' | 'question' | 'poll_response' | 'reaction'
 * - content: Message/question content
 * - isAnonymous: Post anonymously (default: false)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { classId: string } }
) {
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
      { status: 401 }
    );
  }

  try {
    const classId = parseInt(params.classId);
    const { interactionType, content, isAnonymous = false } = await request.json();

    // Validate required fields
    if (!interactionType || !content) {
      return NextResponse.json(
        { error: 'Missing required fields', code: 'MISSING_PARAM' },
        { status: 400 }
      );
    }

    // Validate interaction type
    const validTypes = ['chat', 'question', 'poll_response', 'reaction'];
    if (!validTypes.includes(interactionType)) {
      return NextResponse.json(
        {
          error: `Invalid interaction type. Must be one of: ${validTypes.join(', ')}`,
          code: 'INVALID_TYPE',
        },
        { status: 400 }
      );
    }

    // Verify user is participant or teacher
    const participantCheck = await query(
      `SELECT * FROM live_class_participants
       WHERE class_id = $1 AND user_id = $2`,
      [classId, userId]
    );

    if (participantCheck.rowCount === 0) {
      // Check if user is teacher
      const classCheck = await query(
        `SELECT teacher_id FROM live_classes WHERE class_id = $1`,
        [classId]
      );

      if (classCheck.rowCount === 0 || classCheck.rows[0].teacher_id !== userId) {
        return NextResponse.json(
          { error: 'Not a participant in this class', code: 'NOT_PARTICIPANT' },
          { status: 403 }
        );
      }
    }

    // Insert interaction
    const result = await query(
      `INSERT INTO live_class_interactions
       (class_id, user_id, interaction_type, content, is_anonymous)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [classId, userId, interactionType, content, isAnonymous]
    );

    const interaction = result.rows[0];

    // Get user info
    const userInfo = await query(
      `SELECT user_name, avatar_url FROM profiles WHERE id = $1`,
      [userId]
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          interaction_id: interaction.interaction_id,
          class_id: interaction.class_id,
          user_id: interaction.user_id,
          user_name: isAnonymous ? 'Anonymous' : userInfo.rows[0]?.user_name,
          interaction_type: interaction.interaction_type,
          content: interaction.content,
          is_anonymous: interaction.is_anonymous,
          created_at: interaction.created_at,
        },
        message: 'Interaction posted successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error posting interaction:', error);

    return NextResponse.json(
      {
        error: 'Failed to post interaction',
        code: 'POST_ERROR',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
