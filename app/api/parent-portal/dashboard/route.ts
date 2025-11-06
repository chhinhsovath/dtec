/**
 * Parent Portal Dashboard API
 * Endpoint: GET /api/parent-portal/dashboard
 * Get parent dashboard data with all assigned students and their summaries
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * GET /api/parent-portal/dashboard
 * Get parent dashboard with all linked students and their progress
 */
export async function GET(request: Request) {
  const session = await getSession();

  if (!session || !session?.id || session.role !== 'parent') {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'PARENT_ONLY' },
      { status: 403 }
    );
  }

  try {
    // Get all students linked to this parent
    const studentsResult = await query(
      `SELECT
        psr.relationship_id,
        psr.relationship_type,
        psr.is_primary,
        s.student_id,
        p.user_name,
        p.email,
        p.avatar_url,
        p.phone,
        u.user_name as school_user_name,
        pr.status as enrollment_status
       FROM parent_student_relationships psr
       JOIN students s ON psr.student_id = s.student_id
       JOIN profiles p ON s.user_id = p.id
       LEFT JOIN users u ON p.id = u.user_id
       LEFT JOIN enrollments pr ON s.student_id = pr.student_id AND pr.status = 'active'
       WHERE psr.parent_id = $1 AND psr.status = 'active'
       ORDER BY psr.is_primary DESC, p.user_name ASC`,
      [session.id]
    );

    // Get summary for each student
    const studentsWithSummaries = await Promise.all(
      studentsResult.rows.map(async (student: any) => {
        const summaryResult = await query(
          `SELECT
            overall_gpa,
            attendance_percentage,
            pending_assignments,
            overdue_assignments,
            behavior_score,
            last_login,
            last_updated
           FROM parent_student_summary
           WHERE parent_id = $1 AND student_id = $2`,
          [session.id, student.student_id]
        );

        const summary = summaryResult.rows[0] || {
          overall_gpa: null,
          attendance_percentage: null,
          pending_assignments: 0,
          overdue_assignments: 0,
          behavior_score: null,
          last_login: null,
          last_updated: null,
        };

        // Get unread notifications count for this student
        const notifCountResult = await query(
          `SELECT COUNT(*) as count FROM parent_notifications
           WHERE parent_id = $1 AND student_id = $2 AND is_read = false`,
          [session.id, student.student_id]
        );

        const unreadNotifications = parseInt(notifCountResult.rows[0].count || '0');

        return {
          ...student,
          summary,
          unreadNotifications,
        };
      })
    );

    // Get parent preferences
    const preferencesResult = await query(
      `SELECT * FROM parent_preferences
       WHERE parent_id = $1
       ORDER BY display_order ASC`,
      [session.id]
    );

    // Get unread messages count
    const messagesResult = await query(
      `SELECT COUNT(*) as count FROM parent_messages
       WHERE parent_id = $1 AND is_read = false`,
      [session.id]
    );

    const unreadMessages = parseInt(messagesResult.rows[0].count || '0');

    // Get pending event RSVPs
    const eventsResult = await query(
      `SELECT COUNT(*) as count FROM parent_event_invitations
       WHERE parent_id = $1 AND rsvp_status = 'pending'`,
      [session.id]
    );

    const pendingEvents = parseInt(eventsResult.rows[0].count || '0');

    return NextResponse.json({
      success: true,
      data: {
        parent: {
          id: session.id,
          name: session.name,
          email: session.email,
        },
        students: studentsWithSummaries,
        stats: {
          total_students: studentsWithSummaries.length,
          unread_messages: unreadMessages,
          pending_event_rsvps: pendingEvents,
          total_unread_notifications: studentsWithSummaries.reduce(
            (sum: any, s: any) => sum + s.unreadNotifications,
            0
          ),
        },
        preferences: preferencesResult.rows,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching parent dashboard:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch dashboard',
        code: 'FETCH_ERROR',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
