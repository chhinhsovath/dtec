# Technical Specifications - Parent Portal & Admin Settings

## Overview

Detailed technical specifications for implementing Parent Portal and Admin Settings to reach 100% feature completeness.

---

## Part 1: Parent Portal Architecture

### 1.1 Routes & Pages

```
/dashboard/parent
├── Main Dashboard
├── /students/[studentId]
│   ├── /grades          - View child's grades
│   ├── /attendance      - View attendance records
│   ├── /assignments     - View pending/submitted assignments
│   └── /progress        - View overall progress & analytics
├── /messages            - Parent-teacher communication
├── /notifications       - All notifications & alerts
├── /documents           - Shared school documents
└── /events              - School events & RSVP
```

### 1.2 Authentication & Authorization

**Parent Role Requirements**:
```typescript
interface ParentUser {
  id: string;
  email: string;
  role: 'parent' | 'guardian';
  students: {
    student_id: string;
    relationship_type: 'mother' | 'father' | 'guardian' | 'caregiver';
    is_primary: boolean;
    can_view_grades: boolean;
    can_view_attendance: boolean;
    can_view_assignments: boolean;
  }[];
}
```

**Middleware Check**:
```typescript
// Add to authentication middleware
if (user.role === 'parent' || user.role === 'guardian') {
  if (path.startsWith('/dashboard/parent')) {
    // Allow access
  } else if (path.startsWith('/dashboard/') && !path.includes('parent')) {
    // Redirect to parent dashboard
    redirect('/dashboard/parent');
  }
}
```

### 1.3 Data Models

**Parent Dashboard Response**:
```json
{
  "parent": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "students": [
    {
      "student_id": "uuid",
      "user_name": "Jane Doe",
      "relationship_type": "mother",
      "is_primary": true,
      "summary": {
        "overall_gpa": "3.75",
        "attendance_percentage": 92,
        "pending_assignments": 2,
        "overdue_assignments": 0,
        "behavior_score": 85,
        "last_login": "2024-11-05T10:30:00Z"
      }
    }
  ],
  "stats": {
    "total_students": 2,
    "unread_messages": 3,
    "pending_event_rsvps": 1,
    "total_unread_notifications": 5
  }
}
```

**Student Grades Response**:
```json
{
  "student_id": "uuid",
  "courses": [
    {
      "course_id": "uuid",
      "course_name": "Mathematics",
      "current_grade": "A",
      "percentage": 92.5,
      "assignments": [
        {
          "assignment_id": "uuid",
          "title": "Algebra Quiz",
          "due_date": "2024-11-10",
          "submitted_date": "2024-11-09",
          "score": 18,
          "max_score": 20
        }
      ]
    }
  ]
}
```

### 1.4 Components & Props

**ParentDashboard Component**:
```typescript
interface ParentDashboardProps {
  data: DashboardData;
  onRefresh?: () => Promise<void>;
  onError?: (error: string) => void;
}

export function ParentDashboard(props: ParentDashboardProps) {
  // Implementation
}
```

**StudentGradesView Component**:
```typescript
interface StudentGradesViewProps {
  studentId: string;
  semester?: string;
  year?: number;
  onUpdate?: () => void;
}
```

### 1.5 API Endpoints

All endpoints require parent authentication and verify parent-student relationship.

**GET /api/parent-portal/dashboard**
- Returns: Parent info + students + stats
- Auth: Parent token required
- Errors: 401 Unauthorized, 404 Parent not found

**GET /api/parent-portal/students/{studentId}/grades**
- Returns: Student grades by course
- Params: studentId, semester (optional), year (optional)
- Auth: Verify parent-student relationship
- Errors: 403 Forbidden (not parent), 404 Student not found

**GET /api/parent-portal/students/{studentId}/attendance**
- Returns: Attendance records for past 30 days
- Params: studentId, startDate (optional), endDate (optional)
- Auth: Verify parent-student relationship
- Filters: By course (optional)

**GET /api/parent-portal/messages**
- Returns: Conversation list + recent messages
- Params: page (1), limit (20), unread_only (boolean)
- Auth: Parent token
- Pagination: Cursor-based

**POST /api/parent-portal/messages**
- Body: { recipient_id, subject, message, attachment_ids }
- Returns: Created message object
- Auth: Parent token
- Validation: Message length < 5000 chars

**GET /api/parent-portal/notifications**
- Returns: All notifications for parent
- Params: limit (20), offset (0), type (filter)
- Auth: Parent token
- Types: grade_change, attendance, assignment_due, event, message

**PUT /api/parent-portal/notifications/{notificationId}/read**
- Returns: Updated notification
- Auth: Parent token

**GET /api/parent-portal/events**
- Returns: Upcoming school events
- Params: limit (20), offset (0)
- Auth: Parent token

**POST /api/parent-portal/events/{eventId}/rsvp**
- Body: { status: 'attending' | 'not_attending' | 'maybe' }
- Returns: Updated RSVP record
- Auth: Parent token

### 1.6 Error Handling

```typescript
// Standard error response
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "You don't have permission to view this student's information",
    "details": "Parent-student relationship not found"
  }
}

// Success response
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-11-05T10:30:00Z"
}
```

---

## Part 2: Admin Settings Architecture

### 2.1 Routes & Pages

```
/dashboard/admin/settings
├── Main Hub (grid of setting sections)
├── /institution            - Institution profile & branding
├── /system                 - System config & feature toggles
├── /users                  - User policies & defaults
├── /emails                 - Email configuration
├── /security               - Security & backups
├── /grades                 - Grade scale management
└── /calendar              - Academic calendar
```

### 2.2 Settings Data Models

**Institution Settings**:
```typescript
interface InstitutionSettings {
  id: string;
  name: string;
  code: string;
  description: string;
  logo_url: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  website_url: string;
  academic_year: string;
  timezone: string;
  language_preference: 'en' | 'km' | 'both';
  created_at: timestamp;
  updated_at: timestamp;
  updated_by: user_id;
}
```

**System Settings**:
```typescript
interface SystemSettings {
  id: string;
  // General
  system_name: string;
  maintenance_mode: boolean;
  debug_mode: boolean;
  max_upload_size_mb: number;
  allowed_file_types: string[];
  
  // Features
  features: {
    attendance_tracking: boolean;
    discussion_forums: boolean;
    live_classes: boolean;
    parent_portal: boolean;
    learning_paths: boolean;
    certifications: boolean;
  };
  
  // Performance
  cache_enabled: boolean;
  cache_ttl_minutes: number;
  session_timeout_minutes: number;
  max_concurrent_users: number;
  db_backup_frequency: 'daily' | 'weekly' | 'monthly';
  
  // Notifications
  email_notifications_enabled: boolean;
  sms_notifications_enabled: boolean;
  push_notifications_enabled: boolean;
  notification_frequency: 'immediate' | 'daily' | 'weekly';
}
```

**User Policies**:
```typescript
interface UserPolicies {
  id: string;
  password_min_length: number;
  password_require_uppercase: boolean;
  password_require_numbers: boolean;
  password_require_special_chars: boolean;
  password_expiration_days: number;
  session_timeout_minutes: number;
  login_attempt_limit: number;
  lockout_duration_minutes: number;
  require_email_verification: boolean;
  allow_self_registration: boolean;
  default_user_role: 'student' | 'teacher';
  auto_enroll_students: boolean;
}
```

**Email Configuration**:
```typescript
interface EmailConfig {
  id: string;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string; // Encrypted
  from_email: string;
  from_name: string;
  use_tls: boolean;
  test_email_address?: string;
  last_tested?: timestamp;
  templates: {
    welcome: string;
    password_reset: string;
    notification: string;
    assignment_due: string;
    grade_posted: string;
  };
}
```

**Grade Scales**:
```typescript
interface GradeScale {
  id: string;
  institution_id: string;
  name: string; // "Standard A-F", "Custom Scale", etc.
  is_default: boolean;
  entries: {
    grade_letter: string;
    min_percentage: number;
    max_percentage: number;
    description: string;
  }[];
  created_at: timestamp;
  updated_by: user_id;
}
```

### 2.3 Settings Storage

**Database Tables**:
```sql
CREATE TABLE system_settings (
  id UUID PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  data_type VARCHAR(50), -- 'string', 'number', 'boolean', 'json'
  description TEXT,
  editable BOOLEAN DEFAULT true,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE settings_audit_log (
  id UUID PRIMARY KEY,
  setting_key VARCHAR(255),
  old_value JSONB,
  new_value JSONB,
  changed_by UUID REFERENCES profiles(id),
  changed_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE settings_revisions (
  id UUID PRIMARY KEY,
  revision_number INTEGER,
  settings_snapshot JSONB,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT false
);
```

### 2.4 API Endpoints

**GET /api/admin/settings**
- Returns: All current settings
- Auth: Admin only
- Caching: 1 hour

**GET /api/admin/settings/{section}**
- Examples: institution, system, users, emails
- Returns: Settings for that section
- Auth: Admin only

**PUT /api/admin/settings/{section}**
- Body: { [key]: value }
- Returns: Updated settings
- Auth: Admin only
- Validation: Server-side validation
- Audit: Log changes

**POST /api/admin/settings/{section}/save**
- Body: Complete section data
- Returns: { success: true, data: savedData }
- Auth: Admin only
- Transaction: Save atomically

**POST /api/admin/settings/reset-defaults**
- Returns: { success: true, reverted_count: number }
- Auth: Admin only
- Requires: Confirmation

**GET /api/admin/settings/audit-log**
- Returns: List of all setting changes
- Params: limit (20), offset (0), section (filter)
- Auth: Admin only

**POST /api/admin/settings/export**
- Returns: JSON file of all settings
- Auth: Admin only

**POST /api/admin/settings/import**
- Body: { settings_json: {...} }
- Returns: Preview of changes
- Auth: Admin only
- Requires: Confirmation

**POST /api/admin/settings/rollback**
- Body: { revision_id }
- Returns: { success: true }
- Auth: Admin only
- Audit: Log rollback action

### 2.5 Form Components

**Base Settings Form**:
```typescript
interface SettingsFormProps<T> {
  initialData: T;
  onSubmit: (data: T) => Promise<void>;
  onError: (error: Error) => void;
  loading?: boolean;
  title?: string;
  description?: string;
}

function SettingsForm<T>(props: SettingsFormProps<T>) {
  // Implementation with react-hook-form
}
```

**Form Validation**:
```typescript
// Using Zod for validation
const institutionSettingsSchema = z.object({
  name: z.string().min(3).max(255),
  code: z.string().regex(/^[A-Z0-9]+$/),
  contact_email: z.string().email(),
  contact_phone: z.string().regex(/^\d{10,}$/),
  logo_url: z.string().url().optional(),
  timezone: z.enum(timezoneList),
});
```

### 2.6 UI Components

**Settings Layout**:
```tsx
export function SettingsLayout({ children }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar with section nav */}
      <aside className="bg-white p-6 rounded-lg">
        <nav className="space-y-2">
          {sections.map(section => (
            <Link href={section.href}>
              {section.title}
            </Link>
          ))}
        </nav>
      </aside>
      
      {/* Main content */}
      <main className="lg:col-span-3">
        {children}
      </main>
    </div>
  );
}
```

**Settings Card**:
```tsx
interface SettingsCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onSave?: () => Promise<void>;
  loading?: boolean;
}

export function SettingsCard(props: SettingsCardProps) {
  // Card with header, content, and action buttons
}
```

---

## Part 3: Database Changes

### 3.1 Parent Portal Tables

Already exist in migration `011_parent_guardian_portal.sql`:
- `parent_student_relationships`
- `parent_preferences`
- `parent_student_summary`
- `parent_messages`

No changes needed - tables are ready.

### 3.2 Settings Tables

Already exist in migrations `025_hrmis_integration.sql`:
- `system_settings` (or create if missing)
- `settings_audit_log`
- `settings_revisions`

**Create if missing**:
```sql
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  data_type VARCHAR(50),
  description TEXT,
  editable BOOLEAN DEFAULT true,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_settings_key ON system_settings(key);
```

---

## Part 4: Security Considerations

### 4.1 Parent Portal Security

1. **Row-Level Security (RLS)**:
   ```sql
   -- Parents can only see their own children's data
   CREATE POLICY parent_view_own_students ON student_progress
   FOR SELECT
   USING (
     student_id IN (
       SELECT student_id FROM parent_student_relationships
       WHERE parent_id = auth.uid()
     )
   );
   ```

2. **Authorization Checks**:
   - Verify parent-student relationship exists
   - Check permission flags (can_view_grades, etc.)
   - Don't expose other parents' data

3. **Data Validation**:
   - Sanitize all parent inputs
   - Validate studentId is UUID format
   - Check date ranges for queries

### 4.2 Admin Settings Security

1. **Admin-Only Access**:
   ```typescript
   if (session.role !== 'admin') {
     return { error: 'Unauthorized' };
   }
   ```

2. **Sensitive Data**:
   - Never return SMTP passwords to frontend
   - Mask password fields in responses
   - Encrypt sensitive data at rest

3. **Audit Logging**:
   - Log every settings change
   - Record who made changes and when
   - Allow rollback to previous versions

4. **Rate Limiting**:
   - Limit settings update attempts (10/minute)
   - Limit export requests (1/minute)
   - Prevent brute force on validation

---

## Part 5: Performance Considerations

### 5.1 Parent Portal

1. **Caching**:
   - Cache parent dashboard data (5 min)
   - Cache student grades (10 min)
   - Cache attendance records (15 min)

2. **Query Optimization**:
   - Use appropriate indexes
   - Batch student queries
   - Avoid N+1 queries

3. **Pagination**:
   - Limit messages to 20 per page
   - Limit notifications to 50 per page
   - Use cursor-based pagination

### 5.2 Admin Settings

1. **Caching**:
   - Cache all settings (1 hour)
   - Invalidate cache on save
   - Cache audit log queries

2. **Performance**:
   - Settings table should be small
   - Use indexes on frequently queried keys
   - Load settings once at app startup

---

## Part 6: Testing Strategy

### 6.1 Parent Portal Tests

```typescript
describe('Parent Portal', () => {
  describe('Authentication', () => {
    test('should redirect non-parent users');
    test('should allow parent login');
  });
  
  describe('Dashboard', () => {
    test('should load parent dashboard');
    test('should show all parent children');
    test('should show correct statistics');
  });
  
  describe('Student Data Access', () => {
    test('should only show own children');
    test('should respect permission flags');
    test('should handle missing students');
  });
});
```

### 6.2 Admin Settings Tests

```typescript
describe('Admin Settings', () => {
  describe('Settings Page', () => {
    test('should load settings hub');
    test('should navigate between sections');
  });
  
  describe('Institution Settings', () => {
    test('should load current settings');
    test('should save changes');
    test('should validate required fields');
  });
  
  describe('System Settings', () => {
    test('should toggle features');
    test('should persist toggles');
    test('should prevent invalid values');
  });
});
```

---

## Summary

| Component | Status | Files | Lines | Complexity |
|-----------|--------|-------|-------|------------|
| Parent Portal | 85% | 10 | 400 | Medium |
| Admin Settings | 50% | 10 | 1200 | High |
| **TOTAL** | **67.5%** | **20** | **1600** | **Medium-High** |

**Time Estimate**: 8-13 hours
**Difficulty**: ⭐⭐⭐ (3/5)
**Priority**: 🔴 CRITICAL

