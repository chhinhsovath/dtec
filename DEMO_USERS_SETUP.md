# Demo Users Setup Guide

This guide explains how to set up demo user accounts for development and testing of the DGTech LMS platform.

## Quick Start

The login page now includes **quick demo login buttons** at the bottom for each role. However, you need to first create the demo users in the database.

## Demo User Credentials

| Role | Email | Password |
|------|-------|----------|
| **Student** | `student@demo.com` | `demo@123` |
| **Teacher** | `teacher@demo.com` | `demo@123` |
| **Admin** | `admin@demo.com` | `demo@123` |
| **Parent** | `parent@demo.com` | `demo@123` |

## Setup Instructions

### Step 1: Create SSH Tunnel to Database

Open a terminal and run:

```bash
ssh -L 5433:157.10.73.52:5432 ubuntu@157.10.73.52
# Password: en_&xdX#!N(^OqCQzc3RE0B)m6ogU!
```

Keep this terminal open while working.

### Step 2: Run Demo Users Setup Script

In another terminal, from the project root directory, run:

```bash
PGPASSWORD='P@ssw0rd' psql -h localhost -p 5433 -U admin -d dtech -f scripts/create-demo-users.sql
```

### Step 3: Verify Setup

You should see output like:

```
     email     |  role   |      full_name
---------------+---------+--------------------
 student@demo.com | student | Demo Student
 teacher@demo.com | teacher | Demo Teacher
 admin@demo.com   | admin   | Demo Admin
 parent@demo.com  | parent  | Demo Parent
(4 rows)
```

## Using Demo Accounts

### Via Quick Demo Buttons

1. Go to http://localhost:3002/auth/login
2. Scroll down to "Demo Accounts (Development Only)" section
3. Click any role button (Student, Teacher, Admin, or Parent)
4. You'll be logged in and redirected to that role's dashboard

### Via Manual Login Form

1. Go to http://localhost:3002/auth/login
2. Enter the email and password from the table above
3. Click "Sign In"

## Demo User Features

### Student Dashboard
- Access to courses and assignments
- View grades and attendance
- Submit assignments

### Teacher Dashboard
- Manage courses and students
- View class attendance
- Grade assignments

### Admin Dashboard
- Access all admin settings pages:
  - Institution settings
  - System settings
  - User policies
  - Email configuration
  - Security settings
  - Grade scales

### Parent Dashboard
- View student information
- Check grades and attendance
- View assignments
- Monitor progress
- Message teachers

## Reset Demo Users

To reset demo user passwords or remove them:

### Remove Demo Users

```bash
PGPASSWORD='P@ssw0rd' psql -h localhost -p 5433 -U admin -d dtech << 'EOF'
DELETE FROM profiles WHERE email LIKE '%demo%';
EOF
```

### Recreate Demo Users

Run the setup script again (Step 2).

## Database Connection Details

- **Host**: 157.10.73.52 (requires SSH tunnel)
- **SSH Tunnel Port**: 5433
- **Database Port**: 5432
- **Database**: dtech
- **Username**: admin
- **Password**: P@ssw0rd

## Troubleshooting

### "Demo login failed" Error

**Possible causes:**
1. Demo users not created in database
2. SSH tunnel not active
3. Database connection issues

**Solution:**
- Verify SSH tunnel is running
- Re-run the setup script (Step 2)
- Check that `create-demo-users.sql` script ran without errors

### "Connection refused" Error

**Cause:** SSH tunnel not established

**Solution:**
```bash
# Open new terminal and create tunnel
ssh -L 5433:157.10.73.52:5432 ubuntu@157.10.73.52
```

### Demo Users Not Appearing

**Check if users were created:**
```bash
PGPASSWORD='P@ssw0rd' psql -h localhost -p 5433 -U admin -d dtech << 'EOF'
SELECT email, role FROM profiles WHERE email LIKE '%demo%';
EOF
```

If no results, re-run Step 2.

## Development Notes

- Demo accounts are for **development and testing only**
- Remove or disable demo accounts before deploying to production
- The demo login buttons only appear in development - they're integrated into the login form UI
- All demo users have the same password (`demo@123`) for convenience

## Quick Reference

```bash
# Create SSH tunnel (keep open in background)
ssh -L 5433:157.10.73.52:5432 ubuntu@157.10.73.52

# Setup demo users
PGPASSWORD='P@ssw0rd' psql -h localhost -p 5433 -U admin -d dtech -f scripts/create-demo-users.sql

# View demo users
PGPASSWORD='P@ssw0rd' psql -h localhost -p 5433 -U admin -d dtech -c "SELECT email, role FROM profiles WHERE email LIKE '%demo%';"

# Remove demo users
PGPASSWORD='P@ssw0rd' psql -h localhost -p 5433 -U admin -d dtech -c "DELETE FROM profiles WHERE email LIKE '%demo%';"
```

## Next Steps

After setting up demo users:

1. **Test Parent Portal**: Login as parent@demo.com
2. **Test Admin Settings**: Login as admin@demo.com
3. **Test Student Interface**: Login as student@demo.com
4. **Test Teacher Interface**: Login as teacher@demo.com

Happy testing! 🚀
