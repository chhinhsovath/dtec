import { NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function GET() {
  try {
    // Test basic connection
    const testResult = await query('SELECT NOW()');
    console.log('[TEST] Database connected:', testResult.rows[0]);

    // Check if profiles table exists
    const tableCheck = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles'
    `);
    console.log('[TEST] Profiles table exists:', tableCheck.rows.length > 0);

    // Get table structure
    const columnsCheck = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'profiles'
      ORDER BY ordinal_position
    `);
    console.log('[TEST] Profiles columns:', columnsCheck.rows);

    // Try to count profiles
    const countResult = await query('SELECT COUNT(*) as count FROM profiles');
    console.log('[TEST] Total profiles:', countResult.rows[0]);

    // Try to get first 5 profiles
    const profilesResult = await query('SELECT * FROM profiles LIMIT 5');
    console.log('[TEST] Sample profiles:', profilesResult.rows);

    return NextResponse.json({
      success: true,
      connection: testResult.rows[0],
      tableExists: tableCheck.rows.length > 0,
      columns: columnsCheck.rows,
      totalCount: countResult.rows[0],
      sampleProfiles: profilesResult.rows
    });
  } catch (error: any) {
    console.error('[TEST] Database error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      detail: error.detail
    }, { status: 500 });
  }
}
