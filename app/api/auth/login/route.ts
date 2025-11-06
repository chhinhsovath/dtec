import { NextRequest, NextResponse } from 'next/server';
import { verifyCredentials } from '@/lib/auth/postgres-auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Verify credentials using postgres-auth
    const { user, error } = await verifyCredentials(email, password);

    if (error || !user) {
      return NextResponse.json(
        { error: error?.message || 'Invalid credentials' },
        { status: 401 }
      );
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
