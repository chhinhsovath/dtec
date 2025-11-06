# 🔐 DGTech LMS - Test User Accounts Quick Reference

**Password for ALL accounts:** `tec@12345`

**Login URL:** http://localhost:3001/auth/login

**Domain:** `.tec.kh` (Khmer Education Technology)

---

## 👤 STUDENT ROLE (4 accounts)

| Quick Copy | Email | Password | Khmer Name |
|-----------|-------|----------|------|
| Student 1 | `student1@tec.kh` | `tec@12345` | សិស្ស១ |
| Student 2 | `student2@tec.kh` | `tec@12345` | សិស្ស២ |
| Student 3 | `student3@tec.kh` | `tec@12345` | សិស្ស៣ |
| Student 4 | `student4@tec.kh` | `tec@12345` | សិស្ស៤ |

**Access:** `/dashboard/student` after login

---

## 👨‍🏫 TEACHER ROLE (1 account)

| Quick Copy | Email | Password | Khmer Name |
|-----------|-------|----------|------|
| Teacher | `teacher@tec.kh` | `tec@12345` | គ្រូបង្រៀន |

**Access:** `/dashboard/teacher` after login

---

## 👨‍💼 ADMIN ROLE (1 account)

| Quick Copy | Email | Password | Khmer Name |
|-----------|-------|----------|------|
| Admin | `admin@tec.kh` | `tec@12345` | អ្នកគ្រប់គ្រង |

**Access:** `/dashboard/admin` after login

---

## 🚀 Quick Copy Commands

### Test as Student
```
Email: student1@tec.kh
Password: tec@12345
```

### Test as Teacher
```
Email: teacher@tec.kh
Password: tec@12345
```

### Test as Admin
```
Email: admin@tec.kh
Password: tec@12345
```

---

## 📋 Complete User Database Query

To view all test users in the database:

```sql
SELECT email, role, full_name, password_hash
FROM profiles
WHERE email LIKE '%tec.kh%'
ORDER BY role, email;
```

---

## ✅ Database Status

| Item | Status | Details |
|------|--------|---------|
| Test Users | ✅ Active | 6 users created with password hash for "tec@12345" |
| Password Hash | ✅ Valid | SHA256 of "tec@12345" |
| Database Domain | ✅ Khmer | `.tec.kh` domain (Khmer Education Technology) |
| Database | ✅ Connected | PostgreSQL at 157.10.73.52:5432 |
| Dev Server | ✅ Running | http://localhost:3001 |

---

## 🎯 Use Cases

### Testing Student Features (4 Options)
- Use: **student1@tec.kh**, **student2@tec.kh**, **student3@tec.kh**, or **student4@tec.kh**
- View courses, submit assignments, check grades
- Test collaboration between multiple students

### Testing Teacher Features
- Use: **teacher@tec.kh**
- Create courses, grade assignments, view student progress
- Manage course materials and schedules

### Testing Admin Features
- Use: **admin@tec.kh**
- Manage institutions, users, system settings
- View analytics and reports

### Testing Multiple Students Interaction
- Use: student1, student2, student3, and student4 accounts
- Test collaboration features, group assignments, peer communication

---

## 🔗 Important Links

- **Login Page:** http://localhost:3001/auth/login
- **Student Dashboard:** http://localhost:3001/dashboard/student
- **Teacher Dashboard:** http://localhost:3001/dashboard/teacher
- **Admin Dashboard:** http://localhost:3001/dashboard/admin
- **Homepage:** http://localhost:3001

---

## 📝 Notes

- All accounts share the same password **`tec@12345`** for easy testing
- Each account maps to a different role in the system
- Email domain is `.tec.kh` (Khmer Education Technology)
- Student accounts numbered 1-4 for easy identification
- Language defaults to Khmer (ខ្មែរ) with English fallback
- Input fields have proper visibility with good contrast
- Database credentials stored in `.env.local`

---

**Last Updated:** November 5, 2025
**Platform:** DGTech LMS - Phases 1-8
**Language:** Khmer-First (ខ្មែរ)
**Domain:** .tec.kh
