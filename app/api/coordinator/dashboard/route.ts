import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/coordinator/dashboard
 * Coordinator dashboard statistics and overview
 */
export async function GET(req: NextRequest) {
  try {
    const cookies = req.cookies;
    const coordinatorId = cookies.get('user_id')?.value;
    const userRole = cookies.get('role')?.value;

    // Check authorization
    if (!coordinatorId || userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - coordinator/admin access required' },
        { status: 403 }
      );
    }

    // Mock dashboard data
    const dashboardData = {
      stats: {
        totalStudents: 48,
        activeStudents: 42,
        completedCertifications: 6,
        pendingCertifications: 12,
        inProgressStudents: 30,
        withdrawnStudents: 0,
        averageCompletionRate: 68,
        totalMentors: 12,
        activeMentorships: 42,
        openMentorPositions: 0
      },
      currentPhase: {
        phase_number: 3,
        name_en: 'Teaching Practice',
        name_km: 'ការងារបង្រៀនក្នុងមន្ទីរ',
        duration_weeks: 8,
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      recentActivityCount: {
        assessmentsCompleted: 34,
        portfoliosSubmitted: 28,
        mentorshipSessionsHeld: 45,
        certificationsIssued: 6
      },
      upcomingDeadlines: [
        {
          deadline_id: 'dead-001',
          title: 'Competency Assessment Submission',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          affected_students: 12,
          priority: 'high'
        },
        {
          deadline_id: 'dead-002',
          title: 'Final Portfolio Review',
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          affected_students: 6,
          priority: 'high'
        }
      ],
      alerts: [
        {
          alert_id: 'alert-001',
          type: 'warning',
          message: '3 students have not logged in for more than 2 weeks',
          severity: 'medium',
          action_required: true
        },
        {
          alert_id: 'alert-002',
          type: 'info',
          message: 'Batch 2025-01 is ready for final certification review',
          severity: 'low',
          action_required: false
        }
      ]
    };

    return NextResponse.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Error fetching coordinator dashboard:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
