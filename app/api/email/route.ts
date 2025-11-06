'use server';

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/email
 * Fetch email notifications from queue
 *
 * Query params:
 * - status: 'pending' | 'processing' | 'sent' | 'failed' | 'bounced' (optional)
 * - limit: number (default: 20, max: 100)
 * - offset: number (default: 0)
 * - template_id: BIGINT (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const template_id = searchParams.get('template_id');

    // Build dynamic query
    let countQuery = 'SELECT COUNT(*) as total FROM notification_queue WHERE 1=1';
    let params: any[] = [];

    if (status) {
      countQuery += ' AND status = $' + (params.length + 1);
      params.push(status);
    }

    if (template_id) {
      countQuery += ' AND template_id = $' + (params.length + 1);
      params.push(parseInt(template_id));
    }

    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Build data query
    let dataQuery = `SELECT
      nq.queue_id,
      nq.recipient_id,
      nq.template_id,
      nq.subject,
      nq.status,
      nq.priority,
      nq.retry_count,
      nq.max_retries,
      nq.sendgrid_message_id,
      nq.error_message,
      nq.recipient_email,
      nq.recipient_name,
      nq.sent_at,
      nq.failed_at,
      nq.scheduled_for,
      nq.created_at,
      et.template_name
    FROM notification_queue nq
    LEFT JOIN email_templates et ON nq.template_id = et.template_id
    WHERE 1=1`;

    if (status) {
      dataQuery += ' AND nq.status = $' + (params.length + 1);
      params.push(status);
    }

    if (template_id) {
      dataQuery += ' AND nq.template_id = $' + (params.length + 1);
      params.push(parseInt(template_id));
    }

    dataQuery += ' ORDER BY nq.priority ASC, nq.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await query(dataQuery, params);

    // Get status summary
    const statusSummary = await query(`
      SELECT status, COUNT(*) as count
      FROM notification_queue
      GROUP BY status
    `);

    const statusCounts = {
      pending: 0,
      processing: 0,
      sent: 0,
      failed: 0,
      bounced: 0,
    };

    statusSummary.rows.forEach((row: any) => {
      if (statusCounts.hasOwnProperty(row.status)) {
        statusCounts[row.status as keyof typeof statusCounts] = parseInt(row.count);
      }
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          notifications: result.rows,
          status_counts: statusCounts,
          pagination: {
            total,
            limit,
            offset,
            pages: Math.ceil(total / limit),
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email queue query error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch email queue',
        code: 'QUERY_ERROR',
        meta: {
          error_type: error instanceof Error ? error.constructor.name : 'Unknown',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/email
 * Create and queue new email notification
 *
 * Required body:
 * - recipient_id: BIGINT
 * - template_key: string OR (subject + body_html + body_text)
 * - variables_json: object (optional, for template variable substitution)
 * - priority: 1-10 (optional, default: 5)
 * - scheduled_for: ISO8601 timestamp (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      recipient_id,
      template_key,
      subject,
      body_html,
      body_text,
      variables_json,
      priority = 5,
      scheduled_for,
    } = body;

    // Validate required fields
    if (!recipient_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: recipient_id',
          code: 'MISSING_FIELD',
        },
        { status: 400 }
      );
    }

    if (!template_key && (!subject || !body_html || !body_text)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Provide either template_key OR (subject, body_html, body_text)',
          code: 'INVALID_REQUEST',
        },
        { status: 400 }
      );
    }

    let finalSubject = subject;
    let finalBodyHtml = body_html;
    let finalBodyText = body_text;
    let finalTemplateId = null;

    // Resolve template if provided
    if (template_key) {
      const templateResult = await query(
        'SELECT template_id, subject_template, body_html_template, body_text_template FROM email_templates WHERE template_key = $1',
        [template_key]
      );

      if (templateResult.rowCount === 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Template not found: ${template_key}`,
            code: 'TEMPLATE_NOT_FOUND',
          },
          { status: 404 }
        );
      }

      const template = templateResult.rows[0];
      finalTemplateId = template.template_id;
      finalSubject = template.subject_template;
      finalBodyHtml = template.body_html_template;
      finalBodyText = template.body_text_template;
    }

    // Substitute variables if provided
    if (variables_json && Object.keys(variables_json).length > 0) {
      Object.entries(variables_json).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        finalSubject = finalSubject.replace(new RegExp(placeholder, 'g'), String(value));
        finalBodyHtml = finalBodyHtml.replace(new RegExp(placeholder, 'g'), String(value));
        finalBodyText = finalBodyText.replace(new RegExp(placeholder, 'g'), String(value));
      });
    }

    // Get recipient email from profiles
    const recipientResult = await query(
      'SELECT email, full_name FROM profiles WHERE id = $1',
      [recipient_id]
    );

    if (recipientResult.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Recipient not found: ${recipient_id}`,
          code: 'RECIPIENT_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    const recipient = recipientResult.rows[0];

    // Insert into notification queue
    const insertResult = await query(
      `INSERT INTO notification_queue
       (recipient_id, template_id, subject, body_html, body_text, recipient_email,
        recipient_name, variables_json, status, priority, max_retries, scheduled_for)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, 3, $10)
       RETURNING queue_id, status, created_at`,
      [
        recipient_id,
        finalTemplateId,
        finalSubject,
        finalBodyHtml,
        finalBodyText,
        recipient.email,
        recipient.full_name,
        variables_json ? JSON.stringify(variables_json) : null,
        Math.max(1, Math.min(10, priority)),
        scheduled_for || new Date().toISOString(),
      ]
    );

    const queuedEmail = insertResult.rows[0];

    return NextResponse.json(
      {
        success: true,
        data: {
          queue_id: queuedEmail.queue_id,
          status: queuedEmail.status,
          recipient_email: recipient.email,
          created_at: queuedEmail.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Email queue creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create email queue entry',
        code: 'CREATION_ERROR',
        meta: {
          error_type: error instanceof Error ? error.constructor.name : 'Unknown',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/email
 * Update email status (mark as sent, failed, etc.)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { queue_id, status, sendgrid_message_id, error_message } = body;

    if (!queue_id || !status) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: queue_id, status',
          code: 'MISSING_FIELDS',
        },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'processing', 'sent', 'failed', 'bounced'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      );
    }

    const updateResult = await query(
      `UPDATE notification_queue
       SET status = $1,
           sendgrid_message_id = COALESCE($2, sendgrid_message_id),
           error_message = COALESCE($3, error_message),
           sent_at = CASE WHEN $1 = 'sent' THEN NOW() ELSE sent_at END,
           failed_at = CASE WHEN $1 = 'failed' THEN NOW() ELSE failed_at END,
           updated_at = NOW()
       WHERE queue_id = $4
       RETURNING queue_id, status, sent_at, failed_at`,
      [status, sendgrid_message_id || null, error_message || null, queue_id]
    );

    if (updateResult.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Queue entry not found: ${queue_id}`,
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: updateResult.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email status update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update email status',
        code: 'UPDATE_ERROR',
        meta: {
          error_type: error instanceof Error ? error.constructor.name : 'Unknown',
        },
      },
      { status: 500 }
    );
  }
}
