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

    // Create response with user data
    const response = NextResponse.json({ user });

    // Set user_id cookie for API authentication
    response.cookies.set('user_id', user.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    return response;
  } catch (error: any) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
