/**
 * Live Class Details API
 * Endpoint: GET/PUT /api/live-classes/[classId]
 * Manage individual live class details and settings
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import ZoomService from '@/lib/zoom/zoom-service';

/**
 * GET /api/live-classes/[classId]
 * Get detailed information about a live class
 */
export async function GET(
  request: Request,
  { params }: { params: { classId: string } }
) {
  const session = await getSession();

  if (!session || !session?.id) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
      { status: 401 }
    );
  }

  try {
    const classId = parseInt(params.classId);

    // Get class details
    const classResult = await query(
      `SELECT * FROM live_classes WHERE class_id = $1`,
      [classId]
    );

    if (classResult.rowCount === 0) {
      return NextResponse.json(
        { error: 'Live class not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const liveClass = classResult.rows[0];

    // Get participants
    const participantsResult = await query(
      `SELECT
        lcp.participant_id,
        lcp.user_id,
        p.user_name,
        p.email,
        lcp.role,
        lcp.status,
        lcp.join_time,
        lcp.leave_time,
        lcp.duration_minutes,
        lcp.is_screen_shared
       FROM live_class_participants lcp
       LEFT JOIN profiles p ON lcp.user_id = p.id
       WHERE lcp.class_id = $1
       ORDER BY lcp.join_time DESC`,
      [classId]
    );

    // Get recordings if class has been recorded
    const recordingsResult = await query(
      `SELECT * FROM live_class_recordings WHERE class_id = $1`,
      [classId]
    );

    // Get resources shared during class
    const resourcesResult = await query(
      `SELECT * FROM live_class_resources WHERE class_id = $1 ORDER BY shared_at DESC`,
      [classId]
    );

    return NextResponse.json({
      success: true,
      data: {
        class: liveClass,
        participants: participantsResult.rows,
        participant_count: participantsResult.rowCount,
        recordings: recordingsResult.rows,
        resources: resourcesResult.rows,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching live class details:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch live class details',
        code: 'FETCH_ERROR',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/live-classes/[classId]
 * Update live class settings (teacher only)
 */
export async function PUT(
  request: Request,
  { params }: { params: { classId: string } }
) {
  const session = await getSession();

  if (!session || !session?.id) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
      { status: 401 }
    );
  }

  try {
    const classId = parseInt(params.classId);
    const { title, description, status, maxParticipants } = await request.json();

    // Verify ownership
    const classResult = await query(
      `SELECT teacher_id FROM live_classes WHERE class_id = $1`,
      [classId]
    );

    if (classResult.rowCount === 0 || classResult.rows[0].teacher_id !== session.id) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Update class
    const updateResult = await query(
      `UPDATE live_classes
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           max_participants = COALESCE($4, max_participants),
           updated_at = NOW()
       WHERE class_id = $5
       RETURNING *`,
      [title || null, description || null, status || null, maxParticipants || null, classId]
    );

    return NextResponse.json({
      success: true,
      data: updateResult.rows[0],
      message: 'Live class updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating live class:', error);

    return NextResponse.json(
      {
        error: 'Failed to update live class',
        code: 'UPDATE_ERROR',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/live-classes/[classId]
 * Cancel a live class (teacher only)
 */
export async function DELETE(
  request: Request,
  { params }: { params: { classId: string } }
) {
  const session = await getSession();

  if (!session || !['teacher', 'admin'].includes(session.role || '')) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'TEACHER_ONLY' },
      { status: 403 }
    );
  }

  try {
    const classId = parseInt(params.classId);

    // Verify ownership
    const classResult = await query(
      `SELECT class_id, teacher_id, zoom_meeting_id FROM live_classes WHERE class_id = $1`,
      [classId]
    );

    if (classResult.rowCount === 0) {
      return NextResponse.json(
        { error: 'Live class not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const liveClass = classResult.rows[0];

    if (liveClass.teacher_id !== session.id && session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Delete Zoom meeting
    if (liveClass.zoom_meeting_id) {
      try {
        const zoomService = new ZoomService();
        await zoomService.initialize(1); // Use default credential
        await zoomService.deleteMeeting(liveClass.zoom_meeting_id);
      } catch (error) {
        console.error('Error deleting Zoom meeting:', error);
        // Continue with DB deletion even if Zoom delete fails
      }
    }

    // Update class status to cancelled
    await query(
      `UPDATE live_classes SET status = 'cancelled', updated_at = NOW() WHERE class_id = $1`,
      [classId]
    );

    return NextResponse.json({
      success: true,
      message: 'Live class cancelled successfully',
    });
  } catch (error: any) {
    console.error('Error deleting live class:', error);

    return NextResponse.json(
      {
        error: 'Failed to delete live class',
        code: 'DELETE_ERROR',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
