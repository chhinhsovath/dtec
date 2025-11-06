/**
 * Live Classes Management API
 * Endpoint: GET/POST /api/live-classes
 * Manage creation and listing of live classes
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import ZoomService from '@/lib/zoom/zoom-service';

/**
 * GET /api/live-classes
 * Get all live classes with filters
 *
 * Query parameters:
 * - courseId: Filter by course
 * - status: Filter by status (scheduled, in_progress, ended)
 * - limit: Number of results (default: 50)
 * - offset: Pagination offset
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
  const courseId = searchParams.get('courseId');
  const status = searchParams.get('status');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    let whereClause = '';
    const params: any[] = [];

    if (courseId) {
      whereClause += `${whereClause ? ' AND' : 'WHERE'} lc.course_id = $${params.length + 1}`;
      params.push(parseInt(courseId));
    }

    if (status) {
      whereClause += `${whereClause ? ' AND' : 'WHERE'} lc.status = $${params.length + 1}`;
      params.push(status);
    }

    const result = await query(
      `SELECT
        lc.class_id,
        lc.course_id,
        lc.teacher_id,
        p.user_name as teacher_name,
        lc.title,
        lc.description,
        lc.scheduled_start,
        lc.scheduled_end,
        lc.actual_start,
        lc.actual_end,
        lc.status,
        lc.is_recorded,
        lc.zoom_join_url,
        lc.max_participants,
        (SELECT COUNT(*) FROM live_class_participants lcp
         WHERE lcp.class_id = lc.class_id AND lcp.status = 'joined') as participant_count,
        lc.created_at,
        lc.updated_at
       FROM live_classes lc
       LEFT JOIN profiles p ON lc.teacher_id = p.id
       ${whereClause}
       ORDER BY lc.scheduled_start DESC
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
    console.error('Error fetching live classes:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch live classes',
        code: 'FETCH_ERROR',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/live-classes
 * Create a new live class and Zoom meeting
 *
 * Body:
 * - courseId: Course ID
 * - title: Class title
 * - description: Class description (optional)
 * - scheduledStart: ISO 8601 timestamp
 * - scheduledEnd: ISO 8601 timestamp
 * - maxParticipants: Max participants (default: 100)
 * - autoRecording: Enable auto recording (default: true)
 * - zoomCredentialId: Zoom credential ID to use
 */
export async function POST(request: Request) {
  const session = await getSession();

  if (!session || !['teacher', 'admin'].includes(session.role || '')) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'TEACHER_ONLY' },
      { status: 403 }
    );
  }

  try {
    const {
      courseId,
      title,
      description,
      scheduledStart,
      scheduledEnd,
      maxParticipants = 100,
      autoRecording = true,
      zoomCredentialId,
    } = await request.json();

    // Validate required fields
    if (!courseId || !title || !scheduledStart || !scheduledEnd) {
      return NextResponse.json(
        { error: 'Missing required fields', code: 'MISSING_PARAM' },
        { status: 400 }
      );
    }

    // Verify teacher has access to course
    const courseCheck = await query(
      `SELECT course_id FROM courses WHERE course_id = $1 AND instructor_id = $2`,
      [courseId, session.id]
    );

    if (courseCheck.rowCount === 0) {
      return NextResponse.json(
        { error: 'No access to this course', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Initialize Zoom service
    const zoomService = new ZoomService();
    await zoomService.initialize(zoomCredentialId || 1);

    // Create Zoom meeting
    const zoomMeeting = await zoomService.createMeeting(
      await zoomService.getUserId(),
      {
        topic: title,
        type: 2, // Scheduled meeting
        start_time: ZoomService.formatStartTime(new Date(scheduledStart)),
        duration: ZoomService.calculateDuration(
          new Date(scheduledStart),
          new Date(scheduledEnd)
        ),
        settings: {
          auto_recording: autoRecording ? 'cloud' : 'none',
        },
      }
    );

    // Insert into database
    const result = await query(
      `INSERT INTO live_classes
       (course_id, teacher_id, title, description, scheduled_start, scheduled_end,
        zoom_meeting_id, zoom_join_url, zoom_start_url, password, max_participants,
        meeting_settings, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'scheduled')
       RETURNING *`,
      [
        courseId,
        session.id,
        title,
        description || null,
        scheduledStart,
        scheduledEnd,
        zoomMeeting.id,
        zoomMeeting.join_url,
        zoomMeeting.start_url,
        (zoomMeeting as any).password || null,
        maxParticipants,
        JSON.stringify({ auto_recording: autoRecording ? 'cloud' : 'none' }),
      ]
    );

    const liveClass = result.rows[0];

    // Add teacher as participant
    await query(
      `INSERT INTO live_class_participants
       (class_id, user_id, role, status)
       VALUES ($1, $2, 'host', 'not_joined')`,
      [liveClass.class_id, session.id]
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          class_id: liveClass.class_id,
          course_id: liveClass.course_id,
          title: liveClass.title,
          scheduled_start: liveClass.scheduled_start,
          scheduled_end: liveClass.scheduled_end,
          zoom_meeting_id: liveClass.zoom_meeting_id,
          zoom_join_url: liveClass.zoom_join_url,
          zoom_start_url: liveClass.zoom_start_url,
          password: liveClass.password,
          status: liveClass.status,
        },
        message: 'Live class created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating live class:', error);

    return NextResponse.json(
      {
        error: 'Failed to create live class',
        code: 'CREATE_ERROR',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
