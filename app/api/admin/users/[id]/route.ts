import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import crypto from 'crypto';

// Hash password using SHA256 (for development only)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// GET - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await query(
      `SELECT id, email, full_name, role, created_at, avatar_url
       FROM profiles
       WHERE id = $1`,
      [params.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: result.rows[0] });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { email, fullName, role, password } = body;

    let queryText = `
      UPDATE profiles
      SET updated_at = NOW()
    `;
    const queryParams: any[] = [];
    let paramCount = 1;

    if (email) {
      queryText += `, email = $${paramCount}`;
      queryParams.push(email);
      paramCount++;
    }

    if (fullName !== undefined) {
      queryText += `, full_name = $${paramCount}`;
      queryParams.push(fullName);
      paramCount++;
    }

    if (role) {
      queryText += `, role = $${paramCount}`;
      queryParams.push(role);
      paramCount++;
    }

    if (password) {
      const hashedPassword = hashPassword(password);
      queryText += `, password_hash = $${paramCount}`;
      queryParams.push(hashedPassword);
      paramCount++;
    }

    queryText += ` WHERE id = $${paramCount}
                   RETURNING id, email, full_name, role, created_at`;
    queryParams.push(params.id);

    const result = await query(queryText, queryParams);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: result.rows[0] });
  } catch (error: any) {
    console.error('Error updating user:', error);
    if (error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Delete profile (CASCADE will handle related records)
    const result = await query(
      'DELETE FROM profiles WHERE id = $1 RETURNING id',
      [params.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
