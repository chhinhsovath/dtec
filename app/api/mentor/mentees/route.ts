import { NextRequest, NextResponse } from 'next/server';
import { getMentorMentees } from '@/lib/services/pedagogy-service';

/**
 * GET /api/mentor/mentees
 * Get all mentees for a mentor
 */
export async function GET(req: NextRequest) {
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

    const mentees = await getMentorMentees(mentorId);

    return NextResponse.json({
      success: true,
      data: mentees,
      count: mentees.length
    });
  } catch (error) {
    console.error('Error fetching mentees:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch mentees',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
