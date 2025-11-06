/**
 * Parent Portal Events API
 * Endpoint: GET/PUT /api/parent-portal/events
 * Get event invitations and manage RSVP status
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * GET /api/parent-portal/events
 * Get event invitations with filtering by RSVP status
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
    const rsvpStatus = searchParams.get('rsvpStatus');
    const studentId = searchParams.get('studentId');
    const upcomingOnly = searchParams.get('upcomingOnly') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let whereClause = `pei.parent_id = $1`;
    const params: any[] = [session.id];

    if (rsvpStatus) {
      whereClause += ` AND pei.rsvp_status = $${params.length + 1}`;
      params.push(rsvpStatus);
    }

    if (studentId) {
      whereClause += ` AND pei.student_id = $${params.length + 1}`;
      params.push(parseInt(studentId));
    }

    if (upcomingOnly) {
      whereClause += ` AND pei.event_date >= CURRENT_TIMESTAMP`;
    }

    // Get events
    const eventsResult = await query(
      `SELECT
        pei.invitation_id,
        pei.parent_id,
        pei.student_id,
        pei.event_id,
        pei.event_name,
        pei.event_date,
        pei.event_location,
        pei.description,
        pei.rsvp_status,
        pei.rsvp_date,
        pei.number_of_attendees,
        pei.created_at,
        pei.updated_at,
        s.user_id as student_user_id,
        sp.user_name as student_name
       FROM parent_event_invitations pei
       LEFT JOIN students s ON pei.student_id = s.student_id
       LEFT JOIN profiles sp ON s.user_id = sp.id
       WHERE ${whereClause}
       ORDER BY pei.event_date ASC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    // Get count by status
    const statusCountResult = await query(
      `SELECT
        rsvp_status,
        COUNT(*) as count
       FROM parent_event_invitations
       WHERE parent_id = $1
       GROUP BY rsvp_status`,
      [session.id]
    );

    const statusCounts = statusCountResult.rows.reduce((acc: any, row: any) => {
      acc[row.rsvp_status] = parseInt(row.count || '0');
      return acc;
    }, {});

    // Get pending events count
    const pendingCountResult = await query(
      `SELECT COUNT(*) as count FROM parent_event_invitations
       WHERE parent_id = $1 AND rsvp_status = 'pending'`,
      [session.id]
    );

    const pendingCount = parseInt(pendingCountResult.rows[0].count || '0');

    return NextResponse.json({
      success: true,
      data: {
        events: eventsResult.rows,
        count: eventsResult.rowCount,
        pending_count: pendingCount,
        status_counts: statusCounts,
        limit,
        offset,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching events:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch events',
        code: 'FETCH_ERROR',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/parent-portal/events
 * Update RSVP status for event
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
    const { invitationId, rsvpStatus, numberOfAttendees = 1 } = body;

    if (!invitationId || !rsvpStatus) {
      return NextResponse.json(
        { error: 'Missing required fields', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    if (!['pending', 'accepted', 'declined', 'maybe'].includes(rsvpStatus)) {
      return NextResponse.json(
        { error: 'Invalid rsvpStatus', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    if (numberOfAttendees < 1) {
      return NextResponse.json(
        { error: 'numberOfAttendees must be at least 1', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    // Verify ownership
    const verifyResult = await query(
      `SELECT invitation_id FROM parent_event_invitations
       WHERE invitation_id = $1 AND parent_id = $2`,
      [parseInt(invitationId), session.id]
    );

    if (verifyResult.rowCount === 0) {
      return NextResponse.json(
        { error: 'Invitation not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Update RSVP status
    const updateResult = await query(
      `UPDATE parent_event_invitations
       SET rsvp_status = $1, rsvp_date = CURRENT_TIMESTAMP,
           number_of_attendees = $2, updated_at = CURRENT_TIMESTAMP
       WHERE invitation_id = $3
       RETURNING *`,
      [rsvpStatus, numberOfAttendees, parseInt(invitationId)]
    );

    const invitation = updateResult.rows[0];

    // Get student info if exists
    const studentInfo =
      invitation.student_id
        ? await query(`SELECT user_id FROM students WHERE student_id = $1`, [invitation.student_id])
        : { rowCount: 0, rows: [] };

    const studentProfile =
      studentInfo.rowCount > 0
        ? await query(`SELECT user_name FROM profiles WHERE id = $1`, [studentInfo.rows[0].user_id])
        : { rowCount: 0, rows: [] };

    return NextResponse.json({
      success: true,
      data: {
        ...invitation,
        student_name: studentProfile.rows[0]?.user_name || null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error updating RSVP:', error);

    return NextResponse.json(
      {
        error: 'Failed to update RSVP',
        code: 'UPDATE_ERROR',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
