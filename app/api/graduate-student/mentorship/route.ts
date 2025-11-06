import { NextRequest, NextResponse } from 'next/server';
import { getMentorSessions, createMentorSession } from '@/lib/services/pedagogy-service';

/**
 * GET /api/graduate-student/mentorship
 * Get mentorship sessions for graduate student
 */
export async function GET(req: NextRequest) {
  try {
    const cookies = req.cookies;
    const userId = cookies.get('user_id')?.value;
    const mentorId = req.nextUrl.searchParams.get('mentorId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const sessions = await getMentorSessions(userId, mentorId || undefined);

    return NextResponse.json({
      success: true,
      data: sessions,
      count: sessions.length
    });
  } catch (error) {
    console.error('Error fetching mentorship sessions:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch mentorship sessions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/graduate-student/mentorship
 * Create mentorship session (mentor only)
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
      sessionDate,
      sessionDurationMinutes,
      topicKm,
      topicEn,
      feedbackKm,
      feedbackEn,
      actionItemsKm,
      actionItemsEn
    } = body;

    // Validate required fields
    if (!graduateStudentId || !sessionDate || sessionDurationMinutes === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const session = await createMentorSession(
      mentorId,
      graduateStudentId,
      sessionDate,
      sessionDurationMinutes,
      topicKm || '',
      topicEn || '',
      feedbackKm || '',
      feedbackEn || '',
      actionItemsKm || '',
      actionItemsEn || ''
    );

    return NextResponse.json({
      success: true,
      message: 'Mentorship session created',
      data: session
    });
  } catch (error) {
    console.error('Error creating mentorship session:', error);
    return NextResponse.json(
      {
        error: 'Failed to create mentorship session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
