/**
 * Client-side Authentication
 * 
 * This module provides client-side authentication functions
 * that work with localStorage for session management.
 */

export interface AuthUser {
  id: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  full_name: string | null;
}

export interface AuthResponse {
  user: AuthUser | null;
  error: Error | null;
}

/**
 * Sign in user with email and password
 */
export async function signInWithPassword(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    // Call server-side API for authentication
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return {
        user: null,
        error: new Error(data.error || 'Authentication failed'),
      };
    }

    return {
      user: data.user,
      error: null,
    };
  } catch (error: any) {
    return {
      user: null,
      error: error,
    };
  }
}

/**
 * Get current session from localStorage
 */
export function getSession(): AuthUser | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const sessionStr = localStorage.getItem('auth_session');
  if (!sessionStr) {
    return null;
  }

  try {
    return JSON.parse(sessionStr);
  } catch {
    return null;
  }
}

/**
 * Store session in localStorage
 */
export function setSession(user: AuthUser): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_session', JSON.stringify(user));
  }
}

/**
 * Clear session
 */
export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_session');
  }
}
