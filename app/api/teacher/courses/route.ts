import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/teacher/courses
 * Fetch all courses for the logged-in teacher
 */
export async function GET(request: NextRequest) {
  try {
    const teacherId = request.headers.get('x-teacher-id');

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID required', code: 'MISSING_TEACHER_ID' },
        { status: 400 }
      );
    }

    const result = await query(`
      SELECT
        c.id,
        c.code,
        c.name as title,
        c.description,
        COUNT(DISTINCT e.id) as student_count,
        c.created_at,
        c.updated_at
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN teacher_courses tc ON c.id = tc.course_id
      WHERE tc.teacher_id = $1 AND c.created_at IS NOT NULL
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `, [teacherId]);

    return NextResponse.json({
      success: true,
      courses: result.rows,
      total: result.rows.length
    });
  } catch (error: any) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch courses',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teacher/courses
 * Create a new course
 */
export async function POST(request: NextRequest) {
  try {
    const teacherId = request.headers.get('x-teacher-id');
    const body = await request.json();

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID required', code: 'MISSING_TEACHER_ID' },
        { status: 400 }
      );
    }

    const { title, code, description, credits, semester, year } = body;

    if (!title || !code) {
      return NextResponse.json(
        { error: 'Title and code are required', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    // Insert course
    const courseResult = await query(`
      INSERT INTO courses (code, name, description, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING id, code, name as title, description, created_at, updated_at
    `, [code, title, description || null]);

    const courseId = courseResult.rows[0].id;

    // Link teacher to course
    await query(`
      INSERT INTO teacher_courses (teacher_id, course_id, created_at)
      VALUES ($1, $2, NOW())
    `, [teacherId, courseId]);

    return NextResponse.json({
      success: true,
      message: 'Course created successfully',
      course: courseResult.rows[0]
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to create course',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}
