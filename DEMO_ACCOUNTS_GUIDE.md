# Demo Accounts Guide - Pedagogy LMS

**Last Updated**: November 7, 2025
**Platform**: Pedagogy LMS - Contract Teacher Training & Certification Program
**Supported Roles**: 3 (Graduate Student, Mentor, Coordinator)

---

## 🚀 Quick Start

### Login Page
Navigate to: `http://localhost:3000/auth/login`

### Universal Demo Password
All demo accounts use the password: **`demo@123`**

---

## 📚 Pedagogy LMS
### Contract Teacher Training & Certification Program

A specialized 6-month graduate teacher training program for contract teachers with the following roles:

### 1️⃣ Graduate Student (student@pedagogy.edu)
**Role**: `student`
**Password**: `demo@123`
**Dashboard**: `/dashboard/graduate-student`

**Features Available**:
- ✅ View competency assessments (10 core competencies)
- ✅ Track teaching practice hours (120+ required)
- ✅ Submit portfolio evidence (2+ per competency)
- ✅ View mentorship session feedback
- ✅ Check certification readiness status
- ✅ View practicum placement information
- ✅ Access personal profile

**Navigation Menu**:
- Dashboard - Main progress overview
- Competencies - View all 10 competencies and assessments
- Practicum - School placement information
- Teaching Hours - Log and track teaching hours
- Portfolio - Submit evidence and documents
- Mentorship - View mentor feedback and sessions
- Certification - Track progress toward certification
- Profile - Account information

**Key Pages**:
1. `/dashboard/graduate-student` - Main dashboard with progress stats
2. `/dashboard/graduate-student/competencies` - Competency tracking
3. `/dashboard/graduate-student/practicum` - School placement
4. `/dashboard/graduate-student/teaching-hours` - Hours tracking
5. `/dashboard/graduate-student/portfolio` - Evidence submission
6. `/dashboard/graduate-student/mentorship` - Session feedback
7. `/dashboard/graduate-student/certification` - Certification status
8. `/dashboard/graduate-student/profile` - Student profile

**What to Test**:
- [ ] Can view all 8 navigation items
- [ ] Dashboard shows progress cards (Competencies, Teaching Hours, Certification, Practicum)
- [ ] Can navigate to each section without errors
- [ ] Profile page displays student information
- [ ] Bilingual support (Khmer/English) works

---

### 2️⃣ Mentor (mentor@pedagogy.edu)
**Role**: `teacher` (with mentor assignment)
**Password**: `demo@123`
**Dashboard**: `/dashboard/mentor`

**Features Available**:
- ✅ Assess mentees' competency levels (1-5 scale)
- ✅ Review and provide feedback on student portfolios
- ✅ Schedule and conduct mentorship sessions
- ✅ Track mentee progress toward certification
- ✅ Document feedback and action items

**Navigation Menu**:
- Dashboard - Overview of assigned mentees and statistics
- Competency Assessment - Rate student competencies
- Portfolio Review - Provide feedback on student evidence
- Mentorship Sessions - Schedule and manage sessions
- Profile - Mentor account information

**Key Pages**:
1. `/dashboard/mentor` - Mentor dashboard with mentee statistics
2. `/dashboard/mentor/competency-assessment` - Assessment form
3. `/dashboard/mentor/portfolio-review` - Portfolio feedback interface
4. `/dashboard/mentor/mentorship-sessions` - Session management
5. `/dashboard/mentor/profile` - Mentor profile

**API Endpoints**:
- `GET /api/mentor/dashboard` - Mentor statistics and mentees
- `GET /api/mentor/mentees` - List of assigned mentees
- `GET /api/mentor/competency-assessment` - List assessments
- `POST /api/mentor/competency-assessment` - Create/update assessment
- `GET /api/mentor/portfolio-review` - List portfolio submissions
- `POST /api/mentor/portfolio-review` - Submit portfolio feedback
- `GET /api/mentor/mentorship-sessions` - List sessions
- `POST /api/mentor/mentorship-sessions` - Schedule session
- `PUT /api/mentor/mentorship-sessions` - Update session

**What to Test**:
- [ ] Can view Pedagogy LMS mentor pages
- [ ] Dashboard shows mentee statistics
- [ ] Can access Competency Assessment page
- [ ] Can access Portfolio Review page
- [ ] Can access Mentorship Sessions page
- [ ] Profile page displays mentor role
- [ ] API endpoints return data when called
- [ ] Mentees list populated correctly

---

### 3️⃣ Coordinator (coordinator@pedagogy.edu)
**Role**: `admin` (coordinator assignment)
**Password**: `demo@123`
**Dashboard**: `/dashboard/coordinator`

**Features Available**:
- ✅ Monitor student progress across all cohorts
- ✅ Verify certification requirements completion
- ✅ Issue final certificates to qualified students
- ✅ Generate reports on program completion
- ✅ Manage program configuration
- ✅ Manage mentor-student assignments
- ✅ View student and mentor lists with filtering

**Navigation Menu**:
- Dashboard - Program overview and statistics
- Students - List and manage all students
- Mentors - List and manage all mentors
- Certifications - Issue certificates to graduates
- Reports - Program completion and analytics
- Competencies - Competency framework management
- Settings - Program configuration

**Key Pages**:
1. `/dashboard/coordinator` - Main coordinator dashboard
2. `/dashboard/coordinator/students` - Student management
3. `/dashboard/coordinator/mentors` - Mentor management
4. `/dashboard/coordinator/certification-issuance` - Certificate issuance
5. `/dashboard/coordinator/reports` - Program reports
6. `/dashboard/coordinator/competencies` - Competency setup
7. `/dashboard/coordinator/settings` - Settings

**API Endpoints**:
- `GET /api/coordinator/dashboard` - Dashboard statistics
- `GET /api/coordinator/students` - List students with filtering
- `PUT /api/coordinator/students` - Update student info/status
- `GET /api/coordinator/mentors` - List all mentors
- `POST /api/coordinator/mentors` - Register new mentor
- `PUT /api/coordinator/mentors` - Update mentor information

**Dashboard Statistics**:
- Total Students (48)
- Active Students (42)
- Completed Certifications (6)
- Pending Certifications (12)
- Average Completion Rate (68%)
- Total Mentors (12)
- Active Mentorships (42)
- Current Program Phase

**What to Test**:
- [ ] Can view coordinator dashboard
- [ ] Dashboard shows all statistics
- [ ] Can access Students page with list
- [ ] Can access Mentors page with list
- [ ] Can access Certification Issuance page
- [ ] All navigation items accessible
- [ ] API endpoints return proper data
- [ ] Can filter students by status or batch

---

## 📊 Demo Accounts Summary Table

| Role | Email | Platform | Password | Dashboard URL |
|------|-------|----------|----------|----------------|
| Graduate Student | student@pedagogy.edu | Pedagogy LMS | demo@123 | /dashboard/graduate-student |
| Mentor | mentor@pedagogy.edu | Pedagogy LMS | demo@123 | /dashboard/mentor |
| Coordinator | coordinator@pedagogy.edu | Pedagogy LMS | demo@123 | /dashboard/coordinator |

---

## 🧪 Testing Checklist

### Pedagogy LMS - Graduate Student
- [ ] Login with student@pedagogy.edu / demo@123
- [ ] Redirected to /dashboard/graduate-student
- [ ] See 8 navigation items (Dashboard, Competencies, Practicum, Teaching Hours, Portfolio, Mentorship, Certification, Profile)
- [ ] Dashboard shows progress cards
- [ ] Can navigate to each section
- [ ] Profile page displays student info

### Pedagogy LMS - Mentor
- [ ] Login with mentor@pedagogy.edu / demo@123
- [ ] Redirected to /dashboard/mentor
- [ ] See 5 navigation items (Dashboard, Competency Assessment, Portfolio Review, Mentorship Sessions, Profile)
- [ ] Dashboard shows mentee statistics
- [ ] Bilingual support works
- [ ] Can access all mentor-specific pages

### Pedagogy LMS - Coordinator
- [ ] Login with coordinator@pedagogy.edu / demo@123
- [ ] Redirected to /dashboard/coordinator
- [ ] See 7 navigation items
- [ ] Dashboard shows statistics (students, certifications, mentors, etc.)
- [ ] Can access all coordinator pages
- [ ] Can view student and mentor lists
- [ ] API endpoints return data

---

## 🌐 Language Support

All demo accounts support **bilingual interface**:
- **English (EN)** - Default
- **Khmer (ខ្មែរ)** - Khmer translation

**Toggle Language**: Click language button on login page (EN/ខ្មែរ)

---

## 🛠️ Creating Additional Demo Accounts

### Steps to Create New Demo Account:
1. Go to `/auth/register`
2. Enter email, password, full name
3. Select role during registration
4. Confirm email (use email in browser console or skip for demo)
5. Login with new credentials

### Recommended Additional Accounts:
```
For Testing Pedagogy LMS:
- student2@pedagogy.edu / demo@123
- mentor2@pedagogy.edu / demo@123
- student3@pedagogy.edu / demo@123
```

---

## 📱 Login Page Features

### Login Page Enhancements:
✅ **Single Platform Focus**: Pedagogy LMS only
✅ **Three Demo Buttons**: Graduate Student, Mentor, Coordinator
✅ **Tooltips**: Hover to see role descriptions
✅ **Color Coding**: Different colors for each role
✅ **Icons**: Visual indicators for roles
✅ **Bilingual Support**: English and Khmer labels
✅ **Platform Info**: Clear descriptions
✅ **One-Click Login**: Quick access to all 3 roles

---

## 🔐 Security Notes

### Demo Accounts
- ✅ Demo accounts are for **testing only**
- ✅ Real passwords should be different and secure
- ✅ Demo accounts have limited access to real data
- ✅ All demo account activities are isolated

### Production Accounts
- Always use strong passwords (8+ characters, mixed case, numbers, symbols)
- Use unique email addresses for each user
- Enable two-factor authentication if available
- Regularly update account information

---

## 🐛 Troubleshooting

### Login Issues
**Problem**: "Invalid email or password"
- **Solution**: Verify exact email address from this guide
- **Solution**: Ensure password is exactly `demo@123`
- **Solution**: Clear browser cache and cookies

**Problem**: "Account not found"
- **Solution**: Create account first via `/auth/register`
- **Solution**: Use demo accounts listed above
- **Solution**: Check email spelling carefully

### Navigation Issues
**Problem**: "Cannot access dashboard"
- **Solution**: Verify logged in as correct email
- **Solution**: Check that role is set correctly
- **Solution**: Verify API routes are working

### Dashboard Issues
**Problem**: "Dashboard doesn't load"
- **Solution**: Wait 2-3 seconds for data to load
- **Solution**: Check network tab in browser DevTools
- **Solution**: Verify API endpoints are accessible

---

## 📞 Support

For issues with demo accounts or login page:
1. Check this guide first
2. Clear browser cache and cookies
3. Try in incognito/private browser mode
4. Check browser console for errors (F12)
5. Report with error message and steps to reproduce

---

**Last Updated**: November 7, 2025
**Version**: 2.0 - Pedagogy LMS Only
**Status**: Production Ready - K-12 features removed
