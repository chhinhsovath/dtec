import { NextRequest, NextResponse } from 'next/server';
import {
  getStudentDashboardStats,
  getStudentCohort,
  getStudentCurrentPhase,
  getCompetencyFramework,
  getProgramDetails
} from '@/lib/services/pedagogy-service';

/**
 * GET /api/graduate-student/dashboard
 * Comprehensive dashboard data for graduate student
 */
export async function GET(req: NextRequest) {
  try {
    const cookies = req.cookies;
    const userId = cookies.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all dashboard data in parallel
    const [stats, cohort, currentPhase] = await Promise.all([
      getStudentDashboardStats(userId),
      getStudentCohort(userId),
      getStudentCurrentPhase(userId)
    ]);

    // Get program details if we have a cohort
    let program = null;
    let competencies = null;

    if (cohort) {
      program = await getProgramDetails('TEC-CERT-2025'); // TODO: Get from cohort
      competencies = await getCompetencyFramework(program.program_id);
    }

    return NextResponse.json({
      success: true,
      data: {
        stats,
        cohort,
        currentPhase,
        program,
        competencies,
        progressSummary: {
          competenciesAtLevel3Plus: stats.competencies?.proficient || 0,
          totalCompetencies: stats.competencies?.total || 10,
          teachingHoursLogged: stats.teachingHours?.total_hours || 0,
          teachingHoursTarget: stats.practicum?.teaching_hours_target || 120,
          certificationsCompleted: stats.certification?.completed || 0,
          totalCertificationRequirements: stats.certification?.total || 0,
          practicumStatus: stats.practicum?.placement_status || 'not_started'
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
