'use server';

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/notifications
 * Fetch notifications for a user
 *
 * Query params:
 * - userId: UUID (required)
 * - limit: number (default: 20)
 * - offset: number (default: 0)
 * - unread_only: boolean (default: false)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unread_only') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    // Get total count
    const countQuery = unreadOnly
      ? 'SELECT COUNT(*) as total FROM notifications WHERE recipient_id = $1 AND is_read = false'
      : 'SELECT COUNT(*) as total FROM notifications WHERE recipient_id = $1';

    const countResult = await query(countQuery, [userId]);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated notifications
    const notificationsQuery = unreadOnly
      ? `SELECT * FROM notifications
         WHERE recipient_id = $1 AND is_read = false
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`
      : `SELECT * FROM notifications
         WHERE recipient_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`;

    const result = await query(notificationsQuery, [userId, limit, offset]);

    return NextResponse.json(
      {
        success: true,
        data: result.rows,
        pagination: {
          total,
          limit,
          offset,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Notifications query error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch notifications',
        code: 'QUERY_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 * Create a notification
 *
 * Required body:
 * - recipient_id: UUID
 * - notification_type: string
 * - title: string
 * - message: string (optional)
 * - related_type: string (optional)
 * - related_id: UUID (optional)
 * - action_url: string (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      recipient_id,
      notification_type,
      title,
      message,
      related_type,
      related_id,
      action_url,
    } = body;

    // Validate required fields
    if (!recipient_id || !notification_type || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: recipient_id, notification_type, title', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    // Create notification
    const result = await query(
      `INSERT INTO notifications (recipient_id, notification_type, title, message, related_type, related_id, action_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [recipient_id, notification_type, title, message || null, related_type || null, related_id || null, action_url || null]
    );

    // Get user email for potential email notification
    const userResult = await query('SELECT email FROM profiles WHERE id = $1', [recipient_id]);
    const userEmail = userResult.rows[0]?.email;

    // Check notification preferences
    const prefResult = await query(
      'SELECT email_notifications FROM notification_preferences WHERE user_id = $1',
      [recipient_id]
    );

    const shouldSendEmail = prefResult.rowCount > 0
      ? prefResult.rows[0].email_notifications
      : true; // Default to true

    // Add to notification queue for email sending
    if (shouldSendEmail && userEmail) {
      await query(
        `INSERT INTO notification_queue (notification_id, email, status)
         VALUES ($1, $2, 'pending')`,
        [result.rows[0].id, userEmail]
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Notification creation error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create notification',
        code: 'CREATION_ERROR',
      },
      { status: 500 }
    );
  }
}
