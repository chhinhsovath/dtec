/**
 * Zoom Webhook Handler
 * Endpoint: POST /api/zoom/webhook
 * Processes Zoom events (meeting started/ended, recording completed)
 */

import { NextResponse } from 'next/server';
import ZoomService from '@/lib/zoom/zoom-service';

/**
 * POST /api/zoom/webhook
 * Handle Zoom webhook events
 *
 * Headers:
 * - x-zm-request-timestamp: Zoom request timestamp
 * - x-zm-signature: Webhook signature for verification
 */
export async function POST(request: Request) {
  try {
    const requestBody = await request.text();
    const authHeader = request.headers.get('x-zm-signature') || '';
    const timestamp = request.headers.get('x-zm-request-timestamp') || '';

    // Verify webhook signature
    const zoomService = new ZoomService();
    const isValid = zoomService.verifyWebhookSignature(authHeader, requestBody, timestamp);

    if (!isValid) {
      console.warn('Invalid Zoom webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature', code: 'INVALID_SIGNATURE' },
        { status: 401 }
      );
    }

    const payload = JSON.parse(requestBody);

    // Acknowledge webhook immediately (Zoom expects 200 response within 3 seconds)
    setTimeout(async () => {
      try {
        const eventType = payload.event;
        const eventData = payload.payload;

        console.log(`Processing Zoom webhook event: ${eventType}`);

        // Handle different event types
        if (eventType && eventData) {
          await zoomService.handleWebhookEvent(eventType, eventData);
        }
      } catch (error) {
        console.error('Error processing webhook event:', error);
      }
    }, 0);

    return NextResponse.json({
      success: true,
      message: 'Webhook received',
    });
  } catch (error: any) {
    console.error('Error handling Zoom webhook:', error);

    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        code: 'WEBHOOK_ERROR',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Challenge request handler
 * Zoom sends a challenge request to verify webhook endpoint
 */
export async function GET(request: Request) {
  try {
    const requestBody = await request.text();

    // Check if this is a challenge request
    if (request.headers.get('content-type')?.includes('application/json')) {
      const payload = JSON.parse(requestBody);

      if (payload.type === 'url_validation') {
        // Verify signature
        const zoomService = new ZoomService();
        const authHeader = request.headers.get('x-zm-signature') || '';
        const timestamp = request.headers.get('x-zm-request-timestamp') || '';
        const isValid = zoomService.verifyWebhookSignature(authHeader, requestBody, timestamp);

        if (!isValid) {
          return NextResponse.json(
            { error: 'Invalid signature', code: 'INVALID_SIGNATURE' },
            { status: 401 }
          );
        }

        // Return challenge
        return NextResponse.json({
          plainToken: payload.plain_token,
        });
      }
    }

    return NextResponse.json(
      { error: 'Invalid request', code: 'INVALID_REQUEST' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error handling Zoom challenge:', error);

    return NextResponse.json(
      {
        error: 'Challenge processing failed',
        code: 'CHALLENGE_ERROR',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
