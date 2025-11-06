#!/usr/bin/env node

/**
 * TEC LMS - Demo Data Seeder
 *
 * This script populates the database with realistic demo data for testing.
 *
 * Usage:
 *   node scripts/seed-demo-data.js
 *
 * Requirements:
 *   - SSH tunnel running: ssh -L 5433:157.10.73.52:5432 ubuntu@157.10.73.52
 *   - npm install pg (PostgreSQL client)
 *   - Database already created with schema
 *
 * Created: November 4, 2024
 */

const { Client } = require('pg');

// Database connection config (matches .env.local)
const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  database: process.env.DB_NAME || 'dtech',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'P@ssw0rd',
  ssl: false,
});

// Fixed UUIDs for consistency
const UUIDs = {
  users: {
    admin: '11111111-1111-1111-1111-111111111111',
    teacher: '22222222-2222-2222-2222-222222222222',
    alice: '33333333-3333-3333-3333-333333333333',
    bob: '44444444-4444-4444-4444-444444444444',
    charlie: '55555555-5555-5555-5555-555555555555',
    diana: '66666666-6666-6666-6666-666666666666',
  },
  institution: 'aaaaaaaa-bbbb-cccc-dddd-aaaaaaaaaaaa',
  courses: {
    web: 'eeee1111-1111-1111-1111-111111111111',
    database: 'eeee2222-2222-2222-2222-222222222222',
    mobile: 'eeee3333-3333-3333-3333-333333333333',
    cloud: 'eeee4444-4444-4444-4444-444444444444',
  },
};

// Demo users data
const demoUsers = [
  { id: UUIDs.users.admin, email: 'admin@test.com', password: 'password123', first_name: 'John', last_name: 'Admin', role: 'admin' },
  { id: UUIDs.users.teacher, email: 'teacher@test.com', password: 'password123', first_name: 'Sarah', last_name: 'Teacher', role: 'teacher' },
  { id: UUIDs.users.alice, email: 'alice@test.com', password: 'password123', first_name: 'Alice', last_name: 'Johnson', role: 'student' },
  { id: UUIDs.users.bob, email: 'bob@test.com', password: 'password123', first_name: 'Bob', last_name: 'Smith', role: 'student' },
  { id: UUIDs.users.charlie, email: 'charlie@test.com', password: 'password123', first_name: 'Charlie', last_name: 'Brown', role: 'student' },
  { id: UUIDs.users.diana, email: 'diana@test.com', password: 'password123', first_name: 'Diana', last_name: 'Davis', role: 'student' },
];

const demoCourses = [
  { id: UUIDs.courses.web, title: 'Introduction to Web Development', description: 'Learn the fundamentals of HTML, CSS, and JavaScript for building modern websites.', credits: 3 },
  { id: UUIDs.courses.database, title: 'Advanced Database Design', description: 'Master relational database design, normalization, and optimization techniques.', credits: 4 },
  { id: UUIDs.courses.mobile, title: 'Mobile App Development', description: 'Develop cross-platform mobile applications using modern frameworks.', credits: 3 },
  { id: UUIDs.courses.cloud, title: 'Cloud Computing Fundamentals', description: 'Explore cloud platforms, deployment, and scalability concepts.', credits: 3 },
];

const demoStudents = [
  { userId: UUIDs.users.alice, studentNumber: 'S0001' },
  { userId: UUIDs.users.bob, studentNumber: 'S0002' },
  { userId: UUIDs.users.charlie, studentNumber: 'S0003' },
  { userId: UUIDs.users.diana, studentNumber: 'S0004' },
];

// Helper functions
async function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warn: '\x1b[33m',    // Yellow
    reset: '\x1b[0m',
  };
  const color = colors[type] || colors.info;
  console.log(`${color}[${type.toUpperCase()}]${colors.reset} ${message}`);
}

async function queryWithError(query, params = []) {
  try {
    const result = await client.query(query, params);
    return result;
  } catch (error) {
    log(`Query failed: ${error.message}`, 'error');
    throw error;
  }
}

// Main seeding function
async function seedDatabase() {
  try {
    log('🌱 Starting database seeding...', 'info');
    await client.connect();
    log('Connected to database', 'success');

    // Start transaction
    await client.query('BEGIN');
    log('Transaction started', 'info');

    // 1. Create institution
    log('Creating institution...', 'info');
    await queryWithError(
      `INSERT INTO institutions (id, name, settings, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      [UUIDs.institution, 'Technology Enhanced Classroom (TEC)', JSON.stringify({ country: 'Cambodia', language: 'Khmer' })]
    );
    log('✓ Institution created', 'success');

    // 2. Create courses
    log('Creating courses...', 'info');
    for (const course of demoCourses) {
      await queryWithError(
        `INSERT INTO courses (id, title, description, credits, institution_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        [course.id, course.title, course.description, course.credits, UUIDs.institution]
      );
    }
    log(`✓ ${demoCourses.length} courses created`, 'success');

    // 3. Create profiles
    log('Creating user profiles...', 'info');
    for (const user of demoUsers) {
      await queryWithError(
        `INSERT INTO profiles (user_id, first_name, last_name, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         ON CONFLICT (user_id) DO UPDATE SET first_name = $2, last_name = $3, role = $4`,
        [user.id, user.first_name, user.last_name, user.role]
      );
    }
    log(`✓ ${demoUsers.length} profiles created`, 'success');

    // 4. Create user-institution relationships
    log('Creating user-institution relationships...', 'info');
    for (const user of demoUsers) {
      const userRole = user.role === 'admin' ? 'admin' : (user.role === 'teacher' ? 'instructor' : 'student');
      await queryWithError(
        `INSERT INTO user_institutions (user_id, institution_id, role, created_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (user_id, institution_id) DO NOTHING`,
        [user.id, UUIDs.institution, userRole]
      );
    }
    log(`✓ ${demoUsers.length} user-institution relationships created`, 'success');

    // 5. Create student records
    log('Creating student records...', 'info');
    for (const student of demoStudents) {
      await queryWithError(
        `INSERT INTO students (user_id, student_number, enrollment_date, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         ON CONFLICT (user_id) DO NOTHING`,
        [student.userId, student.studentNumber, '2024-01-15']
      );
    }
    log(`✓ ${demoStudents.length} students created`, 'success');

    // 6. Create enrollments
    log('Creating enrollments...', 'info');
    const enrollments = [
      { student: UUIDs.users.alice, course: UUIDs.courses.web },
      { student: UUIDs.users.alice, course: UUIDs.courses.database },
      { student: UUIDs.users.bob, course: UUIDs.courses.web },
      { student: UUIDs.users.bob, course: UUIDs.courses.mobile },
      { student: UUIDs.users.charlie, course: UUIDs.courses.database },
      { student: UUIDs.users.charlie, course: UUIDs.courses.cloud },
      { student: UUIDs.users.diana, course: UUIDs.courses.web },
      { student: UUIDs.users.diana, course: UUIDs.courses.mobile },
    ];

    for (const enrollment of enrollments) {
      const studentResult = await queryWithError(
        `SELECT id FROM students WHERE user_id = $1`,
        [enrollment.student]
      );

      if (studentResult.rows.length > 0) {
        const studentId = studentResult.rows[0].id;
        await queryWithError(
          `INSERT INTO enrollments (student_id, course_id, status, created_at, updated_at)
           VALUES ($1, $2, $3, NOW(), NOW())
           ON CONFLICT (student_id, course_id) DO NOTHING`,
          [studentId, enrollment.course, 'active']
        );
      }
    }
    log(`✓ ${enrollments.length} enrollments created`, 'success');

    // 7. Create academic records
    log('Creating academic records...', 'info');
    const academicData = [
      { student: UUIDs.users.alice, semester: 'Fall 2024', gpa: 3.75 },
      { student: UUIDs.users.bob, semester: 'Fall 2024', gpa: 3.45 },
      { student: UUIDs.users.charlie, semester: 'Fall 2024', gpa: 3.65 },
      { student: UUIDs.users.diana, semester: 'Fall 2024', gpa: 3.50 },
    ];

    for (const record of academicData) {
      const studentResult = await queryWithError(
        `SELECT id FROM students WHERE user_id = $1`,
        [record.student]
      );

      if (studentResult.rows.length > 0) {
        const studentId = studentResult.rows[0].id;
        await queryWithError(
          `INSERT INTO academic_records (student_id, semester, gpa, created_at, updated_at)
           VALUES ($1, $2, $3, NOW(), NOW())
           ON CONFLICT DO NOTHING`,
          [studentId, record.semester, record.gpa]
        );
      }
    }
    log(`✓ ${academicData.length} academic records created`, 'success');

    // 8. Create attendance records
    log('Creating attendance records...', 'info');
    let attendanceCount = 0;
    const attendanceStatuses = ['present', 'late', 'absent'];
    const today = new Date();

    for (const student of demoStudents) {
      const studentResult = await queryWithError(
        `SELECT id FROM students WHERE user_id = $1`,
        [student.userId]
      );

      if (studentResult.rows.length > 0) {
        const studentId = studentResult.rows[0].id;

        // Create 20 attendance records for the last month
        for (let i = 0; i < 20; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const status = attendanceStatuses[Math.floor(Math.random() * attendanceStatuses.length)];

          await queryWithError(
            `INSERT INTO attendance (student_id, session_id, status, date, created_at)
             VALUES ($1, $2, $3, $4, NOW())
             ON CONFLICT DO NOTHING`,
            [studentId, `session-${i}`, status, date.toISOString().split('T')[0]]
          );
          attendanceCount++;
        }
      }
    }
    log(`✓ ${attendanceCount} attendance records created`, 'success');

    // Commit transaction
    await client.query('COMMIT');
    log('Transaction committed', 'info');

    // Verify data
    log('Verifying data...', 'info');
    const counts = await queryWithError(`
      SELECT
        (SELECT COUNT(*) FROM profiles) as profiles,
        (SELECT COUNT(*) FROM institutions) as institutions,
        (SELECT COUNT(*) FROM students) as students,
        (SELECT COUNT(*) FROM courses) as courses,
        (SELECT COUNT(*) FROM enrollments) as enrollments,
        (SELECT COUNT(*) FROM attendance) as attendance,
        (SELECT COUNT(*) FROM academic_records) as academic_records
    `);

    const { profiles, institutions, students, courses, enrollments, attendance, academic_records } = counts.rows[0];

    log('\n📊 Final Statistics:', 'info');
    log(`   Institutions:     ${institutions}`, 'success');
    log(`   Courses:          ${courses}`, 'success');
    log(`   User Profiles:    ${profiles}`, 'success');
    log(`   Students:         ${students}`, 'success');
    log(`   Enrollments:      ${enrollments}`, 'success');
    log(`   Academic Records: ${academic_records}`, 'success');
    log(`   Attendance:       ${attendance}`, 'success');

    log('\n✅ Demo data seeding completed successfully!', 'success');
    log('\n🧪 Test Accounts:', 'info');
    for (const user of demoUsers) {
      log(`   ${user.email} / ${user.password} (${user.role})`, 'info');
    }

    log('\n🔗 Next Steps:', 'info');
    log('   1. Start dev server: npm run dev', 'info');
    log('   2. Open http://localhost:3000', 'info');
    log('   3. Login with one of the test accounts above', 'info');

  } catch (error) {
    log(`Fatal error: ${error.message}`, 'error');
    await client.query('ROLLBACK').catch(() => {});
    process.exit(1);
  } finally {
    await client.end();
    log('Database connection closed', 'info');
  }
}

// Run seeder
seedDatabase().catch((error) => {
  log(`Seeding failed: ${error.message}`, 'error');
  process.exit(1);
});
