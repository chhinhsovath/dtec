import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import crypto from 'crypto';

// GET - List all courses
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    let queryText = `
      SELECT c.*, 
             p.full_name as teacher_name,
             (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as enrollment_count
      FROM courses c
      LEFT JOIN profiles p ON c.teacher_id = p.user_id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (search) {
      queryText += ` AND (c.name ILIKE $${paramCount} OR c.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (status) {
      queryText += ` AND c.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    queryText += ' ORDER BY c.created_at DESC';

    const result = await query(queryText, params);

    // Get total counts
    const countResult = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as archived
      FROM courses
    `);

    return NextResponse.json({
      courses: result.rows,
      counts: countResult.rows[0],
    });
  } catch (error: any) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

// POST - Create new course
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, credits, teacherId, status = 'active' } = body;

    if (!title || !credits) {
      return NextResponse.json(
        { error: 'Title and credits are required' },
        { status: 400 }
      );
    }

    const courseId = crypto.randomUUID();

    const result = await query(
      `INSERT INTO courses (id, title, description, credits, teacher_id, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [courseId, title, description, credits, teacherId, status]
    );

    return NextResponse.json({ course: result.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}
