/**
 * SendGrid Email Service
 * Handles email sending via SendGrid API
 * Supports email queuing, retries, and analytics
 */

import { query } from '@/lib/db';

interface EmailPayload {
  recipient_email: string;
  subject: string;
  template_name: string;
  template_data: Record<string, any>;
  notification_id?: number;
}

interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  code?: string;
}

/**
 * Process template by replacing variables
 * Example: "Hello {{name}}" with {name: "John"} -> "Hello John"
 */
function processTemplate(template: string, data: Record<string, any>): string {
  let result = template;
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), String(value || ''));
  });
  return result;
}

/**
 * Get email template from database
 */
async function getEmailTemplate(templateName: string) {
  try {
    const result = await query(
      `SELECT * FROM email_templates
       WHERE template_name = $1 AND is_active = true`,
      [templateName]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching email template:', error);
    return null;
  }
}

/**
 * Log email sending attempt to database
 */
async function logEmailSend(data: {
  notification_id?: number;
  recipient_email: string;
  template_name: string;
  status: string;
  sendgrid_message_id?: string;
  error_message?: string;
  error_code?: string;
}) {
  try {
    await query(
      `INSERT INTO notification_queue
       (notification_id, recipient_email, template_name, status,
        sendgrid_message_id, error_message, error_code, send_attempts)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 1)`,
      [
        data.notification_id,
        data.recipient_email,
        data.template_name,
        data.status,
        data.sendgrid_message_id,
        data.error_message,
        data.error_code,
      ]
    );
  } catch (error) {
    console.error('Error logging email send:', error);
  }
}

/**
 * Update email queue record status
 */
async function updateQueueStatus(
  queueId: number,
  status: string,
  data: {
    sendgrid_message_id?: string;
    error_message?: string;
    error_code?: string;
  }
) {
  try {
    await query(
      `UPDATE notification_queue
       SET status = $1,
           send_attempts = send_attempts + 1,
           last_attempt_at = NOW(),
           sendgrid_message_id = COALESCE($2, sendgrid_message_id),
           error_message = $3,
           error_code = $4,
           updated_at = NOW()
       WHERE queue_id = $5`,
      [status, data.sendgrid_message_id, data.error_message, data.error_code, queueId]
    );
  } catch (error) {
    console.error('Error updating queue status:', error);
  }
}

/**
 * Send email via SendGrid API
 * In production, this uses SendGrid SDK
 * In development/mock mode, logs to database only
 */
export async function sendEmailViaSendGrid(payload: EmailPayload): Promise<EmailResponse> {
  try {
    // Get email template from database
    const template = await getEmailTemplate(payload.template_name);

    if (!template) {
      return {
        success: false,
        error: `Template not found: ${payload.template_name}`,
        code: 'TEMPLATE_NOT_FOUND',
      };
    }

    // Process template variables
    const htmlContent = processTemplate(template.html_content, payload.template_data);
    const textContent = processTemplate(template.text_content || '', payload.template_data);
    const subject = processTemplate(template.subject_template, payload.template_data);

    // If mock mode (development), skip actual SendGrid send
    if (process.env.NEXT_PUBLIC_EMAIL_MOCK === 'true') {
      console.log('📧 [MOCK MODE] Email would be sent:', {
        to: payload.recipient_email,
        subject,
        template: payload.template_name,
      });

      // Still log to database for tracking
      await logEmailSend({
        notification_id: payload.notification_id,
        recipient_email: payload.recipient_email,
        template_name: payload.template_name,
        status: 'sent', // Mock as sent
      });

      return { success: true, messageId: 'MOCK-' + Date.now() };
    }

    // Production: Send via SendGrid
    const messageId = await sendViaProductionSendGrid({
      to: payload.recipient_email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@techlms.com',
        name: process.env.SENDGRID_FROM_NAME || 'TEC LMS',
      },
      subject,
      html: htmlContent,
      text: textContent,
      replyTo: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@techlms.com',
      },
    });

    // Log successful send
    await logEmailSend({
      notification_id: payload.notification_id,
      recipient_email: payload.recipient_email,
      template_name: payload.template_name,
      status: 'sent',
      sendgrid_message_id: messageId,
    });

    return { success: true, messageId };
  } catch (error: any) {
    console.error('Error sending email:', error);

    // Log failure
    await logEmailSend({
      notification_id: payload.notification_id,
      recipient_email: payload.recipient_email,
      template_name: payload.template_name,
      status: 'failed',
      error_message: error.message,
      error_code: error.code || 'SEND_ERROR',
    });

    return {
      success: false,
      error: error.message,
      code: error.code || 'SEND_ERROR',
    };
  }
}

/**
 * Send via actual SendGrid API (production)
 * This would use @sendgrid/mail library in production
 */
async function sendViaProductionSendGrid(message: {
  to: string;
  from: { email: string; name: string };
  subject: string;
  html: string;
  text: string;
  replyTo: { email: string };
}): Promise<string> {
  // This is a placeholder for the actual SendGrid SDK call
  // In production, you would do:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // const response = await sgMail.send(message);
  // return response[0].headers['x-message-id'];

  console.log('Would send via SendGrid:', message);

  // For now, return a mock message ID
  throw new Error('SendGrid API key not configured. Set SENDGRID_API_KEY in .env.local');
}

/**
 * Queue email for later sending (async)
 * Used when you want to send email without waiting for response
 */
export async function queueEmail(payload: EmailPayload): Promise<boolean> {
  try {
    const result = await query(
      `INSERT INTO notification_queue
       (notification_id, recipient_email, template_name, template_data, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING queue_id`,
      [
        payload.notification_id,
        payload.recipient_email,
        payload.template_name,
        JSON.stringify(payload.template_data),
      ]
    );

    console.log(`Email queued with ID: ${result.rows[0].queue_id}`);
    return true;
  } catch (error) {
    console.error('Error queueing email:', error);
    return false;
  }
}

/**
 * Get email queue statistics
 */
export async function getQueueStats() {
  try {
    const result = await query(
      `SELECT
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_today,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'bounced' THEN 1 ELSE 0 END) as bounced,
        COUNT(*) as total
       FROM notification_queue
       WHERE created_at > NOW() - INTERVAL '24 hours'`
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error getting queue stats:', error);
    return null;
  }
}

/**
 * Retry failed emails
 */
export async function retryFailedEmails(maxRetries: number = 3) {
  try {
    // Get all failed emails that haven't exceeded max retries
    const result = await query(
      `SELECT * FROM notification_queue
       WHERE status = 'failed' AND send_attempts < $1
       ORDER BY created_at ASC
       LIMIT 50`,
      [maxRetries]
    );

    const failedEmails = result.rows;
    let retried = 0;

    for (const email of failedEmails) {
      try {
        const response = await sendEmailViaSendGrid({
          recipient_email: email.recipient_email,
          subject: email.subject,
          template_name: email.template_name,
          template_data: email.template_data || {},
          notification_id: email.notification_id,
        });

        if (response.success) {
          retried++;
        }
      } catch (error) {
        console.error(`Error retrying email ${email.queue_id}:`, error);
      }
    }

    console.log(`Retried ${retried} failed emails`);
    return { attempted: failedEmails.length, succeeded: retried };
  } catch (error) {
    console.error('Error in retryFailedEmails:', error);
    return { attempted: 0, succeeded: 0 };
  }
}

export default {
  sendEmailViaSendGrid,
  queueEmail,
  getQueueStats,
  retryFailedEmails,
};
