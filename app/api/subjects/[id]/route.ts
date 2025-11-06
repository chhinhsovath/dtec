import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

/**
 * GET /api/subjects/[id]
 * Fetch a specific subject
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subjectId = params.id;

    const result = await query(
      `SELECT * FROM subjects WHERE id = $1`,
      [subjectId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Subject not found',
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
    console.error('Error fetching subject:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch subject',
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
 * PUT /api/subjects/[id]
 * Update a subject
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subjectId = params.id;
    const body = await request.json();

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (body.name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(body.name);
      paramCount++;
    }

    if (body.code !== undefined) {
      updates.push(`code = $${paramCount}`);
      values.push(body.code);
      paramCount++;
    }

    if (body.description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(body.description || null);
      paramCount++;
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

    values.push(subjectId);

    const result = await query(
      `UPDATE subjects SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Subject not found',
          meta: { code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Subject updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating subject:', error);
    return NextResponse.json(
      {
        error: 'Failed to update subject',
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
 * DELETE /api/subjects/[id]
 * Delete a subject
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subjectId = params.id;

    const result = await query(
      'DELETE FROM subjects WHERE id = $1 RETURNING *',
      [subjectId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Subject not found',
          meta: { code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Subject deleted successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting subject:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete subject',
        meta: {
          code: 'DELETE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
