/**
 * Email Queue Processor
 * Processes pending emails from the notification queue
 * Should be called by a cron job every 2-5 minutes
 *
 * Endpoint: GET /api/email/process-queue
 * Headers: x-api-key (internal secret)
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendEmailViaSendGrid } from '@/lib/email/sendgrid';

export async function GET(request: Request) {
  try {
    // Verify internal API key (prevent unauthorized access)
    const apiKey = request.headers.get('x-api-key');
    const expectedKey = process.env.INTERNAL_API_SECRET;

    if (!apiKey || apiKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'INVALID_API_KEY' },
        { status: 401 }
      );
    }

    // Get pending emails (limit to 50 per batch to avoid overload)
    const maxRetries = parseInt(process.env.EMAIL_MAX_RETRIES || '3');
    const pendingResult = await query(
      `SELECT * FROM notification_queue
       WHERE status = 'pending' AND send_attempts < $1
       ORDER BY created_at ASC
       LIMIT 50`,
      [maxRetries]
    );

    const pendingEmails = pendingResult.rows;
    let successCount = 0;
    let failureCount = 0;
    const errors: any[] = [];

    // Process each email
    for (const email of pendingEmails) {
      try {
        // Send email via SendGrid
        const result = await sendEmailViaSendGrid({
          recipient_email: email.recipient_email,
          subject: email.subject,
          template_name: email.template_name,
          template_data: email.template_data || {},
          notification_id: email.notification_id,
        });

        if (result.success) {
          // Mark as sent
          await query(
            `UPDATE notification_queue
             SET status = 'sent',
                 send_attempts = send_attempts + 1,
                 sent_at = NOW(),
                 sendgrid_message_id = $1,
                 updated_at = NOW()
             WHERE queue_id = $2`,
            [result.messageId, email.queue_id]
          );

          successCount++;
        } else {
          // Mark as failed with error details
          await query(
            `UPDATE notification_queue
             SET status = 'failed',
                 send_attempts = send_attempts + 1,
                 last_attempt_at = NOW(),
                 error_message = $1,
                 error_code = $2,
                 updated_at = NOW()
             WHERE queue_id = $3`,
            [result.error, result.code, email.queue_id]
          );

          failureCount++;
          errors.push({
            queue_id: email.queue_id,
            email: email.recipient_email,
            error: result.error,
          });
        }
      } catch (error: any) {
        failureCount++;
        console.error(`Error processing email queue_id ${email.queue_id}:`, error);

        // Update with error
        try {
          await query(
            `UPDATE notification_queue
             SET status = 'failed',
                 send_attempts = send_attempts + 1,
                 last_attempt_at = NOW(),
                 error_message = $1,
                 error_code = 'PROCESSING_ERROR',
                 updated_at = NOW()
             WHERE queue_id = $2`,
            [error.message, email.queue_id]
          );
        } catch (updateError) {
          console.error('Error updating queue record:', updateError);
        }

        errors.push({
          queue_id: email.queue_id,
          email: email.recipient_email,
          error: error.message,
        });
      }
    }

    // Return processing results
    return NextResponse.json({
      success: true,
      message: 'Email queue processed',
      stats: {
        total_processed: pendingEmails.length,
        successful: successCount,
        failed: failureCount,
        success_rate: pendingEmails.length > 0
          ? ((successCount / pendingEmails.length) * 100).toFixed(2) + '%'
          : '0%',
      },
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Email queue processor error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Queue processing failed',
        code: 'QUEUE_PROCESS_ERROR',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Alternative POST endpoint for manual trigger
 */
export async function POST(request: Request) {
  try {
    // Verify internal API key
    const apiKey = request.headers.get('x-api-key');
    const expectedKey = process.env.INTERNAL_API_SECRET;

    if (!apiKey || apiKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'INVALID_API_KEY' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'process-queue') {
      // Same as GET - process pending emails
      return GET(request);
    }

    if (action === 'retry-failed') {
      // Retry failed emails
      const maxRetries = parseInt(process.env.EMAIL_MAX_RETRIES || '3');
      const failedResult = await query(
        `SELECT * FROM notification_queue
         WHERE status = 'failed' AND send_attempts < $1
         ORDER BY created_at ASC
         LIMIT 50`,
        [maxRetries]
      );

      const failedEmails = failedResult.rows;
      let retriedCount = 0;

      for (const email of failedEmails) {
        try {
          const result = await sendEmailViaSendGrid({
            recipient_email: email.recipient_email,
            subject: email.subject,
            template_name: email.template_name,
            template_data: email.template_data || {},
            notification_id: email.notification_id,
          });

          if (result.success) {
            await query(
              `UPDATE notification_queue
               SET status = 'sent',
                   send_attempts = send_attempts + 1,
                   sent_at = NOW(),
                   sendgrid_message_id = $1
               WHERE queue_id = $2`,
              [result.messageId, email.queue_id]
            );

            retriedCount++;
          }
        } catch (error) {
          console.error('Error retrying email:', error);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Retry processing complete',
        stats: {
          attempted: failedEmails.length,
          succeeded: retriedCount,
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid action', code: 'INVALID_ACTION' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Email queue processor error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Request processing failed',
        code: 'PROCESS_ERROR',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
