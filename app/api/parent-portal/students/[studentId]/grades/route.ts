/**
 * Parent Portal Student Grades API
 * Endpoint: GET /api/parent-portal/students/[studentId]/grades
 * Get student grades with parent access control
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * GET /api/parent-portal/students/[studentId]/grades
 * Get all grades for a student visible to parent
 */
export async function GET(
  request: Request,
  { params }: { params: { studentId: string } }
) {
  const session = await getSession();

  if (!session || !session?.id || session.role !== 'parent') {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'PARENT_ONLY' },
      { status: 403 }
    );
  }

  try {
    const studentId = parseInt(params.studentId);

    // Verify parent has access to this student
    const accessCheck = await query(
      `SELECT can_view_grades FROM parent_student_relationships
       WHERE parent_id = $1 AND student_id = $2 AND status = 'active'`,
      [session.id, studentId]
    );

    if (accessCheck.rowCount === 0 || !accessCheck.rows[0].can_view_grades) {
      return NextResponse.json(
        { error: 'No access to view grades', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const semester = searchParams.get('semester');

    // Build query
    let whereClause = `g.student_id = $1`;
    const params: any[] = [studentId];

    if (courseId) {
      whereClause += ` AND g.course_id = $${params.length + 1}`;
      params.push(parseInt(courseId));
    }

    // Get student grades grouped by course
    const gradesResult = await query(
      `SELECT
        g.grade_id,
        g.student_id,
        g.course_id,
        c.course_name,
        c.course_code,
        g.grade_type,
        g.score,
        g.max_score,
        g.percentage,
        g.grade_letter,
        g.weighted_score,
        g.is_final,
        g.graded_at,
        g.feedback,
        t.user_name as teacher_name,
        (g.score / g.max_score * 100) as calculated_percentage
       FROM grades g
       LEFT JOIN courses c ON g.course_id = c.course_id
       LEFT JOIN profiles t ON g.graded_by = t.id
       WHERE ${whereClause}
       ORDER BY g.course_id ASC, g.grade_type ASC, g.graded_at DESC`,
      params
    );

    // Group grades by course
    const gradesByCourse = gradesResult.rows.reduce((acc: any, grade) => {
      if (!acc[grade.course_id]) {
        acc[grade.course_id] = {
          course_id: grade.course_id,
          course_name: grade.course_name,
          course_code: grade.course_code,
          grades: [],
          course_average: null,
        };
      }
      acc[grade.course_id].grades.push(grade);
      return acc;
    }, {});

    // Calculate course averages
    const courseSummary = Object.values(gradesByCourse).map((course: any) => {
      const finalGrades = course.grades.filter((g: any) => g.is_final);
      const courseAverage =
        finalGrades.length > 0
          ? (
              finalGrades.reduce((sum: number, g: any) => sum + (g.percentage || 0), 0) /
              finalGrades.length
            ).toFixed(2)
          : null;

      return {
        ...course,
        course_average: courseAverage,
        total_assessments: course.grades.length,
        final_grade_count: finalGrades.length,
      };
    });

    // Calculate overall GPA
    const allFinalGrades = gradesResult.rows.filter((g: any) => g.is_final);
    const overallGPA =
      allFinalGrades.length > 0
        ? (
            allFinalGrades.reduce((sum: number, g: any) => sum + (g.percentage || 0), 0) /
            allFinalGrades.length
          ).toFixed(2)
        : null;

    return NextResponse.json({
      success: true,
      data: {
        student_id: studentId,
        overall_gpa: overallGPA,
        courses: courseSummary,
        total_courses: courseSummary.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching student grades:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch grades',
        code: 'FETCH_ERROR',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
