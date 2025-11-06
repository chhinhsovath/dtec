# 🎬 Demo Data Setup - TEC LMS

Complete guide to populate your database with realistic demo data for testing and development.

---

## 🚀 Quick Start (5 minutes)

### Option 1: Run SQL Script Directly (Fastest)

```bash
# 1. Create SSH tunnel (Terminal 1)
ssh -L 5433:157.10.73.52:5432 ubuntu@157.10.73.52

# 2. Load demo data (Terminal 2)
psql -h localhost -p 5433 -U admin -d dtech < supabase/migrations/002_demo_data.sql

# 3. Verify data loaded
psql -h localhost -p 5433 -U admin -d dtech -c "SELECT COUNT(*) as institutions FROM institutions;"
```

### Option 2: Use Node.js Script (More Control)

```bash
# 1. Create SSH tunnel (Terminal 1)
ssh -L 5433:157.10.73.52:5432 ubuntu@157.10.73.52

# 2. Install dependencies
npm install pg

# 3. Run demo data loader
node scripts/seed-demo-data.js

# 4. Start your app
npm run dev
```

---

## 📊 Demo Data Includes

### Users & Profiles (6 test accounts)

| Name | Email | Password | Role | Purpose |
|------|-------|----------|------|---------|
| **John Admin** | admin@test.com | password123 | Admin | System administrator |
| **Sarah Teacher** | teacher@test.com | password123 | Teacher | Course instructor |
| **Alice Student** | alice@test.com | password123 | Student | Test learner |
| **Bob Student** | bob@test.com | password123 | Student | Test learner |
| **Charlie Student** | charlie@test.com | password123 | Student | Test learner |
| **Diana Student** | diana@test.com | password123 | Student | Test learner |

### Institutions (1)
- **Technology Enhanced Classroom (TEC)** - Main institution

### Courses (4)
- Introduction to Web Development
- Advanced Database Design
- Mobile App Development
- Cloud Computing Fundamentals

### Enrollments (8)
- Each student enrolled in 2 courses

### Academic Records (6)
- GPA data for semesters
- Semester: Fall 2024, Spring 2025

### Attendance Records (40+)
- Last 4 weeks of attendance data
- Mix of present, absent, and late

---

## 📋 Data Loading Methods

### Method 1: SQL Migration File (RECOMMENDED)

**Fastest and most reliable for PostgreSQL**

File: `supabase/migrations/002_demo_data.sql`

**Steps:**
1. Create SSH tunnel
2. Run: `psql -h localhost -p 5433 -U admin -d dtech < supabase/migrations/002_demo_data.sql`
3. Done!

**Advantages:**
- ✅ Fast
- ✅ No Node.js needed
- ✅ Pure SQL
- ✅ Idempotent (safe to run multiple times)

---

### Method 2: Node.js Script

**More control and logging**

File: `scripts/seed-demo-data.js`

**Steps:**
1. Create SSH tunnel
2. Run: `node scripts/seed-demo-data.js`

**Advantages:**
- ✅ Better error messages
- ✅ Progress logging
- ✅ Easy to modify
- ✅ Can validate data

---

### Method 3: TypeScript API Seed (Node.js)

**For more advanced scenarios**

File: `lib/seed-data.ts`

**Use case:** Programmatically create data in your Next.js app

---

## ✅ Verification Checklist

After loading demo data, verify everything:

```bash
# 1. Check institutions
psql -h localhost -p 5433 -U admin -d dtech \
  -c "SELECT COUNT(*) as total, COUNT(DISTINCT role) as roles FROM profiles;"

# 2. Check courses
psql -h localhost -p 5433 -U admin -d dtech \
  -c "SELECT COUNT(*) as courses FROM courses;"

# 3. Check enrollments
psql -h localhost -p 5433 -U admin -d dtech \
  -c "SELECT COUNT(*) as enrollments FROM enrollments;"

# 4. Check attendance
psql -h localhost -p 5433 -U admin -d dtech \
  -c "SELECT COUNT(*) as attendance_records FROM attendance;"

# 5. Login test
# Go to http://localhost:3000/auth/login
# Email: student@test.com
# Password: password123
```

---

## 🔄 Reset & Reload Demo Data

### Clear All Data (Start Fresh)

```bash
# CAUTION: This deletes all data!
psql -h localhost -p 5433 -U admin -d dtech << 'EOF'

-- Delete all data in reverse order of foreign key dependencies
DELETE FROM attendance;
DELETE FROM course_schedules;
DELETE FROM course_materials;
DELETE FROM academic_records;
DELETE FROM enrollments;
DELETE FROM teacher_courses;
DELETE FROM courses;
DELETE FROM students;
DELETE FROM user_institutions;
DELETE FROM institutions;
DELETE FROM profiles;
-- Note: Do NOT delete from auth.users as it's managed by Supabase

EOF
```

### Then Reload Demo Data

```bash
psql -h localhost -p 5433 -U admin -d dtech < supabase/migrations/002_demo_data.sql
```

---

## 📚 Data Schema Overview

### Hierarchical Structure

```
Institution (TEC)
├── Courses (4)
│   ├── Course 1: Web Development
│   │   ├── Students: 4
│   │   ├── Schedules: 3
│   │   ├── Materials: 3
│   │   └── Attendance: 20 records
│   │
│   └── Course 2: Database Design
│       ├── Students: 4
│       ├── Schedules: 3
│       ├── Materials: 2
│       └── Attendance: 20 records
│
└── Students (4)
    ├── Student 1: Alice
    │   ├── Enrollments: 2
    │   ├── Academic Records: 2
    │   └── Attendance: 8 records
    │
    └── Student 2-4: Similar structure
```

---

## 🎓 Test Scenarios You Can Try

### 1. Student Login & Dashboard

```
Email: alice@test.com
Password: password123

Expected:
✓ Redirect to /dashboard/student
✓ See dashboard with:
  - Student name & number
  - Enrolled courses (2)
  - GPA (3.75)
  - Attendance rate (94%)
```

### 2. Teacher View

```
Email: teacher@test.com
Password: password123

Expected:
✓ Redirect to /dashboard/teacher
✓ See:
  - Student directory (4 students)
  - Course list (4 courses)
  - Can view student profiles
```

### 3. Admin Dashboard

```
Email: admin@test.com
Password: password123

Expected:
✓ Redirect to /dashboard/admin
✓ See:
  - All users & roles
  - Student directory
  - Institution stats
  - System statistics
```

### 4. Student Directory Search

**As Teacher or Admin:**
1. Go to `/students`
2. Search by name (e.g., "Alice")
3. See filtered results
4. Click on student to view profile

### 5. Academic Records

**As Student:**
1. Go to `/academics`
2. See courses with credits
3. See GPA for each semester
4. See overall statistics

### 6. Attendance Tracking

**As Student:**
1. Go to `/attendance`
2. See last 4 weeks of records
3. See attendance rate (%)
4. See monthly breakdown

---

## 🔧 Customize Demo Data

### Add More Students

Edit `supabase/migrations/002_demo_data.sql` and add more INSERT statements:

```sql
-- Add another student
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeef05'::uuid,
    'eva@test.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
);

-- Then profile, student, enrollments...
```

### Modify GPA Values

Change in academic_records INSERT statements:

```sql
INSERT INTO academic_records (student_id, semester, gpa)
VALUES (
    '...',
    'Fall 2024',
    3.85  -- Change this value
);
```

### Add More Courses

Simply add more INSERT statements to the courses table:

```sql
INSERT INTO courses (id, title, description, credits, institution_id, created_at, updated_at)
VALUES (
    'course-id'::uuid,
    'New Course Title',
    'Description here',
    3,
    (SELECT id FROM institutions WHERE name = 'Technology Enhanced Classroom'),
    NOW(),
    NOW()
);
```

---

## ❌ Common Issues & Fixes

### Issue: "Relation does not exist"

**Cause:** Schema migration (001_initial_schema.sql) hasn't been run

**Fix:**
1. Check tables exist: `psql -h localhost -p 5433 -U admin -d dtech -c "\dt"`
2. If missing, run: `psql -h localhost -p 5433 -U admin -d dtech < supabase/migrations/001_initial_schema.sql`
3. Then load demo data

### Issue: "Duplicate key value violates unique constraint"

**Cause:** Demo data already loaded

**Fix:** Run clear script first:
```bash
psql -h localhost -p 5433 -U admin -d dtech -c "DELETE FROM attendance; DELETE FROM enrollments; DELETE FROM students;"
```

### Issue: Login fails with "Invalid credentials"

**Cause:** Auth users weren't created

**Fix:**
1. Check if 002_demo_data.sql was created (it should create auth users)
2. Manually create test user via registration page
3. Or contact support for Supabase-specific auth issues

### Issue: Can't see other students as teacher

**Cause:** RLS policies blocking access

**Fix:** Verify teacher has correct role in profiles table:
```bash
psql -h localhost -p 5433 -U admin -d dtech -c "SELECT email, role FROM profiles JOIN auth.users ON profiles.user_id = auth.users.id WHERE email = 'teacher@test.com';"
```

---

## 📊 Data Statistics

After loading demo data:

```
Institutions:     1
Courses:          4
Students:         4
Enrollments:      8
Academic Records: 8
Attendance:       40+ records
Users:            6 total (1 admin, 1 teacher, 4 students)
```

---

## 🔒 Security Notes

**Important:** Demo credentials are for development only!

- ❌ Never use these in production
- ❌ Never share demo passwords
- ❌ Change before deploying live
- ✅ Use strong passwords in production
- ✅ Implement proper authentication
- ✅ Use environment variables for secrets

---

## 🎯 Next Steps After Loading Demo Data

1. **Test All Roles:**
   - Login as student, teacher, admin
   - Verify each sees correct data

2. **Test Features:**
   - Student profile editing
   - Search functionality
   - Export to CSV
   - Dashboard statistics

3. **Performance Testing:**
   - Load with demo data
   - Test with large datasets
   - Check query performance

4. **Mobile Testing:**
   - Test responsive design
   - Check touch interactions
   - Verify mobile navigation

---

## 📚 Files Provided

| File | Purpose |
|------|---------|
| `supabase/migrations/002_demo_data.sql` | SQL migration with all demo data |
| `scripts/seed-demo-data.js` | Node.js script to load data |
| `lib/seed-data.ts` | TypeScript data definitions |
| `DEMO_DATA_SETUP.md` | This file |

---

## 🆘 Need Custom Data?

### For Different Numbers of Users:
Edit `supabase/migrations/002_demo_data.sql` and duplicate INSERT blocks

### For Different Course Names:
Search and replace course titles in migration file

### For Different Institution:
Change institution name in INSERT statement

### For Real Data:
- Export from your actual database
- Import using `psql` with COPY command
- Or use data migration tools

---

## ✨ Advanced: Bulk Data Loading

For large datasets (100+ students):

```bash
# Create CSV file
cat > students.csv << 'EOF'
student_number,first_name,last_name,enrollment_date
S001,John,Doe,2024-01-15
S002,Jane,Smith,2024-01-15
EOF

# Load via COPY
psql -h localhost -p 5433 -U admin -d dtech << 'SQL'
COPY students(student_number, first_name, last_name, enrollment_date)
FROM '/path/to/students.csv'
WITH (FORMAT csv, HEADER true);
SQL
```

---

**Ready to test your LMS with demo data!** 🎉

Next: Choose Method 1 or 2 above and follow the steps.
