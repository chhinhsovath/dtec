'use server';

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/student/analytics
 * Fetch comprehensive analytics for student dashboard
 *
 * Query params:
 * - studentId: UUID (required) - student requesting their analytics
 * - courseId: UUID (optional) - specific course analytics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const courseId = searchParams.get('courseId');

    // Validate inputs
    if (!studentId) {
      return NextResponse.json(
        { error: 'Missing studentId', code: 'MISSING_STUDENT_ID' },
        { status: 400 }
      );
    }

    // Verify student exists
    const studentCheck = await query(
      `SELECT id FROM profiles WHERE id = $1 AND role = 'student'`,
      [studentId]
    );

    if (studentCheck.rowCount === 0) {
      return NextResponse.json(
        { error: 'Student not found', code: 'STUDENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Get overall learning stats
    const overallStats = await query(
      `SELECT
        COUNT(DISTINCT e.course_id) as enrolled_courses,
        COUNT(DISTINCT sp.path_id) as enrolled_paths,
        COUNT(DISTINCT c.id) as certificates_earned,
        COALESCE(ROUND(AVG(CAST(ar.score as numeric)), 1), 0) as average_quiz_score,
        COALESCE(SUM(se.total_time_minutes), 0) as total_learning_minutes
      FROM profiles p
      LEFT JOIN enrollments e ON p.id = e.student_id AND e.status = 'active'
      LEFT JOIN student_path_progress sp ON p.id = sp.student_id AND sp.status IN ('enrolled', 'in_progress', 'completed')
      LEFT JOIN certificates c ON p.id = c.student_id AND c.is_valid = true
      LEFT JOIN academic_records ar ON p.id = ar.student_id AND ar.score > 0
      LEFT JOIN student_engagement se ON p.id = se.student_id
      WHERE p.id = $1`,
      [studentId]
    );

    const stats = overallStats.rows[0];

    // Get course-specific progress
    const courseProgress = await query(
      `SELECT
        c.id,
        c.name,
        c.thumbnail_url,
        e.status,
        COALESCE(ROUND((CAST(COUNT(DISTINCT cm.id) as numeric) /
          NULLIF(COUNT(DISTINCT CASE WHEN cm.id IS NOT NULL THEN 1 END), 0) * 100), 0), 0) as completion_percentage,
        COUNT(DISTINCT q.id) as total_quizzes,
        COALESCE(ROUND(AVG(CAST(ar.score as numeric)), 1), 0) as average_quiz_score,
        COALESCE(se.total_time_minutes, 0) as time_spent_minutes
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.student_id = $1
      LEFT JOIN course_materials cm ON c.id = cm.course_id
      LEFT JOIN quizzes q ON c.id = q.course_id
      LEFT JOIN academic_records ar ON e.id = ar.enrollment_id
      LEFT JOIN student_engagement se ON c.id = se.course_id AND se.student_id = $1
      WHERE e.student_id = $1 OR (c.id = $2 AND $2 IS NOT NULL)
      GROUP BY c.id, c.name, c.thumbnail_url, e.status, se.total_time_minutes
      ORDER BY e.enrollment_date DESC`,
      [studentId, courseId || null]
    );

    // Get learning path progress
    const pathProgress = await query(
      `SELECT
        lp.id,
        lp.name,
        lp.thumbnail_url,
        lp.difficulty_level,
        lp.estimated_hours,
        spp.status,
        CAST(spp.progress_percentage as numeric) as progress_percentage,
        spp.completed_courses,
        spp.total_courses,
        spp.enrolled_date,
        spp.started_date,
        spp.completed_date
      FROM student_path_progress spp
      JOIN learning_paths lp ON spp.path_id = lp.id
      WHERE spp.student_id = $1
      ORDER BY spp.enrolled_date DESC`,
      [studentId]
    );

    // Get quiz performance over time (last 10 quizzes)
    const quizPerformance = await query(
      `SELECT
        q.id,
        q.title,
        c.name as course_name,
        ar.score,
        ar.total_points,
        ROUND((CAST(ar.score as numeric) / NULLIF(CAST(ar.total_points as numeric), 0) * 100), 1) as percentage,
        ar.created_at as completion_date
      FROM academic_records ar
      JOIN quizzes q ON ar.quiz_id = q.id
      JOIN courses c ON q.course_id = c.id
      WHERE ar.student_id = $1 AND ar.score IS NOT NULL
      ORDER BY ar.created_at DESC
      LIMIT 10`,
      [studentId]
    );

    // Get recent achievements (certificates and badges)
    const achievements = await query(
      `SELECT
        'certificate' as type,
        c.id,
        c.title,
        c.issued_date as earned_date,
        c.certificate_type as category,
        CASE
          WHEN c.certificate_type = 'course' THEN 'Course'
          WHEN c.certificate_type = 'path' THEN 'Learning Path'
          ELSE 'Specialization'
        END as category_name
      FROM certificates c
      WHERE c.student_id = $1 AND c.is_valid = true
      ORDER BY c.issued_date DESC
      LIMIT 5`,
      [studentId]
    );

    // Get engagement metrics
    const engagement = await query(
      `SELECT
        total_time_minutes,
        last_activity,
        engagement_score,
        CASE
          WHEN engagement_score >= 80 THEN 'Excellent'
          WHEN engagement_score >= 60 THEN 'Good'
          WHEN engagement_score >= 40 THEN 'Average'
          ELSE 'Low'
        END as engagement_level
      FROM student_engagement
      WHERE student_id = $1`,
      [studentId]
    );

    // Calculate learning time distribution
    const timeDistribution = await query(
      `SELECT
        c.name as course_name,
        COALESCE(se.total_time_minutes, 0) as time_minutes
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN student_engagement se ON e.student_id = se.student_id AND e.course_id = se.course_id
      WHERE e.student_id = $1
      ORDER BY time_minutes DESC`,
      [studentId]
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          overall_stats: {
            enrolled_courses: parseInt(stats.enrolled_courses) || 0,
            enrolled_paths: parseInt(stats.enrolled_paths) || 0,
            certificates_earned: parseInt(stats.certificates_earned) || 0,
            average_quiz_score: parseFloat(stats.average_quiz_score) || 0,
            total_learning_minutes: parseInt(stats.total_learning_minutes) || 0,
          },
          course_progress: courseProgress.rows,
          path_progress: pathProgress.rows,
          quiz_performance: quizPerformance.rows,
          achievements: achievements.rows,
          engagement: engagement.rows[0] || {
            total_time_minutes: 0,
            last_activity: null,
            engagement_score: 0,
            engagement_level: 'Low',
          },
          time_distribution: timeDistribution.rows,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Analytics query error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch analytics',
        code: 'ANALYTICS_ERROR',
      },
      { status: 500 }
    );
  }
}
