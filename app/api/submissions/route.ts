import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/submissions
 * Fetch submissions with optional filtering
 *
 * Query Parameters:
 * - assignmentId: Filter by assignment
 * - studentId: Filter by student
 * - status: Filter by status (draft, submitted, graded)
 * - includeGrades: Include grade information (true/false)
 */
export async function GET(request: NextRequest) {
  try {
    const assignmentId = request.nextUrl.searchParams.get('assignmentId');
    const studentId = request.nextUrl.searchParams.get('studentId');
    const status = request.nextUrl.searchParams.get('status');
    const includeGrades = request.nextUrl.searchParams.get('includeGrades') === 'true';

    let sql = `SELECT
      s.*,
      a.title as assignment_title,
      a.due_date,
      a.max_score,
      p.full_name as student_name
      ${includeGrades ? ', g.score, g.feedback, g.graded_at, g.graded_by' : ''}
     FROM assignment_submissions s
     LEFT JOIN assignments a ON s.assignment_id = a.id
     LEFT JOIN students st ON s.student_id = st.id
     LEFT JOIN profiles p ON st.user_id = p.id
     ${includeGrades ? 'LEFT JOIN grades g ON s.id = g.assignment_submission_id' : ''}
     WHERE 1=1`;

    const params: unknown[] = [];

    if (assignmentId) {
      sql += ` AND s.assignment_id = $${params.length + 1}`;
      params.push(assignmentId);
    }

    if (studentId) {
      sql += ` AND s.student_id = $${params.length + 1}`;
      params.push(studentId);
    }

    if (status) {
      sql += ` AND s.status = $${params.length + 1}`;
      params.push(status);
    }

    sql += ' ORDER BY s.submitted_at DESC';

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rowCount || 0,
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch submissions',
        meta: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/submissions
 * Create a new submission (student submitting work)
 *
 * Request Body:
 * {
 *   assignmentId: string (UUID)
 *   studentId: string (UUID)
 *   submissionText?: string
 *   fileUrl?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.assignmentId || !body.studentId) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          meta: {
            code: 'VALIDATION_ERROR',
            required: ['assignmentId', 'studentId'],
          },
        },
        { status: 400 }
      );
    }

    // Check if submission already exists (UNIQUE constraint)
    const existing = await query(
      'SELECT id FROM assignment_submissions WHERE assignment_id = $1 AND student_id = $2',
      [body.assignmentId, body.studentId]
    );

    if (existing.rows.length > 0) {
      // Update existing submission instead of creating new one
      const result = await query(
        `UPDATE assignment_submissions
         SET submission_text = $1, file_url = $2, status = 'submitted', submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE assignment_id = $3 AND student_id = $4
         RETURNING *`,
        [
          body.submissionText || null,
          body.fileUrl || null,
          body.assignmentId,
          body.studentId,
        ]
      );

      return NextResponse.json({
        success: true,
        message: 'Submission updated successfully',
        data: result.rows[0],
      });
    }

    // Create new submission
    const result = await query(
      `INSERT INTO assignment_submissions (assignment_id, student_id, submission_text, file_url, status, submitted_at)
       VALUES ($1, $2, $3, $4, 'submitted', CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        body.assignmentId,
        body.studentId,
        body.submissionText || null,
        body.fileUrl || null,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Submission created successfully',
        data: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating submission:', error);
    return NextResponse.json(
      {
        error: 'Failed to create submission',
        meta: {
          code: 'CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
