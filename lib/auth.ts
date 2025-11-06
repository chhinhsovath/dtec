// Re-export only postgres-auth for server-side use
// For client-side auth, import directly from './auth/client-auth'
export * from './auth/postgres-auth';
import type { AuthUser as PostgresAuthUser } from './auth/postgres-auth';

// Extended AuthUser type for API routes that expect a nested user object
export interface AuthUser {
  user?: {
    id: string;
    email: string;
    name?: string;
    role: 'student' | 'teacher' | 'admin' | 'parent';
    full_name: string | null;
  };
  id: string;
  email: string;
  name?: string;
  role: 'student' | 'teacher' | 'admin' | 'parent';
  full_name: string | null;
  [key: string]: any; // Allow additional properties for flexibility
}

// Stub function for API routes that haven't been migrated to header-based auth
// WARNING: This returns null - API routes should use header-based auth instead
// (x-user-id, x-teacher-id headers from the request)
export async function getSession(): Promise<AuthUser | null> {
  return null;
}