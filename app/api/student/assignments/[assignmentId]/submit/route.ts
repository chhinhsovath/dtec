import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * POST /api/student/assignments/[assignmentId]/submit
 * Submit student responses to all assignment questions
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
    const studentId = request.headers.get('x-student-id');
    const assignmentId = params.assignmentId;
    const body = await request.json();
    const { responses } = body; // Array of { questionId, responseText?, selectedOptionId?, h5pResponseData? }

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID required', code: 'MISSING_STUDENT_ID' },
        { status: 400 }
      );
    }

    if (!Array.isArray(responses) || responses.length === 0) {
      return NextResponse.json(
        { error: 'Responses array is required', code: 'MISSING_RESPONSES' },
        { status: 400 }
      );
    }

    // Get student's ID from profiles table
    const studentResult = await query(`
      SELECT id FROM students WHERE id = $1
    `, [studentId]);

    if (studentResult.rowCount === 0) {
      return NextResponse.json(
        { error: 'Student not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verify student is enrolled in course
    const enrollmentResult = await query(`
      SELECT e.id FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      JOIN assignments a ON c.id = a.course_id
      WHERE a.id = $1 AND e.student_id = $2 AND e.status = 'active'
    `, [assignmentId, studentId]);

    if (enrollmentResult.rowCount === 0) {
      return NextResponse.json(
        { error: 'You are not enrolled in this course', code: 'ACCESS_DENIED' },
        { status: 403 }
      );
    }

    // Get or create submission
    let submissionResult = await query(`
      SELECT id FROM assignment_submissions
      WHERE assignment_id = $1 AND student_id = $2
      LIMIT 1
    `, [assignmentId, studentId]);

    let submissionId: string;
    if (submissionResult.rowCount === 0) {
      // Create new submission
      const createResult = await query(`
        INSERT INTO assignment_submissions
        (assignment_id, student_id, status, submitted_at)
        VALUES ($1, $2, 'submitted', CURRENT_TIMESTAMP)
        RETURNING id
      `, [assignmentId, studentId]);
      submissionId = createResult.rows[0].id;
    } else {
      submissionId = submissionResult.rows[0].id;
    }

    // Process each response
    const savedResponses = [];
    for (const resp of responses) {
      const { questionId, responseText, selectedOptionId, h5pResponseData } = resp;

      if (!questionId) {
        continue;
      }

      // Check if response already exists
      const existingResult = await query(`
        SELECT id FROM assignment_responses
        WHERE submission_id = $1 AND question_id = $2
      `, [submissionId, questionId]);

      let responseId: string;
      if (existingResult.rowCount === 0) {
        // Create new response
        const createResp = await query(`
          INSERT INTO assignment_responses
          (assignment_id, submission_id, question_id, student_id, response_text, selected_option_id, h5p_response_data, submitted_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
          RETURNING id
        `, [
          assignmentId,
          submissionId,
          questionId,
          studentId,
          responseText || null,
          selectedOptionId || null,
          h5pResponseData ? JSON.stringify(h5pResponseData) : null
        ]);
        responseId = createResp.rows[0].id;
      } else {
        // Update existing response
        const updateResp = await query(`
          UPDATE assignment_responses
          SET response_text = COALESCE($1, response_text),
              selected_option_id = COALESCE($2, selected_option_id),
              h5p_response_data = COALESCE($3, h5p_response_data),
              submitted_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE submission_id = $4 AND question_id = $5
          RETURNING id
        `, [
          responseText || null,
          selectedOptionId || null,
          h5pResponseData ? JSON.stringify(h5pResponseData) : null,
          submissionId,
          questionId
        ]);
        responseId = updateResp.rows[0].id;
      }

      savedResponses.push(responseId);

      // Auto-grade MCQ questions
      if (selectedOptionId) {
        const optionResult = await query(`
          SELECT qo.is_correct, aq.points
          FROM question_options qo
          JOIN assignment_questions aq ON qo.question_id = aq.id
          WHERE qo.id = $1
        `, [selectedOptionId]);

        if (optionResult.rowCount > 0) {
          const isCorrect = optionResult.rows[0].is_correct;
          const points = isCorrect ? optionResult.rows[0].points : 0;

          await query(`
            UPDATE assignment_responses
            SET score = $1, is_auto_graded = true
            WHERE id = $2
          `, [points, responseId]);
        }
      }
    }

    // Update submission status
    await query(`
      UPDATE assignment_submissions
      SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [submissionId]);

    return NextResponse.json({
      success: true,
      message: 'Assignment submitted successfully',
      data: {
        submissionId,
        responsesCount: savedResponses.length
      }
    });
  } catch (error: any) {
    console.error('Error submitting assignment:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to submit assignment',
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}
