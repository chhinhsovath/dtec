import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/teacher/attendance
 * Fetch all attendance records for teacher's students
 */
export async function GET(request: NextRequest) {
  try {
    const teacherId = request.headers.get('x-teacher-id');
    const courseId = request.nextUrl.searchParams.get('courseId');

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID required', code: 'MISSING_TEACHER_ID' },
        { status: 400 }
      );
    }

    // If courseId is provided, fetch only that course's attendance
    if (courseId) {
      // Verify teacher has access to this course
      const accessResult = await query(`
        SELECT tc.id FROM teacher_courses tc
        WHERE tc.teacher_id = $1 AND tc.course_id = $2
      `, [teacherId, courseId]);

      if (accessResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Access denied', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }

      const result = await query(`
        SELECT
          a.id,
          a.student_id,
          a.course_id,
          a.date,
          a.status,
          a.remarks,
          a.created_at,
          p.full_name,
          p.email,
          s.student_number
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        JOIN profiles p ON s.user_id = p.id
        WHERE a.course_id = $1
        ORDER BY a.date DESC, p.full_name ASC
      `, [courseId]);

      return NextResponse.json({
        success: true,
        attendance: result.rows,
        total: result.rows.length,
        records: result.rows.map((row: any) => ({
          id: row.id,
          student_id: row.student_id,
          student_name: row.full_name,
          student_email: row.email,
          date: row.date,
          status: row.status,
          remarks: row.remarks,
          created_at: row.created_at,
          updated_at: row.updated_at,
        })),
      });
    }

    // Otherwise, fetch all attendance for teacher's students
    const result = await query(`
      SELECT DISTINCT
        a.id,
        a.student_id,
        p.full_name,
        p.email,
        a.date,
        a.status,
        a.remarks,
        a.created_at,
        a.updated_at
      FROM attendance a
      INNER JOIN students s ON a.student_id = s.id
      INNER JOIN profiles p ON s.user_id = p.id
      INNER JOIN enrollments e ON s.id = e.student_id
      INNER JOIN courses c ON e.course_id = c.id
      INNER JOIN teacher_courses tc ON c.id = tc.course_id
      WHERE tc.teacher_id = $1
      ORDER BY a.date DESC
      LIMIT 1000
    `, [teacherId]);

    return NextResponse.json({
      success: true,
      records: result.rows.map((row: any) => ({
        id: row.id,
        student_id: row.student_id,
        student_name: row.full_name,
        student_email: row.email,
        date: row.date,
        status: row.status,
        remarks: row.remarks,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })),
      total: result.rows.length
    });
  } catch (error: any) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch attendance',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teacher/attendance
 * Mark student attendance
 */
export async function POST(request: NextRequest) {
  try {
    const teacherId = request.headers.get('x-teacher-id');
    const body = await request.json();
    const { studentId, courseId, date, status, remarks } = body;

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID required', code: 'MISSING_TEACHER_ID' },
        { status: 400 }
      );
    }

    if (!studentId || !courseId || !date || !status) {
      return NextResponse.json(
        { error: 'Student ID, Course ID, date, and status are required', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    // Verify teacher has access to this course
    const accessResult = await query(`
      SELECT tc.id FROM teacher_courses tc
      WHERE tc.teacher_id = $1 AND tc.course_id = $2
    `, [teacherId, courseId]);

    if (accessResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Access denied', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Verify student is enrolled in the course
    const enrollmentResult = await query(`
      SELECT e.id FROM enrollments e
      WHERE e.student_id = $1 AND e.course_id = $2
    `, [studentId, courseId]);

    if (enrollmentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Student not enrolled in this course', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Insert or update attendance
    const result = await query(`
      INSERT INTO attendance (student_id, course_id, date, status, remarks, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (student_id, course_id, date) DO UPDATE SET
        status = $4,
        remarks = $5,
        updated_at = NOW()
      RETURNING *
    `, [studentId, courseId, date, status, remarks || null]);

    return NextResponse.json({
      success: true,
      message: 'Attendance marked successfully',
      attendance: result.rows[0]
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error marking attendance:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to mark attendance',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}
