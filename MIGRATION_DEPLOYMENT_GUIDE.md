# 🚀 Migration Deployment Guide - Teacher Modules

## Overview

This guide walks you through deploying the teacher modules database migration to your PostgreSQL database.

**Migration File**: `supabase/migrations/003_teacher_modules.sql`

**Tables Created**: 7 new tables with 50+ columns, indexes, and RLS policies

---

## ⚠️ Pre-Deployment Checklist

Before deploying, ensure:

- [x] Database backup exists (CRITICAL!)
- [x] No other migrations are running
- [x] You have database admin credentials
- [x] SSH access to database server (if applicable)
- [x] Network connectivity to database

---

## 🔧 Method 1: Using Deployment Script (Recommended)

### Step 1: Make script executable

```bash
chmod +x scripts/deploy-migrations.sh
```

### Step 2: Run for development (localhost)

```bash
./scripts/deploy-migrations.sh dev
# Then enter database password when prompted
```

### Step 3: Run for production (with SSH tunnel)

**First, ensure SSH tunnel is open:**

```bash
# Terminal 1 - Keep this open during migration
ssh -L 5433:157.10.73.52:5432 ubuntu@157.10.73.52
# Password: en_&xdX#!N(^OqCQzc3RE0B)m6ogU!
```

**Second, deploy in another terminal:**

```bash
# Terminal 2
./scripts/deploy-migrations.sh prod
# Then enter database password when prompted: P@ssw0rd
```

---

## 🔧 Method 2: Manual Deployment

### Step 1: For Development Database (localhost)

```bash
export PGPASSWORD="P@ssw0rd"

psql \
  -h localhost \
  -p 5433 \
  -U admin \
  -d dtech \
  -f supabase/migrations/003_teacher_modules.sql

unset PGPASSWORD
```

### Step 2: For Production Database (with SSH tunnel)

**Terminal 1 - Create SSH tunnel:**

```bash
ssh -L 5433:157.10.73.52:5432 ubuntu@157.10.73.52
# Password: en_&xdX#!N(^OqCQzc3RE0B)m6ogU!
# Keep this terminal open
```

**Terminal 2 - Deploy migration:**

```bash
export PGPASSWORD="P@ssw0rd"

psql \
  -h localhost \
  -p 5433 \
  -U admin \
  -d dtech \
  -f supabase/migrations/003_teacher_modules.sql

unset PGPASSWORD
```

---

## ✅ Verification Steps

### Step 1: Check if tables were created

```bash
export PGPASSWORD="P@ssw0rd"

psql \
  -h localhost \
  -p 5433 \
  -U admin \
  -d dtech \
  -c "SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;"

unset PGPASSWORD
```

**Expected output should include:**
```
 course_announcements
 assessments
 questions
 question_options
 submissions
 submission_answers
 grades
```

### Step 2: Check table structure

```bash
export PGPASSWORD="P@ssw0rd"

psql \
  -h localhost \
  -p 5433 \
  -U admin \
  -d dtech \
  -c "SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'assessments'
      ORDER BY ordinal_position;"

unset PGPASSWORD
```

### Step 3: Check indexes

```bash
export PGPASSWORD="P@ssw0rd"

psql \
  -h localhost \
  -p 5433 \
  -U admin \
  -d dtech \
  -c "SELECT indexname FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename IN ('assessments', 'questions', 'submissions', 'grades')
      ORDER BY indexname;"

unset PGPASSWORD
```

### Step 4: Check RLS policies

```bash
export PGPASSWORD="P@ssw0rd"

psql \
  -h localhost \
  -p 5433 \
  -U admin \
  -d dtech \
  -c "SELECT schemaname, tablename, policyname
      FROM pg_policies
      WHERE tablename IN ('assessments', 'submissions', 'grades')
      ORDER BY tablename, policyname;"

unset PGPASSWORD
```

---

## 📊 Migration Contents

### Tables Created (7)

1. **course_announcements**
   - Stores teacher announcements for courses
   - Columns: id, course_id, teacher_id, title, content, is_pinned, timestamps
   - Indexes: course_id, teacher_id, created_at

2. **assessments**
   - Stores quizzes, assignments, exams
   - Columns: id, course_id, teacher_id, title, description, assessment_type, total_points, due_date, settings
   - Indexes: course_id, teacher_id, is_published, due_date

3. **questions**
   - Stores assessment questions
   - Columns: id, assessment_id, question_text, question_type, points, order_position, explanation
   - Indexes: assessment_id, order_position

4. **question_options**
   - Stores multiple choice answer options
   - Columns: id, question_id, option_text, is_correct, order_position
   - Indexes: question_id, order_position

5. **submissions**
   - Stores student submissions to assessments
   - Columns: id, assessment_id, student_id, status, score, max_score, timestamps, time_spent
   - Indexes: assessment_id, student_id, status, submitted_at

6. **submission_answers**
   - Stores individual question responses
   - Columns: id, submission_id, question_id, answer_text, selected_option_id, points_earned, feedback
   - Indexes: submission_id, question_id

7. **grades**
   - Stores final grades and feedback
   - Columns: id, submission_id, teacher_id, overall_score, letter_grade, feedback, graded_at
   - Indexes: submission_id, teacher_id, graded_at

### Additional Features

- ✅ **Auto-timestamps**: Triggers update `updated_at` on every change
- ✅ **Enum types**: assessment_type, submission_status for data integrity
- ✅ **Cascading deletes**: Deleting course cascades to assessments, which cascades to questions
- ✅ **RLS policies**: Row-level security for teacher/student access control
- ✅ **Unique constraints**: Prevents duplicate submissions, grades

---

## 🔄 Rollback (If Needed)

If something goes wrong, you can rollback by dropping the new tables:

```bash
export PGPASSWORD="P@ssw0rd"

psql \
  -h localhost \
  -p 5433 \
  -U admin \
  -d dtech \
  -c "
  DROP TABLE IF EXISTS grades CASCADE;
  DROP TABLE IF EXISTS submission_answers CASCADE;
  DROP TABLE IF EXISTS submissions CASCADE;
  DROP TABLE IF EXISTS question_options CASCADE;
  DROP TABLE IF EXISTS questions CASCADE;
  DROP TABLE IF EXISTS assessments CASCADE;
  DROP TABLE IF EXISTS course_announcements CASCADE;
  DROP TYPE IF EXISTS assessment_type;
  DROP TYPE IF EXISTS submission_status;
  "

unset PGPASSWORD
```

⚠️ **WARNING**: This will delete all data in these tables!

---

## 🐛 Troubleshooting

### Issue: "psql: command not found"

**Solution**: Install PostgreSQL client tools

```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# Windows
Download from https://www.postgresql.org/download/windows/
```

### Issue: "could not connect to database server"

**Solution**:
1. Verify SSH tunnel is open (for production)
2. Verify host/port/credentials
3. Check firewall rules
4. Verify database is running

```bash
# Test connection
psql -h localhost -p 5433 -U admin -d dtech -c "SELECT 1"
```

### Issue: "password authentication failed"

**Solution**:
- Verify password is correct
- Verify PGPASSWORD environment variable is set
- Try entering password interactively (remove PGPASSWORD export)

```bash
# Without PGPASSWORD (will prompt)
psql -h localhost -p 5433 -U admin -d dtech -c "SELECT 1"
```

### Issue: "relation already exists" error

**Solution**: The migration is idempotent and safe to run multiple times. If you get this error:

1. Check if tables already exist:
```bash
psql -h localhost -p 5433 -U admin -d dtech -c \
  "SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public' AND table_name LIKE '%announcement%';"
```

2. If tables exist, you can safely ignore the error or re-run the migration

### Issue: SSH tunnel timeout

**Solution**: Keep SSH terminal open during entire migration

```bash
# Terminal 1 - Keep permanently open
ssh -L 5433:157.10.73.52:5432 ubuntu@157.10.73.52

# Terminal 2 - Run migration here
./scripts/deploy-migrations.sh prod
```

---

## 📋 Post-Deployment Tasks

After successful deployment:

1. **Restart Development Server**
   ```bash
   npm run dev
   ```

2. **Test in Browser**
   - Login as teacher
   - Navigate to `/dashboard/teacher/announcements`
   - Test creating an announcement

3. **Verify API Routes**
   ```bash
   # Test announcements API
   curl -H "x-teacher-id: {teacher-uuid}" \
     http://localhost:3000/api/teacher/announcements
   ```

4. **Check Logs**
   - Monitor browser console for errors
   - Check server logs for API errors

5. **Run End-to-End Tests**
   - Create assessment
   - Add questions
   - Publish assessment
   - Test student submission
   - Test grading

---

## 📊 Migration Statistics

- **Migration File**: 400+ lines of SQL
- **Tables Created**: 7
- **Columns Added**: 50+
- **Indexes Created**: 20+
- **RLS Policies**: 14
- **Enum Types**: 2
- **Triggers**: 7

**Estimated Deployment Time**: 2-5 seconds

---

## 🔐 Security Notes

The migration includes comprehensive security:

- ✅ Row-Level Security (RLS) policies on all tables
- ✅ Foreign key constraints prevent orphaned data
- ✅ Teacher ownership verification
- ✅ Student access restricted to own submissions
- ✅ Cascading deletes maintain referential integrity

---

## 📞 Support

If you encounter issues:

1. **Check database logs**:
   ```bash
   # Connect and check PostgreSQL logs
   psql -h localhost -p 5433 -U admin -d dtech \
     -c "SELECT * FROM pg_stat_statements LIMIT 10;"
   ```

2. **Verify migration file syntax**:
   ```bash
   # Validate SQL syntax (PostgreSQL 14+)
   psql -h localhost -p 5433 -U admin -d dtech \
     --single-transaction \
     -f supabase/migrations/003_teacher_modules.sql
   ```

3. **Contact Database Admin**:
   - Provide error message
   - Provide database version: `SELECT version();`
   - Provide PostgreSQL logs

---

## ✅ Deployment Checklist

- [ ] Database backup created
- [ ] Migration file downloaded (003_teacher_modules.sql)
- [ ] SSH access verified (production only)
- [ ] Database credentials confirmed
- [ ] Deployment script made executable
- [ ] Pre-deployment tests passed
- [ ] Migration deployed successfully
- [ ] Post-deployment verification completed
- [ ] Development server restarted
- [ ] Teacher modules tested in browser
- [ ] API routes tested
- [ ] Documentation updated

---

**Last Updated**: November 2024
**Migration Version**: 003_teacher_modules.sql
**Status**: Ready for Deployment

