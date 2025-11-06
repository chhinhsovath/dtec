import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/teacher/submissions
 * Fetch submissions for teacher's assessments
 */
export async function GET(request: NextRequest) {
  try {
    const teacherId = request.headers.get('x-teacher-id');
    const assessmentId = request.nextUrl.searchParams.get('assessmentId');
    const status = request.nextUrl.searchParams.get('status');

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID required', code: 'MISSING_TEACHER_ID' },
        { status: 400 }
      );
    }

    let sql = `
      SELECT
        s.id,
        s.assessment_id,
        s.student_id,
        s.status,
        s.score,
        s.max_score,
        s.started_at,
        s.submitted_at,
        s.graded_at,
        s.time_spent_minutes,
        s.created_at,
        s.updated_at,
        a.title as assessment_title,
        p.first_name,
        p.last_name
      FROM submissions s
      JOIN assessments a ON a.id = s.assessment_id
      JOIN students st ON st.id = s.student_id
      JOIN profiles p ON p.user_id = st.user_id
      WHERE a.teacher_id = $1
    `;

    const params: any[] = [teacherId];
    let paramIndex = 2;

    if (assessmentId) {
      sql += ` AND s.assessment_id = $${paramIndex}`;
      params.push(assessmentId);
      paramIndex++;
    }

    if (status) {
      sql += ` AND s.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    sql += ` ORDER BY s.submitted_at DESC`;

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      submissions: result.rows,
      total: result.rows.length
    });
  } catch (error: any) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch submissions',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}
