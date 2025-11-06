import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/coordinator/students
 * List all students with their progress
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

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    const batch = searchParams.get('batch');
    const search = searchParams.get('search');

    // Mock student list data
    let students = [
      {
        student_id: 'stu-001',
        student_code: 'GS-2025-001',
        full_name: 'Sophea Khmer',
        email: 'sophea@pedagogy.edu',
        phone: '+855-12-345-678',
        batch_code: 'BATCH-2025-01',
        batch_name: 'Cohort A - 2025',
        enrollment_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'in_progress',
        completion_percentage: 72,
        mentor_assigned: 'Dr. Neath Sophea',
        mentor_id: 'ment-001',
        competencies_at_level_3: 7,
        total_competencies: 10,
        teaching_hours_logged: 98,
        teaching_hours_target: 120,
        portfolios_submitted: 12,
        portfolios_required: 20,
        certification_ready: false
      },
      {
        student_id: 'stu-002',
        student_code: 'GS-2025-002',
        full_name: 'Vantha Dara',
        email: 'vantha@pedagogy.edu',
        phone: '+855-12-345-679',
        batch_code: 'BATCH-2025-01',
        batch_name: 'Cohort A - 2025',
        enrollment_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'completed',
        completion_percentage: 100,
        mentor_assigned: 'Dr. Sophea Serey',
        mentor_id: 'ment-002',
        competencies_at_level_3: 10,
        total_competencies: 10,
        teaching_hours_logged: 125,
        teaching_hours_target: 120,
        portfolios_submitted: 20,
        portfolios_required: 20,
        certification_ready: true
      },
      {
        student_id: 'stu-003',
        student_code: 'GS-2025-003',
        full_name: 'Chea Sophany',
        email: 'sophany@pedagogy.edu',
        phone: '+855-12-345-680',
        batch_code: 'BATCH-2025-01',
        batch_name: 'Cohort A - 2025',
        enrollment_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'in_progress',
        completion_percentage: 45,
        mentor_assigned: 'Dr. Sopheak Chea',
        mentor_id: 'ment-003',
        competencies_at_level_3: 4,
        total_competencies: 10,
        teaching_hours_logged: 52,
        teaching_hours_target: 120,
        portfolios_submitted: 6,
        portfolios_required: 20,
        certification_ready: false
      }
    ];

    // Apply filters
    if (status) {
      students = students.filter(s => s.status === status);
    }
    if (batch) {
      students = students.filter(s => s.batch_code === batch);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      students = students.filter(
        s =>
          s.full_name.toLowerCase().includes(searchLower) ||
          s.student_code.toLowerCase().includes(searchLower) ||
          s.email.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({
      success: true,
      data: students,
      count: students.length,
      filters: {
        status,
        batch,
        search
      },
      summary: {
        total: 48,
        in_progress: students.filter(s => s.status === 'in_progress').length,
        completed: students.filter(s => s.status === 'completed').length,
        certification_ready: students.filter(s => s.certification_ready).length
      }
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch students',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/coordinator/students
 * Update student information or status
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
    const { student_id, mentor_id, status } = body;

    // Validate input
    if (!student_id) {
      return NextResponse.json(
        { error: 'Invalid input', message: 'student_id is required' },
        { status: 400 }
      );
    }

    // Mock update
    const updated = {
      student_id,
      ...(mentor_id && { mentor_id, mentor_assigned: 'Updated Mentor' }),
      ...(status && { status }),
      updated_by: coordinatorId,
      updated_date: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: 'Student information updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json(
      {
        error: 'Failed to update student',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
