import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/mentor/portfolio-review
 * List all portfolio submissions for mentor's mentees
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

    // Mock data for portfolio submissions
    const portfolios = [
      {
        portfolio_id: 'port-001',
        mentee_id: 'stu-001',
        mentee_name: 'Sophea Khmer',
        competency_id: 'comp-001',
        competency_name: 'Self-Awareness',
        submission_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        title: 'Teaching Reflection Journa l',
        description: 'Weekly reflection on classroom management challenges and solutions',
        evidence_type: 'document',
        file_url: '/portfolio/evidence-001.pdf',
        status: 'pending_review',
        mentor_feedback: null
      },
      {
        portfolio_id: 'port-002',
        mentee_id: 'stu-001',
        mentee_name: 'Sophea Khmer',
        competency_id: 'comp-002',
        competency_name: 'Subject Matter Knowledge',
        submission_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        title: 'Lesson Plan - Biology Unit',
        description: 'Comprehensive lesson plan demonstrating subject expertise',
        evidence_type: 'document',
        file_url: '/portfolio/evidence-002.pdf',
        status: 'reviewed',
        mentor_feedback: 'Excellent lesson structure with clear learning objectives'
      }
    ];

    return NextResponse.json({
      success: true,
      data: portfolios,
      count: portfolios.length,
      pending: portfolios.filter(p => p.status === 'pending_review').length,
      reviewed: portfolios.filter(p => p.status === 'reviewed').length
    });
  } catch (error) {
    console.error('Error fetching portfolio submissions:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch portfolio submissions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/mentor/portfolio-review
 * Submit feedback on a portfolio submission
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
    const { portfolio_id, feedback, status, rating } = body;

    // Validate input
    if (!portfolio_id || !feedback || !status) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          message: 'portfolio_id, feedback, and status are required'
        },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['pending_review', 'reviewed', 'rejected', 'needs_revision'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: 'Invalid status',
          message: `status must be one of: ${validStatuses.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Mock saving the review
    const review = {
      portfolio_id,
      mentor_feedback: feedback,
      review_status: status,
      rating: rating || 3,
      reviewed_by: mentorId,
      reviewed_date: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: 'Portfolio feedback submitted successfully',
      data: review
    });
  } catch (error) {
    console.error('Error submitting portfolio feedback:', error);
    return NextResponse.json(
      {
        error: 'Failed to submit portfolio feedback',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
