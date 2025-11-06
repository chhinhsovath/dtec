import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { getMentorDashboardStats, getMentorMentees } from '@/lib/services/pedagogy-service';

/**
 * GET /api/mentor/dashboard
 * Comprehensive dashboard data for mentor
 */
export async function GET(req: NextRequest) {
  try {
    const cookies = req.cookies;
    const userId = cookies.get('user_id')?.value;
    const userRole = cookies.get('role')?.value;

    // Mentors have 'teacher' role in the system, admins can also access mentor dashboards
    if (!userId || (userRole !== 'teacher' && userRole !== 'admin')) {
      return NextResponse.json(
        { error: 'Unauthorized - mentor access required' },
        { status: 403 }
      );
    }

    // Look up mentor ID from user_id
    const mentorResult = await query(
      'SELECT id FROM mentors WHERE user_id = $1',
      [userId]
    );

    const mentorId = mentorResult.rows[0]?.id;
    if (!mentorId) {
      return NextResponse.json(
        { error: 'Mentor profile not found for this user' },
        { status: 404 }
      );
    }

    const [stats, mentees] = await Promise.all([
      getMentorDashboardStats(mentorId),
      getMentorMentees(mentorId)
    ]);

    return NextResponse.json({
      success: true,
      data: {
        stats,
        mentees,
        summary: {
          totalMentees: stats.totalMentees,
          totalObservations: stats.totalObservations,
          totalSessions: stats.totalSessions,
          averageSessionDuration: stats.totalSessions > 0 ? 60 : 0, // Default 1 hour
          menteesStatuses: mentees.reduce((acc, mentee) => {
            const status = mentee.relationship_status || 'active';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching mentor dashboard:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch mentor dashboard',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
