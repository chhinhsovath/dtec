/**
 * Parent Portal Messages API
 * Endpoint: GET/POST /api/parent-portal/messages
 * Get parent-teacher messages and send new messages
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * GET /api/parent-portal/messages
 * Get messages between parent and teachers
 */
export async function GET(request: Request) {
  const session = await getSession();

  if (!session || !session?.id || session.role !== 'parent') {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'PARENT_ONLY' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const teacherId = searchParams.get('teacherId');
    const messageType = searchParams.get('type');
    const isRead = searchParams.get('isRead');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let whereClause = `pm.parent_id = $1`;
    const params: any[] = [session.id];

    if (studentId) {
      whereClause += ` AND pm.student_id = $${params.length + 1}`;
      params.push(parseInt(studentId));
    }

    if (teacherId) {
      whereClause += ` AND pm.teacher_id = $${params.length + 1}`;
      params.push(parseInt(teacherId));
    }

    if (messageType) {
      whereClause += ` AND pm.message_type = $${params.length + 1}`;
      params.push(messageType);
    }

    if (isRead !== null) {
      whereClause += ` AND pm.is_read = $${params.length + 1}`;
      params.push(isRead === 'true');
    }

    // Get messages
    const messagesResult = await query(
      `SELECT
        pm.message_id,
        pm.parent_id,
        pm.teacher_id,
        pm.student_id,
        pm.message_text,
        pm.message_type,
        pm.topic,
        pm.is_read,
        pm.read_at,
        pm.replied_at,
        pm.reply_text,
        pm.replied_by,
        pm.priority,
        pm.is_archived,
        pm.created_at,
        pm.updated_at,
        pr.user_name as parent_name,
        t.user_name as teacher_name,
        s.user_id as student_user_id,
        sp.user_name as student_name,
        rp.user_name as replied_by_name
       FROM parent_messages pm
       LEFT JOIN profiles pr ON pm.parent_id = pr.id
       LEFT JOIN profiles t ON pm.teacher_id = t.id
       LEFT JOIN students s ON pm.student_id = s.student_id
       LEFT JOIN profiles sp ON s.user_id = sp.id
       LEFT JOIN profiles rp ON pm.replied_by = rp.id
       WHERE ${whereClause}
       ORDER BY pm.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    // Get unread count
    const unreadCountResult = await query(
      `SELECT COUNT(*) as count FROM parent_messages
       WHERE parent_id = $1 AND is_read = false`,
      [session.id]
    );

    const unreadCount = parseInt(unreadCountResult.rows[0].count || '0');

    return NextResponse.json({
      success: true,
      data: {
        messages: messagesResult.rows,
        count: messagesResult.rowCount,
        unread_count: unreadCount,
        limit,
        offset,
      },
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

/**
 * POST /api/parent-portal/messages
 * Send a new message to teacher
 */
export async function POST(request: Request) {
  const session = await getSession();

  if (!session || !session?.id || session.role !== 'parent') {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'PARENT_ONLY' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const {
      studentId,
      teacherId,
      messageText,
      messageType = 'message',
      topic,
      priority = 'normal',
    } = body;

    // Validate required fields
    if (!studentId || !teacherId || !messageText) {
      return NextResponse.json(
        { error: 'Missing required fields', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    if (!['message', 'concern', 'praise', 'question'].includes(messageType)) {
      return NextResponse.json(
        { error: 'Invalid messageType', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    if (!['low', 'normal', 'high', 'urgent'].includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    // Verify parent has access to this student
    const accessCheck = await query(
      `SELECT can_communicate FROM parent_student_relationships
       WHERE parent_id = $1 AND student_id = $2 AND status = 'active'`,
      [session.id, parseInt(studentId)]
    );

    if (accessCheck.rowCount === 0 || !accessCheck.rows[0].can_communicate) {
      return NextResponse.json(
        { error: 'No permission to message', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Verify teacher exists
    const teacherCheck = await query(
      `SELECT id FROM profiles WHERE id = $1`,
      [parseInt(teacherId)]
    );

    if (teacherCheck.rowCount === 0) {
      return NextResponse.json(
        { error: 'Teacher not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Create message
    const createResult = await query(
      `INSERT INTO parent_messages (
        parent_id, teacher_id, student_id, message_text,
        message_type, topic, priority, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        session.id,
        parseInt(teacherId),
        parseInt(studentId),
        messageText,
        messageType,
        topic || null,
        priority,
      ]
    );

    const message = createResult.rows[0];

    // Get parent and teacher names
    const profilesResult = await query(
      `SELECT id, user_name FROM profiles WHERE id = ANY($1)`,
      [[session.id, parseInt(teacherId)]]
    );

    const profiles = profilesResult.rows.reduce((acc: any, p: any) => {
      acc[p.id] = p.user_name;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        ...message,
        parent_name: profiles[session.id],
        teacher_name: profiles[parseInt(teacherId)],
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error sending message:', error);

    return NextResponse.json(
      {
        error: 'Failed to send message',
        code: 'CREATE_ERROR',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
