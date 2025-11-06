/**
 * Attendance Reports API
 * Endpoint: GET /api/attendance/reports
 * Generate attendance reports by course, student, or date range
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * GET /api/attendance/reports
 * Get attendance reports with various filters
 *
 * Query parameters:
 * - courseId: Filter by course (required)
 * - studentId: Filter by student (optional)
 * - reportType: 'summary' or 'detailed' (default: summary)
 * - startDate: Start date (ISO 8601)
 * - endDate: End date (ISO 8601)
 */
export async function GET(request: Request) {
  const session = await getSession();

  // Only teachers and admins can view reports
  if (!session || !['teacher', 'admin'].includes(session.role)) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('courseId');
  const studentId = searchParams.get('studentId');
  const reportType = searchParams.get('type') || 'summary';
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!courseId) {
    return NextResponse.json(
      { error: 'courseId is required', code: 'MISSING_PARAM' },
      { status: 400 }
    );
  }

  try {
    if (reportType === 'summary' || !studentId) {
      // Course attendance summary
      return getSummarReport(parseInt(courseId));
    } else if (reportType === 'detailed' && studentId) {
      // Detailed attendance by session
      return getDetailedReport(parseInt(courseId), parseInt(studentId), startDate, endDate);
    } else {
      return NextResponse.json(
        { error: 'Invalid report type or missing student ID', code: 'INVALID_REPORT' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error generating report:', error);

    return NextResponse.json(
      {
        error: 'Report generation failed',
        code: 'REPORT_ERROR',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Get summary attendance report for a course
 */
async function getSummarReport(courseId: number) {
  try {
    const result = await query(
      `SELECT
        s.student_id,
        u.user_name,
        u.email,
        COALESCE(stats.total_classes, 0) as total_classes,
        COALESCE(stats.classes_attended, 0) as classes_attended,
        COALESCE(stats.classes_absent, 0) as classes_absent,
        COALESCE(stats.classes_late, 0) as classes_late,
        COALESCE(stats.classes_excused, 0) as classes_excused,
        COALESCE(stats.attendance_percentage, 0) as attendance_percentage,
        CASE
          WHEN COALESCE(stats.attendance_percentage, 0) >= 80 THEN 'good'
          WHEN COALESCE(stats.attendance_percentage, 0) >= 60 THEN 'fair'
          ELSE 'poor'
        END as status_category
       FROM students s
       JOIN profiles u ON s.user_id = u.id
       JOIN enrollments e ON s.student_id = e.student_id
       LEFT JOIN attendance_statistics stats ON s.student_id = stats.student_id
         AND stats.course_id = $1
       WHERE e.course_id = $1 AND e.status = 'active'
       ORDER BY stats.attendance_percentage DESC NULLS LAST`,
      [courseId]
    );

    return NextResponse.json({
      success: true,
      reportType: 'summary',
      courseId,
      data: result.rows,
      count: result.rowCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    throw error;
  }
}

/**
 * Get detailed attendance report for a specific student
 */
async function getDetailedReport(
  courseId: number,
  studentId: number,
  startDate?: string | null,
  endDate?: string | null
) {
  try {
    // Build date filter
    let dateFilter = '';
    const params: (string | number)[] = [courseId, studentId];

    if (startDate) {
      dateFilter += ` AND cs.class_date >= $${params.length + 1}`;
      params.push(startDate);
    }

    if (endDate) {
      dateFilter += ` AND cs.class_date <= $${params.length + 1}`;
      params.push(endDate);
    }

    const result = await query(
      `SELECT
        ar.attendance_id,
        cs.session_id,
        cs.class_date,
        cs.start_time,
        cs.end_time,
        cs.topic,
        ar.status,
        ar.marked_at,
        ar.marking_method,
        ar.notes,
        COALESCE(u.user_name, 'System') as marked_by_name
       FROM attendance_records ar
       JOIN class_sessions cs ON ar.class_session_id = cs.session_id
       LEFT JOIN profiles u ON ar.marked_by = u.id
       WHERE cs.course_id = $1 AND ar.student_id = $2 ${dateFilter}
       ORDER BY cs.class_date DESC`,
      params
    );

    // Get student info
    const studentResult = await query(
      'SELECT s.student_id, u.user_name, u.email FROM students s JOIN profiles u ON s.user_id = u.id WHERE s.student_id = $1',
      [studentId]
    );

    const student = studentResult.rows[0];

    // Calculate summary stats
    const stats = {
      total: result.rowCount,
      present: result.rows.filter((r: any) => r.status === 'present').length,
      absent: result.rows.filter((r: any) => r.status === 'absent').length,
      late: result.rows.filter((r: any) => r.status === 'late').length,
      excused: result.rows.filter((r: any) => r.status === 'excused').length,
    };

    const percentage = stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(2) : 0;

    return NextResponse.json({
      success: true,
      reportType: 'detailed',
      courseId,
      studentId,
      student,
      stats: {
        ...stats,
        attendance_percentage: parseFloat(String(percentage)),
      },
      data: result.rows,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    throw error;
  }
}
