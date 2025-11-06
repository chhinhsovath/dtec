# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 🧠 MEMORIZE - Development Server & Database Credentials

### SSH Server Access
```
Host: 157.10.73.52
User: ubuntu
Password: en_&xdX#!N(^OqCQzc3RE0B)m6ogU!
SSH Tunnel Command:
  ssh -L 5433:157.10.73.52:5432 ubuntu@157.10.73.52
```

### PostgreSQL Database
```
Host: 157.10.73.52 (via SSH tunnel: localhost:5433)
Port: 5432 (tunnel port: 5433)
Database: dtech
User: admin
Password: P@ssw0rd
Connection Pool: min=2, max=10
```

### Connection Pattern
- **Development**: SSH tunnel on localhost:5433 → forwards to 157.10.73.52:5432
- **Database Library**: lib/database.ts with pg package
- **Environment File**: .env.local (already configured with defaults)
- **Test Command**: `psql -h localhost -p 5433 -U admin -d dtech -c "SELECT NOW();"`

### Quick Terminal Setup
```bash
# Terminal 1 (Keep open): SSH Tunnel
ssh -L 5433:157.10.73.52:5432 ubuntu@157.10.73.52

# Terminal 2: Development
npm run dev
```

---

## 🚀 Quick Commands

### Development
```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm start            # Run production build locally
npm run lint         # Run ESLint
npx tsc --noEmit    # Type check without emitting
```

### Server Connection
```bash
# Terminal 1: Create SSH tunnel to database server
ssh -L 5433:157.10.73.52:5432 ubuntu@157.10.73.52
# Password: en_&xdX#!N(^OqCQzc3RE0B)m6ogU!

# Or use provided script
./scripts/setup-tunnel.sh

# Terminal 2: Start application (after tunnel is open)
npm run dev
```

### Testing Accounts (Local Development)
```
Student:  student@test.com / password123
Teacher:  teacher@test.com / password123
Admin:    admin@test.com / password123
```

### Database
- **PostgreSQL Host**: 157.10.73.52:5432
- **Database Name**: dtech
- **User**: admin
- **Password**: P@ssw0rd
- **SSH Tunnel**: Use local port 5433 (forwarded to remote 5432)
- **Test Connection**: `psql -h localhost -p 5433 -U admin -d dtech -c "SELECT NOW();"`

---

## 🏗️ Architecture & Project Structure

### High-Level Architecture

**Stack**: Next.js 14 + TypeScript + Supabase + Tailwind CSS

**Three-Tier Structure**:
1. **Frontend**: Next.js pages and components (Client-side)
2. **Backend**: Next.js API routes + Supabase
3. **Database**: PostgreSQL via Supabase with Row Level Security (RLS)

**Authentication Flow**:
- Supabase Auth handles user registration/login
- Middleware (`lib/supabase/middleware.ts`) protects routes based on user role
- Role-based dashboards: Student, Teacher, Admin
- RLS policies enforce access control at database level

### Directory Structure

```
dgtech/
├── app/                          # Next.js App Router (all routes/pages)
│   ├── (auth)/                  # Auth pages (login, register, verify-email)
│   ├── dashboard/               # Role-based dashboards
│   │   ├── student/
│   │   ├── teacher/
│   │   └── admin/
│   ├── profile/                 # User profile management
│   ├── students/                # Student directory (teacher/admin views)
│   ├── academics/               # Academic records and GPA
│   ├── attendance/              # Attendance tracking
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Homepage
│   └── globals.css             # Global Tailwind styles
│
├── components/                  # Reusable React components
│   └── ui/                     # Basic UI components (Button, Card)
│
├── lib/                         # Utility functions and clients
│   ├── supabase/               # Supabase configuration
│   │   ├── client.ts           # Client-side Supabase client
│   │   ├── server.ts           # Server-side Supabase client
│   │   └── middleware.ts       # Auth middleware for route protection
│   └── utils.ts                # Utility functions (e.g., cn() for class merging)
│
├── types/                       # TypeScript type definitions
│   └── database.types.ts       # Auto-generated Supabase database types
│
├── supabase/                   # Supabase configuration
│   └── migrations/             # Database migrations
│       └── 001_initial_schema.sql
│
├── middleware.ts               # Next.js middleware (re-exports from lib)
├── tsconfig.json              # TypeScript configuration (uses @ path alias)
├── tailwind.config.ts         # Tailwind CSS configuration
├── next.config.mjs            # Next.js configuration
└── package.json               # Dependencies
```

### Key Technologies & Their Purpose

| Technology | Purpose | Key Files |
|-----------|---------|-----------|
| **Next.js 14** | Full-stack framework with App Router | `app/**`, `middleware.ts` |
| **Supabase** | Backend-as-a-Service + PostgreSQL | `lib/supabase/**` |
| **Supabase Auth** | User authentication and sessions | `lib/supabase/client.ts` |
| **PostgreSQL** | Relational database with RLS | `supabase/migrations/` |
| **Tailwind CSS** | Utility-first CSS framework | `tailwind.config.ts` |
| **TypeScript** | Type safety for JavaScript | `types/database.types.ts` |

---

## 🔐 Database & Data Flow

### Database Schema Overview

**Core Tables**:
- `profiles` - User profile info with role (student/teacher/admin)
- `institutions` - Educational institutions
- `user_institutions` - User-institution relationships
- `students` - Student-specific data
- `courses` - Course information
- `enrollments` - Student-course enrollments
- `academic_records` - GPA and course performance
- `attendance` - Attendance records
- `course_materials` - Learning materials
- `course_schedules` - Class schedules
- `teacher_courses` - Teacher-course assignments

**Important Note**: All table names and columns use **snake_case** (PostgreSQL convention)

### Row Level Security (RLS)

All tables have RLS policies enabled:
- Users can only see their own data (or authorized data)
- Teachers can see student data for their enrolled students
- Admins can see all data
- Policies are SQL-based in Supabase

### Data Access Pattern

```
User logs in
    ↓
Supabase Auth creates session
    ↓
Middleware verifies session + role
    ↓
Page queries database via Supabase client
    ↓
RLS policies filter data by role + user_id
    ↓
Frontend renders with secure data
```

---

## 🔌 Key Code Patterns & How They Work

### Supabase Client Usage

**Client-Side** (in `'use client'` components):
```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('user_id', userId);
```

**Server-Side** (in server components or API routes):
```typescript
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

const cookieStore = cookies();
const supabase = createClient(cookieStore);
```

**Why two clients?**
- Client: Uses browser session + auth token
- Server: Uses service role key (more powerful, server-only)

### Authentication Middleware

**Location**: `lib/supabase/middleware.ts`

**How it works**:
1. Intercepts every request
2. Verifies user session from cookies
3. Checks user role from database
4. Allows/blocks access based on route + role
5. Routes like `/dashboard/teacher` redirect unauthenticated users to login

### Protected Page Pattern

```typescript
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
      if (!user) router.push('/auth/login');
    };
    checkAuth();
  }, [router, supabase]);

  return <div>Protected Content</div>;
}
```

---

## 📋 Features by Phase

### Phase 1: Foundation ✅ (100% Complete)
- ✅ Multi-role authentication (Student, Teacher, Admin)
- ✅ Role-based dashboards
- ✅ Database schema with RLS
- ✅ Profile management

### Phase 2: Student Information System 🚧 (60% Complete)
- ✅ User profile editing
- ✅ Student directory with search and export
- ✅ Academic records and GPA tracking
- ✅ Attendance tracking
- ⏳ Enhanced registration workflow
- ⏳ Grade management

### Phase 3-8: Future Phases
See `ROADMAP.md` for complete planning

---

## 🧩 Component & Page Guidelines

### Creating New Pages

1. **Client Component** (uses `'use client'`):
   - Use when you need interactivity or client-side state
   - Can call API routes or Supabase client
   - Must handle authentication manually

2. **Server Component** (default, no directive):
   - Preferred for static content
   - Can use server-side Supabase queries
   - Cannot use hooks (useState, useEffect)

### Common Page Template

```typescript
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Data {
  id: string;
  [key: string]: any;
}

export default function PageName() {
  const [data, setData] = useState<Data[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: items, error: err } = await supabase
          .from('table_name')
          .select('*')
          .order('created_at', { ascending: false });

        if (err) throw err;
        setData(items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1>Page Title</h1>
      {/* Content here */}
    </div>
  );
}
```

### Creating UI Components

Use TypeScript interfaces for props:
```typescript
interface CardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Card({ title, children, className }: CardProps) {
  return (
    <div className={cn('p-6 bg-white rounded-lg shadow', className)}>
      <h2 className="text-lg font-bold">{title}</h2>
      {children}
    </div>
  );
}
```

---

## 🎨 Styling & Tailwind CSS

**Configuration**: `tailwind.config.ts`

**Key Classes**:
- Layout: `flex`, `grid`, `w-full`, `min-h-screen`
- Spacing: `p-4`, `m-2`, `gap-4`
- Colors: `bg-blue-600`, `text-gray-900`, `border-gray-300`
- Responsive: `md:`, `lg:` prefixes
- Interactive: `hover:`, `focus:`, `disabled:`

**Utility Function**:
- Use `cn()` from `lib/utils.ts` to merge Tailwind classes conditionally
- Example: `cn('base-class', condition && 'conditional-class')`

---

## 🚀 Deployment

### Recommended: Vercel + Supabase
1. Push code to GitHub
2. Connect GitHub repository to Vercel
3. Set environment variables in Vercel dashboard
4. Automatic deployments on push to `main`

### Environment Variables for Deployment
```env
NEXT_PUBLIC_SUPABASE_URL=your_production_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**See**: `DEPLOYMENT.md` for detailed instructions

---

## 📊 Type Safety

**Database Types**: Auto-generated by Supabase
- File: `types/database.types.ts`
- Regenerate: Use Supabase CLI or pull from dashboard
- Used to type all database queries in TypeScript

**Always use types** when defining function parameters and return types:
```typescript
interface User {
  id: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
}

async function getUser(id: string): Promise<User | null> {
  // implementation
}
```

---

## 🔍 Testing & Debugging

### Local Testing
1. Start dev server: `npm run dev`
2. Test with different accounts (Student/Teacher/Admin)
3. Check browser console for errors
4. Use Supabase dashboard to inspect database

### Common Issues

**"Cannot find module"**: TypeScript path alias issue
- Check `tsconfig.json` for `@/*` path mapping
- Restart dev server

**"Relation does not exist"**: Database migration not run
- Check Supabase SQL Editor
- Copy/paste contents of `supabase/migrations/001_initial_schema.sql`
- Execute in Supabase

**Authentication not working**: Middleware issue
- Check `lib/supabase/middleware.ts`
- Verify route is protected correctly
- Check `.env.local` has correct Supabase keys

---

## 📚 Important Files & Their Roles

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout with global providers |
| `middleware.ts` | Route protection and authentication |
| `lib/supabase/client.ts` | Client-side Supabase initialization |
| `lib/supabase/middleware.ts` | Auth middleware logic |
| `types/database.types.ts` | Auto-generated database types |
| `tailwind.config.ts` | Tailwind CSS customization |
| `.env.local.example` | Template for environment variables |
| `CONTRIBUTING.md` | Code style and contribution guidelines |
| `DEPLOYMENT.md` | Production deployment guide |

---

## 🎯 Development Workflow

1. **Create Feature Branch**: `git checkout -b feature/feature-name`
2. **Make Changes**: Follow code style in `CONTRIBUTING.md`
3. **Test Locally**: Run `npm run dev` and test manually
4. **Type Check**: Run `npx tsc --noEmit`
5. **Lint**: Run `npm run lint`
6. **Commit**: Use descriptive commit messages
7. **Push & Create PR**: Open pull request for review

---

## 📖 Additional Documentation

- **QUICK_REFERENCE.md** - Code snippets and common commands
- **SETUP_GUIDE.md** - Detailed setup instructions
- **CONTRIBUTING.md** - Code style guidelines
- **DEPLOYMENT.md** - Production deployment guide
- **README.md** - Complete project documentation
- **START_HERE.md** - Quick start guide

---

## ⚠️ Common Pitfalls to Avoid

1. **Mixed Client/Server**: Don't use server-only features in client components
2. **Missing Error Handling**: Always handle Supabase errors in try/catch
3. **Stale Sessions**: Use `createClient()` fresh in each function for latest session
4. **RLS Bypasses**: Remember RLS only filters data, doesn't prevent queries
5. **Type Mismatch**: Regenerate `database.types.ts` after schema changes
6. **Forgotten `.env.local`**: Must have Supabase credentials to run locally

---

## 💡 Working with PostgreSQL (Node.js)

### Basic Query

```typescript
import { query } from '@/lib/database';

// Simple select
const result = await query('SELECT * FROM profiles WHERE id = $1', [userId]);
console.log(result.rows);

// The $1, $2, etc. are parameterized placeholders (prevents SQL injection)
```

### Query with Error Handling

```typescript
import { query } from '@/lib/database';

try {
  const result = await query(
    `INSERT INTO academic_records
     (student_id, course_id, gpa)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [studentId, courseId, 3.5]
  );

  const newRecord = result.rows[0];
  console.log('Created record:', newRecord);
  return newRecord;
} catch (err) {
  console.error('Insert failed:', err instanceof Error ? err.message : 'Unknown error');
  throw err;
}
```

### Join Tables

```typescript
import { query } from '@/lib/database';

const result = await query(`
  SELECT
    e.*,
    c.title,
    c.credits,
    s.student_number
  FROM enrollments e
  JOIN courses c ON e.course_id = c.id
  JOIN students s ON e.student_id = s.id
  WHERE e.student_id = $1
`, [studentId]);

console.log(result.rows);
```

### Using Transactions

```typescript
import { getClient } from '@/lib/database';

const client = await getClient();

try {
  await client.query('BEGIN');

  // Multiple queries in transaction
  const result1 = await client.query('INSERT INTO ... RETURNING id', [...]);
  const newId = result1.rows[0].id;

  await client.query('UPDATE ... WHERE id = $1', [newId]);

  await client.query('COMMIT');
  console.log('Transaction succeeded');
} catch (err) {
  await client.query('ROLLBACK');
  console.error('Transaction failed:', err);
} finally {
  client.release();
}
```

---

## 💡 Working with Supabase (Alternative)

If using Supabase instead of direct PostgreSQL:

### Query with Filtering
```typescript
const { data, error } = await supabase
  .from('students')
  .select('*')
  .eq('user_id', userId)
  .single(); // Single result (throws if not exactly 1)
```

### Insert with Error Handling
```typescript
try {
  const { data, error } = await supabase
    .from('academic_records')
    .insert({
      student_id: studentId,
      course_id: courseId,
      gpa: 3.5,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
} catch (err) {
  console.error('Insert failed:', err);
}
```

### Join Tables
```typescript
const { data } = await supabase
  .from('enrollments')
  .select(`
    *,
    courses (id, title, credits),
    students (id, student_number)
  `)
  .eq('student_id', studentId);
```

---

## 🔐 Security Reminders

- Never commit `.env.local` (it contains secrets)
- RLS policies must be enabled on all tables
- Validate all user input before database operations
- Use parameterized queries (Supabase client handles this)
- Service role key should only be used on server-side

---

**Last Updated**: November 4, 2024
**Tech Stack**: Next.js 14, TypeScript, Supabase, Tailwind CSS
**Phase**: 2/8 (60% of Phase 2 complete)
- add above information to memorize