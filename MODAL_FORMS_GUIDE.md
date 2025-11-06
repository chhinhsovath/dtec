# Generic Modal Forms System

## Overview

The `FormModal` component provides a fully reusable, production-grade modal dialog system for Create, Read, Update operations. It handles all the complexity of form validation, error display, and user interaction.

## Components Created

### 1. **Generic FormModal** (`/app/components/FormModal.tsx`)
Universal modal component for all CRUD forms with:
- Dynamic field rendering (text, textarea, select, date, number, etc.)
- Built-in validation
- Error handling with per-field error messages
- Loading states
- Customizable button labels
- International (i18n) support

### 2. **Reusable CourseFormModal** (`/app/components/CourseFormModal.tsx`)
Specialized modal for course creation/editing (can be used as a template for other specialized modals)

## Implementation Examples

### Example 1: Courses Page
**File**: `/app/dashboard/teacher/courses/page.tsx`

```typescript
// 1. Define state
const [isModalOpen, setIsModalOpen] = useState(false);
const [editingCourse, setEditingCourse] = useState<Course | null>(null);
const [submitting, setSubmitting] = useState(false);

// 2. Create submit handler
const handleSubmitCourse = async (formData: CourseFormData) => {
  try {
    setSubmitting(true);
    // API call with formData
    // Update state
    setIsModalOpen(false);
  } finally {
    setSubmitting(false);
  }
};

// 3. Render modal
<CourseFormModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onSubmit={handleSubmitCourse}
  initialData={editingCourse ? { code, name, description } : null}
  isEditing={!!editingCourse}
  isSubmitting={submitting}
  t={t}
/>
```

### Example 2: Assignments Page
**File**: `/app/dashboard/teacher/assignments/page.tsx`

```typescript
// 1. Define form fields dynamically
const getAssignmentFormFields = (): FormField[] => [
  {
    name: 'course_id',
    label: t('dashboard.teacher.assignCourse'),
    type: 'select',
    required: true,
    options: courses.map(c => ({ value: c.id, label: `${c.code} - ${c.title}` })),
  },
  {
    name: 'title',
    label: t('dashboard.teacher.assignmentTitle'),
    type: 'text',
    required: true,
  },
  {
    name: 'due_date',
    label: t('dashboard.teacher.dueDate'),
    type: 'datetime-local',
  },
  // ... more fields
];

// 2. Render generic modal
<FormModal
  isOpen={isModalOpen}
  onClose={handleCloseModal}
  onSubmit={handleSubmitAssignment}
  title={editingAssignment ? t('assignments.editAssignment') : t('dashboard.teacher.createAssignment')}
  fields={getAssignmentFormFields()}
  initialData={editingAssignment ? { course_id, title, due_date, ... } : null}
  isEditing={!!editingAssignment}
  isSubmitting={submitting}
  t={t}
/>
```

### Example 3: Students Page (Grade Modal)
**File**: `/app/dashboard/teacher/students/page.tsx`

```typescript
// Simple 2-field modal for grade editing
<FormModal
  isOpen={!!editingGrade}
  onClose={() => setEditingGrade(null)}
  onSubmit={handleSubmitGrade}
  title={`${t('common.edit')} ${t('grades.grade')}`}
  fields={[
    {
      name: 'score',
      label: `${t('grades.score')} (0-100)`,
      type: 'number',
      required: true,
      min: 0,
      max: 100,
    },
    {
      name: 'letterGrade',
      label: t('grades.letterGrade'),
      type: 'select',
      options: [
        { value: 'A', label: t('grades.gradeScale_A') },
        { value: 'B', label: t('grades.gradeScale_B') },
        // ...
      ],
    },
  ]}
  initialData={editingGrade ? { score: editingGrade.score, letterGrade: editingGrade.letterGrade } : null}
  isSubmitting={submitting}
  t={t}
/>
```

## FormField Type Definitions

```typescript
interface FormField {
  name: string;                              // Unique field identifier
  label: string;                             // Display label
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'date' | 'datetime-local';
  placeholder?: string;                      // Optional placeholder
  required?: boolean;                        // Validation requirement
  rows?: number;                             // For textarea
  options?: Array<{ value: string; label: string }>; // For select fields
  pattern?: string;                          // Regex validation
  min?: number | string;                     // For number/date fields
  max?: number | string;                     // For number/date fields
}
```

## FormModal Props

```typescript
interface FormModalProps {
  isOpen: boolean;                           // Control visibility
  onClose: () => void;                       // Close handler
  onSubmit: (formData: Record<string, any>) => Promise<void>; // Submit handler
  title: string;                             // Modal title
  fields: FormField[];                       // Form fields to render
  initialData?: Record<string, any> | null;  // Pre-fill for editing
  isEditing?: boolean;                       // Show edit vs create context
  isSubmitting?: boolean;                    // Loading state
  submitButtonLabel?: string;                // Customize button text
  cancelButtonLabel?: string;                // Customize button text
  t: (key: string) => string;               // Translation function
}
```

## Features

✅ **Form Validation**
- Required field validation
- Email format validation
- Number range validation
- Per-field error messages
- Auto-clear errors on correction

✅ **User Experience**
- Sticky header with close button
- Dark overlay prevents background interaction
- Smooth animations and transitions
- Scrollable content for long forms
- Loading state during submission
- Success auto-close on submit

✅ **Accessibility**
- Semantic HTML
- ARIA-friendly structure
- Focus management
- Keyboard navigation support
- Clear error messaging

✅ **Internationalization**
- Support for i18n translation keys
- Flexible label/placeholder text
- Works with any translation system

✅ **Responsive**
- Mobile-friendly layout
- Max-width constraint (max-w-2xl)
- Proper padding and spacing
- Touch-friendly buttons

## Comparison: Before vs After

### Before (Inline Forms)
❌ Takes up screen space, pushes content down
❌ Easy to lose focus while scrolling
❌ Can't see table while editing
❌ User can scroll past form accidentally
❌ ~150 lines of JSX per page
❌ Mixed form logic with page logic

### After (Modal Forms)
✅ Overlays on content, doesn't push anything
✅ Modal stays in focus with dark overlay
✅ Can see table while editing in tooltip
✅ Can't interact with anything while form is open
✅ 3-5 lines of JSX per page
✅ Separated concerns, cleaner code

## Quick Start Guide

### For a New CRUD Page:

1. **Add imports**
```typescript
import { FormModal, FormField } from '@/app/components/FormModal';
```

2. **Add state**
```typescript
const [isModalOpen, setIsModalOpen] = useState(false);
const [editingItem, setEditingItem] = useState<Item | null>(null);
const [submitting, setSubmitting] = useState(false);
```

3. **Define fields**
```typescript
const getItemFormFields = (): FormField[] => [
  { name: 'field1', label: 'Field 1', type: 'text', required: true },
  { name: 'field2', label: 'Field 2', type: 'number', min: 0 },
];
```

4. **Create handler**
```typescript
const handleSubmit = async (formData) => {
  try {
    setSubmitting(true);
    // API call and state update
    setIsModalOpen(false);
  } finally {
    setSubmitting(false);
  }
};
```

5. **Render modal**
```typescript
<FormModal
  isOpen={isModalOpen}
  onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
  onSubmit={handleSubmit}
  title={editingItem ? 'Edit Item' : 'Create Item'}
  fields={getItemFormFields()}
  initialData={editingItem}
  isEditing={!!editingItem}
  isSubmitting={submitting}
  t={t}
/>
```

That's it! You now have a production-grade modal form system.

## Pages Using This System

| Page | Component | Fields | Status |
|------|-----------|--------|--------|
| Courses | `CourseFormModal` | code, name, description | ✓ Implemented |
| Assignments | `FormModal` | course_id, title, description, max_score, due_date, status | ✓ Implemented |
| Students | `FormModal` | score, letterGrade | ✓ Implemented |

## File Structure

```
app/
├── components/
│   ├── FormModal.tsx          # Generic modal for any CRUD form
│   └── CourseFormModal.tsx    # Specialized modal for courses (template)
└── dashboard/
    └── teacher/
        ├── courses/page.tsx   # Uses CourseFormModal
        ├── assignments/page.tsx # Uses FormModal
        └── students/page.tsx   # Uses FormModal
```

## Performance Notes

- Modal component is lightweight (~200 lines)
- Form validation happens client-side (instant feedback)
- No redundant API calls
- Properly closes and cleans up state on submit
- Prevents double-submission with `disabled` button

## Next Steps

This system can be extended to:
1. Add multi-step forms (wizard pattern)
2. Add file upload fields
3. Add date range pickers
4. Add custom field types
5. Add field-level async validation
6. Add dynamic field show/hide based on conditions

---

**Last Updated**: November 5, 2024
**Author**: Claude Code
**Status**: Production Ready
