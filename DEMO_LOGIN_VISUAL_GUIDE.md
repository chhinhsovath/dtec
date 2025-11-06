# Demo Login Visual Guide

## Login Page Layout

The login page now includes a demo login section at the bottom:

```
┌─────────────────────────────────────────────────┐
│                                                 │
│        🎓 DGTech Learning Management System    │
│                                                 │
│              [EN] [ខ្មែរ]                        │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│    📧 Email                                    │
│    [_____________________]                     │
│                                                 │
│    🔒 Password                                 │
│    [_____________________]                     │
│                                                 │
│    ☑ Remember Me        Forgot Password?       │
│                                                 │
│    [       SIGN IN       ]                     │
│                                                 │
│    No account? Register now                   │
│                                                 │
├─────────────────────────────────────────────────┤
│  DEMO ACCOUNTS (DEVELOPMENT ONLY)              │
│                                                 │
│  [👤 Student]  [📚 Teacher]                   │
│  [⚙️ Admin]    [👨‍👩‍👧 Parent]                │
│                                                 │
│    Password: demo@123                         │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Button Details

### 👤 Student Button
- **Color**: Light Blue
- **Email**: `student@demo.com`
- **Password**: `demo@123`
- **Redirects to**: `/dashboard/student`

### 📚 Teacher Button
- **Color**: Light Green
- **Email**: `teacher@demo.com`
- **Password**: `demo@123`
- **Redirects to**: `/dashboard/teacher`

### ⚙️ Admin Button
- **Color**: Light Purple
- **Email**: `admin@demo.com`
- **Password**: `demo@123`
- **Redirects to**: `/dashboard/admin/settings`

### 👨‍👩‍👧 Parent Button
- **Color**: Light Orange
- **Email**: `parent@demo.com`
- **Password**: `demo@123`
- **Redirects to**: `/dashboard/parent`

---

## Responsive Design

### Desktop (≥768px)
```
Buttons arranged in 2x2 grid:
[Student] [Teacher]
[Admin]   [Parent]
```

### Mobile (<768px)
```
Buttons stack responsively
(Still shows 2x2 grid on small screens)
```

---

## How Demo Buttons Work

1. **User clicks a demo button**
   - Button is disabled during login
   - Shows loading state

2. **Frontend sends credentials**
   - Calls `/api/auth/login` with demo email & password
   - `handleDemoLogin()` function processes request

3. **Backend verifies credentials**
   - Checks PostgreSQL database
   - Returns user object with role

4. **Session stored**
   - Saves to localStorage
   - User is "logged in"

5. **Redirect**
   - Routes to role-based dashboard
   - Example: Admin → `/dashboard/admin/settings`

---

## Manual vs Demo Login

### Manual Login (Traditional)
1. Type email: `student@demo.com`
2. Type password: `demo@123`
3. Click "Sign In"

### Demo Login (Quick)
1. Click "👤 Student" button
2. Instant login (same credentials, one click)
3. Same result as manual login

---

## Database Password Hash

All demo users use the same password hash (SHA256):

```
Password: demo@123
Hash: ad5561d2f2034f7a6b73ee5760cbc612cb04480866df0b322bc2af34e31bd3bc
```

This allows quick demo login without typing credentials.

---

## Sample User Entries

What's stored in the `profiles` table:

```sql
INSERT INTO profiles VALUES
  (
    'student-demo-001',
    'student@demo.com',
    'ad5561d2f2034f7a6b73ee5760cbc612cb04480866df0b322bc2af34e31bd3bc',
    'Demo Student',
    'student',
    NOW(),
    NOW()
  ),
  (
    'teacher-demo-001',
    'teacher@demo.com',
    'ad5561d2f2034f7a6b73ee5760cbc612cb04480866df0b322bc2af34e31bd3bc',
    'Demo Teacher',
    'teacher',
    NOW(),
    NOW()
  ),
  (
    'admin-demo-001',
    'admin@demo.com',
    'ad5561d2f2034f7a6b73ee5760cbc612cb04480866df0b322bc2af34e31bd3bc',
    'Demo Admin',
    'admin',
    NOW(),
    NOW()
  ),
  (
    'parent-demo-001',
    'parent@demo.com',
    'ad5561d2f2034f7a6b73ee5760cbc612cb04480866df0b322bc2af34e31bd3bc',
    'Demo Parent',
    'parent',
    NOW(),
    NOW()
  );
```

---

## Testing Flow Examples

### Example 1: Test Parent Portal
1. Click "👨‍👩‍👧 Parent" button
2. Redirected to `/dashboard/parent`
3. See parent dashboard with:
   - Language toggle
   - Student list
   - Quick access links
4. Click "Students" to view student details
5. Click "Grades" to see grade breakdown

### Example 2: Test Admin Settings
1. Click "⚙️ Admin" button
2. Redirected to `/dashboard/admin/settings`
3. See 6 settings section cards
4. Click any section (e.g., "User Policies")
5. See form with configurable options
6. Edit and submit (will show success/error)

### Example 3: Quick Role Switch
1. Logged in as Parent
2. Scroll down (if in settings)
3. Logout
4. Click "👤 Student" button
5. Now logged in as Student
6. See Student dashboard

---

## UI Styling Details

### Button Styling
```css
/* Dimensions */
- Height: 2.5rem (py-2)
- Padding: 0.75rem (px-3)
- Font Size: 0.75rem (text-xs)
- Font Weight: medium

/* Colors (by role) */
- Student: bg-blue-50, text-blue-700
- Teacher: bg-green-50, text-green-700
- Admin: bg-purple-50, text-purple-700
- Parent: bg-orange-50, text-orange-700

/* States */
- Hover: +100 shade (bg-blue-100, etc.)
- Disabled: opacity-50, cursor-not-allowed
- Focus: Active during login
```

### Container Styling
```css
/* Demo Section Container */
- Top Margin: 2rem (mt-8)
- Top Padding: 2rem (pt-8)
- Top Border: 1px solid gray-200

/* Button Grid */
- Columns: 2 (grid-cols-2)
- Gap: 0.5rem (gap-2)

/* Label */
- Font Size: 0.75rem (text-xs)
- Font Weight: semibold, uppercase
- Text Color: gray-500
```

---

## Browser Compatibility

| Browser | Status |
|---------|--------|
| Chrome | ✅ Fully Tested |
| Firefox | ✅ Compatible |
| Safari | ✅ Compatible |
| Edge | ✅ Compatible |
| Mobile Safari | ✅ Responsive |
| Mobile Chrome | ✅ Responsive |

---

## Accessibility

- ✅ Buttons are focusable (keyboard navigation)
- ✅ Color-coded for visual distinction
- ✅ Emoji icons for quick recognition
- ✅ Text labels for clarity
- ✅ Disabled state during loading
- ✅ Responsive on all screen sizes

---

## Quick Reference

### Click the Button For:
| Button | Purpose |
|--------|---------|
| 👤 Student | Test student dashboard |
| 📚 Teacher | Test teacher dashboard |
| ⚙️ Admin | Test admin settings |
| 👨‍👩‍👧 Parent | Test parent portal |

### All Passwords:
```
demo@123
```

### All Uses Same Password:
```
✅ Yes - for convenience during development
❌ Not for production
```

---

## Notes

- Demo buttons appear **below the main login form**
- They're visible to all users (development only)
- Same effect as typing email/password manually
- Faster way to test different roles
- Perfect for quick navigation between features

---

**Last Updated**: November 5, 2025
**Location**: Login page footer (line 176-214 in app/auth/login/page.tsx)
