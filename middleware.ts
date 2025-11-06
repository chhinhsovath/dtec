import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for route protection
 * Since we're using PostgreSQL direct connection, no Supabase needed
 */
export function middleware(request: NextRequest) {
  // Allow all requests through
  // Authentication is handled at API route level via postgres-auth
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
};
