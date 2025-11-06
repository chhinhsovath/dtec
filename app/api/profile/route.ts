import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get profile data
    const profileResult = await query(
      `SELECT id, user_id, first_name, last_name, avatar_url, role, created_at, email
       FROM profiles
       WHERE user_id = $1`,
      [userId]
    );

    if (profileResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const profile = profileResult.rows[0];

    // If student, get student-specific data
    let studentData = null;
    if (profile.role === 'student') {
      const studentResult = await query(
        `SELECT student_number, enrollment_date
         FROM students
         WHERE user_id = $1`,
        [userId]
      );

      if (studentResult.rows.length > 0) {
        studentData = studentResult.rows[0];
      }
    }

    return NextResponse.json({
      profile,
      studentData,
    });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, firstName, lastName } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Update profile
    const result = await query(
      `UPDATE profiles
       SET first_name = $1, last_name = $2, updated_at = NOW()
       WHERE user_id = $3
       RETURNING id, user_id, first_name, last_name, avatar_url, role, created_at`,
      [firstName, lastName, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      profile: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
