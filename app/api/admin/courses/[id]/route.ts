import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

// GET - Get single course
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await query(
      `SELECT c.*, 
              p.full_name as teacher_name,
              (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as enrollment_count
       FROM courses c
       LEFT JOIN profiles p ON c.teacher_id = p.user_id
       WHERE c.id = $1`,
      [params.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ course: result.rows[0] });
  } catch (error: any) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}

// PUT - Update course
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, description, credits, teacherId, status } = body;

    let queryText = `
      UPDATE courses
      SET updated_at = NOW()
    `;
    const queryParams: any[] = [];
    let paramCount = 1;

    if (title) {
      queryText += `, title = $${paramCount}`;
      queryParams.push(title);
      paramCount++;
    }

    if (description !== undefined) {
      queryText += `, description = $${paramCount}`;
      queryParams.push(description);
      paramCount++;
    }

    if (credits) {
      queryText += `, credits = $${paramCount}`;
      queryParams.push(credits);
      paramCount++;
    }

    if (teacherId !== undefined) {
      queryText += `, teacher_id = $${paramCount}`;
      queryParams.push(teacherId);
      paramCount++;
    }

    if (status) {
      queryText += `, status = $${paramCount}`;
      queryParams.push(status);
      paramCount++;
    }

    queryText += ` WHERE id = $${paramCount} RETURNING *`;
    queryParams.push(params.id);

    const result = await query(queryText, queryParams);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ course: result.rows[0] });
  } catch (error: any) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    );
  }
}

// DELETE - Delete course
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Delete related enrollments first
    await query('DELETE FROM enrollments WHERE course_id = $1', [params.id]);
    
    // Delete course
    const result = await query(
      'DELETE FROM courses WHERE id = $1 RETURNING id',
      [params.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Course deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}
