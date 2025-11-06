import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

// GET - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    // Get user counts by role
    const userCountsResult = await query(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as students,
        SUM(CASE WHEN role = 'teacher' THEN 1 ELSE 0 END) as teachers,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins
      FROM profiles
    `);

    // Get course counts
    const courseCountsResult = await query(`
      SELECT
        COUNT(*) as total_courses
      FROM courses
    `);

    // Get enrollment counts
    const enrollmentCountsResult = await query(`
      SELECT 
        COUNT(*) as total_enrollments,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_enrollments
      FROM enrollments
    `);

    // Get recent activity
    const recentActivityResult = await query(`
      SELECT 
        'user_created' as type,
        p.full_name as description,
        p.created_at as timestamp
      FROM profiles p
      ORDER BY p.created_at DESC
      LIMIT 10
    `);

    const stats = {
      users: {
        total: userCountsResult.rows[0] ? parseInt(userCountsResult.rows[0].total_users) || 0 : 0,
        students: userCountsResult.rows[0] ? parseInt(userCountsResult.rows[0].students) || 0 : 0,
        teachers: userCountsResult.rows[0] ? parseInt(userCountsResult.rows[0].teachers) || 0 : 0,
        admins: userCountsResult.rows[0] ? parseInt(userCountsResult.rows[0].admins) || 0 : 0,
      },
      courses: {
        total: courseCountsResult.rows[0] ? parseInt(courseCountsResult.rows[0].total_courses) || 0 : 0,
      },
      enrollments: {
        total: enrollmentCountsResult.rows[0] ? parseInt(enrollmentCountsResult.rows[0].total_enrollments) || 0 : 0,
        active: enrollmentCountsResult.rows[0] ? parseInt(enrollmentCountsResult.rows[0].active_enrollments) || 0 : 0,
      },
      recentActivity: recentActivityResult.rows || [],
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error fetching stats:', error.message || error);
    return NextResponse.json(
      {
        error: 'Failed to fetch statistics',
        message: error.message || 'Unknown error',
        code: error.code || 'UNKNOWN'
      },
      { status: 500 }
    );
  }
}
