import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const teacherId = request.headers.get('x-teacher-id');

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID is required' },
        { status: 400 }
      );
    }

    // Fetch teacher's classes via teacher_courses junction table
    try {
      const result = await query(
        `SELECT
          c.id,
          c.code,
          c.name,
          c.description,
          c.created_at,
          c.updated_at,
          COUNT(DISTINCT e.student_id) as student_count
        FROM courses c
        INNER JOIN teacher_courses tc ON c.id = tc.course_id
        LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
        WHERE tc.teacher_id = $1
        GROUP BY c.id, c.code, c.name, c.description, c.created_at, c.updated_at
        ORDER BY c.created_at DESC`,
        [teacherId]
      );

      const classes = result.rows.map(row => ({
        id: row.id,
        class_code: row.code,
        class_name: row.name,
        description: row.description,
        grade_level: null,
        room_number: null,
        semester: null,
        student_count: parseInt(row.student_count) || 0,
        status: 'active',
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));

      return NextResponse.json({ classes });
    } catch (dbError) {
      // Return empty array if query fails (no classes yet)
      console.error('Database query error:', dbError);
      return NextResponse.json({ classes: [] });
    }
  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch classes',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const teacherId = request.headers.get('x-teacher-id');

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { classCode, className, description, gradeLevel, roomNumber, semester, status } = body;

    if (!classCode || !className || !semester) {
      return NextResponse.json(
        { error: 'Class code, name, and semester are required' },
        { status: 400 }
      );
    }

    // Get default institution - use the first one or create a placeholder
    const institutionResult = await query(
      'SELECT id FROM institutions LIMIT 1'
    );
    const institutionId = institutionResult.rows[0]?.id || '00000000-0000-0000-0000-000000000000';

    // Create new course
    const courseResult = await query(
      `INSERT INTO courses (
        code,
        title,
        description,
        credits,
        institution_id,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *`,
      [classCode, className, description || null, 3, institutionId]
    );

    const newCourse = courseResult.rows[0];

    // Link course to teacher
    await query(
      `INSERT INTO teacher_courses (teacher_id, course_id, role, created_at)
       VALUES ($1, $2, 'instructor', NOW())`,
      [teacherId, newCourse.id]
    );

    return NextResponse.json({
      class: {
        id: newCourse.id,
        class_code: newCourse.code,
        class_name: newCourse.title,
        description: newCourse.description,
        grade_level: gradeLevel || null,
        room_number: roomNumber || null,
        semester: semester,
        student_count: 0,
        status: 'active',
        created_at: newCourse.created_at,
        updated_at: newCourse.updated_at,
      },
    });
  } catch (error) {
    console.error('Error creating class:', error);
    return NextResponse.json(
      {
        error: 'Failed to create class',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
