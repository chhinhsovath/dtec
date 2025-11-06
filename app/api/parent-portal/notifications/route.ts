/**
 * Parent Portal Notifications API
 * Endpoint: GET /api/parent-portal/notifications
 * Get parent notifications with filtering and read status management
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * GET /api/parent-portal/notifications
 * Get all notifications or filter by read status
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
    const isRead = searchParams.get('isRead');
    const notificationType = searchParams.get('type');
    const studentId = searchParams.get('studentId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let whereClause = `pn.parent_id = $1`;
    const params: any[] = [session.id];

    if (isRead !== null) {
      whereClause += ` AND pn.is_read = $${params.length + 1}`;
      params.push(isRead === 'true');
    }

    if (notificationType) {
      whereClause += ` AND pn.notification_type = $${params.length + 1}`;
      params.push(notificationType);
    }

    if (studentId) {
      whereClause += ` AND pn.student_id = $${params.length + 1}`;
      params.push(parseInt(studentId));
    }

    // Get notifications
    const notificationsResult = await query(
      `SELECT
        pn.notification_id,
        pn.parent_id,
        pn.student_id,
        pn.notification_type,
        pn.title,
        pn.description,
        pn.related_entity_id,
        pn.related_entity_type,
        pn.severity,
        pn.is_read,
        pn.read_at,
        pn.action_url,
        pn.created_at,
        pn.expires_at,
        s.user_id as student_user_id,
        p.user_name as student_name
       FROM parent_notifications pn
       LEFT JOIN students s ON pn.student_id = s.student_id
       LEFT JOIN profiles p ON s.user_id = p.id
       WHERE ${whereClause}
       ORDER BY pn.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    // Get unread count
    const unreadCountResult = await query(
      `SELECT COUNT(*) as count FROM parent_notifications
       WHERE parent_id = $1 AND is_read = false`,
      [session.id]
    );

    const unreadCount = parseInt(unreadCountResult.rows[0].count || '0');

    return NextResponse.json({
      success: true,
      data: {
        notifications: notificationsResult.rows,
        count: notificationsResult.rowCount,
        unread_count: unreadCount,
        limit,
        offset,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch notifications',
        code: 'FETCH_ERROR',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/parent-portal/notifications
 * Mark notifications as read
 */
export async function PUT(request: Request) {
  const session = await getSession();

  if (!session || !session?.id || session.role !== 'parent') {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'PARENT_ONLY' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { notificationIds, markAsRead = true } = body;

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid notificationIds', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    // Verify ownership (parent can only mark their own notifications)
    const verifyResult = await query(
      `SELECT COUNT(*) as count FROM parent_notifications
       WHERE parent_id = $1 AND notification_id = ANY($2)`,
      [session.id, notificationIds]
    );

    const matchCount = parseInt(verifyResult.rows[0].count || '0');

    if (matchCount !== notificationIds.length) {
      return NextResponse.json(
        { error: 'Cannot modify notifications', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Update read status
    const updateResult = await query(
      `UPDATE parent_notifications
       SET is_read = $1, read_at = CASE WHEN $1 = true THEN CURRENT_TIMESTAMP ELSE NULL END
       WHERE parent_id = $2 AND notification_id = ANY($3)
       RETURNING notification_id, is_read, read_at`,
      [markAsRead, session.id, notificationIds]
    );

    return NextResponse.json({
      success: true,
      data: {
        updated_count: updateResult.rowCount,
        notifications: updateResult.rows,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error updating notifications:', error);

    return NextResponse.json(
      {
        error: 'Failed to update notifications',
        code: 'UPDATE_ERROR',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/parent-portal/notifications
 * Delete notifications
 */
export async function DELETE(request: Request) {
  const session = await getSession();

  if (!session || !session?.id || session.role !== 'parent') {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'PARENT_ONLY' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { notificationIds } = body;

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid notificationIds', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    // Verify ownership
    const verifyResult = await query(
      `SELECT COUNT(*) as count FROM parent_notifications
       WHERE parent_id = $1 AND notification_id = ANY($2)`,
      [session.id, notificationIds]
    );

    const matchCount = parseInt(verifyResult.rows[0].count || '0');

    if (matchCount !== notificationIds.length) {
      return NextResponse.json(
        { error: 'Cannot delete notifications', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Delete notifications
    const deleteResult = await query(
      `DELETE FROM parent_notifications
       WHERE parent_id = $1 AND notification_id = ANY($2)
       RETURNING notification_id`,
      [session.id, notificationIds]
    );

    return NextResponse.json({
      success: true,
      data: {
        deleted_count: deleteResult.rowCount,
        notification_ids: deleteResult.rows.map((r: any) => r.notification_id),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error deleting notifications:', error);

    return NextResponse.json(
      {
        error: 'Failed to delete notifications',
        code: 'DELETE_ERROR',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
