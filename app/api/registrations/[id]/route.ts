import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/registrations/[id]
 * Fetch a specific registration request
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const registrationId = params.id;

    const result = await query(
      `SELECT
        r.*,
        i.name as institution_name
       FROM registration_requests r
       LEFT JOIN institutions i ON r.institution_id = i.id
       WHERE r.id = $1`,
      [registrationId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Registration not found',
          meta: { code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching registration:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch registration',
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
 * PUT /api/registrations/[id]
 * Update a registration request
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const registrationId = params.id;
    const body = await request.json();

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (body.firstName !== undefined) {
      updates.push(`first_name = $${paramCount}`);
      values.push(body.firstName);
      paramCount++;
    }

    if (body.lastName !== undefined) {
      updates.push(`last_name = $${paramCount}`);
      values.push(body.lastName);
      paramCount++;
    }

    if (body.dateOfBirth !== undefined) {
      updates.push(`date_of_birth = $${paramCount}`);
      values.push(body.dateOfBirth || null);
      paramCount++;
    }

    if (body.phoneNumber !== undefined) {
      updates.push(`phone_number = $${paramCount}`);
      values.push(body.phoneNumber || null);
      paramCount++;
    }

    if (body.address !== undefined) {
      updates.push(`address = $${paramCount}`);
      values.push(body.address || null);
      paramCount++;
    }

    if (body.institutionId !== undefined) {
      updates.push(`institution_id = $${paramCount}`);
      values.push(body.institutionId || null);
      paramCount++;
    }

    if (body.idDocumentUrl !== undefined) {
      updates.push(`id_document_url = $${paramCount}`);
      values.push(body.idDocumentUrl || null);
      paramCount++;
    }

    if (body.transcriptUrl !== undefined) {
      updates.push(`transcript_url = $${paramCount}`);
      values.push(body.transcriptUrl || null);
      paramCount++;
    }

    if (body.proofOfAddressUrl !== undefined) {
      updates.push(`proof_of_address_url = $${paramCount}`);
      values.push(body.proofOfAddressUrl || null);
      paramCount++;
    }

    if (body.currentStep !== undefined) {
      updates.push(`current_step = $${paramCount}`);
      values.push(body.currentStep);
      paramCount++;
    }

    if (body.status !== undefined) {
      updates.push(`status = $${paramCount}`);
      values.push(body.status);
      paramCount++;
      if (body.status === 'submitted') {
        updates.push(`submitted_at = CURRENT_TIMESTAMP`);
      }
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updates.length === 1) {
      return NextResponse.json(
        {
          error: 'No fields to update',
          meta: { code: 'NO_UPDATES' },
        },
        { status: 400 }
      );
    }

    values.push(registrationId);

    const result = await query(
      `UPDATE registration_requests SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Registration not found',
          meta: { code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Registration updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating registration:', error);
    return NextResponse.json(
      {
        error: 'Failed to update registration',
        meta: {
          code: 'UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/registrations/[id]
 * Delete a registration request
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const registrationId = params.id;

    const result = await query(
      'DELETE FROM registration_requests WHERE id = $1 RETURNING *',
      [registrationId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Registration not found',
          meta: { code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Registration deleted successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting registration:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete registration',
        meta: {
          code: 'DELETE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
