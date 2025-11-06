import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import crypto from 'crypto';

/**
 * GET /api/certificates
 * Fetch certificates for student or all certificates
 */
export async function GET(request: NextRequest) {
  try {
    const studentId = request.nextUrl.searchParams.get('studentId');
    const courseId = request.nextUrl.searchParams.get('courseId');
    const pathId = request.nextUrl.searchParams.get('pathId');

    let sql = `SELECT
                c.*,
                p.first_name,
                p.last_name,
                p.email,
                co.name as course_name,
                lp.name as path_name
              FROM certificates c
              LEFT JOIN profiles p ON c.student_id = p.id
              LEFT JOIN courses co ON c.course_id = co.id
              LEFT JOIN learning_paths lp ON c.path_id = lp.id
              WHERE c.is_valid = true`;
    const params: unknown[] = [];

    if (studentId) {
      sql += ` AND c.student_id = $${params.length + 1}`;
      params.push(studentId);
    }

    if (courseId) {
      sql += ` AND c.course_id = $${params.length + 1}`;
      params.push(courseId);
    }

    if (pathId) {
      sql += ` AND c.path_id = $${params.length + 1}`;
      params.push(pathId);
    }

    sql += ` ORDER BY c.issued_date DESC LIMIT 100`;

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rowCount || 0,
    });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch certificates',
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
 * POST /api/certificates
 * Issue a new certificate
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.studentId || !body.title || !body.certificateType) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          meta: {
            code: 'VALIDATION_ERROR',
            required: ['studentId', 'title', 'certificateType'],
          },
        },
        { status: 400 }
      );
    }

    // Generate certificate number and verification code
    const certificateNumber = `CERT-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
    const verificationCode = crypto
      .randomBytes(16)
      .toString('hex')
      .toUpperCase();

    const result = await query(
      `INSERT INTO certificates (
        student_id, course_id, path_id, certificate_type,
        certificate_number, title, description, issued_date,
        expiry_date, is_valid, verification_code, certificate_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, $8, true, $9, $10)
      RETURNING *`,
      [
        body.studentId,
        body.courseId || null,
        body.pathId || null,
        body.certificateType,
        certificateNumber,
        body.title,
        body.description || null,
        body.expiryDate || null,
        verificationCode,
        body.certificateUrl || null,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Certificate issued successfully',
        data: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error issuing certificate:', error);
    return NextResponse.json(
      {
        error: 'Failed to issue certificate',
        meta: {
          code: 'CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
