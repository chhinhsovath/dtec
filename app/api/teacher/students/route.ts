import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/teacher/students
 * Fetch all students enrolled in teacher's courses with their grades and attendance
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

    let whereClause = 'WHERE tc.teacher_id = $1';
    let params: any[] = [teacherId];

    if (courseId) {
      whereClause += ' AND c.id = $2';
      params.push(courseId);
    }

    // Debug: Check teacher courses
    const coursesResult = await query(
      'SELECT id, code, name FROM courses WHERE id IN (SELECT course_id FROM teacher_courses WHERE teacher_id = $1)',
      [teacherId]
    );

    const result = await query(`
      SELECT DISTINCT
        p.id,
        p.email,
        p.full_name,
        s.student_id,
        c.id as course_id,
        c.code as course_code,
        c.name as course_name,
        e.id as enrollment_id,
        e.enrollment_date,
        e.status as enrollment_status,
        COALESCE(COUNT(DISTINCT att.id), 0) as attendance_count
      FROM teacher_courses tc
      JOIN courses c ON tc.course_id = c.id
      JOIN enrollments e ON c.id = e.course_id
      JOIN students s ON e.student_id = s.id
      JOIN profiles p ON s.user_id = p.id
      LEFT JOIN attendance att ON s.id = att.student_id AND c.id = att.course_id
      ${whereClause}
      GROUP BY p.id, p.email, p.full_name, s.student_id,
               c.id, c.code, c.name, e.id, e.enrollment_date, e.status
      ORDER BY p.full_name ASC
    `, params);

    return NextResponse.json({
      success: true,
      students: result.rows,
      total: result.rows.length
    });
  } catch (error: any) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch students',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/teacher/students/[studentId]/grade
 * Update student grade in a course
 */
export async function PUT(request: NextRequest) {
  try {
    const teacherId = request.headers.get('x-teacher-id');
    const body = await request.json();
    const { studentId, courseId, score, letterGrade } = body;

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID required', code: 'MISSING_TEACHER_ID' },
        { status: 400 }
      );
    }

    if (!studentId || !courseId || score === undefined) {
      return NextResponse.json(
        { error: 'Student ID, Course ID, and score are required', code: 'MISSING_FIELDS' },
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

    // Get enrollment ID
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

    const enrollmentId = enrollmentResult.rows[0].id;

    // Update or insert grade
    const result = await query(`
      INSERT INTO grades (enrollment_id, score, letter_grade, graded_at, graded_by)
      VALUES ($1, $2, $3, NOW(), $4)
      ON CONFLICT (enrollment_id) DO UPDATE SET
        score = $2,
        letter_grade = $3,
        graded_at = NOW()
      RETURNING *
    `, [enrollmentId, score, letterGrade || null, teacherId]);

    return NextResponse.json({
      success: true,
      message: 'Grade updated successfully',
      grade: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error updating grade:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to update grade',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}
