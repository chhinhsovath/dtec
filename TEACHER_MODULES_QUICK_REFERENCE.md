# 🚀 Teacher Modules - Quick Reference Guide

## 📍 All Routes & URLs

### Main Pages

| Module | URL | Status |
|--------|-----|--------|
| **Dashboard** | `/dashboard/teacher` | ✅ |
| **Courses** | `/dashboard/teacher/courses` | ✅ |
| **Announcements** | `/dashboard/teacher/announcements` | ✅ |
| **Course Materials** | `/dashboard/teacher/materials` | ✅ |
| **Assessments** | `/dashboard/teacher/assessments` | ✅ |
| **Assessment Questions** | `/dashboard/teacher/assessments/[id]/questions` | ✅ |
| **Submissions** | `/dashboard/teacher/submissions` | ✅ |
| **Grade Submission** | `/dashboard/teacher/submissions/[id]` | ✅ |
| **Course Schedule** | `/dashboard/teacher/courses/[courseId]/schedule` | ✅ NEW |
| **Grades** | `/dashboard/teacher/grades` | ✅ |
| **Students** | `/dashboard/teacher/students` | ✅ |

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| **GET/POST** | `/api/teacher/announcements` | List/Create announcements |
| **PUT/DELETE** | `/api/teacher/announcements/[id]` | Edit/Delete announcements |
| **GET/POST** | `/api/teacher/assessments` | List/Create assessments |
| **GET/PUT/DELETE** | `/api/teacher/assessments/[id]` | View/Edit/Delete assessments |
| **GET/POST** | `/api/teacher/assessments/[id]/questions` | List/Add questions |
| **GET/PUT/DELETE** | `/api/teacher/assessments/[id]/questions/[qid]` | View/Edit/Delete questions |
| **GET/POST** | `/api/teacher/materials` | List/Upload materials |
| **PUT/DELETE** | `/api/teacher/materials/[id]` | Edit/Delete materials |
| **GET/POST** | `/api/teacher/courses/[courseId]/schedule` | List/Add schedules |
| **PUT/DELETE** | `/api/teacher/courses/[courseId]/schedule/[id]` | Edit/Delete schedules |
| **GET** | `/api/teacher/submissions` | List submissions |
| **GET/PUT** | `/api/teacher/submissions/[id]` | View/Grade submissions |

---

## 🎯 Feature Quick Links

### Create Content

1. **Post Announcement**
   - Go to: `/dashboard/teacher/announcements`
   - Click: "New Announcement"
   - Fields: Course, Title, Content, Pin option

2. **Upload Course Material**
   - Go to: `/dashboard/teacher/materials`
   - Click: "Upload Material"
   - Supports: Video, PDF, Image, Presentation, Document

3. **Create Assessment**
   - Go to: `/dashboard/teacher/assessments`
   - Click: "New Assessment"
   - Types: Quiz, Assignment, Exam
   - Then click: "Manage Questions"

4. **Add Schedule**
   - Go to: `/dashboard/teacher/courses`
   - Click a course
   - Click: "Schedule" tab
   - Click: "Add Class Time"

### Grade & Assess

1. **View Submissions**
   - Go to: `/dashboard/teacher/submissions`
   - Filter by status/assessment
   - Click student to grade

2. **Grade Submission**
   - Click on student in Submissions
   - Score each answer
   - Add feedback
   - Set overall grade & feedback

3. **View All Grades**
   - Go to: `/dashboard/teacher/grades`
   - See all student grades

### Manage Courses

1. **View My Courses**
   - Go to: `/dashboard/teacher/courses`
   - See all your courses

2. **Manage Course Schedule**
   - From Courses page
   - Click course → Schedule
   - Add/edit/delete class times

3. **View Students**
   - Go to: `/dashboard/teacher/students`
   - See enrolled students

---

## 🔐 Authentication

All API routes require `x-teacher-id` header:

```bash
curl -H "x-teacher-id: {teacher-uuid}" \
  http://localhost:3000/api/teacher/announcements
```

**From Frontend** (automatic):
```typescript
const response = await fetch('/api/teacher/announcements', {
  headers: { 'x-teacher-id': session.id }
});
```

---

## 📋 Quick Start (First Time)

### 1. Deploy Migration (1 min)
```bash
chmod +x scripts/deploy-migrations.sh
./scripts/deploy-migrations.sh dev
# Password: P@ssw0rd
```

### 2. Restart Server (1 min)
```bash
npm run dev
```

### 3. Test Navigation (2 min)
- Login as teacher
- Check sidebar navigation
- Click around to test links

### 4. Create Sample Data (5 min)

**Create Announcement**:
```
Title: "Welcome to Class"
Content: "This is our first announcement"
Course: Select a course
```

**Upload Material**:
```
Title: "Lecture Slides"
Course: Select a course
File: Any PDF or document
```

**Create Assessment**:
```
Title: "Chapter 1 Quiz"
Type: Quiz
Points: 10
```

---

## 🎨 UI Components by Page

| Page | Components | Features |
|------|-----------|----------|
| Dashboard | Stats cards, Buttons grid | Quick access |
| Announcements | Modal form, Card list | CRUD, Filter |
| Materials | Dropzone upload, Card list | Upload, Preview, Delete |
| Assessments | Modal form, Card list | CRUD, Publish, Manage Q |
| Questions | Modal form, Card list | Add/Edit/Delete Q & Options |
| Schedule | Modal form, Table/Cards | Add/Edit/Delete times |
| Submissions | Table with sorting | Filter, Search, Grade |
| Grading | Form with sections | Score answers, Feedback |

---

## 🌐 Language Support

Every page has EN/ខ្មែរ toggle in top-right corner.

**Supported Translations**:
- Page titles
- Button labels
- Form labels
- Placeholders
- Error messages
- Confirmation dialogs

---

## 📱 Responsive Design

| Screen | Behavior |
|--------|----------|
| Desktop (≥768px) | Sidebar visible, Tables full width |
| Tablet (576-768px) | Sidebar collapsible, Tables responsive |
| Mobile (<576px) | Sidebar collapsed by default, Cards instead of tables |

---

## ⚡ Common Tasks

### Task: Create Quiz & Grade
**Time**: 10 minutes

1. Go to Assessments
2. Create assessment (type: Quiz)
3. Click "Manage Questions" → Add 5 questions
4. Go back & click "Publish"
5. Wait for student submissions
6. Go to Submissions
7. Click student submission
8. Grade each question
9. Save grades

### Task: Post Announcement
**Time**: 2 minutes

1. Go to Announcements
2. Click "New Announcement"
3. Fill in Course, Title, Content
4. Click "Save"
5. (Optional) Pin important announcements

### Task: Upload Course Materials
**Time**: 3 minutes

1. Go to Course Materials
2. Click "Upload Material"
3. Drag/drop or select file
4. Fill in Title and Course
5. Click "Upload"

### Task: Set Course Schedule
**Time**: 5 minutes

1. Go to Courses
2. Click a course
3. Go to Schedule tab
4. Click "Add Class Time"
5. Select Day, Time, Location
6. Click "Save"
7. Repeat for all class sessions

---

## 🐛 Troubleshooting Quick Links

| Issue | Solution |
|-------|----------|
| Pages 404 | Restart server: `npm run dev` |
| Navigation missing | Clear cache, hard refresh F5 |
| Authentication error | Re-login, check x-teacher-id header |
| File upload fails | Check file size, type supported |
| Khmer text broken | Ensure UTF-8 encoding, refresh |
| Styles weird | Clear .next folder, restart |

---

## 📊 Data Limits

| Item | Limit | Recommendation |
|------|-------|-----------------|
| Questions per assessment | No limit | Keep < 100 |
| Materials per course | No limit | Keep < 500 |
| Submission size | Up to DB limit | Keep < 10MB |
| File uploads | 1 per request | Max 500MB per file |
| Results per page | 10 (paginated) | Use pagination |

---

## 🔄 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `/dashboard/teacher` | Go to dashboard |
| Tab | Navigate forms |
| Enter | Submit forms |
| Esc | Close modals |

---

## 📞 Getting Help

### Check These First
1. MIGRATION_DEPLOYMENT_GUIDE.md - Deployment issues
2. TEACHER_MODULES_IMPLEMENTATION.md - Feature docs
3. PRD_VERIFICATION_CHECKLIST.md - What's implemented

### Common Questions

**Q: How do I deploy migrations?**
A: Run `./scripts/deploy-migrations.sh dev` (dev) or `prod` (production)

**Q: Where's the course schedule link?**
A: Create a course detail page linking to schedule (TODO)

**Q: Can students see schedule?**
A: Not yet - future enhancement

**Q: How do I bulk grade?**
A: Currently per-submission, bulk grading in future

**Q: Where's the grades page?**
A: Created but links under "Grades" in sidebar

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Can login as teacher
- [ ] Sidebar navigation visible
- [ ] Can click all navigation links
- [ ] Dashboard loads
- [ ] Can create announcement
- [ ] Can upload material
- [ ] Can create assessment
- [ ] Can add questions
- [ ] Can view submissions
- [ ] Can grade submission
- [ ] Khmer language works
- [ ] Mobile responsive

---

## 🚀 Next Steps After Deployment

1. **Create Test Data**
   - Create course
   - Create assessment
   - Create questions

2. **Test Student Features**
   - Login as student
   - View announcements
   - View materials
   - Submit assessment

3. **Test Grading**
   - Submit assessment as student
   - Grade as teacher
   - View grades as student

4. **Performance Testing**
   - Load test with multiple users
   - Monitor database performance
   - Check API response times

5. **User Training**
   - Demo for teachers
   - Share quick reference
   - Q&A session

---

## 📚 Full Documentation

- **TEACHER_MODULES_IMPLEMENTATION.md** (300+ lines)
  - Complete module documentation
  - Database schema
  - API specifications
  - Testing scenarios

- **MIGRATION_DEPLOYMENT_GUIDE.md** (300+ lines)
  - Detailed deployment guide
  - Troubleshooting
  - Verification steps

- **PRD_VERIFICATION_CHECKLIST.md** (200+ lines)
  - PRD requirement mapping
  - Completion status
  - What's implemented

- **INTEGRATION_SUMMARY.md** (300+ lines)
  - Integration details
  - New features added
  - Navigation structure

---

**Last Updated**: November 2024
**Status**: ✅ READY FOR USE
**Version**: 1.0.0

