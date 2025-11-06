/**
 * PostgreSQL-based Authentication (Server-side only)
 *
 * This module provides server-side authentication functions that work directly with
 * PostgreSQL instead of Supabase Auth.
 *
 * Used when NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are not configured.
 * 
 * IMPORTANT: This file should only be imported in server-side code (API routes, server components)
 * For client-side auth, use @/lib/auth/client-auth
 */

import crypto from 'crypto';
import { query } from '@/lib/database';

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
 * Hash password using SHA256 (for development only)
 * In production, use bcrypt or similar
 */
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Verify user credentials (server-side only)
 */
export async function verifyCredentials(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    const hashedPassword = hashPassword(password);

    console.log('[AUTH] Verifying credentials for:', email);
    console.log('[AUTH] Password hash:', hashedPassword);

    const result = await query(
      `SELECT id, email, role, full_name FROM profiles WHERE email = $1 AND password_hash = $2`,
      [email, hashedPassword]
    );

    console.log('[AUTH] Query result rows:', result.rows.length);

    if (result.rows.length === 0) {
      console.log('[AUTH] No user found with email and matching password hash');
      return {
        user: null,
        error: new Error('Invalid email or password'),
      };
    }

    const user = result.rows[0];
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
      },
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
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<AuthUser | null> {
  try {
    const result = await query(
      `SELECT id, email, role, full_name FROM profiles WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

/**
 * Sign up new user
 */
export async function signUp(
  email: string,
  password: string,
  fullName: string,
  role: 'student' | 'teacher' | 'admin' = 'student'
): Promise<AuthResponse> {
  try {
    const userId = crypto.randomUUID();
    const hashedPassword = hashPassword(password);

    const result = await query(
      `INSERT INTO profiles (id, email, password_hash, full_name, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, email, role, full_name`,
      [userId, email, hashedPassword, fullName, role]
    );

    if (result.rows.length === 0) {
      return {
        user: null,
        error: new Error('Failed to create user'),
      };
    }

    const user = result.rows[0];
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
      },
      error: null,
    };
  } catch (error: any) {
    if (error.message.includes('duplicate key')) {
      return {
        user: null,
        error: new Error('Email already exists'),
      };
    }
    return {
      user: null,
      error: error,
    };
  }
}

