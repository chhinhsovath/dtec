import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/grades
 * Fetch grades with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const studentId = request.nextUrl.searchParams.get('studentId');
    const assignmentId = request.nextUrl.searchParams.get('assignmentId');
    const courseId = request.nextUrl.searchParams.get('courseId');
    const limit = request.nextUrl.searchParams.get('limit') || '100';

    let sql = 'SELECT g.*, asub.submission_text, asub.file_url, asub.submitted_at, a.title as assignment_title, a.max_score, c.name as course_name, c.code as course_code, s.id as student_id, p.full_name as student_name, p.email as student_email, gp.full_name as graded_by_name FROM grades g LEFT JOIN assignment_submissions asub ON g.assignment_submission_id = asub.id LEFT JOIN assignments a ON asub.assignment_id = a.id LEFT JOIN courses c ON a.course_id = c.id LEFT JOIN students s ON asub.student_id = s.id LEFT JOIN profiles p ON s.user_id = p.id LEFT JOIN profiles gp ON g.graded_by = gp.id WHERE 1=1';

    const params: unknown[] = [];

    if (studentId) {
      sql += ' AND s.id = $' + (params.length + 1);
      params.push(studentId);
    }

    if (assignmentId) {
      sql += ' AND a.id = $' + (params.length + 1);
      params.push(assignmentId);
    }

    if (courseId) {
      sql += ' AND c.id = $' + (params.length + 1);
      params.push(courseId);
    }

    const limitNum = parseInt(limit);
    sql += ' ORDER BY g.graded_at DESC LIMIT ' + limitNum;

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rowCount || 0,
    });
  } catch (error) {
    console.error('Error fetching grades:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch grades',
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
 * POST /api/grades
 * Submit a grade for an assignment submission
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.assignmentSubmissionId || body.score === undefined || !body.gradedBy) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          meta: {
            code: 'VALIDATION_ERROR',
            required: ['assignmentSubmissionId', 'score', 'gradedBy'],
          },
        },
        { status: 400 }
      );
    }

    const existing = await query(
      'SELECT id FROM grades WHERE assignment_submission_id = $1',
      [body.assignmentSubmissionId]
    );

    let result;

    if (existing.rows.length > 0) {
      result = await query(
        'UPDATE grades SET score = $1, feedback = $2, graded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE assignment_submission_id = $3 RETURNING *',
        [body.score, body.feedback || null, body.assignmentSubmissionId]
      );
    } else {
      result = await query(
        'INSERT INTO grades (assignment_submission_id, score, feedback, graded_by, graded_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING *',
        [body.assignmentSubmissionId, body.score, body.feedback || null, body.gradedBy]
      );
    }

    await query(
      'UPDATE assignment_submissions SET status = $1 WHERE id = $2',
      ['graded', body.assignmentSubmissionId]
    );

    return NextResponse.json(
      {
        success: true,
        message: existing.rows.length > 0 ? 'Grade updated successfully' : 'Grade submitted successfully',
        data: result.rows[0],
      },
      { status: existing.rows.length > 0 ? 200 : 201 }
    );
  } catch (error) {
    console.error('Error creating/updating grade:', error);
    return NextResponse.json(
      {
        error: 'Failed to submit grade',
        meta: {
          code: 'CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
