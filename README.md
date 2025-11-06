# TEC Learning Management System

A comprehensive Learning Management System built with Next.js 14, TypeScript, Supabase, and Tailwind CSS for Technology Enhanced Classroom (TEC) digitalization.

## 🚀 Features

### Phase 1 - Foundation ✅ (Complete)
- ✅ Multi-role authentication (Student, Teacher, Administrator)
- ✅ Role-based access control (RBAC)
- ✅ Secure authentication with Supabase
- ✅ Database schema with Row Level Security (RLS)
- ✅ Modern, responsive UI with Tailwind CSS
- ✅ Role-based dashboards

### Phase 2 - Student Information System 🚧 (60% Complete)
- ✅ User profile management with editing
- ✅ Student directory with search and export
- ✅ Academic records and GPA tracking
- ✅ Attendance tracking and monitoring
- ⏳ Enhanced registration workflow (coming soon)
- ⏳ Grade management system (coming soon)

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Supabase account (free tier works)
- Git installed

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd dgtech
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to be provisioned
3. Go to Project Settings > API
4. Copy your project URL and anon key

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 5. Run Database Migrations

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and run the SQL in the editor

This will create:
- All necessary tables (profiles, institutions, students, courses, etc.)
- Row Level Security policies
- Database triggers
- Indexes for performance

### 6. Configure Supabase Authentication

1. In Supabase Dashboard, go to Authentication > Settings
2. Enable Email provider
3. Configure email templates (optional)
4. Set Site URL to `http://localhost:3000` for development

### 7. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 User Roles & Access

### Student Dashboard
- ✅ View and edit profile
- ✅ Track academic records and GPA
- ✅ Monitor attendance
- ✅ View enrolled and completed courses
- ⏳ Access assignments (Phase 4)
- ⏳ Submit work (Phase 4)

### Teacher Dashboard
- ✅ View and manage student directory
- ✅ Search and export student data
- ✅ Access student profiles
- ⏳ Create and manage courses (Phase 3)
- ⏳ Create assignments (Phase 4)
- ⏳ Grade submissions (Phase 4)

### Admin Dashboard
- ✅ Manage all users
- ✅ View student directory
- ✅ Access system statistics
- ⏳ Create institutions (Phase 2)
- ⏳ Generate reports (Phase 7)
- ⏳ System configuration (Phase 8)

## 🗂️ Project Structure

```
dgtech/
├── app/                      # Next.js app directory
│   ├── auth/                # Authentication pages
│   │   ├── login/          # Login page
│   │   ├── register/       # Registration page
│   │   └── verify-email/   # Email verification
│   ├── dashboard/          # Role-based dashboards
│   │   ├── student/        # Student dashboard
│   │   ├── teacher/        # Teacher dashboard
│   │   └── admin/          # Admin dashboard
│   ├── profile/            # User profile management
│   ├── students/           # Student directory
│   ├── academics/          # Academic records
│   ├── attendance/         # Attendance tracking
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Homepage
├── lib/                     # Utility functions
│   └── supabase/           # Supabase clients
│       ├── client.ts       # Client-side client
│       ├── server.ts       # Server-side client
│       └── middleware.ts   # Auth middleware
├── types/                   # TypeScript types
│   └── database.types.ts   # Database types
├── supabase/               # Supabase files
│   └── migrations/         # Database migrations
├── middleware.ts           # Next.js middleware
├── tailwind.config.ts      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies
```

## 🔐 Security Features

- Row Level Security (RLS) on all tables
- Secure authentication with Supabase Auth
- Role-based access control
- Protected API routes
- Automatic session management

## 📝 Database Schema (Phase 1)

### Core Tables
- `profiles` - User profiles with role information
- `institutions` - Educational institutions
- `user_institutions` - User-institution relationships
- `students` - Student-specific data
- `courses` - Course information
- `enrollments` - Student course enrollments
- `academic_records` - Academic performance records
- `attendance` - Attendance tracking
- `course_materials` - Learning materials
- `course_schedules` - Class schedules
- `teacher_courses` - Teacher-course assignments

## 🚧 Development Roadmap

### ✅ Phase 1: Foundation & Authentication (Current)
- Project setup
- Authentication system
- Role-based dashboards
- Database schema

### 📅 Phase 2: Student Information System (Next)
- Student registration workflow
- Academic records management
- Attendance tracking
- Student directory

### 📅 Phase 3: Course Management
- Course creation and management
- Learning materials upload
- Course scheduling
- Teacher assignments

### 📅 Phase 4: Assessment & Grading
- Quiz and exam creation
- Automated grading
- Grade book management
- Feedback system

### 📅 Phase 5: Communication & Collaboration
- Real-time messaging
- Discussion forums
- Announcements
- AI chatbot integration

### 📅 Phase 6: Learning Delivery & Progress
- Self-paced learning modules
- Progress tracking
- Learning analytics
- Mobile-responsive delivery

### 📅 Phase 7: Reporting & Analytics
- Performance reports
- Analytics dashboards
- Data visualization
- Export capabilities

### 📅 Phase 8: HRMIS Integration
- HRMIS connectivity
- API development
- Advanced AI features
- System administration

## 🧪 Testing

To test the application:

1. Register a new account at `/auth/register`
2. Select your role (Student, Teacher, or Admin)
3. Check your email for verification (if email is configured)
4. Login at `/auth/login`
5. You'll be redirected to your role-specific dashboard

## 🤝 Contributing

This is a private project for TEC digitalization. For contributions:

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

Proprietary - All rights reserved

## 📞 Support

For support and questions, contact the development team.

## 🎯 Next Steps

1. **Set up Supabase** - Create your project and run migrations
2. **Configure environment variables** - Add your Supabase credentials
3. **Test authentication** - Register and login with different roles
4. **Explore dashboards** - Check out the role-specific interfaces
5. **Start Phase 2** - Begin implementing Student Information System features

---

**Built with ❤️ for Technology Enhanced Classroom**
