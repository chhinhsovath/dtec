import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/coordinator/mentors
 * List all mentors and their assignments
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

    // Mock mentor list data
    const mentors = [
      {
        mentor_id: 'ment-001',
        mentor_code: 'MEN-2025-001',
        full_name: 'Dr. Neath Sophea',
        email: 'neath.sophea@school.edu',
        phone: '+855-12-111-111',
        school: 'Royal School of Excellence',
        expertise_areas: ['Mathematics', 'Science', 'Pedagogy'],
        mentees_assigned: 4,
        mentees_capacity: 5,
        active_sessions: 3,
        average_feedback_rating: 4.5,
        status: 'active',
        years_experience: 8,
        certifications: ['Master in Education', 'Mentor Certification']
      },
      {
        mentor_id: 'ment-002',
        mentor_code: 'MEN-2025-002',
        full_name: 'Dr. Sophea Serey',
        email: 'sophea.serey@school.edu',
        phone: '+855-12-222-222',
        school: 'Central Education Institute',
        expertise_areas: ['Language Arts', 'Social Studies', 'Curriculum Design'],
        mentees_assigned: 5,
        mentees_capacity: 5,
        active_sessions: 5,
        average_feedback_rating: 4.7,
        status: 'active',
        years_experience: 12,
        certifications: ['PhD in Education', 'Mentor Certification', 'Curriculum Specialist']
      },
      {
        mentor_id: 'ment-003',
        mentor_code: 'MEN-2025-003',
        full_name: 'Dr. Sopheak Chea',
        email: 'sopheak.chea@school.edu',
        phone: '+855-12-333-333',
        school: 'National Teacher Training Center',
        expertise_areas: ['Technology in Education', 'Assessment', 'Professional Development'],
        mentees_assigned: 3,
        mentees_capacity: 5,
        active_sessions: 2,
        average_feedback_rating: 4.2,
        status: 'active',
        years_experience: 6,
        certifications: ['Master in Educational Technology', 'Mentor Certification']
      }
    ];

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');

    let filtered = mentors;
    if (status) {
      filtered = mentors.filter(m => m.status === status);
    }

    return NextResponse.json({
      success: true,
      data: filtered,
      count: filtered.length,
      summary: {
        total_mentors: mentors.length,
        active_mentors: mentors.filter(m => m.status === 'active').length,
        total_mentees_assigned: mentors.reduce((sum, m) => sum + m.mentees_assigned, 0),
        total_capacity: mentors.reduce((sum, m) => sum + m.mentees_capacity, 0),
        average_rating: (mentors.reduce((sum, m) => sum + m.average_feedback_rating, 0) / mentors.length).toFixed(2)
      }
    });
  } catch (error) {
    console.error('Error fetching mentors:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch mentors',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/coordinator/mentors
 * Register a new mentor
 */
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { full_name, email, phone, school, expertise_areas, mentees_capacity, certifications } = body;

    // Validate input
    if (!full_name || !email || !school) {
      return NextResponse.json(
        { error: 'Invalid input', message: 'full_name, email, and school are required' },
        { status: 400 }
      );
    }

    // Mock creating mentor
    const mentor = {
      mentor_id: `ment-${Date.now()}`,
      mentor_code: `MEN-2025-${Math.floor(Math.random() * 999)}`,
      full_name,
      email,
      phone: phone || null,
      school,
      expertise_areas: expertise_areas || [],
      mentees_assigned: 0,
      mentees_capacity: mentees_capacity || 5,
      active_sessions: 0,
      average_feedback_rating: 0,
      status: 'active',
      years_experience: 0,
      certifications: certifications || [],
      created_by: coordinatorId,
      created_date: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: 'Mentor registered successfully',
      data: mentor
    });
  } catch (error) {
    console.error('Error registering mentor:', error);
    return NextResponse.json(
      {
        error: 'Failed to register mentor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/coordinator/mentors
 * Update mentor information
 */
export async function PUT(req: NextRequest) {
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

    const body = await req.json();
    const { mentor_id, status, mentees_capacity } = body;

    // Validate input
    if (!mentor_id) {
      return NextResponse.json(
        { error: 'Invalid input', message: 'mentor_id is required' },
        { status: 400 }
      );
    }

    // Mock update
    const updated = {
      mentor_id,
      ...(status && { status }),
      ...(mentees_capacity && { mentees_capacity }),
      updated_by: coordinatorId,
      updated_date: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: 'Mentor information updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error updating mentor:', error);
    return NextResponse.json(
      {
        error: 'Failed to update mentor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
