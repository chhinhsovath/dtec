import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required', meta: { code: 'MISSING_EMAIL' } },
        { status: 400 }
      );
    }

    // Query student profile with GPA and attendance data
    const result = await query(
      `SELECT
        p.id,
        p.email,
        p.full_name,
        p.role,
        COUNT(DISTINCT e.course_id) as courses_count,
        COALESCE(AVG(ar.gpa), 0) as gpa,
        ROUND(
          (COUNT(CASE WHEN a.status = 'present' THEN 1 END)::float /
          NULLIF(COUNT(a.id), 0) * 100)
        ) as attendance_rate
      FROM profiles p
      LEFT JOIN students s ON p.id = s.user_id
      LEFT JOIN enrollments e ON s.id = e.student_id
      LEFT JOIN academic_records ar ON s.id = ar.student_id
      LEFT JOIN attendance a ON s.id = a.student_id
      WHERE p.email = $1 AND p.role = 'student'
      GROUP BY p.id, p.email, p.full_name, p.role`,
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Student not found', meta: { code: 'STUDENT_NOT_FOUND' } },
        { status: 404 }
      );
    }

    const student = result.rows[0];

    // Format response to match StudentData interface
    return NextResponse.json({
      profile: {
        id: student.id,
        email: student.email,
        full_name: student.full_name,
        role: student.role,
      },
      gpa: parseFloat(student.gpa) || 0,
      coursesCount: parseInt(student.courses_count) || 0,
      attendanceRate: parseInt(student.attendance_rate) || 0,
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch student profile',
        meta: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
