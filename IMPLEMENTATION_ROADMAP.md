# DGTech LMS - Parent Portal & Admin Settings Implementation Roadmap

**Status**: High Priority Implementation
**Total Time Required**: 8-13 hours
**Difficulty**: Medium
**Target Completion**: This development cycle

---

## 📋 Overview

This roadmap covers the implementation of two critical features to reach 100% feature completeness:

1. **Parent Portal Main Route & Integration** (3-5 hours)
2. **Admin Settings UI & Configuration** (5-8 hours)

---

## 🎯 Phase 1: Parent Portal (3-5 hours)

### Current Status
- ✅ Database schema complete (parent_student_relationships, parent_preferences, etc.)
- ✅ API endpoints ready (`/api/parent-portal/*`)
- ✅ Component library built (7 components)
- ❌ **Main route missing**: No `/dashboard/parent` or `/parent-portal` route
- ❌ Components not fully integrated/wired

### What Needs to Be Done

#### 1.1 Create Parent Portal Main Route (1.5 hours)
**File**: `app/dashboard/parent/page.tsx`

**Checklist**:
- [ ] Create new folder structure:
  ```
  app/dashboard/parent/
  ├── page.tsx                    # Main dashboard
  ├── students/
  │   ├── [studentId]/
  │   │   ├── grades/page.tsx
  │   │   ├── attendance/page.tsx
  │   │   ├── assignments/page.tsx
  │   │   └── progress/page.tsx
  ├── messages/page.tsx
  ├── notifications/page.tsx
  ├── documents/page.tsx
  ├── events/page.tsx
  └── layout.tsx
  ```

- [ ] Create layout wrapper with:
  - Sidebar navigation with parent menu items
  - Header with user info
  - Bilingual support (Khmer/English)
  - Theme/style consistency with other dashboards

- [ ] Implement role-based middleware check
  - Verify user is parent/guardian
  - Redirect non-parents to appropriate dashboard

**Success Criteria**:
- Parent can access `/dashboard/parent`
- Dashboard loads without errors
- All components render properly

#### 1.2 Wire Components to Routes (1.5 hours)
**Files to modify**:
- `app/dashboard/parent/page.tsx` - Import & use ParentDashboard
- `app/dashboard/parent/messages/page.tsx` - Import & use MessagesView
- `app/dashboard/parent/notifications/page.tsx` - Import & use NotificationsView
- `app/dashboard/parent/documents/page.tsx` - Import & use DocumentsView
- `app/dashboard/parent/events/page.tsx` - Import & use EventsView
- `app/dashboard/parent/students/[studentId]/grades/page.tsx` - Use StudentGradesView
- `app/dashboard/parent/students/[studentId]/attendance/page.tsx` - Use StudentAttendanceView
- `app/dashboard/parent/students/[studentId]/progress/page.tsx` - Create progress component

**Checklist**:
- [ ] Import existing parent-portal components
- [ ] Fix any prop/interface mismatches
- [ ] Add proper error handling
- [ ] Add loading states
- [ ] Ensure parent authentication check
- [ ] Add breadcrumb navigation

**Success Criteria**:
- All routes load correctly
- Navigation works between parent pages
- Components receive correct data

#### 1.3 Verify API Endpoints Work (1 hour)
**Endpoints to verify**:
- `GET /api/parent-portal/dashboard` - Dashboard data
- `GET /api/parent-portal/students/{studentId}/grades` - Student grades
- `GET /api/parent-portal/students/{studentId}/attendance` - Attendance
- `GET /api/parent-portal/messages` - Messages
- `GET /api/parent-portal/notifications` - Notifications
- `POST /api/parent-portal/messages` - Send message

**Checklist**:
- [ ] Test each endpoint with valid parent user
- [ ] Check data format matches component expectations
- [ ] Verify error responses
- [ ] Test with multiple students
- [ ] Check pagination (if applicable)
- [ ] Verify RLS policies (row-level security)

**Success Criteria**:
- All endpoints return correct data
- Error handling works
- RLS prevents unauthorized access

#### 1.4 Update Navigation & Menu (1 hour)
**Files to modify**:
- `app/layout.tsx` - Add parent dashboard route
- `components/navigation/Sidebar.tsx` or equivalent - Add parent menu
- `lib/navigation.ts` - Add parent portal routes
- Update authentication check to support parent role

**Checklist**:
- [ ] Update role-based routing
- [ ] Add parent option to role selection
- [ ] Create parent-specific menu items
- [ ] Update login redirect for parents
- [ ] Test navigation from login -> parent dashboard

**Success Criteria**:
- Parents see parent dashboard after login
- Menu shows parent-specific options
- Can navigate between parent pages

#### 1.5 Test End-to-End (1 hour)
**Test cases**:
- [ ] Parent logs in successfully
- [ ] Parent sees all their children
- [ ] Can view child's grades
- [ ] Can view child's attendance
- [ ] Can send messages to teachers
- [ ] Can view notifications
- [ ] Can access documents
- [ ] RSVP to events works
- [ ] Test with multiple children
- [ ] Test permission controls

**Success Criteria**:
- All workflows functional
- No console errors
- Proper error messages shown

---

## 🛠️ Phase 2: Admin Settings UI (5-8 hours)

### Current Status
- ✅ Database schema complete (system_settings, configuration tables)
- ✅ API endpoints ready (`/api/admin/settings/*`)
- ❌ **Settings UI missing**: No `/dashboard/admin/settings` route
- ❌ Settings editor not implemented
- ❌ Configuration form not built

### What Needs to Be Done

#### 2.1 Create Admin Settings Page Structure (1.5 hours)
**File**: `app/dashboard/admin/settings/page.tsx`

**Folder structure**:
```
app/dashboard/admin/settings/
├── page.tsx                    # Main settings hub
├── institution/
│   └── page.tsx               # Institution settings
├── system/
│   └── page.tsx               # System settings
├── users/
│   └── page.tsx               # User policies & defaults
├── emails/
│   └── page.tsx               # Email configuration
├── security/
│   └── page.tsx               # Security settings
├── grades/
│   └── page.tsx               # Grade scale configuration
├── calendar/
│   └── page.tsx               # Academic calendar
└── layout.tsx                 # Settings layout with sidebar
```

**Checklist**:
- [ ] Create settings layout with navigation tabs
- [ ] Create main settings hub page
- [ ] Add settings sidebar with links
- [ ] Implement tab-based navigation
- [ ] Add breadcrumbs for navigation
- [ ] Style consistently with admin dashboard

**Success Criteria**:
- Settings page loads
- Navigation between sections works
- Layout is clean and organized

#### 2.2 Implement Institution Settings (1 hour)

**Fields to manage**:
- Institution name (text)
- Institution code (text)
- Institution description (textarea)
- Institution logo (image upload)
- Contact email (text)
- Contact phone (text)
- Address (textarea)
- Website URL (text)
- Academic year (select)
- Timezone (select)
- Language preference (select)

**Checklist**:
- [ ] Create form with all institution fields
- [ ] Add form validation
- [ ] Implement save/update functionality
- [ ] Add success/error notifications
- [ ] Add loading state
- [ ] Implement undo/reset option
- [ ] Add file upload for logo

**Success Criteria**:
- Can view current institution settings
- Can edit and save changes
- Validation prevents invalid data

#### 2.3 Implement System Settings (1.5 hours)

**Settings categories**:

1. **General System**:
   - System name
   - Maintenance mode toggle
   - Debug mode toggle
   - Max upload file size
   - Allowed file types

2. **Features Toggle**:
   - Enable/disable attendance tracking
   - Enable/disable forums
   - Enable/disable live classes
   - Enable/disable parent portal
   - Enable/disable learning paths
   - Enable/disable certifications

3. **Performance**:
   - Cache settings
   - Session timeout
   - Max concurrent users
   - Database backup frequency

4. **Notifications**:
   - Email notifications enabled
   - SMS notifications enabled
   - Push notifications enabled
   - Notification frequency options

**Checklist**:
- [ ] Create toggles for feature flags
- [ ] Create input fields for numeric settings
- [ ] Create select dropdowns for categories
- [ ] Implement real-time toggle feedback
- [ ] Add settings reset to defaults button
- [ ] Implement settings export/import

**Success Criteria**:
- Can toggle features on/off
- Settings persist after save
- Changes take effect immediately

#### 2.4 Implement Grade Scale Configuration (1 hour)

**Functionality**:
- View existing grade scales
- Create new grade scale
- Edit grade scale entries (A: 90-100, B: 80-89, etc.)
- Set default grade scale
- Delete custom grade scales

**Checklist**:
- [ ] Create list of grade scales
- [ ] Add "Create new" button
- [ ] Implement modal/form for grade entry
- [ ] Validate percentage ranges (0-100)
- [ ] Prevent overlapping ranges
- [ ] Allow setting default scale
- [ ] Add preview of scale

**Success Criteria**:
- Can create new grade scales
- Can modify existing scales
- Scale validations work

#### 2.5 Implement User Policies & Defaults (1 hour)

**Policies to configure**:
- Password requirements (min length, complexity)
- Session timeout (in minutes)
- Login attempt limits (before lockout)
- Password expiration period
- Require email verification
- Allow self-registration
- Default user role
- Auto-enroll students in courses

**Checklist**:
- [ ] Create form for each policy
- [ ] Add validation for numeric fields
- [ ] Add toggle switches for boolean settings
- [ ] Add password strength preview
- [ ] Show current policy in effect
- [ ] Allow reset to defaults

**Success Criteria**:
- Can configure user policies
- Policies save correctly
- Validations prevent invalid configs

#### 2.6 Implement Email Configuration (1 hour)

**Settings to configure**:
- SMTP server address
- SMTP port
- SMTP username
- SMTP password (masked)
- From email address
- From name
- Email templates list
- Test email button

**Checklist**:
- [ ] Create form for SMTP settings
- [ ] Mask password input
- [ ] Add "Send test email" button
- [ ] Show email templates preview
- [ ] List available email templates
- [ ] Allow customizing email templates
- [ ] Verify SMTP connection

**Success Criteria**:
- Can configure email settings
- Test email functionality works
- Settings save securely

#### 2.7 Add Security & Backup Settings (1 hour)

**Features**:
- Two-factor authentication toggle
- API key management
- Backup schedule configuration
- Database backup status
- Log retention period
- Security audit log viewer

**Checklist**:
- [ ] Add 2FA toggle
- [ ] Implement API key creation/revocation
- [ ] Add backup schedule selection
- [ ] Show last backup timestamp
- [ ] Display system logs
- [ ] Add log export functionality
- [ ] Show security alerts

**Success Criteria**:
- Can manage security settings
- Can view backup status
- Can manage API keys

#### 2.8 Add Settings Management Features (1 hour)

**Features to implement**:
- Save settings with validation
- Reset to defaults option
- Export current settings as JSON
- Import settings from JSON
- Settings change history/audit log
- Rollback to previous settings

**Checklist**:
- [ ] Implement bulk save across all sections
- [ ] Add confirmation dialog before reset
- [ ] Add settings export button
- [ ] Add settings import button with validation
- [ ] Create audit log for all changes
- [ ] Implement rollback functionality
- [ ] Add settings version control

**Success Criteria**:
- Can save all changes
- Can reset to defaults
- Can export/import settings

#### 2.9 Test Settings End-to-End (1 hour)

**Test cases**:
- [ ] All settings pages load
- [ ] Can create new settings
- [ ] Can edit existing settings
- [ ] Can save changes
- [ ] Changes persist after reload
- [ ] Validation works correctly
- [ ] Error messages display properly
- [ ] Reset to defaults works
- [ ] Settings audit log records changes
- [ ] Export/import functionality works

**Success Criteria**:
- All settings pages functional
- Data persists correctly
- No console errors

---

## 📊 Timeline

**Week 1**:
- Days 1-2: Parent Portal Setup (1.1, 1.2, 1.4)
- Days 3-4: Parent Portal Integration (1.3, 1.5)

**Week 2**:
- Days 1-2: Admin Settings Core (2.1, 2.2)
- Days 3-4: Admin Settings Features (2.3, 2.4, 2.5)
- Day 5: Admin Settings Advanced + Testing (2.6, 2.7, 2.8, 2.9)

---

## ✅ Final Checklist

- [ ] All routes created and accessible
- [ ] No console errors in development
- [ ] All API endpoints tested
- [ ] Form validation working
- [ ] Error handling implemented
- [ ] Bilingual support confirmed
- [ ] Mobile responsive design verified
- [ ] Database changes logged
- [ ] Settings persist after page reload
- [ ] Security audit passed
- [ ] Load testing passed (100+ concurrent users)
- [ ] Documentation updated

**Total Estimated Time**: 8-13 hours
**Status**: Ready to implement
