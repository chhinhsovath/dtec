import { NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function POST() {
  try {
    // Demo users to create (using UUID format for id)
    // Note: Database only supports student, teacher, admin roles
    const demoUsers = [
      {
        id: '10000000-0000-0000-0000-000000000001',
        email: 'student@demo.com',
        password_hash: 'ad5561d2f2034f7a6b73ee5760cbc612cb04480866df0b322bc2af34e31bd3bc',
        full_name: 'Demo Student',
        role: 'student'
      },
      {
        id: '10000000-0000-0000-0000-000000000002',
        email: 'teacher@demo.com',
        password_hash: 'ad5561d2f2034f7a6b73ee5760cbc612cb04480866df0b322bc2af34e31bd3bc',
        full_name: 'Demo Teacher',
        role: 'teacher'
      },
      {
        id: '10000000-0000-0000-0000-000000000003',
        email: 'admin@demo.com',
        password_hash: 'ad5561d2f2034f7a6b73ee5760cbc612cb04480866df0b322bc2af34e31bd3bc',
        full_name: 'Demo Admin',
        role: 'admin'
      }
    ];

    const results = [];

    for (const user of demoUsers) {
      try {
        const result = await query(
          `INSERT INTO profiles (id, email, password_hash, full_name, role, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
           ON CONFLICT (email) DO NOTHING
           RETURNING *`,
          [user.id, user.email, user.password_hash, user.full_name, user.role]
        );

        results.push({
          email: user.email,
          role: user.role,
          created: result.rows.length > 0,
          message: result.rows.length > 0 ? 'Created' : 'Already exists'
        });
      } catch (err: any) {
        results.push({
          email: user.email,
          role: user.role,
          created: false,
          error: err.message
        });
      }
    }

    // Verify all demo users exist
    const verify = await query(
      `SELECT email, role, full_name FROM profiles WHERE email LIKE '%demo%' ORDER BY role`
    );

    return NextResponse.json({
      success: true,
      message: 'Demo users setup complete',
      inserted: results,
      verified: verify.rows,
      totalDemoUsers: verify.rows.length
    });
  } catch (error: any) {
    console.error('[DEMO-USERS] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      detail: error.detail
    }, { status: 500 });
  }
}
