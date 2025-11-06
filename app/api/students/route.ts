import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

// GET - List all students
export async function GET(request: NextRequest) {
  try {
    const result = await query(`
      SELECT 
        s.id,
        s.user_id,
        s.student_number,
        s.enrollment_date,
        p.first_name,
        p.last_name,
        p.email,
        p.role
      FROM students s
      INNER JOIN profiles p ON s.user_id = p.user_id
      ORDER BY s.enrollment_date DESC
    `);

    // Transform data to match expected structure
    const students = result.rows.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      student_number: row.student_number,
      enrollment_date: row.enrollment_date,
      profiles: {
        first_name: row.first_name,
        last_name: row.last_name,
        role: row.role,
      },
    }));

    return NextResponse.json({ students });
  } catch (error: any) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}
