/**
 * Parent Portal Documents API
 * Endpoint: GET/PUT /api/parent-portal/documents
 * Get shared documents and manage document signatures
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * GET /api/parent-portal/documents
 * Get documents shared with parent
 */
export async function GET(request: Request) {
  const session = await getSession();

  if (!session || !session?.id || session.role !== 'parent') {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'PARENT_ONLY' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const documentType = searchParams.get('type');
    const requiresAction = searchParams.get('requiresAction');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let whereClause = `pd.parent_id = $1`;
    const params: any[] = [session.id];

    if (studentId) {
      whereClause += ` AND pd.student_id = $${params.length + 1}`;
      params.push(parseInt(studentId));
    }

    if (documentType) {
      whereClause += ` AND pd.document_type = $${params.length + 1}`;
      params.push(documentType);
    }

    if (requiresAction !== null) {
      whereClause += ` AND pd.requires_action = $${params.length + 1}`;
      params.push(requiresAction === 'true');
    }

    // Get documents
    const documentsResult = await query(
      `SELECT
        pd.document_id,
        pd.parent_id,
        pd.student_id,
        pd.document_type,
        pd.file_name,
        pd.file_url,
        pd.file_size_mb,
        pd.description,
        pd.issued_date,
        pd.is_signed,
        pd.signed_at,
        pd.signed_by,
        pd.requires_action,
        pd.action_deadline,
        pd.created_at,
        s.user_id as student_user_id,
        sp.user_name as student_name,
        sb.user_name as signed_by_name
       FROM parent_documents pd
       LEFT JOIN students s ON pd.student_id = s.student_id
       LEFT JOIN profiles sp ON s.user_id = sp.id
       LEFT JOIN profiles sb ON pd.signed_by = sb.id
       WHERE ${whereClause}
       ORDER BY pd.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    // Get count of documents requiring action
    const actionCountResult = await query(
      `SELECT COUNT(*) as count FROM parent_documents
       WHERE parent_id = $1 AND requires_action = true AND is_signed = false`,
      [session.id]
    );

    const docsRequiringAction = parseInt(actionCountResult.rows[0].count || '0');

    return NextResponse.json({
      success: true,
      data: {
        documents: documentsResult.rows,
        count: documentsResult.rowCount,
        documents_requiring_action: docsRequiringAction,
        limit,
        offset,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching documents:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch documents',
        code: 'FETCH_ERROR',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/parent-portal/documents
 * Sign documents
 */
export async function PUT(request: Request) {
  const session = await getSession();

  if (!session || !session?.id || session.role !== 'parent') {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'PARENT_ONLY' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { documentId } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: 'Missing documentId', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    // Verify ownership
    const verifyResult = await query(
      `SELECT document_id FROM parent_documents WHERE document_id = $1 AND parent_id = $2`,
      [parseInt(documentId), session.id]
    );

    if (verifyResult.rowCount === 0) {
      return NextResponse.json(
        { error: 'Document not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Sign document
    const updateResult = await query(
      `UPDATE parent_documents
       SET is_signed = true, signed_at = CURRENT_TIMESTAMP, signed_by = $1
       WHERE document_id = $2
       RETURNING *`,
      [session.id, parseInt(documentId)]
    );

    const document = updateResult.rows[0];

    // Get signer info
    const signerResult = await query(
      `SELECT user_name FROM profiles WHERE id = $1`,
      [session.id]
    );

    return NextResponse.json({
      success: true,
      data: {
        ...document,
        signed_by_name: signerResult.rows[0]?.user_name || null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error signing document:', error);

    return NextResponse.json(
      {
        error: 'Failed to sign document',
        code: 'UPDATE_ERROR',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
