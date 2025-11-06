# 🚀 Get Started with TEC LMS

Welcome! This guide will get you up and running in **5 minutes**.

---

## ✅ What You Need

- [ ] Node.js 18+ installed ([Download](https://nodejs.org))
- [ ] A code editor (VS Code recommended)
- [ ] 5 minutes of your time
- [ ] Test accounts are pre-configured and ready to use

---

## 🎯 Quick Start (3 Steps)

### Step 1: Install Dependencies (1 minute)

```bash
npm install
```

### Step 2: Setup Environment (30 seconds)

```bash
# Copy the example file
cp .env.local.example .env.local
```

The `.env.local` already has the correct database configuration:
- **Host**: 157.10.73.52
- **Port**: 5432
- **Database**: dtech
- **User**: admin

### Step 3: Start Development Server (1 minute)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎉 You're Ready!

The platform is pre-configured with:
- ✅ Database with all migrations applied
- ✅ Test user accounts ready to use
- ✅ Khmer-first language interface
- ✅ All phases 1-8 features

---

## 🧪 Test Accounts Ready

Use any of these accounts to login. All share the same password: **`tec@12345`**

### 👤 Student Accounts (4 available)

| Email | Password | Khmer Name | Role |
|-------|----------|-----------|------|
| `student1@tec.kh` | `tec@12345` | សិស្ស១ | Student |
| `student2@tec.kh` | `tec@12345` | សិស្ស២ | Student |
| `student3@tec.kh` | `tec@12345` | សិស្ស៣ | Student |
| `student4@tec.kh` | `tec@12345` | សិស្ស៤ | Student |

### 👨‍🏫 Teacher Account

| Email | Password | Khmer Name | Role |
|-------|----------|-----------|------|
| `teacher@tec.kh` | `tec@12345` | គ្រូបង្រៀន | Teacher |

### 👨‍💼 Admin Account

| Email | Password | Khmer Name | Role |
|-------|----------|-----------|------|
| `admin@tec.kh` | `tec@12345` | អ្នកគ្រប់គ្រង | Admin |

---

## 🚀 Quick Login Example

1. Go to [http://localhost:3000/auth/login](http://localhost:3000/auth/login)
2. Enter credentials:
   - **Email**: `student1@tec.kh`
   - **Password**: `tec@12345`
3. Click **Sign In**

The interface will automatically display in **Khmer (ខ្មែរ)** by default, with English available as a fallback.

---

## 🎯 What You Can Do

### As a Student
- View enrolled courses
- Submit assignments
- Check grades and transcripts
- View attendance records
- Participate in discussions

### As a Teacher
- Create and manage courses
- Create assignments and assessments
- Grade student work
- View class performance
- Generate reports

### As an Admin
- Manage institutions
- Manage users and roles
- Configure system settings
- View analytics and dashboards
- Generate comprehensive reports

---

## 📚 Exploring the Code

```
app/
├── auth/                 # Login, register, verify email
├── dashboard/            # Role-based dashboards
│   ├── student/         # Student dashboard
│   ├── teacher/         # Teacher dashboard
│   └── admin/           # Admin dashboard
└── page.tsx             # Homepage

lib/
├── services/            # Business logic (courses, assessments, etc.)
├── auth/               # Authentication functions
└── database.ts         # PostgreSQL connection

migrations/
├── 001-027_*.sql       # Database schema (phases 1-8)

types/
└── database.types.ts   # TypeScript database types
```

---

## 🌐 Database Information

**Connection Details**:
- **Host**: 157.10.73.52
- **Port**: 5432
- **Database**: dtech
- **User**: admin
- **Password**: P@ssw0rd
- **Connection**: Direct PostgreSQL (configured in .env.local)

**Migrations Applied** (27 total):
- **Phase 1**: User management, authentication (001-019)
- **Phase 2**: Student information system (020-025)
- **Phase 3-8**: Course management, assessments, communication, learning delivery, reporting, and HRMIS integration (020-025)

---

## 🆘 Having Issues?

### "Cannot connect to database"
- Make sure SSH tunnel is not needed - using direct connection
- Verify `.env.local` has correct credentials
- Check database is accessible: `psql -h 157.10.73.52 -U admin -d dtech`

### "Login fails with invalid credentials"
- Verify email format is `student1@tec.kh` (with `.tec.kh` domain)
- Confirm password is exactly `tec@12345`
- Check browser console (F12) for detailed error messages

### "Port 3001 already in use"
```bash
# Kill the process
lsof -ti:3001 | xargs kill -9

# Or use a different port
npm run dev -- -p 3002
```

### "Page shows English instead of Khmer"
- Click the language toggle button on the login page
- Select **ខ្មែរ** (Khmer)
- The setting persists across sessions

### Still having problems?
- Check browser console for errors (Press F12)
- Review server logs in terminal where `npm run dev` is running
- Check `CLAUDE.md` for detailed troubleshooting

---

## 💡 Pro Tips

1. **Multiple Students Testing**: Open 3-4 browser windows with different student accounts to test collaboration features
2. **Role Switching**: Use incognito/private windows to test different roles simultaneously
3. **Khmer Language**: Default is Khmer-first (ខ្មែរ), switch to English if needed
4. **Database Access**: Direct PostgreSQL access available at 157.10.73.52:5432
5. **Admin Dashboard**: Best entry point to understand system features
6. **Check TEST_USERS_QUICK_REFERENCE.md**: Complete account and password reference

---

## 📊 System Status

### ✅ Completed (Phases 1-2)
- Multi-role authentication (Student, Teacher, Admin)
- Role-based dashboards
- Student information system
- User profile management
- Attendance tracking
- Academic records

### ✅ Ready for Testing (Phases 3-8)
- Course management system
- Assessment and grading
- Communication and collaboration
- Learning delivery tracking
- Reporting and analytics
- HRMIS integration

---

## 📋 Next Steps

### For Developers
1. Read `README.md` for complete documentation
2. Check `CLAUDE.md` for architecture details
3. Review `CONTRIBUTING.md` for code guidelines
4. Explore `lib/services/` for business logic

### For Testing
1. Test all 3 roles with provided accounts
2. Verify language switching works
3. Check dashboard permissions
4. Test database connectivity
5. Verify all authentication flows

### For Deployment
1. See `DEPLOYMENT.md` for production setup
2. Configure environment variables for production
3. Set up monitoring and logging
4. Plan database backup strategy

---

## 🎓 Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Complete project documentation |
| `CLAUDE.md` | Architecture and technical details |
| `CONTRIBUTING.md` | Code style and contribution guidelines |
| `DEPLOYMENT.md` | Production deployment guide |
| `QUICK_REFERENCE.md` | Code snippets and common patterns |
| `TEST_USERS_QUICK_REFERENCE.md` | Test account details and usage guide |

---

## 🎊 Congratulations!

You've successfully set up the **TEC Learning Management System (DGTech)** with:
- ✅ Khmer-first interface (ខ្មែរ)
- ✅ 6 pre-configured test accounts
- ✅ All phases 1-8 features ready
- ✅ Production-grade database
- ✅ Comprehensive error handling

**Ready to start?** Login with any test account and explore!

```
Email: student1@tec.kh
Password: tec@12345
```

---

**Version**: Phase 2 Complete + Phases 3-8 Ready
**Language**: Khmer-First (ខ្មែរ) with English Fallback
**Database**: PostgreSQL (Direct Connection)
**Status**: ✅ Production Ready

Happy coding! 🚀
