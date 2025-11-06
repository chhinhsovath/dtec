import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * POST /api/learning-paths/enroll
 * Enroll a student in a learning path
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.pathId || !body.studentId) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          meta: {
            code: 'VALIDATION_ERROR',
            required: ['pathId', 'studentId'],
          },
        },
        { status: 400 }
      );
    }

    // Check if already enrolled
    const existingEnrollment = await query(
      `SELECT id FROM student_path_progress
       WHERE path_id = $1 AND student_id = $2`,
      [body.pathId, body.studentId]
    );

    if (existingEnrollment.rowCount && existingEnrollment.rowCount > 0) {
      return NextResponse.json(
        {
          error: 'Already enrolled in this learning path',
          meta: { code: 'ALREADY_ENROLLED' },
        },
        { status: 409 }
      );
    }

    // Create enrollment
    const result = await query(
      `INSERT INTO student_path_progress (
        path_id, student_id, status, enrollment_date, progress_percentage
      ) VALUES ($1, $2, 'enrolled', CURRENT_TIMESTAMP, 0)
      RETURNING *`,
      [body.pathId, body.studentId]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Enrolled in learning path successfully',
        data: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error enrolling in learning path:', error);
    return NextResponse.json(
      {
        error: 'Failed to enroll in learning path',
        meta: {
          code: 'ENROLL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
