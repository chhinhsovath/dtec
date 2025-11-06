/**
 * Attendance Marking API
 * Endpoints: GET, POST, PUT /api/attendance/mark
 * Mark, retrieve, and manage student attendance records
 */

import { NextResponse, NextRequest } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/attendance/mark
 * Fetch attendance records with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');
    const student_id = searchParams.get('student_id');
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    let countQuery = 'SELECT COUNT(*) as total FROM attendance_records WHERE 1=1';
    let params: any[] = [];

    if (session_id) {
      countQuery += ' AND session_id = $' + (params.length + 1);
      params.push(parseInt(session_id));
    }

    if (student_id) {
      countQuery += ' AND student_id = $' + (params.length + 1);
      params.push(parseInt(student_id));
    }

    if (status) {
      countQuery += ' AND status = $' + (params.length + 1);
      params.push(status);
    }

    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    let dataQuery = `SELECT ar.* FROM attendance_records ar WHERE 1=1`;
    let dataParams: any[] = [];

    if (session_id) {
      dataQuery += ' AND ar.session_id = $' + (dataParams.length + 1);
      dataParams.push(parseInt(session_id));
    }

    if (student_id) {
      dataQuery += ' AND ar.student_id = $' + (dataParams.length + 1);
      dataParams.push(parseInt(student_id));
    }

    if (status) {
      dataQuery += ' AND ar.status = $' + (dataParams.length + 1);
      dataParams.push(status);
    }

    dataQuery += ' ORDER BY ar.marked_at DESC LIMIT $' + (dataParams.length + 1) + ' OFFSET $' + (dataParams.length + 2);
    dataParams.push(limit, offset);

    const result = await query(dataQuery, dataParams);

    return NextResponse.json(
      {
        success: true,
        data: {
          records: result.rows,
          pagination: {
            total,
            limit,
            offset,
            pages: Math.ceil(total / limit),
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Attendance records query error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch attendance records',
        code: 'QUERY_ERROR',
        meta: {
          error_type: error instanceof Error ? error.constructor.name : 'Unknown',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/attendance/mark
 * Mark student attendance in a class session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      session_id,
      student_id,
      status,
      marking_method,
      qr_token,
      location_latitude,
      location_longitude,
      check_in_time,
      check_out_time,
      notes,
      marked_by,
    } = body;

    // Validate required fields
    if (!session_id || !student_id || !status || !marking_method) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: session_id, student_id, status, marking_method',
          code: 'MISSING_FIELDS',
        },
        { status: 400 }
      );
    }

    const validStatuses = ['present', 'absent', 'late', 'excused'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      );
    }

    const validMethods = ['qr_code', 'manual', 'mobile', 'api'];
    if (!validMethods.includes(marking_method)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid marking_method. Must be one of: ${validMethods.join(', ')}`,
          code: 'INVALID_METHOD',
        },
        { status: 400 }
      );
    }

    // Validate QR token if marking via QR code
    if (marking_method === 'qr_code' && qr_token) {
      const tokenCheck = await query(
        `SELECT token_id FROM qr_code_tokens
         WHERE token_string = $1 AND session_id = $2 AND expires_at > NOW()`,
        [qr_token, session_id]
      );

      if (tokenCheck.rowCount === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid or expired QR code token',
            code: 'INVALID_QR_TOKEN',
          },
          { status: 400 }
        );
      }
    }

    // Check if student exists
    const studentCheck = await query(
      'SELECT student_id FROM students WHERE student_id = $1',
      [student_id]
    );

    if (studentCheck.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Student not found',
          code: 'STUDENT_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Insert or update attendance record
    const upsertResult = await query(
      `INSERT INTO attendance_records
       (session_id, student_id, status, marking_method, marked_by, check_in_time,
        check_out_time, location_latitude, location_longitude, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (session_id, student_id) DO UPDATE SET
       status = EXCLUDED.status,
       marking_method = EXCLUDED.marking_method,
       marked_by = COALESCE(EXCLUDED.marked_by, attendance_records.marked_by),
       check_in_time = COALESCE(EXCLUDED.check_in_time, attendance_records.check_in_time),
       check_out_time = COALESCE(EXCLUDED.check_out_time, attendance_records.check_out_time),
       notes = COALESCE(EXCLUDED.notes, attendance_records.notes),
       marked_at = NOW(),
       updated_at = NOW()
       RETURNING attendance_id, session_id, student_id, status, marked_at`,
      [
        session_id,
        student_id,
        status,
        marking_method,
        marked_by || null,
        check_in_time || null,
        check_out_time || null,
        location_latitude || null,
        location_longitude || null,
        notes || null,
      ]
    );

    const attendanceRecord = upsertResult.rows[0];

    // Update attendance statistics
    const sessionResult = await query(
      'SELECT course_id FROM class_sessions WHERE session_id = $1',
      [session_id]
    );

    if (sessionResult.rowCount > 0) {
      await updateAttendanceStatistics(student_id, sessionResult.rows[0].course_id);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          attendance_id: attendanceRecord.attendance_id,
          status: attendanceRecord.status,
          marked_at: attendanceRecord.marked_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Attendance marking error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mark attendance',
        code: 'MARKING_ERROR',
        meta: {
          error_type: error instanceof Error ? error.constructor.name : 'Unknown',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Update attendance statistics for a student in a course
 */
async function updateAttendanceStatistics(student_id: number, course_id: number) {
  try {
    await query(`
      INSERT INTO attendance_statistics
      (student_id, course_id, total_classes, present_count, absent_count, late_count, excused_count, attendance_percentage)
      SELECT
        $1,
        $2,
        COUNT(*),
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END),
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END),
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END),
        SUM(CASE WHEN status = 'excused' THEN 1 ELSE 0 END),
        ROUND(100.0 * SUM(CASE WHEN status IN ('present', 'late') THEN 1 ELSE 0 END) / COUNT(*), 2)
      FROM attendance_records
      WHERE student_id = $1 AND session_id IN (SELECT session_id FROM class_sessions WHERE course_id = $2)
      ON CONFLICT (student_id, course_id) DO UPDATE SET
        total_classes = EXCLUDED.total_classes,
        present_count = EXCLUDED.present_count,
        absent_count = EXCLUDED.absent_count,
        late_count = EXCLUDED.late_count,
        excused_count = EXCLUDED.excused_count,
        attendance_percentage = EXCLUDED.attendance_percentage,
        last_updated = NOW()
    `, [student_id, course_id]);
  } catch (error) {
    console.error('Error updating attendance statistics:', error);
  }
}
