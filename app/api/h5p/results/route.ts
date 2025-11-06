import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/h5p/results
 * Fetch H5P results with filtering by content or student
 */
export async function GET(request: NextRequest) {
  try {
    const contentId = request.nextUrl.searchParams.get('contentId');
    const studentId = request.nextUrl.searchParams.get('studentId');
    const limit = request.nextUrl.searchParams.get('limit') || '100';

    // Since h5p_results table may not exist yet, use quiz attempts as proxy
    let sql = `SELECT
                a.id,
                a.quiz_id as content_id,
                a.student_id,
                a.total_score as score,
                a.percentage_score,
                a.passed,
                a.start_time,
                a.end_time,
                a.time_spent_seconds,
                'quiz' as content_type,
                p.email as student_email,
                p.first_name,
                p.last_name
              FROM student_quiz_attempts a
              LEFT JOIN profiles p ON a.student_id = p.id
              WHERE 1=1`;
    const params: unknown[] = [];

    if (contentId) {
      sql += ` AND a.quiz_id = $${params.length + 1}`;
      params.push(contentId);
    }

    if (studentId) {
      sql += ` AND a.student_id = $${params.length + 1}`;
      params.push(studentId);
    }

    sql += ` ORDER BY a.start_time DESC LIMIT ${parseInt(limit)}`;

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rowCount || 0,
    });
  } catch (error) {
    console.error('Error fetching H5P results:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch H5P results',
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
 * POST /api/h5p/results
 * Record H5P xAPI statement (Learning Record Store integration)
 * This endpoint receives xAPI statements from H5P player
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate xAPI statement
    if (!body.actor || !body.verb || !body.object) {
      return NextResponse.json(
        {
          error: 'Invalid xAPI statement',
          meta: {
            code: 'VALIDATION_ERROR',
            required: ['actor', 'verb', 'object'],
          },
        },
        { status: 400 }
      );
    }

    // Parse xAPI statement
    const actorEmail = body.actor?.mbox?.replace('mailto:', '') || 'unknown@example.com';
    const actorName = body.actor?.name || 'Unknown';
    const verbId = body.verb?.id || '';
    const objectId = body.object?.id || '';
    const score = body.result?.score?.raw || 0;
    const maxScore = body.result?.score?.max || 100;
    const completion = body.result?.completion || false;
    const duration = body.result?.duration || 'PT0S';

    // Get student ID from email
    const studentResult = await query(
      `SELECT id FROM profiles WHERE email = $1`,
      [actorEmail]
    );

    if (studentResult.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Student not found',
          meta: { code: 'STUDENT_NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    const studentId = studentResult.rows[0].id;

    // Store xAPI statement (basic logging)
    // In a production system, you would store this in an h5p_results or lrs table
    console.log('xAPI Statement:', {
      student: actorName,
      email: actorEmail,
      verb: verbId,
      object: objectId,
      score: `${score}/${maxScore}`,
      completed: completion,
      timestamp: new Date().toISOString(),
    });

    // Create grade entry if this is a completion statement
    if (completion && verbId.includes('completed')) {
      const percentageScore = (score / maxScore) * 100;

      // Find content ID from objectId (would need actual h5p content linking)
      // For now, we'll just log this as an H5P activity result

      await query(
        `INSERT INTO grades (student_id, course_id, h5p_content_id, score, max_score, grade_type, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'h5p', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [studentId, 'unknown-course', objectId, score, maxScore]
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'xAPI statement recorded',
        data: {
          studentId,
          score,
          maxScore,
          percentageScore: (score / maxScore) * 100,
          completed: completion,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error recording H5P result:', error);
    return NextResponse.json(
      {
        error: 'Failed to record H5P result',
        meta: {
          code: 'RECORD_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
