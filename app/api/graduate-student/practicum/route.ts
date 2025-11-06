import { NextRequest, NextResponse } from 'next/server';
import { getStudentPracticumPlacement, logTeachingHours, getTotalTeachingHours, createTeachingObservation, getTeachingObservations } from '@/lib/services/pedagogy-service';

/**
 * GET /api/graduate-student/practicum
 * Get practicum placement and status
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

    const placement = await getStudentPracticumPlacement(userId);
    const teachingHours = await getTotalTeachingHours(userId);
    const observations = await getTeachingObservations(userId);

    return NextResponse.json({
      success: true,
      data: {
        placement,
        teachingHours,
        totalObservations: observations.length,
        observations
      }
    });
  } catch (error) {
    console.error('Error fetching practicum data:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch practicum data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/graduate-student/practicum/hours
 * Log teaching hours
 */
export async function POST(req: NextRequest) {
  try {
    const cookies = req.cookies;
    const userId = cookies.get('user_id')?.value;
    const userRole = cookies.get('role')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { action, placementId, hoursLogged, activityDate, notes } = body;

    if (action === 'log_hours') {
      if (!placementId || !hoursLogged || !activityDate) {
        return NextResponse.json(
          { error: 'Missing required fields: placementId, hoursLogged, activityDate' },
          { status: 400 }
        );
      }

      const result = await logTeachingHours(
        userId,
        placementId,
        hoursLogged,
        activityDate,
        notes || ''
      );

      return NextResponse.json({
        success: true,
        message: 'Teaching hours logged',
        data: result
      });
    }

    if (action === 'add_observation') {
      if (userRole !== 'mentor') {
        return NextResponse.json(
          { error: 'Only mentors can add observations' },
          { status: 403 }
        );
      }

      const {
        graduateStudentId,
        placementId: obsPlacementId,
        observationDate,
        lessonTitle,
        gradeLevel,
        strengthsKm,
        strengthsEn,
        areasForImprovementKm,
        areasForImprovementEn,
        recommendationsKm,
        recommendationsEn,
        overallScore
      } = body;

      const observation = await createTeachingObservation(
        graduateStudentId,
        obsPlacementId,
        userId,
        observationDate,
        lessonTitle,
        gradeLevel,
        strengthsKm,
        strengthsEn,
        areasForImprovementKm,
        areasForImprovementEn,
        recommendationsKm,
        recommendationsEn,
        overallScore
      );

      return NextResponse.json({
        success: true,
        message: 'Teaching observation recorded',
        data: observation
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in practicum operation:', error);
    return NextResponse.json(
      {
        error: 'Failed to process practicum operation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
