import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teacherId = request.headers.get('x-teacher-id');
    const classId = params.id;

    if (!teacherId || !classId) {
      return NextResponse.json(
        { error: 'Teacher ID and Class ID are required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { classCode, className, description, gradeLevel, roomNumber, semester, status } = body;

    if (!classCode || !className) {
      return NextResponse.json(
        { error: 'Class code and name are required' },
        { status: 400 }
      );
    }

    // Verify teacher owns this class via teacher_courses
    const ownerCheck = await query(
      'SELECT c.id FROM courses c INNER JOIN teacher_courses tc ON c.id = tc.course_id WHERE c.id = $1 AND tc.teacher_id = $2',
      [classId, teacherId]
    );

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Class not found or you do not have permission' },
        { status: 404 }
      );
    }

    // Update course (class)
    const result = await query(
      `UPDATE courses
       SET code = $1,
           title = $2,
           description = $3,
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [classCode, className, description || null, classId]
    );

    const updatedClass = result.rows[0];

    return NextResponse.json({
      class: {
        id: updatedClass.id,
        class_code: updatedClass.code,
        class_name: updatedClass.title,
        description: updatedClass.description,
        grade_level: gradeLevel || null,
        room_number: roomNumber || null,
        semester: semester,
        student_count: 0,
        status: 'active',
        created_at: updatedClass.created_at,
        updated_at: updatedClass.updated_at,
      },
    });
  } catch (error) {
    console.error('Error updating class:', error);
    return NextResponse.json(
      {
        error: 'Failed to update class',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teacherId = request.headers.get('x-teacher-id');
    const classId = params.id;

    if (!teacherId || !classId) {
      return NextResponse.json(
        { error: 'Teacher ID and Class ID are required' },
        { status: 400 }
      );
    }

    // Verify teacher owns this class via teacher_courses
    const ownerCheck = await query(
      'SELECT c.id FROM courses c INNER JOIN teacher_courses tc ON c.id = tc.course_id WHERE c.id = $1 AND tc.teacher_id = $2',
      [classId, teacherId]
    );

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Class not found or you do not have permission' },
        { status: 404 }
      );
    }

    // Remove teacher assignment from course
    await query(
      'DELETE FROM teacher_courses WHERE course_id = $1 AND teacher_id = $2',
      [classId, teacherId]
    );

    return NextResponse.json({
      message: 'Class deleted successfully',
      id: classId,
    });
  } catch (error) {
    console.error('Error deleting class:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete class',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
