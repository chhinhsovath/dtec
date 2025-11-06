import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/teacher/assessments
 * Fetch assessments for teacher's courses
 */
export async function GET(request: NextRequest) {
  try {
    const teacherId = request.headers.get('x-teacher-id');
    const courseId = request.nextUrl.searchParams.get('courseId');

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID required', code: 'MISSING_TEACHER_ID' },
        { status: 400 }
      );
    }

    let sql = `
      SELECT
        a.id,
        a.course_id,
        a.title,
        a.description,
        a.assessment_type,
        a.total_points,
        a.due_date,
        a.allow_retakes,
        a.max_attempts,
        a.show_answers,
        a.shuffle_questions,
        a.time_limit_minutes,
        a.is_published,
        a.created_at,
        a.updated_at,
        c.name as course_name,
        COUNT(DISTINCT q.id) as question_count,
        COUNT(DISTINCT s.id) as submission_count
      FROM assessments a
      JOIN courses c ON c.id = a.course_id
      JOIN teacher_courses tc ON tc.course_id = c.id
      LEFT JOIN questions q ON q.assessment_id = a.id
      LEFT JOIN submissions s ON s.assessment_id = a.id
      WHERE tc.teacher_id = $1
    `;

    const params: any[] = [teacherId];

    if (courseId) {
      sql += ` AND a.course_id = $2`;
      params.push(courseId);
    }

    sql += ` GROUP BY a.id, c.id ORDER BY a.created_at DESC`;

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      assessments: result.rows,
      total: result.rows.length
    });
  } catch (error: any) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch assessments',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teacher/assessments
 * Create a new assessment
 */
export async function POST(request: NextRequest) {
  try {
    const teacherId = request.headers.get('x-teacher-id');
    const body = await request.json();

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID required', code: 'MISSING_TEACHER_ID' },
        { status: 400 }
      );
    }

    const {
      courseId,
      title,
      description,
      assessmentType,
      totalPoints = 100,
      dueDate,
      allowRetakes = false,
      maxAttempts = 1,
      showAnswers = false,
      shuffleQuestions = false,
      timeLimitMinutes,
      isPublished = false
    } = body;

    if (!courseId || !title || !assessmentType) {
      return NextResponse.json(
        { error: 'Course ID, title, and assessment type are required', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    // Verify teacher owns the course
    const courseCheck = await query(
      `SELECT 1 FROM teacher_courses WHERE teacher_id = $1 AND course_id = $2`,
      [teacherId, courseId]
    );

    if (courseCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    const result = await query(`
      INSERT INTO assessments
      (course_id, teacher_id, title, description, assessment_type, total_points,
       due_date, allow_retakes, max_attempts, show_answers, shuffle_questions,
       time_limit_minutes, is_published, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      RETURNING
        id, course_id, title, description, assessment_type, total_points,
        due_date, allow_retakes, max_attempts, show_answers, shuffle_questions,
        time_limit_minutes, is_published, created_at, updated_at
    `, [
      courseId, teacherId, title, description || null, assessmentType,
      totalPoints, dueDate || null, allowRetakes, maxAttempts, showAnswers,
      shuffleQuestions, timeLimitMinutes || null, isPublished
    ]);

    return NextResponse.json({
      success: true,
      message: 'Assessment created successfully',
      assessment: result.rows[0]
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating assessment:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to create assessment',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}
