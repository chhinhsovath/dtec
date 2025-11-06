import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/registrations
 * Fetch registration requests with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const statusParams = request.nextUrl.searchParams.getAll('status');
    const institutionId = request.nextUrl.searchParams.get('institutionId');
    const limit = request.nextUrl.searchParams.get('limit') || '50';

    let sql = `SELECT
      r.*,
      i.name as institution_name
     FROM registration_requests r
     LEFT JOIN institutions i ON r.institution_id = i.id
     WHERE 1=1`;

    const params: unknown[] = [];

    if (statusParams.length > 0) {
      const placeholders = statusParams.map((_, index) => `$${params.length + index + 1}`).join(',');
      sql += ` AND r.status IN (${placeholders})`;
      params.push(...statusParams);
    }

    if (institutionId) {
      sql += ' AND r.institution_id = $' + (params.length + 1);
      params.push(institutionId);
    }

    const limitNum = parseInt(limit);
    sql += ' ORDER BY r.created_at DESC LIMIT ' + limitNum;

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rowCount || 0,
    });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch registrations',
        meta: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/registrations
 * Create or update a registration request
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.email || !body.firstName || !body.lastName) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          meta: {
            code: 'VALIDATION_ERROR',
            required: ['email', 'firstName', 'lastName'],
          },
        },
        { status: 400 }
      );
    }

    // Check if registration already exists
    const existing = await query(
      'SELECT id FROM registration_requests WHERE email = $1',
      [body.email]
    );

    let result;

    if (existing.rows.length > 0) {
      // Update existing registration
      result = await query(
        `UPDATE registration_requests
         SET first_name = $1, last_name = $2, date_of_birth = $3, phone_number = $4,
             address = $5, institution_id = $6, current_step = $7, updated_at = CURRENT_TIMESTAMP
         WHERE email = $8
         RETURNING *`,
        [
          body.firstName,
          body.lastName,
          body.dateOfBirth || null,
          body.phoneNumber || null,
          body.address || null,
          body.institutionId || null,
          body.currentStep || 1,
          body.email,
        ]
      );
    } else {
      // Create new registration
      result = await query(
        `INSERT INTO registration_requests
         (email, first_name, last_name, date_of_birth, phone_number, address, institution_id, current_step)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          body.email,
          body.firstName,
          body.lastName,
          body.dateOfBirth || null,
          body.phoneNumber || null,
          body.address || null,
          body.institutionId || null,
          body.currentStep || 1,
        ]
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: existing.rows.length > 0 ? 'Registration updated' : 'Registration created',
        data: result.rows[0],
      },
      { status: existing.rows.length > 0 ? 200 : 201 }
    );
  } catch (error) {
    console.error('Error creating registration:', error);
    return NextResponse.json(
      {
        error: 'Failed to create registration',
        meta: {
          code: 'CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
