'use server';

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * PUT /api/notifications/[id]
 * Mark notification as read
 *
 * Required body:
 * - is_read: boolean
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { is_read } = body;

    if (typeof is_read !== 'boolean') {
      return NextResponse.json(
        { error: 'is_read must be a boolean', code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    const updateQuery = is_read
      ? `UPDATE notifications SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`
      : `UPDATE notifications SET is_read = false, read_at = NULL WHERE id = $1 RETURNING *`;

    const result = await query(updateQuery, [id]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Notification not found', code: 'NOT_FOUND' },
        { status: 404 }
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
    console.error('Notification update error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update notification',
        code: 'UPDATE_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications/[id]
 * Delete a notification
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const result = await query(
      `DELETE FROM notifications WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Notification not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Notification deleted',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Notification delete error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to delete notification',
        code: 'DELETE_ERROR',
      },
      { status: 500 }
    );
  }
}
