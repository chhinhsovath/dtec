import { NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function GET() {
  try {
    // Get all unique roles
    const roles = await query(`SELECT DISTINCT role FROM profiles ORDER BY role`);

    // Get table constraints
    const constraints = await query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'profiles'
    `);

    // Get check constraint details
    const checkConstraints = await query(`
      SELECT constraint_name, check_clause
      FROM information_schema.check_constraints
      WHERE constraint_name LIKE '%role%'
    `);

    return NextResponse.json({
      allRoles: roles.rows,
      constraints: constraints.rows,
      checkConstraints: checkConstraints.rows
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      detail: error.detail
    }, { status: 500 });
  }
}
