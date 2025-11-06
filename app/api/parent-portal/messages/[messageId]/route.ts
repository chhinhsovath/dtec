/**
 * Parent Portal Message Detail API
 * Endpoint: GET/PUT /api/parent-portal/messages/[messageId]
 * Get message details and mark as read
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * GET /api/parent-portal/messages/[messageId]
 * Get message detail and auto-mark as read
 */
export async function GET(
  request: Request,
  { params }: { params: { messageId: string } }
) {
  const session = await getSession();

  if (!session || !session?.id || session.role !== 'parent') {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'PARENT_ONLY' },
      { status: 403 }
    );
  }

  try {
    const messageId = parseInt(params.messageId);

    // Get message and mark as read
    const messageResult = await query(
      `UPDATE parent_messages
       SET is_read = true, read_at = CURRENT_TIMESTAMP
       WHERE message_id = $1 AND parent_id = $2
       RETURNING *`,
      [messageId, session.id]
    );

    if (messageResult.rowCount === 0) {
      return NextResponse.json(
        { error: 'Message not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const message = messageResult.rows[0];

    // Get related information
    const profilesResult = await query(
      `SELECT id, user_name FROM profiles WHERE id = ANY($1)`,
      [[message.parent_id, message.teacher_id, message.replied_by]]
    );

    const profiles = profilesResult.rows.reduce((acc: any, p: any) => {
      acc[p.id] = p.user_name;
      return acc;
    }, {});

    const studentResult = await query(
      `SELECT user_id FROM students WHERE student_id = $1`,
      [message.student_id]
    );

    const studentProfileResult = studentResult.rowCount > 0
      ? await query(`SELECT user_name FROM profiles WHERE id = $1`, [studentResult.rows[0].user_id])
      : { rowCount: 0, rows: [] };

    return NextResponse.json({
      success: true,
      data: {
        ...message,
        parent_name: profiles[message.parent_id],
        teacher_name: profiles[message.teacher_id],
        student_name: studentProfileResult.rows[0]?.user_name || null,
        replied_by_name: message.replied_by ? profiles[message.replied_by] : null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching message:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch message',
        code: 'FETCH_ERROR',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/parent-portal/messages/[messageId]
 * Update message read status
 */
export async function PUT(
  request: Request,
  { params }: { params: { messageId: string } }
) {
  const session = await getSession();

  if (!session || !session?.id || session.role !== 'parent') {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'PARENT_ONLY' },
      { status: 403 }
    );
  }

  try {
    const messageId = parseInt(params.messageId);
    const body = await request.json();
    const { isArchived } = body;

    // Verify ownership
    const verifyResult = await query(
      `SELECT message_id FROM parent_messages WHERE message_id = $1 AND parent_id = $2`,
      [messageId, session.id]
    );

    if (verifyResult.rowCount === 0) {
      return NextResponse.json(
        { error: 'Message not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Update message
    const updateResult = await query(
      `UPDATE parent_messages
       SET is_archived = $1, updated_at = CURRENT_TIMESTAMP
       WHERE message_id = $2
       RETURNING *`,
      [isArchived || false, messageId]
    );

    return NextResponse.json({
      success: true,
      data: updateResult.rows[0],
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error updating message:', error);

    return NextResponse.json(
      {
        error: 'Failed to update message',
        code: 'UPDATE_ERROR',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/parent-portal/messages/[messageId]
 * Delete message (soft delete for audit)
 */
export async function DELETE(
  request: Request,
  { params }: { params: { messageId: string } }
) {
  const session = await getSession();

  if (!session || !session?.id || session.role !== 'parent') {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'PARENT_ONLY' },
      { status: 403 }
    );
  }

  try {
    const messageId = parseInt(params.messageId);

    // Verify ownership
    const verifyResult = await query(
      `SELECT message_id FROM parent_messages WHERE message_id = $1 AND parent_id = $2`,
      [messageId, session.id]
    );

    if (verifyResult.rowCount === 0) {
      return NextResponse.json(
        { error: 'Message not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Mark as deleted (soft delete)
    const deleteResult = await query(
      `DELETE FROM parent_messages WHERE message_id = $1 RETURNING message_id`,
      [messageId]
    );

    return NextResponse.json({
      success: true,
      data: {
        message_id: deleteResult.rows[0].message_id,
        deleted: true,
      },
      timestamp: new Date().toISOString(),
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
