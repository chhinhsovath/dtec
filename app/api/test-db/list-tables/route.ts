import { NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function GET() {
  try {
    // Get all tables in public schema
    const tablesResult = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const tablesList = tablesResult.rows.map(row => row.table_name);

    // Get column info for each table
    const tableDetails: Record<string, any> = {};

    for (const tableName of tablesList) {
      const columnsResult = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);

      tableDetails[tableName] = columnsResult.rows;
    }

    return NextResponse.json({
      tables: tablesList,
      totalTables: tablesList.length,
      details: tableDetails
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      code: error.code
    }, { status: 500 });
  }
}
