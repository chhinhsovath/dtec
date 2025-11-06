import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import crypto from 'crypto';

// Hash password using SHA256 (for development only)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// GET - List all users
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');
    const search = searchParams.get('search');

    let queryText = `
      SELECT id, email, full_name, role, created_at, avatar_url
      FROM profiles
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (role) {
      queryText += ` AND role = $${paramCount}`;
      params.push(role);
      paramCount++;
    }

    if (search) {
      queryText += ` AND (full_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    queryText += ' ORDER BY created_at DESC';

    const result = await query(queryText, params);

    console.log('[API] Users query result:', result.rows.length, 'users found');

    // Get counts by role
    const countResult = await query(`
      SELECT role, COUNT(*) as count
      FROM profiles
      GROUP BY role
    `);

    console.log('[API] Count result:', countResult.rows);

    const counts = countResult.rows.reduce((acc: any, row: any) => {
      acc[row.role] = parseInt(row.count);
      return acc;
    }, {});

    const totalCount = Object.values(counts).reduce((sum: number, count: any) => sum + count, 0);

    const response = {
      users: result.rows,
      counts: {
        total: totalCount,
        student: counts.student || 0,
        teacher: counts.teacher || 0,
        admin: counts.admin || 0,
      },
    };

    console.log('[API] Sending response with', response.users.length, 'users and counts:', response.counts);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack
    });
    return NextResponse.json(
      { 
        error: 'Failed to fetch users',
        message: error.message,
        code: error.code,
        detail: error.detail
      },
      { status: 500 }
    );
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName, role } = body;

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Email, password, and role are required' },
        { status: 400 }
      );
    }

    const userId = crypto.randomUUID();
    const hashedPassword = hashPassword(password);

    // Create profile
    const profileResult = await query(
      `INSERT INTO profiles (id, email, password_hash, full_name, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, email, full_name, role, created_at`,
      [userId, email, hashedPassword, fullName, role]
    );

    const user = profileResult.rows[0];

    // If student, create student record
    if (role === 'student') {
      const studentNumber = `STU${Date.now().toString().slice(-6)}`;
      await query(
        `INSERT INTO students (id, user_id, student_id, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [crypto.randomUUID(), userId, studentNumber]
      );
    }

    return NextResponse.json({ user }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    if (error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
