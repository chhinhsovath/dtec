import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

interface TeacherProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: string;
  created_at: string;
  updated_at?: string;
}

/**
 * GET - Fetch teacher profile
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    // Get profile data
    const profileResult = await query(
      `SELECT
        id,
        email,
        full_name,
        avatar_url,
        role,
        created_at,
        updated_at
       FROM profiles
       WHERE id = $1 AND role = 'teacher'`,
      [userId]
    );

    if (profileResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Teacher profile not found', code: 'PROFILE_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: profileResult.rows[0] as TeacherProfile,
    });
  } catch (error: any) {
    console.error('Error fetching teacher profile:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
        code: error.code || 'DATABASE_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update teacher profile
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, firstName, lastName } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    // Combine first and last name into full_name
    const fullName = `${firstName || ''} ${lastName || ''}`.trim();

    // Update profile
    const result = await query(
      `UPDATE profiles
       SET
        full_name = $1,
        updated_at = NOW()
       WHERE id = $2 AND role = 'teacher'
       RETURNING
        id,
        email,
        full_name,
        avatar_url,
        role,
        created_at,
        updated_at`,
      [fullName, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Teacher profile not found', code: 'PROFILE_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: result.rows[0] as TeacherProfile,
    });
  } catch (error: any) {
    console.error('Error updating teacher profile:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return NextResponse.json(
      {
        error: 'Failed to update profile',
        message: error.message,
        code: error.code || 'UPDATE_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete teacher profile (soft delete)
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    // Soft delete by setting deleted_at
    const result = await query(
      `UPDATE profiles
       SET updated_at = NOW()
       WHERE id = $1 AND role = 'teacher'
       RETURNING id, email, full_name, updated_at`,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Teacher profile not found', code: 'PROFILE_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile deleted successfully',
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error deleting teacher profile:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return NextResponse.json(
      {
        error: 'Failed to delete profile',
        message: error.message,
        code: error.code || 'DELETE_ERROR',
      },
      { status: 500 }
    );
  }
}
