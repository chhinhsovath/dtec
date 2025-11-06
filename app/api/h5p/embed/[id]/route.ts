import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/h5p/embed/[id]
 * Render H5P content player in iframe
 * This endpoint serves an HTML page with the H5P player embedded
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contentId = params.id;

    // Fetch H5P content from database
    // Note: This assumes h5p_contents table exists
    // If not using H5P database tables yet, return a basic embed

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>H5P Content</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/h5p/1.24.0/styles/h5p.css">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .h5p-container {
      max-width: 100%;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      padding: 20px;
      margin: 0 auto;
    }
    .h5p-player {
      width: 100%;
    }
    .loading {
      text-align: center;
      padding: 40px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="h5p-container">
    <div class="h5p-player" id="h5p-container"></div>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/h5p/1.24.0/js/h5p-resizer.js"></script>

  <script>
    // H5P content will be loaded here
    // This is a placeholder for the actual H5P player implementation
    // The actual content data would be loaded from the database and injected here

    document.addEventListener('DOMContentLoaded', function() {
      console.log('H5P player ready for content: ${contentId}');
      // Initialize H5P player with content data
      // Example: H5P.newRunnable(contentData, contentId, window.H5PIntegration);
    });
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Error rendering H5P content:', error);
    return NextResponse.json(
      {
        error: 'Failed to render H5P content',
        meta: {
          code: 'RENDER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
