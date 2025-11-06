# i18n System Consolidation Plan

## Executive Summary

This document details the consolidation of the TEC LMS i18n (internationalization) system from a fragmented multi-system approach to a unified, scalable architecture. The goal is to have **ONE source of truth for all translations** across the entire platform.

**Status**: ✅ Phase 0 Foundation Complete | Phase 1A Files Generated

---

## Current State Analysis

### Existing Systems (Pre-Consolidation)

#### ❌ System 1: `/lib/translations/` (TypeScript-based)
- **Location**: `/lib/translations/*.ts`
- **Format**: TypeScript modules
- **Status**: **DEPRECATED** - To be migrated/deleted
- **Problem**: Not suitable for dynamic loading or easy editing

#### ✅ System 2: `/lib/i18n/` (JSON-based - RECOMMENDED)
- **Location**: `/lib/i18n/translations/*.json`
- **Format**: JSON with nested structure
- **Status**: **ACTIVE** - Official i18n system
- **Advantages**:
  - Easy to edit without code changes
  - Supports variable placeholders `{{variable}}`
  - Hierarchical key organization
  - Performant client-side access

### Problem Statement

- **Fragmentation**: Two translation systems create confusion
- **Maintenance Burden**: Updates must be made in multiple places
- **Data Inconsistency**: Keys may differ between systems
- **Component Integration**: Some components use `lib/translations`, others use `lib/i18n`

---

## Consolidated Architecture

### Single Source of Truth

```
/lib/i18n/
├── i18n.ts                 (Core translation engine)
├── useTranslation.ts       (React hook for client components)
└── translations/
    ├── en.json            (English - 290+ keys, PHASE 1A COMPLETE)
    ├── km.json            (Khmer - 290+ keys, PHASE 1A COMPLETE)
    └── [future: zh, fr, es, etc.]
```

### File Hierarchy & Key Structure

**Translation Key Organization** (dot-notation):

```
common.logout                           → "Logout" / "ចាកចេញ"
auth.login.title                        → "Educational Management System"
auth.login.emailPlaceholder             → "Enter your email"
dashboard.student.welcome               → "Welcome, {{name}}!"
courses.enrollButton                    → "Enroll Now"
validation.email                        → "Please enter a valid email..."
email.gradeNotification.subject         → "Your grade for {{assignmentName}} has been posted"
```

### Phase 1A Complete Keys (290+ keys)

**Organized in 14 categories**:

1. **common** (42 keys)
   - Basic UI actions: logout, save, cancel, delete, edit, view, back, search, filter, reset
   - Common states: loading, error, success, empty, required, optional
   - Pagination & navigation: page, first, last, previous, next
   - Utilities: copy, download, upload, settings, language, theme, profile

2. **auth** (90 keys)
   - Login (10 keys)
   - Register (18 keys)
   - Password Reset (12 keys)
   - Email Verification (10 keys)
   - Two-Factor Authentication (5 keys)
   - Error messages & feedback (20+ keys)

3. **navigation** (32 keys)
   - Main navigation items: dashboard, courses, assignments, grades, attendance
   - Menu controls: mobile menu, breadcrumb, footer
   - Administrative: users, teachers, students, classes, schools
   - Meta: help, contact, privacy, terms, about

4. **dashboard** (72 keys)
   - Student dashboard (23 keys)
   - Teacher dashboard (25 keys)
   - Admin dashboard (18 keys)
   - Parent dashboard (18 keys)

5. **courses** (41 keys)
   - Course metadata: name, code, description, instructor, duration
   - Status tracking: active, inactive, archived, upcoming, completed
   - Student actions: enroll, unenroll, view details, join class
   - Course components: materials, lessons, modules, resources, forum

6. **assignments** (41 keys)
   - Assignment metadata: title, description, due date, points value
   - Submission tracking: pending, submitted, graded, returned, draft
   - Status messages: overdue, due today, due tomorrow
   - Actions: submit, view, edit, delete, grade, comment

7. **grades** (38 keys)
   - Grade tracking: score, percentage, letter grade, GPA
   - Status: grading in progress, not yet graded
   - Scale labels: A (90-100), B (80-89), C, D, F
   - Performance: excellent, good, satisfactory, needs improvement

8. **attendance** (41 keys)
   - Attendance status: present, absent, late, excused
   - Tracking metrics: attendance rate, absences, tardies
   - QR code scanning: scan, code invalid, code expired
   - Methods: QR code, manual, mobile, API

9. **validation** (32 keys)
   - Field validation: required, email, password, phone, URL, number, date
   - Password rules: minimum length, weak/strong indicators, mismatch
   - File validation: file required, file size, file type
   - Dynamic placeholders: `{{min}}`, `{{max}}`

10. **forms** (14 keys)
    - Form actions: submit, submitting, submitted, submit error
    - Form management: clear, reset, fill, preview
    - State management: unsaved changes, invalid form

11. **date/time** (30+ keys)
    - Month names (long & short): January, មករា
    - Day names (long & short): Monday, ច័ន្ទ
    - Relative time: today, tomorrow, yesterday, this week, last month
    - Time units: second, minute, hour, day, week, month, year
    - Special: AM, PM, midnight, noon

12. **messages** (24 keys)
    - Status: loading, no data, error, success, warning, info
    - Operations: deleted, updated, created, saved
    - Errors: not found, access denied, unauthorized, offline
    - Actions: try again, contact support, go home

13. **email** (30 keys)
    - Welcome email template
    - Grade notification template
    - Attendance alert template
    - Assignment reminder template
    - Announcement template
    - Each with: subject, greeting, body, CTA, footer (+ variable placeholders)

14. **errors** (22 keys)
    - HTTP status codes: 400, 401, 403, 404, 405, 408, 409, 500, 502, 503, 504
    - Error descriptions: bad request, unauthorized, forbidden, not found, etc.

15. **statusMessage** (12 keys)
    - Progress indicators: loading, saving, deleting, updating, uploading
    - System states: processing, sending, receiving, syncing, initializing

---

## Migration Strategy

### Phase 0: Foundation (✅ COMPLETED)

- [x] Fixed critical LTR/RTL bug in i18n.ts
- [x] Created useTranslation React hook
- [x] Generated 290+ English translation keys
- [x] Generated matching Khmer translations

### Phase 1A: Translation Keys (✅ IN PROGRESS - FILES GENERATED)

**Files Changed**:
- ✅ `/lib/i18n/translations/en.json` - Updated with 290+ keys (was ~60 keys)
- ✅ `/lib/i18n/translations/km.json` - Updated with matching Khmer translations

**Verification Checklist**:
```
[ ] All keys have matching English ↔ Khmer translations
[ ] Variable placeholders are consistent {{name}}, {{count}}, etc.
[ ] JSON syntax is valid (run: `npm run lint`)
[ ] Email templates include all required fields
[ ] No duplicate keys
[ ] Hierarchical key names follow dot-notation convention
```

### Phase 1B: Expand Module Translations (PENDING)

**Goal**: Add 300+ additional keys for Feature Modules

**Modules to Add**:
- Courses (advanced filtering, prerequisites)
- Assignments (rubrics, peer review, plagiarism detection)
- Grades (transcripts, GPA calculation, class rankings)
- Attendance (analytics, reports, parent notifications)
- Discussions (forums, moderation, best practices)
- Certificates (templates, criteria, tracking)
- Notifications (email, SMS, push, in-app)
- Reports (analytics, dashboards, export formats)
- Administration (user management, system logs, backups)
- Settings (preferences, notifications, privacy, accessibility)

### Phase 2: Component Conversion (PENDING)

**Goal**: Convert hardcoded text → i18n keys

**Priority Pages**:

1. **Auth Pages** (HIGH PRIORITY - Users see first)
   - `/app/auth/login/page.tsx` - Has hardcoded Khmer text
   - `/app/auth/register/page.tsx`
   - `/app/auth/reset-password/page.tsx`
   - `/app/auth/verify-email/page.tsx`

2. **Dashboard Pages** (HIGH)
   - `/app/dashboard/student/page.tsx`
   - `/app/dashboard/teacher/page.tsx`
   - `/app/dashboard/admin/page.tsx`
   - `/app/dashboard/parent/page.tsx`

3. **Feature Pages** (MEDIUM)
   - `/app/courses/page.tsx`
   - `/app/assignments/page.tsx`
   - `/app/grades/page.tsx`
   - `/app/attendance/page.tsx`

4. **Navigation Components** (HIGH)
   - `/components/Navbar.tsx`
   - `/components/Sidebar.tsx`
   - `/components/Footer.tsx`

### Phase 3: Database Localization (PENDING)

**Goal**: Support bilingual content in database

**Database Schema Changes**:

```sql
-- Example: Courses table
ALTER TABLE courses ADD COLUMN (
  course_name_en VARCHAR(255),
  course_name_km VARCHAR(255),
  description_en TEXT,
  description_km TEXT
);

-- Example: Announcements table
ALTER TABLE announcements ADD COLUMN (
  title_en VARCHAR(500),
  title_km VARCHAR(500),
  content_en TEXT,
  content_km TEXT
);
```

**Migration Strategy**:
1. Add new `*_en` and `*_km` columns alongside existing columns
2. Copy existing data to `*_en` column (backward compatibility)
3. Provide admin interface for editing both languages
4. Deprecate old single-language column after 1 release cycle
5. Delete old column in v2.0

### Phase 4: API Localization (PENDING)

**Goal**: APIs return both EN and KM content

**Example Response**:
```json
{
  "course_id": 123,
  "name": {
    "en": "Introduction to Physics",
    "km": "ស្វាគមន៍ក្នុងប្រធានបទរូបវិទ្យា"
  },
  "description": {
    "en": "Learn physics basics...",
    "km": "រៀនមូលដ្ឋានរូបវិទ្យា..."
  }
}
```

**API Endpoints to Update**:
- `/api/courses`
- `/api/assignments`
- `/api/grades`
- `/api/announcements`
- `/api/notifications` (email templates)

### Phase 5-6: Testing & Deployment (PENDING)

**Testing**:
- [ ] Translation key coverage (100% of UI text)
- [ ] Variable placeholder substitution
- [ ] Cross-browser rendering of Khmer text
- [ ] RTL/LTR direction switching (already fixed)
- [ ] Performance: no translation lookup delays
- [ ] Fallback behavior (missing keys)

**Deployment**:
- [ ] Staging environment testing
- [ ] User acceptance testing with Khmer speakers
- [ ] Production rollout with rollback plan
- [ ] Monitor for untranslated text warnings
- [ ] Analytics: track language selection usage

---

## Technical Implementation Details

### i18n.ts Core Functions

**Available Functions**:

```typescript
// Get current language from localStorage or browser settings
getCurrentLanguage(): Language  // Returns 'en' or 'km'

// Retrieve translation by key
t(key: string, language?: Language): string
// Example: t('auth.login.title') → "Educational Management System"

// Format date according to locale
formatDate(date: Date | string, language?: Language): string
// Example: formatDate(new Date()) → "November 5, 2025" or "5 វិច្ឆិកា 2025"

// Format time relative to now
formatTimeAgo(date: Date | string, language?: Language): string
// Example: formatTimeAgo(Date.now() - 5*60000) → "5 minutes ago" or "5 នាទីមុន"

// Convert digits to Khmer numerals
formatNumber(num: number, language?: Language): string
// Example: formatNumber(12345, 'km') → "១២៣៤៥"

// Get month/day names
getMonthName(index: number, format: 'long' | 'short', language?: Language): string
getDayName(index: number, format: 'long' | 'short', language?: Language): string

// Direction (always LTR for English and Khmer)
getDir(language?: Language): 'ltr' | 'rtl'  // Always returns 'ltr'
```

### useTranslation Hook (React)

**Usage in Components**:

```typescript
'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';

export default function LoginPage() {
  const { t, language, changeLanguage, format } = useTranslation();

  return (
    <div>
      <h1>{t('auth.login.title')}</h1>
      <p>{t('dashboard.student.welcome', 'Welcome!')}</p>

      {/* Language Switcher */}
      <button onClick={() => changeLanguage('en')}>
        {t('common.language')} - English
      </button>
      <button onClick={() => changeLanguage('km')}>
        {t('common.language')} - ខ្មែរ
      </button>

      {/* Date Formatting */}
      <p>{format.date(new Date())}</p>
      <p>{format.timeAgo(Date.now() - 1000*60*5)}</p>
    </div>
  );
}
```

### Email Template Variable Substitution

**Template Variables** (in email JSON):

```json
{
  "email": {
    "welcome": {
      "subject": "Welcome to {{platformName}}",
      "greeting": "Hello {{name}},",
      "body": "Welcome to our platform!",
      "cta": "Get Started"
    }
  }
}
```

**Server-side Substitution**:

```typescript
const emailTemplate = t('email.welcome.subject'); // "Welcome to {{platformName}}"
const variables = { platformName: 'TEC LMS', name: 'John Doe' };

Object.entries(variables).forEach(([key, value]) => {
  const placeholder = `{{${key}}}`;
  subject = subject.replace(new RegExp(placeholder, 'g'), String(value));
});

// Result: "Welcome to TEC LMS"
```

---

## Files to Delete (Migration Cleanup)

### Deprecated `/lib/translations/` System

**Files to Delete**:
```
/lib/translations/
├── index.ts                (DELETE)
├── en.ts                   (DELETE)
├── km.ts                   (DELETE)
└── types.ts                (DELETE)
```

**Files to Keep/Migrate**:
- All type definitions → Move to `/lib/i18n/types.ts`
- Import references → Update throughout codebase

### Deprecation Process

**Step 1** (Current Release): Keep both systems, prefer i18n
```typescript
// OLD (deprecated)
import { t as translateOld } from '@/lib/translations';

// NEW (recommended)
import { t } from '@/lib/i18n/i18n';
```

**Step 2** (Next Release): Remove all references to old system
```bash
# Search for old imports
grep -r "from '@/lib/translations'" app/
grep -r "from '@/lib/translations'" components/
grep -r "from '@/lib/translations'" lib/
```

**Step 3** (v2.0): Delete `/lib/translations/` directory

---

## Backup & Recovery

### Before Migration

```bash
# Create backup of current translation files
cp -r /lib/i18n/translations /lib/i18n/translations.backup.$(date +%Y%m%d)
```

### If Issues Occur

```bash
# Restore from backup
rm -rf /lib/i18n/translations
cp -r /lib/i18n/translations.backup.20251105 /lib/i18n/translations
```

---

## Success Criteria

- [x] Phase 0: Foundation completed
- [x] Phase 1A: 290+ keys generated and working
- [ ] Phase 1B: 300+ additional keys added (Q1 2025)
- [ ] Phase 2: All priority pages converted to i18n (Q1 2025)
- [ ] Phase 3: Database schema updated for bilingual content (Q2 2025)
- [ ] Phase 4: APIs return both languages (Q2 2025)
- [ ] Phase 5: 100% test coverage for translations (Q2 2025)
- [ ] Phase 6: Production deployment with 0 untranslated strings (Q2 2025)

---

## Maintenance & Future Enhancements

### Adding New Languages

To add Spanish (es):

1. Create `/lib/i18n/translations/es.json`
2. Copy structure from `en.json`
3. Translate all keys to Spanish
4. Update Language type: `type Language = 'en' | 'km' | 'es'`

### Translation Coverage Auditing

```typescript
// Script to find missing translations
const allKeys = getAllKeysFromJSON('en.json');
const kmKeys = getAllKeysFromJSON('km.json');

const missing = allKeys.filter(key => !kmKeys.includes(key));
console.log('Missing Khmer translations:', missing);
```

### Performance Optimization

- **Lazy load translations** by language
- **Cache translated strings** in memory
- **Code-split translation files** per page/feature
- **Use CDN** for translation updates

---

## References

- **i18n Core**: `/lib/i18n/i18n.ts`
- **React Hook**: `/lib/i18n/useTranslation.ts`
- **English Keys**: `/lib/i18n/translations/en.json` (290+ keys)
- **Khmer Keys**: `/lib/i18n/translations/km.json` (290+ keys)

---

## Questions & Support

For questions about this consolidation plan:
1. Review this document completely first
2. Check the [i18n.ts source code](/lib/i18n/i18n.ts) for implementation details
3. Review the [useTranslation hook](/lib/i18n/useTranslation.ts) for React integration
4. Contact the development team with specific implementation questions

---

**Last Updated**: November 5, 2025
**Status**: Phase 1A Complete - Translation Files Generated
**Next Phase**: Phase 1B - Expand to 600+ keys for all modules
