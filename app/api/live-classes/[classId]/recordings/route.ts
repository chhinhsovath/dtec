/**
 * Live Class Recordings API
 * Endpoint: GET /api/live-classes/[classId]/recordings
 * Retrieve recordings for a live class with access control
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * GET /api/live-classes/[classId]/recordings
 * Get all recordings for a live class with access control
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

    // Get class details to verify access
    const classResult = await query(
      `SELECT lc.class_id, lc.course_id, lc.teacher_id
       FROM live_classes lc
       WHERE lc.class_id = $1`,
      [classId]
    );

    if (classResult.rowCount === 0) {
      return NextResponse.json(
        { error: 'Live class not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const liveClass = classResult.rows[0];

    // Check if user has access (teacher, student enrolled in course, or admin)
    const enrollmentCheck = await query(
      `SELECT * FROM enrollments
       WHERE student_id = $1 AND course_id = $2 AND status = 'active'
       UNION
       SELECT * FROM enrollments
       WHERE student_id IN (
         SELECT id FROM profiles WHERE id = $3
       ) AND course_id = $2`,
      [session.id, liveClass.course_id, session.id]
    );

    const isEnrolled = enrollmentCheck.rowCount > 0 || liveClass.teacher_id === session.id;

    if (!isEnrolled && session.role !== 'admin') {
      return NextResponse.json(
        { error: 'No access to these recordings', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Get recordings
    const recordingsResult = await query(
      `SELECT
        lcr.recording_id,
        lcr.class_id,
        lcr.zoom_recording_id,
        lcr.file_name,
        lcr.file_size_mb,
        lcr.file_url,
        lcr.file_type,
        lcr.recording_type,
        lcr.recording_start,
        lcr.recording_end,
        lcr.created_at
       FROM live_class_recordings lcr
       WHERE lcr.class_id = $1
       ORDER BY lcr.created_at DESC`,
      [classId]
    );

    // Get access control info for each recording
    const recordingsWithAccess = await Promise.all(
      recordingsResult.rows.map(async (rec: any) => {
        const accessResult = await query(
          `SELECT access_level FROM recording_access
           WHERE recording_id = $1 AND (user_id = $2 OR role = 'public' OR role = 'enrolled_students')`,
          [rec.recording_id, session.id]
        );

        return {
          ...rec,
          can_access: accessResult.rowCount > 0 || liveClass.teacher_id === session.id,
          can_download:
            accessResult.rowCount > 0
              ? accessResult.rows[0].access_level === 'download'
              : false,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: recordingsWithAccess,
      count: recordingsWithAccess.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching recordings:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch recordings',
        code: 'FETCH_ERROR',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
