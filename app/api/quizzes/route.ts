import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/quizzes
 * Fetch all quizzes with filtering by course, module, or type
 */
export async function GET(request: NextRequest) {
  try {
    const courseId = request.nextUrl.searchParams.get('courseId');
    const moduleId = request.nextUrl.searchParams.get('moduleId');
    const quizType = request.nextUrl.searchParams.get('quizType');
    const published = request.nextUrl.searchParams.get('published');
    const limit = request.nextUrl.searchParams.get('limit') || '100';

    let sql = `SELECT
                q.*,
                c.name as course_name,
                cm.title as module_title,
                p.email as created_by_email,
                COUNT(qq.id) as total_questions
              FROM quizzes q
              LEFT JOIN courses c ON q.course_id = c.id
              LEFT JOIN course_modules cm ON q.module_id = cm.id
              LEFT JOIN profiles p ON q.created_by = p.id
              LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
              WHERE 1=1`;
    const params: unknown[] = [];

    if (courseId) {
      sql += ` AND q.course_id = $${params.length + 1}`;
      params.push(courseId);
    }

    if (moduleId) {
      sql += ` AND q.module_id = $${params.length + 1}`;
      params.push(moduleId);
    }

    if (quizType) {
      sql += ` AND q.quiz_type = $${params.length + 1}`;
      params.push(quizType);
    }

    if (published !== null) {
      const isPublished = published === 'true';
      sql += ` AND q.is_published = $${params.length + 1}`;
      params.push(isPublished);
    }

    sql += ` GROUP BY q.id, c.id, cm.id, p.id
             ORDER BY q.created_at DESC
             LIMIT ${parseInt(limit)}`;

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rowCount || 0,
    });
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch quizzes',
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
 * POST /api/quizzes
 * Create a new quiz
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.courseId || !body.createdBy) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          meta: {
            code: 'VALIDATION_ERROR',
            required: ['title', 'courseId', 'createdBy'],
          },
        },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO quizzes (
        course_id, module_id, created_by, title, description,
        quiz_type, total_questions, total_points, passing_score,
        time_limit_minutes, show_answers_after_submit, show_score_immediately,
        shuffle_questions, random_selection, number_of_random_questions,
        due_date, available_from, available_until, is_published,
        allow_review, attempts_allowed
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *`,
      [
        body.courseId,
        body.moduleId || null,
        body.createdBy,
        body.title,
        body.description || null,
        body.quizType || 'quiz',
        body.totalQuestions || 0,
        body.totalPoints || null,
        body.passingScore || null,
        body.timeLimitMinutes || null,
        body.showAnswersAfterSubmit || false,
        body.showScoreImmediately || true,
        body.shuffleQuestions || false,
        body.randomSelection || false,
        body.numberOfRandomQuestions || null,
        body.dueDate || null,
        body.availableFrom || null,
        body.availableUntil || null,
        body.isPublished || false,
        body.allowReview !== false,
        body.attemptsAllowed ?? 1,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Quiz created successfully',
        data: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating quiz:', error);
    return NextResponse.json(
      {
        error: 'Failed to create quiz',
        meta: {
          code: 'CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
