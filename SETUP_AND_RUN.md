# 🚀 Complete Setup & Run Guide - TEC LMS

**Everything you need to get the project running with demo data in under 10 minutes.**

---

## ⚠️ IMPORTANT: SSH Tunnel Required

Your database is on a remote server. You MUST have an SSH tunnel open to connect.

---

## 🔧 STEP-BY-STEP SETUP

### Step 1️⃣: Open Terminal Window 1 (SSH Tunnel)

**This window MUST stay open while you develop**

```bash
ssh -L 5433:157.10.73.52:5432 ubuntu@157.10.73.52
```

When prompted for password, type:
```
en_&xdX#!N(^OqCQzc3RE0B)m6ogU!
```

✅ **You should see:**
```
Welcome to Ubuntu...
ubuntu@server:~$
```

**Keep this terminal open!** Do NOT close it.

---

### Step 2️⃣: Open Terminal Window 2 (Development)

In a **NEW terminal** (not the one with SSH tunnel):

```bash
# Navigate to project
cd /Users/chhinhsovath/Documents/GitHub/dgtech

# Install dependencies
npm install

# Install PostgreSQL client library
npm install pg
```

✅ **You should see:**
```
added X packages in Xs
```

---

### Step 3️⃣: Seed Demo Data (Still in Terminal 2)

```bash
# Load demo data from SQL file
psql -h localhost -p 5433 -U admin -d dtech < supabase/migrations/002_demo_data.sql
```

✅ **You should see:**
```
BEGIN
INSERT ...
COMMIT
(1 row)
```

Verify data was loaded:
```bash
psql -h localhost -p 5433 -U admin -d dtech -c "SELECT COUNT(*) as total_records FROM profiles;"
```

✅ **Should return: 6** (6 user profiles)

---

### Step 4️⃣: Start Development Server (Still in Terminal 2)

```bash
npm run dev
```

✅ **You should see:**
```
▲ Next.js 14.2.0
- Local:        http://localhost:3000
- Environments: .env.local

✓ Ready in 2.5s
```

---

### Step 5️⃣: Open in Browser

Go to: **http://localhost:3000**

You should see the TEC LMS homepage.

---

### Step 6️⃣: Login with Demo Account

Click on "Login" or go to: **http://localhost:3000/auth/login**

**Test Account:**
```
Email:    alice@test.com
Password: password123
```

✅ **You should see the Student Dashboard with:**
- Name: Alice Johnson
- Student ID: S0001
- GPA: 3.75
- Courses: 2
- Attendance Rate: 94%

---

## 📋 Summary of Terminal Windows

### Terminal 1 (Keep Open)
```
SSH Tunnel
Command: ssh -L 5433:157.10.73.52:5432 ubuntu@157.10.73.52
Status: Should show prompt (ubuntu@server:~$)
Do NOT close this!
```

### Terminal 2 (Your Development Window)
```
Commands:
1. cd /Users/chhinhsovath/Documents/GitHub/dgtech
2. npm install
3. npm install pg
4. psql -h localhost -p 5433 -U admin -d dtech < supabase/migrations/002_demo_data.sql
5. npm run dev

Result: http://localhost:3000 opens
```

---

## 🧪 All Test Accounts (Password: password123)

| Email | Role | Use Case |
|-------|------|----------|
| alice@test.com | Student | Test student dashboard |
| bob@test.com | Student | Test different student |
| charlie@test.com | Student | Test different student |
| diana@test.com | Student | Test different student |
| teacher@test.com | Teacher | View student directory |
| admin@test.com | Admin | Full system access |

---

## ✨ What Each Account Can Do

### Alice (alice@test.com) - Student
- View dashboard with GPA, attendance, courses
- See academic records
- Check attendance history
- Edit profile
- View enrolled courses: Web Development, Database Design
- GPA: 3.75

### Teacher (teacher@test.com) - Teacher
- View all students
- Search for specific students
- View student profiles
- See all courses
- View enrollments

### Admin (admin@test.com) - Admin
- Manage all users
- View complete student directory
- Access system statistics
- See all institution data
- Full system control

---

## 🎯 Quick Test Scenarios

### Test 1: Login & See Student Dashboard
1. Login as alice@test.com / password123
2. Should redirect to /dashboard/student
3. See: Name, GPA (3.75), Courses (2), Attendance (94%)

### Test 2: Search Students (As Teacher)
1. Login as teacher@test.com / password123
2. Go to /students
3. Search for "alice"
4. Click on Alice Johnson
5. View her profile

### Test 3: View Academic Records
1. Login as alice@test.com
2. Go to /academics
3. See: GPA for Fall 2024 (3.75)
4. See: Enrolled courses with credits

### Test 4: Check Attendance
1. Login as alice@test.com
2. Go to /attendance
3. See: Last 4 weeks of attendance
4. See: Attendance rate calculation

### Test 5: Admin Dashboard
1. Login as admin@test.com
2. Go to /dashboard/admin
3. See: System statistics
4. See: User list
5. See: Institution data

---

## ⚠️ Common Issues & Fixes

### Issue: "Connection refused" when running psql

**Cause:** SSH tunnel not running

**Fix:**
1. Check Terminal 1 - is it showing command prompt?
2. If not, run: `ssh -L 5433:157.10.73.52:5432 ubuntu@157.10.73.52`
3. Wait for it to show: `ubuntu@server:~$`
4. Then try psql command again

### Issue: "Duplicate key value violates unique constraint"

**Cause:** Demo data already loaded

**Fix:**
```bash
# Delete existing data
psql -h localhost -p 5433 -U admin -d dtech << 'EOF'
DELETE FROM attendance;
DELETE FROM academic_records;
DELETE FROM enrollments;
DELETE FROM courses;
DELETE FROM students;
DELETE FROM institutions;
DELETE FROM profiles;
EOF

# Then reload
psql -h localhost -p 5433 -U admin -d dtech < supabase/migrations/002_demo_data.sql
```

### Issue: "npm: command not found"

**Cause:** Node.js not installed

**Fix:**
```bash
# Install Node.js (macOS with Homebrew)
brew install node

# Verify installation
node --version
npm --version
```

### Issue: "psql: command not found"

**Cause:** PostgreSQL client not installed

**Fix:**
```bash
# Install PostgreSQL tools (macOS with Homebrew)
brew install postgresql

# Verify installation
psql --version
```

### Issue: "Cannot connect to database"

**Cause:** Database doesn't exist or schema not created

**Fix:**
```bash
# First create schema
psql -h localhost -p 5433 -U admin -d dtech < supabase/migrations/001_initial_schema.sql

# Then load demo data
psql -h localhost -p 5433 -U admin -d dtech < supabase/migrations/002_demo_data.sql
```

### Issue: "Login fails"

**Cause:** Wrong email format

**Fix:**
- Use lowercase: `alice@test.com` (NOT `Alice@test.com`)
- Use exact password: `password123`
- Check for typos

---

## 📊 What Gets Seeded

Running the demo data script creates:

✅ **1 Institution**
- Technology Enhanced Classroom (TEC)

✅ **4 Courses**
- Introduction to Web Development
- Advanced Database Design
- Mobile App Development
- Cloud Computing Fundamentals

✅ **6 Users**
- 4 Students (Alice, Bob, Charlie, Diana)
- 1 Teacher (Sarah)
- 1 Admin (John)

✅ **8 Enrollments**
- Each student in 2 courses

✅ **8 Academic Records**
- GPA for Fall 2024

✅ **80+ Attendance Records**
- Last 4 weeks per student

---

## 🔄 Stopping & Restarting

### To Stop Development
Press `Ctrl+C` in Terminal 2 (dev server will stop)

### To Keep SSH Tunnel Open
Do NOT press Ctrl+C in Terminal 1

### To Restart Everything
```bash
# Terminal 2
npm run dev

# Then navigate to http://localhost:3000
```

### To Stop Everything
```bash
# Terminal 2: Press Ctrl+C
# Terminal 1: Press Ctrl+C (this stops SSH tunnel)
```

---

## ✅ Verification Checklist

- [ ] Terminal 1: SSH tunnel running (shows prompt)
- [ ] Terminal 2: npm install completed
- [ ] Terminal 2: npm install pg completed
- [ ] Terminal 2: psql command loaded demo data
- [ ] Terminal 2: npm run dev started (shows http://localhost:3000)
- [ ] Browser: Can access http://localhost:3000
- [ ] Browser: Can login with alice@test.com / password123
- [ ] Browser: See student dashboard with data

If all checked ✅, you're ready to go!

---

## 🆘 Getting Help

**Something not working?**

1. Check the issue in "Common Issues & Fixes" section above
2. Read the error message carefully
3. Make sure SSH tunnel is running in Terminal 1
4. Verify you're in correct directory: `/Users/chhinhsovath/Documents/GitHub/dgtech`
5. Check all commands are typed exactly as shown

---

## 📝 Key Credentials to Remember

**SSH Server:**
```
Host: 157.10.73.52
User: ubuntu
Password: en_&xdX#!N(^OqCQzc3RE0B)m6ogU!
```

**Database:**
```
Host: localhost:5433 (via SSH tunnel)
Database: dtech
User: admin
Password: P@ssw0rd
```

**Test Account (All passwords: password123):**
```
alice@test.com - Student (GPA: 3.75)
teacher@test.com - Teacher
admin@test.com - Admin
```

---

## 🎉 You're Ready!

Everything is set up. Just follow the 5 steps above and you'll be running locally with demo data in under 10 minutes!

**Estimated Time:**
- Step 1 (SSH Tunnel): 30 seconds
- Step 2 (Install): 2-3 minutes
- Step 3 (Seed Data): 10 seconds
- Step 4 (Dev Server): 5 seconds
- Step 5 (Browser): Instant
- Step 6 (Login): Instant

**Total: ~5 minutes** ⏱️

---

**Next Action: Start with Step 1 above!** 🚀
