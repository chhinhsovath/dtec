# TEC LMS - Quick Reference Guide

Quick commands and code snippets for common tasks.

---

## 🚀 Common Commands

### Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Type check
npx tsc --noEmit
```

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature

# Commit changes
git add .
git commit -m "feat: your feature description"

# Push to remote
git push origin feature/your-feature

# Update from main
git checkout main
git pull origin main
git checkout feature/your-feature
git merge main
```

### Database
```bash
# Access Supabase SQL Editor
# Go to: https://app.supabase.com/project/YOUR_PROJECT/sql

# Run migration
# Copy contents of supabase/migrations/001_initial_schema.sql
# Paste in SQL Editor and run
```

---

## 📝 Code Snippets

### Creating a New Page

```typescript
// app/your-page/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function YourPage() {
  const [data, setData] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    const loadData = async () => {
      const { data } = await supabase
        .from('your_table')
        .select('*');
      setData(data);
    };
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <h1>Your Page</h1>
    </div>
  );
}
```

### Creating a Component

```typescript
// components/YourComponent.tsx
import { cn } from '@/lib/utils';

interface YourComponentProps {
  title: string;
  className?: string;
}

export default function YourComponent({ title, className }: YourComponentProps) {
  return (
    <div className={cn('p-4 bg-white rounded-lg', className)}>
      <h2>{title}</h2>
    </div>
  );
}
```

### Database Query Examples

```typescript
// Select data
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', userId)
  .single();

// Insert data
const { data, error } = await supabase
  .from('courses')
  .insert({
    title: 'New Course',
    description: 'Course description',
    credits: 3,
  });

// Update data
const { data, error } = await supabase
  .from('profiles')
  .update({ first_name: 'John' })
  .eq('user_id', userId);

// Delete data
const { error } = await supabase
  .from('enrollments')
  .delete()
  .eq('id', enrollmentId);

// Join tables
const { data, error } = await supabase
  .from('enrollments')
  .select(`
    *,
    courses (
      title,
      description
    ),
    students (
      student_number
    )
  `)
  .eq('student_id', studentId);
```

### Authentication Snippets

```typescript
// Get current user
const { data: { user } } = await supabase.auth.getUser();

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});

// Sign out
await supabase.auth.signOut();

// Get session
const { data: { session } } = await supabase.auth.getSession();
```

### Protected Route Pattern

```typescript
// app/protected/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ProtectedPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
      }
    };
    checkAuth();
  }, [router, supabase]);

  return <div>Protected Content</div>;
}
```

---

## 🎨 Tailwind CSS Classes

### Layout
```css
/* Container */
max-w-7xl mx-auto px-4 sm:px-6 lg:px-8

/* Flexbox */
flex items-center justify-between
flex flex-col space-y-4

/* Grid */
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6
```

### Components
```css
/* Button */
px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700

/* Card */
bg-white rounded-xl shadow-md p-6

/* Input */
w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500
```

### Colors
```css
/* Primary */
bg-primary-600 text-primary-600 border-primary-600

/* Gray */
bg-gray-50 bg-gray-100 bg-gray-200 text-gray-600 text-gray-900

/* Status */
bg-green-600 bg-red-600 bg-yellow-600 bg-blue-600
```

---

## 🔐 Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional (for future phases)
NEXT_PUBLIC_APP_URL=http://localhost:3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

---

## 📊 Database Table Reference

### profiles
```sql
id, user_id, first_name, last_name, avatar_url, role, created_at, updated_at
```

### students
```sql
id, user_id, student_number, enrollment_date, created_at, updated_at
```

### courses
```sql
id, title, description, credits, institution_id, created_at, updated_at
```

### enrollments
```sql
id, student_id, course_id, status, created_at, updated_at
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

### Clear Next.js Cache
```bash
rm -rf .next
npm run dev
```

### Reset Database
```bash
# In Supabase SQL Editor, run:
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
# Then run migration again
```

### Fix TypeScript Errors
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 📱 Testing Accounts

Create these test accounts for development:

```
Student:
- Email: student@test.com
- Password: password123
- Role: Student

Teacher:
- Email: teacher@test.com
- Password: password123
- Role: Teacher

Admin:
- Email: admin@test.com
- Password: password123
- Role: Admin
```

---

## 🔗 Useful Links

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs)

### Project Files
- Setup Guide: `SETUP_GUIDE.md`
- Deployment: `DEPLOYMENT.md`
- Contributing: `CONTRIBUTING.md`
- Status: `PROJECT_STATUS.md`

### Supabase Dashboard
- Project: https://app.supabase.com/project/YOUR_PROJECT
- SQL Editor: https://app.supabase.com/project/YOUR_PROJECT/sql
- Auth: https://app.supabase.com/project/YOUR_PROJECT/auth
- Database: https://app.supabase.com/project/YOUR_PROJECT/database

---

## 💡 Pro Tips

1. **Use TypeScript**: Let the types guide you
2. **Check RLS**: Always verify Row Level Security policies
3. **Test locally**: Before deploying to production
4. **Use the browser**: Preview at http://localhost:3000
5. **Read errors**: TypeScript and Next.js errors are helpful
6. **Check console**: Browser console shows runtime errors
7. **Use Git**: Commit often, push regularly
8. **Document**: Update docs when adding features

---

**Last Updated**: November 4, 2024  
**Version**: 1.0.0
