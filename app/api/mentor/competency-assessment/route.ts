import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/mentor/competency-assessment
 * List all competency assessments for mentor's mentees
 */
export async function GET(req: NextRequest) {
  try {
    const cookies = req.cookies;
    const mentorId = cookies.get('user_id')?.value;
    const userRole = cookies.get('role')?.value;

    // Accept both 'mentor' and 'teacher' roles (teachers can be mentors)
    if (!mentorId || (userRole !== 'teacher' && userRole !== 'admin' && userRole !== 'mentor')) {
      return NextResponse.json(
        { error: 'Unauthorized - mentor access required' },
        { status: 403 }
      );
    }

    // Mock data for competency assessments
    const assessments = [
      {
        assessment_id: 'cass-001',
        mentee_id: 'stu-001',
        mentee_name: 'Sophea Khmer',
        competency_id: 'comp-001',
        competency_name: 'Self-Awareness',
        current_level: 2,
        target_level: 3,
        feedback: 'Shows potential but needs more reflection on teaching practice',
        assessment_date: new Date().toISOString(),
        status: 'in_progress'
      },
      {
        assessment_id: 'cass-002',
        mentee_id: 'stu-001',
        mentee_name: 'Sophea Khmer',
        competency_id: 'comp-002',
        competency_name: 'Subject Matter Knowledge',
        current_level: 3,
        target_level: 3,
        feedback: 'Demonstrates solid understanding of subject content',
        assessment_date: new Date().toISOString(),
        status: 'completed'
      }
    ];

    return NextResponse.json({
      success: true,
      data: assessments,
      count: assessments.length
    });
  } catch (error) {
    console.error('Error fetching competency assessments:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch competency assessments',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/mentor/competency-assessment
 * Create or update a competency assessment
 */
export async function POST(req: NextRequest) {
  try {
    const cookies = req.cookies;
    const mentorId = cookies.get('user_id')?.value;
    const userRole = cookies.get('role')?.value;

    // Accept both 'mentor' and 'teacher' roles (teachers can be mentors)
    if (!mentorId || (userRole !== 'teacher' && userRole !== 'admin' && userRole !== 'mentor')) {
      return NextResponse.json(
        { error: 'Unauthorized - mentor access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { mentee_id, competency_id, level, feedback } = body;

    // Validate input
    if (!mentee_id || !competency_id || level === undefined || level < 1 || level > 5) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          message: 'competency_id, mentee_id, level (1-5), and feedback are required'
        },
        { status: 400 }
      );
    }

    // Mock saving the assessment
    const assessment = {
      assessment_id: `cass-${Date.now()}`,
      mentee_id,
      competency_id,
      current_level: level,
      feedback,
      assessment_date: new Date().toISOString(),
      created_by: mentorId,
      status: 'completed'
    };

    return NextResponse.json({
      success: true,
      message: 'Competency assessment saved successfully',
      data: assessment
    });
  } catch (error) {
    console.error('Error saving competency assessment:', error);
    return NextResponse.json(
      {
        error: 'Failed to save competency assessment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
