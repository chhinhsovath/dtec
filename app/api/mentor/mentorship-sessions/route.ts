import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/mentor/mentorship-sessions
 * List all mentorship sessions for mentor
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

    // Mock data for mentorship sessions
    const sessions = [
      {
        session_id: 'sess-001',
        mentee_id: 'stu-001',
        mentee_name: 'Sophea Khmer',
        session_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        session_time: '14:00',
        duration_minutes: 60,
        location: 'School Office',
        topic: 'Classroom Management Strategies',
        status: 'scheduled',
        notes: null,
        meeting_link: 'https://meet.example.com/sess-001'
      },
      {
        session_id: 'sess-002',
        mentee_id: 'stu-001',
        mentee_name: 'Sophea Khmer',
        session_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        session_time: '15:00',
        duration_minutes: 45,
        location: 'Virtual - Zoom',
        topic: 'Lesson Planning Review',
        status: 'completed',
        notes: 'Good progress on differentiation. Focus on assessment next week.',
        meeting_link: 'https://zoom.us/j/example'
      },
      {
        session_id: 'sess-003',
        mentee_id: 'stu-002',
        mentee_name: 'Vantha Dara',
        session_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        session_time: '16:00',
        duration_minutes: 60,
        location: 'School Office',
        topic: 'Subject Matter Knowledge',
        status: 'scheduled',
        notes: null,
        meeting_link: 'https://meet.example.com/sess-003'
      }
    ];

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');

    let filtered = sessions;
    if (status) {
      filtered = sessions.filter(s => s.status === status);
    }

    return NextResponse.json({
      success: true,
      data: filtered,
      count: filtered.length,
      stats: {
        scheduled: sessions.filter(s => s.status === 'scheduled').length,
        completed: sessions.filter(s => s.status === 'completed').length,
        cancelled: sessions.filter(s => s.status === 'cancelled').length
      }
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
 * POST /api/mentor/mentorship-sessions
 * Create or schedule a new mentorship session
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
    const { mentee_id, session_date, session_time, duration_minutes, topic, location, meeting_link } = body;

    // Validate input
    if (!mentee_id || !session_date || !session_time || !topic) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          message: 'mentee_id, session_date, session_time, and topic are required'
        },
        { status: 400 }
      );
    }

    // Mock creating the session
    const session = {
      session_id: `sess-${Date.now()}`,
      mentee_id,
      session_date,
      session_time,
      duration_minutes: duration_minutes || 60,
      topic,
      location: location || 'Virtual',
      status: 'scheduled',
      created_by: mentorId,
      created_date: new Date().toISOString(),
      meeting_link: meeting_link || null
    };

    return NextResponse.json({
      success: true,
      message: 'Mentorship session scheduled successfully',
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

/**
 * PUT /api/mentor/mentorship-sessions
 * Update an existing mentorship session
 */
export async function PUT(req: NextRequest) {
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
    const { session_id, status, notes } = body;

    // Validate input
    if (!session_id) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          message: 'session_id is required'
        },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['scheduled', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          {
            error: 'Invalid status',
            message: `status must be one of: ${validStatuses.join(', ')}`
          },
          { status: 400 }
        );
      }
    }

    // Mock updating the session
    const updated = {
      session_id,
      status: status || 'scheduled',
      notes: notes || null,
      updated_by: mentorId,
      updated_date: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: 'Mentorship session updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error updating mentorship session:', error);
    return NextResponse.json(
      {
        error: 'Failed to update mentorship session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
