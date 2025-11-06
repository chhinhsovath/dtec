# Quick Demo Login Reference

## 🚀 Quick Start (3 Steps)

### Step 1: Open SSH Tunnel
```bash
ssh -L 5433:157.10.73.52:5432 ubuntu@157.10.73.52
# Password: en_&xdX#!N(^OqCQzc3RE0B)m6ogU!
```
**Keep this terminal open!**

### Step 2: Create Demo Users
```bash
PGPASSWORD='P@ssw0rd' psql -h localhost -p 5433 -U admin -d dtech -f scripts/create-demo-users.sql
```

### Step 3: Login
Go to http://localhost:3002/auth/login and click any role button!

---

## 📋 Demo Users

| Role | Email | Password | Color |
|------|-------|----------|-------|
| 👤 Student | `student@demo.com` | `demo@123` | Blue |
| 📚 Teacher | `teacher@demo.com` | `demo@123` | Green |
| ⚙️ Admin | `admin@demo.com` | `demo@123` | Purple |
| 👨‍👩‍👧 Parent | `parent@demo.com` | `demo@123` | Orange |

---

## 🎯 What You Can Test

### As Student
- View courses and grades
- Check attendance
- Submit assignments

### As Teacher
- Manage courses
- Grade assignments
- Track attendance

### As Admin
- Access all settings pages:
  - Institution settings
  - System settings
  - User policies
  - Email configuration
  - Security settings
  - Grade scales

### As Parent
- View student progress
- Check grades & attendance
- Monitor assignments
- See analytics

---

## 🔐 Reset Demo Users

Remove old demo users:
```bash
PGPASSWORD='P@ssw0rd' psql -h localhost -p 5433 -U admin -d dtech << 'EOF'
DELETE FROM profiles WHERE email LIKE '%demo%';
EOF
```

---

## ❓ Troubleshooting

**"Demo login failed"?**
- Check SSH tunnel is running
- Run Step 2 again

**"Connection refused"?**
- Create SSH tunnel (Step 1)

**Can't find demo users in database?**
```bash
PGPASSWORD='P@ssw0rd' psql -h localhost -p 5433 -U admin -d dtech << 'EOF'
SELECT email, role FROM profiles WHERE email LIKE '%demo%';
EOF
```

---

## 📱 Development URLs

- **Login**: http://localhost:3002/auth/login
- **Student**: http://localhost:3002/dashboard/student
- **Teacher**: http://localhost:3002/dashboard/teacher
- **Admin Settings**: http://localhost:3002/dashboard/admin/settings
- **Parent Portal**: http://localhost:3002/dashboard/parent

---

See `DEMO_USERS_SETUP.md` for detailed setup instructions.
