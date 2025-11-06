/**
 * Email Templates Management API
 * Endpoints: GET /api/email/templates, POST /api/email/templates
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * GET /api/email/templates
 * Get all email templates (admin only)
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

    const result = await query(
      `SELECT * FROM email_templates
       ORDER BY template_name ASC`
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to fetch templates',
        code: 'FETCH_ERROR',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/email/templates
 * Create or update email template (admin only)
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'ADMIN_ONLY' },
        { status: 403 }
      );
    }

    const {
      template_name,
      template_type,
      subject_template,
      html_content,
      text_content,
      is_active,
    } = await request.json();

    // Validate required fields
    if (!template_name || !subject_template || !html_content) {
      return NextResponse.json(
        { error: 'Missing required fields', code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    // Check if template exists
    const existing = await query(
      `SELECT template_id FROM email_templates WHERE template_name = $1`,
      [template_name]
    );

    let result;

    if (existing.rowCount > 0) {
      // Update existing
      result = await query(
        `UPDATE email_templates
         SET template_type = $1,
             subject_template = $2,
             html_content = $3,
             text_content = $4,
             is_active = COALESCE($5, is_active),
             updated_at = NOW()
         WHERE template_name = $6
         RETURNING *`,
        [
          template_type,
          subject_template,
          html_content,
          text_content,
          is_active,
          template_name,
        ]
      );
    } else {
      // Create new
      result = await query(
        `INSERT INTO email_templates
         (template_name, template_type, subject_template, html_content, text_content, is_active)
         VALUES ($1, $2, $3, $4, $5, COALESCE($6, true))
         RETURNING *`,
        [
          template_name,
          template_type,
          subject_template,
          html_content,
          text_content,
          is_active,
        ]
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: existing.rowCount > 0 ? 'Template updated' : 'Template created',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to save template',
        code: 'SAVE_ERROR',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
