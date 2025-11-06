import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/client-auth';
import { getStudentCompetencies, updateCompetencyAssessment } from '@/lib/services/pedagogy-service';

/**
 * GET /api/graduate-student/competencies
 * Get all competency assessments for logged-in student
 */
export async function GET(req: NextRequest) {
  try {
    // Get session from cookies
    const cookies = req.cookies;
    const userId = cookies.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - no user session' },
        { status: 401 }
      );
    }

    // Get student ID (in pedagogy, we need to query for graduate_student_id from user_id)
    // For now, we'll use user_id as the identifier (would need mapping in real scenario)
    const competencies = await getStudentCompetencies(userId);

    return NextResponse.json({
      success: true,
      data: competencies,
      count: competencies.length
    });
  } catch (error) {
    console.error('Error fetching competencies:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch competencies',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/graduate-student/competencies
 * Update competency assessment (mentor only)
 */
export async function POST(req: NextRequest) {
  try {
    const cookies = req.cookies;
    const mentorId = cookies.get('user_id')?.value;
    const userRole = cookies.get('role')?.value;

    if (!mentorId || userRole !== 'mentor') {
      return NextResponse.json(
        { error: 'Unauthorized - mentor access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      graduateStudentId,
      competencyId,
      currentLevel,
      score,
      feedbackText
    } = body;

    // Validate required fields
    if (!graduateStudentId || !competencyId || currentLevel === undefined || score === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: graduateStudentId, competencyId, currentLevel, score' },
        { status: 400 }
      );
    }

    // Validate level is 1-5
    if (currentLevel < 1 || currentLevel > 5) {
      return NextResponse.json(
        { error: 'Competency level must be between 1 and 5' },
        { status: 400 }
      );
    }

    const result = await updateCompetencyAssessment(
      graduateStudentId,
      competencyId,
      currentLevel,
      score,
      feedbackText || '',
      mentorId
    );

    return NextResponse.json({
      success: true,
      message: 'Competency assessment updated',
      data: result
    });
  } catch (error) {
    console.error('Error updating competency:', error);
    return NextResponse.json(
      {
        error: 'Failed to update competency',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
