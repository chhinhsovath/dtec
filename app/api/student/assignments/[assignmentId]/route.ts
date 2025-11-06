import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/student/assignments/[assignmentId]
 * Get assignment details with all questions for student to answer
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
    const studentId = request.headers.get('x-student-id');
    const assignmentId = params.assignmentId;

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID required', code: 'MISSING_STUDENT_ID' },
        { status: 400 }
      );
    }

    // Get assignment details
    const assignmentResult = await query(`
      SELECT
        a.id,
        a.title,
        a.description,
        a.max_score,
        a.due_date,
        a.status,
        c.id as course_id,
        c.code,
        c.name as course_name
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      JOIN enrollments e ON c.id = e.course_id
      JOIN students s ON e.student_id = s.id
      WHERE a.id = $1 AND s.id = $2 AND e.status = 'active'
    `, [assignmentId, studentId]);

    if (assignmentResult.rowCount === 0) {
      return NextResponse.json(
        { error: 'Assignment not found or you are not enrolled in this course', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const assignment = assignmentResult.rows[0];

    // Get all questions with options
    const questionsResult = await query(`
      SELECT
        aq.id,
        aq.question_number,
        aq.question_type,
        aq.question_text,
        aq.question_description,
        aq.points,
        aq.required
      FROM assignment_questions aq
      WHERE aq.assignment_id = $1 AND aq.is_published = true
      ORDER BY aq.question_number ASC
    `, [assignmentId]);

    // Get options for each MCQ question
    const questionsWithOptions = await Promise.all(
      questionsResult.rows.map(async (q: any) => {
        if (q.question_type !== 'multiple_choice') {
          return q;
        }

        const optionsResult = await query(`
          SELECT id, option_number, option_text
          FROM question_options
          WHERE question_id = $1
          ORDER BY option_number ASC
        `, [q.id]);

        return {
          ...q,
          options: optionsResult.rows
        };
      })
    );

    // Get student's existing submission if any
    let existingSubmission = null;
    const submissionResult = await query(`
      SELECT id, status, submitted_at
      FROM assignment_submissions
      WHERE assignment_id = $1 AND student_id = $2
      LIMIT 1
    `, [assignmentId, studentId]);

    if (submissionResult.rowCount > 0) {
      existingSubmission = submissionResult.rows[0];

      // Get student's existing responses
      const responsesResult = await query(`
        SELECT
          ar.question_id,
          ar.response_text,
          ar.selected_option_id,
          ar.h5p_response_data,
          ar.score
        FROM assignment_responses ar
        WHERE ar.submission_id = $1
      `, [existingSubmission.id]);

      existingSubmission.responses = responsesResult.rows;
    }

    return NextResponse.json({
      success: true,
      data: {
        assignment,
        questions: questionsWithOptions,
        existingSubmission,
        totalQuestions: questionsWithOptions.length,
        totalPoints: questionsWithOptions.reduce((sum: number, q: any) => sum + (q.points || 1), 0)
      }
    });
  } catch (error: any) {
    console.error('Error fetching assignment:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch assignment',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}
