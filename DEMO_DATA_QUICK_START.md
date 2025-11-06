# 🎬 Demo Data - Quick Start (5 Minutes)

Get your TEC LMS running with realistic demo data instantly.

---

## ⚡ Fastest Way (Method 1: SQL)

### Step 1: Create SSH Tunnel (Terminal 1)
```bash
ssh -L 5433:157.10.73.52:5432 ubuntu@157.10.73.52
# Password: en_&xdX#!N(^OqCQzc3RE0B)m6ogU!
# Keep this open!
```

### Step 2: Load Demo Data (Terminal 2)
```bash
psql -h localhost -p 5433 -U admin -d dtech < supabase/migrations/002_demo_data.sql
```

**Expected output:**
```
BEGIN
INSERT ... (multiple inserts)
COMMIT
(1 row)
```

### Step 3: Verify (Terminal 2)
```bash
psql -h localhost -p 5433 -U admin -d dtech -c "SELECT COUNT(*) as total_records FROM profiles;"
```

**Should return: 6** (6 user profiles)

### Step 4: Start App (Terminal 2)
```bash
npm run dev
```

### Step 5: Login (Browser)
Go to: http://localhost:3000/auth/login

**Test Account:**
```
Email:    alice@test.com
Password: password123
```

---

## 🚀 Alternative Way (Method 2: Node.js Script)

### Step 1: Create SSH Tunnel (Terminal 1)
```bash
ssh -L 5433:157.10.73.52:5432 ubuntu@157.10.73.52
```

### Step 2: Run Node Script (Terminal 2)
```bash
npm install pg
node scripts/seed-demo-data.js
```

**Output will show:**
```
[INFO] 🌱 Starting database seeding...
[SUCCESS] ✓ Institution created
[SUCCESS] ✓ 4 courses created
...
[SUCCESS] 📊 Final Statistics:
[SUCCESS] ✅ Demo data seeding completed successfully!
```

### Step 3: Start App (Terminal 2)
```bash
npm run dev
```

---

## 🎓 Test Accounts (All Passwords: `password123`)

| Email | Role | Dashboard |
|-------|------|-----------|
| **alice@test.com** | Student | `/dashboard/student` |
| **bob@test.com** | Student | `/dashboard/student` |
| **charlie@test.com** | Student | `/dashboard/student` |
| **diana@test.com** | Student | `/dashboard/student` |
| **teacher@test.com** | Teacher | `/dashboard/teacher` |
| **admin@test.com** | Admin | `/dashboard/admin` |

---

## 🧪 What To Test

### 1. Student Dashboard (alice@test.com)
```
✓ See dashboard with:
  - Name: Alice Johnson
  - Student ID: S0001
  - GPA: 3.75
  - Courses: 2 (Web Dev, Database Design)
  - Attendance: 94%
```

### 2. Student Search (As Teacher)
```
1. Login as: teacher@test.com
2. Go to: /students
3. Search: "alice"
4. Expected: See Alice Johnson in results
5. Click: View her profile
```

### 3. Academic Records (As Student)
```
1. Login as: alice@test.com
2. Go to: /academics
3. See: GPA for Fall 2024 (3.75)
4. See: Enrolled courses (2)
```

### 4. Attendance Tracking (As Student)
```
1. Login as: alice@test.com
2. Go to: /attendance
3. See: Last 4 weeks of attendance
4. See: Attendance rate calculation
```

---

## 📊 What You Get

After loading demo data:

**Users (6 total)**
- 1 Admin
- 1 Teacher
- 4 Students

**Institutions (1)**
- Technology Enhanced Classroom (TEC)

**Courses (4)**
- Introduction to Web Development
- Advanced Database Design
- Mobile App Development
- Cloud Computing Fundamentals

**Enrollments (8)**
- 2 courses per student

**Academic Records**
- GPA data for Fall 2024

**Attendance Records (80+)**
- 20 records per student
- Mix of present, late, absent

---

## ✅ Verification Commands

### Check if data loaded
```bash
psql -h localhost -p 5433 -U admin -d dtech << 'EOF'

-- Show total records
SELECT
  (SELECT COUNT(*) FROM profiles) as profiles,
  (SELECT COUNT(*) FROM courses) as courses,
  (SELECT COUNT(*) FROM students) as students,
  (SELECT COUNT(*) FROM enrollments) as enrollments,
  (SELECT COUNT(*) FROM attendance) as attendance;

-- List test users
SELECT email, role FROM profiles
JOIN auth.users ON profiles.user_id = auth.users.id
ORDER BY email;

-- Show courses with enrollment count
SELECT c.title, COUNT(e.id) as student_count
FROM courses c
LEFT JOIN enrollments e ON c.id = e.course_id
GROUP BY c.id, c.title;

EOF
```

---

## 🔄 Reset & Reload

### Delete All Demo Data
```bash
psql -h localhost -p 5433 -U admin -d dtech << 'EOF'

DELETE FROM attendance;
DELETE FROM academic_records;
DELETE FROM enrollments;
DELETE FROM course_schedules;
DELETE FROM course_materials;
DELETE FROM teacher_courses;
DELETE FROM courses;
DELETE FROM students;
DELETE FROM user_institutions;
DELETE FROM institutions;
DELETE FROM profiles;

EOF
```

### Reload Demo Data
```bash
# Method 1: SQL
psql -h localhost -p 5433 -U admin -d dtech < supabase/migrations/002_demo_data.sql

# OR Method 2: Node.js
node scripts/seed-demo-data.js
```

---

## 🎯 Common Actions to Try

### Login Flow
1. Go to http://localhost:3000
2. Click "Register" (if you want to create your own user)
   - OR click "Login" (to use test accounts)
3. Enter: alice@test.com / password123
4. See dashboard with all student data

### Search Students (As Teacher)
1. Login as: teacher@test.com
2. Go to: /students
3. Type in search box: "alice"
4. Click on result to view profile

### Check GPA (As Student)
1. Login as: alice@test.com
2. Go to: /academics
3. See: "GPA: 3.75 (Fall 2024)"

### View Attendance (As Student)
1. Login as: alice@test.com
2. Go to: /attendance
3. See: Attendance rate & daily records

### See All Students (As Admin)
1. Login as: admin@test.com
2. Go to: /students
3. See: All 4 students with details

---

## 🐛 Troubleshooting

### "Connection refused" when running seed
**Fix:** Make sure SSH tunnel is running in Terminal 1

### "Database does not exist"
**Fix:** Database schema must be created first
```bash
psql -h localhost -p 5433 -U admin < supabase/migrations/001_initial_schema.sql
```

### "Duplicate key value" error
**Fix:** Data already loaded. Delete first:
```bash
psql -h localhost -p 5433 -U admin -d dtech -c "DELETE FROM attendance; DELETE FROM enrollments; DELETE FROM students;"
```

### Login doesn't work
**Fix:** Check test account exact spelling:
```
alice@test.com (NOT Alice@test.com)
bob@test.com
charlie@test.com
diana@test.com
teacher@test.com
admin@test.com
```

---

## 📚 Next Steps

1. ✅ **Load demo data** (using Method 1 or 2 above)
2. ✅ **Start dev server:** `npm run dev`
3. ✅ **Login** with test accounts
4. ✅ **Test features** (see section above)
5. ✅ **Read** DEMO_DATA_SETUP.md for more options

---

## 🎉 That's It!

You now have:
- ✅ Working database with real data
- ✅ 6 test accounts to login with
- ✅ 4 courses with enrollments
- ✅ Attendance tracking
- ✅ Academic records
- ✅ Ready to test all features!

**Start with:** `npm run dev` and login as **alice@test.com**

Enjoy testing! 🚀
