# TEC LMS - Quick Setup Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name**: TEC LMS
   - **Database Password**: (create a strong password)
   - **Region**: Choose closest to you
4. Click "Create new project"
5. Wait 2-3 minutes for setup

### Step 3: Get Your Supabase Credentials

1. In your Supabase project, click "Settings" (gear icon)
2. Go to "API" section
3. You'll see:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)
   - **service_role** key (another long string)

### Step 4: Configure Environment Variables

1. Copy the example file:
```bash
cp .env.local.example .env.local
```

2. Open `.env.local` and replace with your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 5: Run Database Migration

1. In Supabase Dashboard, click "SQL Editor" in the left sidebar
2. Click "New Query"
3. Open `supabase/migrations/001_initial_schema.sql` from this project
4. Copy ALL the SQL code
5. Paste it into the Supabase SQL Editor
6. Click "Run" button (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned"

### Step 6: Configure Authentication

1. In Supabase Dashboard, go to "Authentication" > "Providers"
2. Make sure "Email" is enabled (it should be by default)
3. Go to "Authentication" > "URL Configuration"
4. Set **Site URL** to: `http://localhost:3000`
5. Add to **Redirect URLs**: `http://localhost:3000/auth/callback`

### Step 7: Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## ✅ Verify Installation

### Test 1: Homepage
- You should see the TEC LMS homepage
- Click "Sign In" button - should go to login page

### Test 2: Registration
1. Click "Get Started" or "Sign up"
2. Fill in the registration form:
   - First Name: Test
   - Last Name: User
   - Email: test@example.com
   - Role: Student
   - Password: password123
3. Click "Create Account"
4. You should see "Check Your Email" page

### Test 3: Login (Skip email verification for testing)
1. Go back to login page
2. Use the credentials you just created
3. You should be redirected to the Student Dashboard

## 🎯 Default Test Accounts

After running the migration, you can create test accounts:

### Student Account
- Email: student@test.com
- Password: password123
- Role: Student

### Teacher Account
- Email: teacher@test.com
- Password: password123
- Role: Teacher

### Admin Account
- Email: admin@test.com
- Password: password123
- Role: Admin

## 🔧 Troubleshooting

### Issue: "Invalid API key"
**Solution**: Double-check your `.env.local` file. Make sure:
- No extra spaces
- Keys are complete (they're very long)
- File is named exactly `.env.local`

### Issue: "relation does not exist"
**Solution**: You haven't run the database migration. Go back to Step 5.

### Issue: "Cannot connect to Supabase"
**Solution**: 
- Check your internet connection
- Verify the Supabase project URL is correct
- Make sure your Supabase project is active (not paused)

### Issue: Email verification required
**Solution**: For development, you can disable email verification:
1. Go to Supabase Dashboard > Authentication > Settings
2. Scroll to "Email Auth"
3. Toggle OFF "Enable email confirmations"

### Issue: Port 3000 already in use
**Solution**: 
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- -p 3001
```

## 📊 Database Tables Created

After migration, you'll have these tables:
- ✅ profiles (user profiles)
- ✅ institutions (schools/organizations)
- ✅ user_institutions (user-institution links)
- ✅ students (student records)
- ✅ courses (course information)
- ✅ enrollments (student enrollments)
- ✅ academic_records (grades, GPA)
- ✅ attendance (attendance tracking)
- ✅ course_materials (learning materials)
- ✅ course_schedules (class schedules)
- ✅ teacher_courses (teacher assignments)

## 🎨 What You Can Do Now

### As a Student:
- ✅ Register and login
- ✅ View dashboard
- 🚧 Enroll in courses (Phase 2)
- 🚧 Submit assignments (Phase 4)
- 🚧 View grades (Phase 4)

### As a Teacher:
- ✅ Register and login
- ✅ View dashboard
- 🚧 Create courses (Phase 3)
- 🚧 Create assignments (Phase 4)
- 🚧 Grade submissions (Phase 4)

### As an Admin:
- ✅ Register and login
- ✅ View dashboard
- 🚧 Manage users (Phase 2)
- 🚧 Create institutions (Phase 2)
- 🚧 View reports (Phase 7)

## 📝 Next Steps

1. ✅ Complete Phase 1 setup (you're here!)
2. 📅 Implement Phase 2: Student Information System
3. 📅 Implement Phase 3: Course Management
4. 📅 Continue with remaining phases

## 🆘 Need Help?

- Check the main [README.md](./README.md) for detailed documentation
- Review the [pdd.md](./pdd.md) for project requirements
- Contact the development team

---

**Estimated Setup Time**: 5-10 minutes
**Difficulty**: Beginner-friendly

Good luck! 🚀
