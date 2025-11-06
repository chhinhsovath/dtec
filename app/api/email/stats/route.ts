/**
 * Email Statistics API
 * Endpoint: GET /api/email/stats
 * Returns email delivery statistics and queue status
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * GET /api/email/stats
 * Get email queue statistics (admin only)
 */
export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'ADMIN_ONLY' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '24h'; // 24h, 7d, 30d, all

    // Determine time filter
    let timeFilter = "NOW() - INTERVAL '24 hours'";
    if (period === '7d') {
      timeFilter = "NOW() - INTERVAL '7 days'";
    } else if (period === '30d') {
      timeFilter = "NOW() - INTERVAL '30 days'";
    } else if (period === 'all') {
      timeFilter = 'TO_TIMESTAMP(0)'; // Beginning of time
    }

    // Get queue status
    const queueResult = await query(
      `SELECT
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN status = 'bounced' THEN 1 ELSE 0 END) as bounced,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        COUNT(*) as total
       FROM notification_queue
       WHERE created_at > ${timeFilter}`
    );

    const queueStats = queueResult.rows[0];

    // Calculate rates
    const successCount = (queueStats.sent || 0) + (queueStats.delivered || 0);
    const successRate = queueStats.total > 0
      ? ((successCount / queueStats.total) * 100).toFixed(2)
      : 0;

    const bounceRate = queueStats.total > 0
      ? (((queueStats.bounced || 0) / queueStats.total) * 100).toFixed(2)
      : 0;

    const failureRate = queueStats.total > 0
      ? (((queueStats.failed || 0) / queueStats.total) * 100).toFixed(2)
      : 0;

    // Get template breakdown
    const templateResult = await query(
      `SELECT
        template_name,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sent' OR status = 'delivered' THEN 1 ELSE 0 END) as succeeded,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
       FROM notification_queue
       WHERE created_at > ${timeFilter}
       GROUP BY template_name
       ORDER BY total DESC`
    );

    // Get hourly breakdown
    const hourlyResult = await query(
      `SELECT
        DATE_TRUNC('hour', created_at) as hour,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sent' OR status = 'delivered' THEN 1 ELSE 0 END) as succeeded,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
       FROM notification_queue
       WHERE created_at > ${timeFilter}
       GROUP BY DATE_TRUNC('hour', created_at)
       ORDER BY hour DESC
       LIMIT 24`
    );

    return NextResponse.json({
      success: true,
      period,
      stats: {
        overall: {
          total: queueStats.total,
          pending: queueStats.pending || 0,
          sent: queueStats.sent || 0,
          delivered: queueStats.delivered || 0,
          bounced: queueStats.bounced || 0,
          failed: queueStats.failed || 0,
          success_rate: `${successRate}%`,
          bounce_rate: `${bounceRate}%`,
          failure_rate: `${failureRate}%`,
        },
        by_template: templateResult.rows,
        hourly: hourlyResult.rows,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to fetch statistics',
        code: 'FETCH_ERROR',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
