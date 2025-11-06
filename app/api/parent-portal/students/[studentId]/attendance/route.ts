/**
 * Parent Portal Student Attendance API
 * Endpoint: GET /api/parent-portal/students/[studentId]/attendance
 * Get student attendance records with parent access control
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * GET /api/parent-portal/students/[studentId]/attendance
 * Get attendance records for a student
 */
export async function GET(
  request: Request,
  { params }: { params: { studentId: string } }
) {
  const session = await getSession();

  if (!session || !session?.id || session.role !== 'parent') {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'PARENT_ONLY' },
      { status: 403 }
    );
  }

  try {
    const studentId = parseInt(params.studentId);

    // Verify parent has access to this student
    const accessCheck = await query(
      `SELECT can_view_attendance FROM parent_student_relationships
       WHERE parent_id = $1 AND student_id = $2 AND status = 'active'`,
      [session.id, studentId]
    );

    if (accessCheck.rowCount === 0 || !accessCheck.rows[0].can_view_attendance) {
      return NextResponse.json(
        { error: 'No access to view attendance', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let whereClause = `ar.student_id = $1`;
    const queryParams: any[] = [studentId];

    if (courseId) {
      whereClause += ` AND ar.course_id = $${queryParams.length + 1}`;
      queryParams.push(parseInt(courseId));
    }

    // Get attendance records
    const recordsResult = await query(
      `SELECT
        ar.attendance_id,
        ar.student_id,
        ar.course_id,
        c.course_name,
        cs.class_date,
        cs.start_time,
        cs.end_time,
        cs.topic,
        ar.status,
        ar.marking_method,
        ar.marked_at,
        ar.notes,
        t.user_name as marked_by_name
       FROM attendance_records ar
       LEFT JOIN courses c ON ar.course_id = c.course_id
       LEFT JOIN class_sessions cs ON ar.class_session_id = cs.session_id
       LEFT JOIN profiles t ON ar.marked_by = t.id
       WHERE ${whereClause}
       ORDER BY cs.class_date DESC, cs.start_time DESC
       LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
      [...queryParams, limit, offset]
    );

    // Get attendance statistics
    const statsResult = await query(
      `SELECT
        COUNT(*) as total_classes,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late,
        SUM(CASE WHEN status = 'excused' THEN 1 ELSE 0 END) as excused,
        ROUND(
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END)::numeric /
          COUNT(*)::numeric * 100, 2
        ) as attendance_percentage
       FROM attendance_records
       WHERE student_id = $1 ${courseId ? `AND course_id = ${courseId}` : ''}`,
      [studentId]
    );

    const stats = statsResult.rows[0] || {
      total_classes: 0,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      attendance_percentage: null,
    };

    return NextResponse.json({
      success: true,
      data: {
        student_id: studentId,
        statistics: {
          total_classes: parseInt(stats.total_classes || '0'),
          present: parseInt(stats.present || '0'),
          absent: parseInt(stats.absent || '0'),
          late: parseInt(stats.late || '0'),
          excused: parseInt(stats.excused || '0'),
          attendance_percentage: parseFloat(stats.attendance_percentage || '0'),
        },
        records: recordsResult.rows,
        count: recordsResult.rowCount,
        limit,
        offset,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching attendance:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch attendance',
        code: 'FETCH_ERROR',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
