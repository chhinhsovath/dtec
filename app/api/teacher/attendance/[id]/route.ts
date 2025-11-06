import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * PUT /api/teacher/attendance/[id]
 * Update an attendance record
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teacherId = request.headers.get('x-teacher-id');
    const recordId = params.id;

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID required', code: 'MISSING_TEACHER_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status, remarks, date } = body;

    if (!status && !remarks && !date) {
      return NextResponse.json(
        { error: 'At least one field must be provided to update', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    // Verify the teacher has access to this record
    const verifyResult = await query(
      `
      SELECT a.id FROM attendance a
      INNER JOIN students s ON a.student_id = s.id
      INNER JOIN enrollments e ON s.id = e.student_id
      INNER JOIN courses c ON e.course_id = c.id
      INNER JOIN teacher_courses tc ON c.id = tc.course_id
      WHERE a.id = $1 AND tc.teacher_id = $2
      `,
      [recordId, teacherId]
    );

    if (verifyResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Attendance record not found or access denied', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Build dynamic update query
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (status) {
      updateFields.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    if (remarks !== undefined) {
      updateFields.push(`remarks = $${paramIndex}`);
      values.push(remarks || null);
      paramIndex++;
    }

    if (date) {
      updateFields.push(`date = $${paramIndex}`);
      values.push(date);
      paramIndex++;
    }

    updateFields.push(`updated_at = NOW()`);

    values.push(recordId);

    const updateQuery = `
      UPDATE attendance
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update attendance record', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    const record = result.rows[0];

    // Fetch student details
    const studentResult = await query(
      `
      SELECT p.full_name, p.email FROM profiles p
      WHERE p.id = $1
      `,
      [record.student_id]
    );

    const studentData = studentResult.rows[0];

    return NextResponse.json({
      success: true,
      message: 'Attendance updated successfully',
      record: {
        id: record.id,
        student_id: record.student_id,
        student_name: studentData?.full_name || 'Unknown',
        student_email: studentData?.email || '',
        date: record.date,
        status: record.status,
        remarks: record.remarks,
        created_at: record.created_at,
        updated_at: record.updated_at,
      },
    });
  } catch (error: any) {
    console.error('Error updating attendance:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to update attendance',
        code: error.code,
        detail: error.detail,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teacher/attendance/[id]
 * Delete an attendance record
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teacherId = request.headers.get('x-teacher-id');
    const recordId = params.id;

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID required', code: 'MISSING_TEACHER_ID' },
        { status: 400 }
      );
    }

    // Verify the teacher has access to this record
    const verifyResult = await query(
      `
      SELECT a.id FROM attendance a
      INNER JOIN students s ON a.student_id = s.id
      INNER JOIN enrollments e ON s.id = e.student_id
      INNER JOIN courses c ON e.course_id = c.id
      INNER JOIN teacher_courses tc ON c.id = tc.course_id
      WHERE a.id = $1 AND tc.teacher_id = $2
      `,
      [recordId, teacherId]
    );

    if (verifyResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Attendance record not found or access denied', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete the attendance record
    const result = await query(
      `
      DELETE FROM attendance WHERE id = $1
      RETURNING id
      `,
      [recordId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete attendance record', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Attendance record deleted successfully',
      id: recordId,
    });
  } catch (error: any) {
    console.error('Error deleting attendance:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to delete attendance',
        code: error.code,
        detail: error.detail,
      },
      { status: 500 }
    );
  }
}
