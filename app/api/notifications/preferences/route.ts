'use server';

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/notifications/preferences
 * Get notification preferences for a user
 *
 * Query params:
 * - userId: UUID (required)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    const result = await query(
      'SELECT * FROM notification_preferences WHERE user_id = $1',
      [userId]
    );

    // If no preferences exist, create defaults
    if (result.rowCount === 0) {
      const createResult = await query(
        `INSERT INTO notification_preferences (user_id)
         VALUES ($1)
         RETURNING *`,
        [userId]
      );
      return NextResponse.json(
        {
          success: true,
          data: createResult.rows[0],
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Preferences query error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch preferences',
        code: 'QUERY_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notifications/preferences
 * Update notification preferences for a user
 *
 * Required body:
 * - userId: UUID
 * - forum_replies: boolean (optional)
 * - certificates: boolean (optional)
 * - path_milestones: boolean (optional)
 * - quiz_grades: boolean (optional)
 * - email_notifications: boolean (optional)
 * - in_app_notifications: boolean (optional)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      forum_replies,
      certificates,
      path_milestones,
      quiz_grades,
      email_notifications,
      in_app_notifications,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [userId];
    let paramIndex = 2;

    if (forum_replies !== undefined) {
      updates.push(`forum_replies = $${paramIndex}`);
      params.push(forum_replies);
      paramIndex++;
    }
    if (certificates !== undefined) {
      updates.push(`certificates = $${paramIndex}`);
      params.push(certificates);
      paramIndex++;
    }
    if (path_milestones !== undefined) {
      updates.push(`path_milestones = $${paramIndex}`);
      params.push(path_milestones);
      paramIndex++;
    }
    if (quiz_grades !== undefined) {
      updates.push(`quiz_grades = $${paramIndex}`);
      params.push(quiz_grades);
      paramIndex++;
    }
    if (email_notifications !== undefined) {
      updates.push(`email_notifications = $${paramIndex}`);
      params.push(email_notifications);
      paramIndex++;
    }
    if (in_app_notifications !== undefined) {
      updates.push(`in_app_notifications = $${paramIndex}`);
      params.push(in_app_notifications);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update', code: 'NO_UPDATES' },
        { status: 400 }
      );
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const updateQuery = `
      UPDATE notification_preferences
      SET ${updates.join(', ')}
      WHERE user_id = $1
      RETURNING *
    `;

    const result = await query(updateQuery, params);

    if (result.rowCount === 0) {
      // Create preferences if they don't exist
      const createResult = await query(
        `INSERT INTO notification_preferences (user_id, forum_replies, certificates, path_milestones, quiz_grades, email_notifications, in_app_notifications)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          userId,
          forum_replies ?? true,
          certificates ?? true,
          path_milestones ?? true,
          quiz_grades ?? true,
          email_notifications ?? true,
          in_app_notifications ?? true,
        ]
      );
      return NextResponse.json(
        {
          success: true,
          data: createResult.rows[0],
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Preferences update error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update preferences',
        code: 'UPDATE_ERROR',
      },
      { status: 500 }
    );
  }
}
