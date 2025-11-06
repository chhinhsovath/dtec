# Mantine UI Complete Migration Guide

## Overview
This guide walks you through migrating your Next.js application from Tailwind CSS to **pure Mantine UI** components. No inline styles, no Tailwind classes, only Mantine.

## Completed Infrastructure ✅

### 1. **MantinePageTemplate** (`/app/components/MantinePageTemplate.tsx`)
Reusable header and layout template for all pages.

**Usage Example:**
```tsx
import { MantinePageTemplate } from '@/app/components/MantinePageTemplate';

export default function MyPage() {
  const { t, language, changeLanguage } = useTranslation();

  return (
    <MantinePageTemplate
      title={t('navigation.myPage')}
      onLogout={handleLogout}
      language={language}
      onLanguageChange={changeLanguage}
      t={t}
    >
      {/* Your page content here */}
    </MantinePageTemplate>
  );
}
```

### 2. **FormModal** (`/app/components/FormModal.tsx`)
Fully Mantine-based generic form modal supporting:
- TextInput, Textarea, Select, Date, Number, Email, Password
- Automatic validation and error display
- Loading states and submission handling

### 3. **CourseFormModal** (`/app/components/CourseFormModal.tsx`)
Specialized modal using Mantine Modal component.

### 4. **Courses Page** (`/app/dashboard/teacher/courses/page.tsx`)
✅ Fully migrated with:
- Mantine Table for course listing
- Mantine Pagination
- Mantine TextInput for search
- Mantine Modal for forms
- Tabler Icons throughout

---

## Mantine Component Mapping

### Form Components
| Tailwind | Mantine | Notes |
|----------|---------|-------|
| `<input className="..." />` | `<TextInput />` | Single-line text, email, password, number |
| `<textarea className="..." />` | `<Textarea />` | Multi-line text |
| `<select className="..." />` | `<Select />` or `<MultiSelect />` | Dropdown selection |
| Custom checkbox | `<Checkbox />` | Boolean input |
| Custom radio | `<Radio />` or `<RadioGroup />` | Single selection |
| Custom switch | `<Switch />` | Toggle switch |
| Custom date picker | `<DatePickerInput />` | From @mantine/dates |

### Layout Components
| Tailwind | Mantine | Notes |
|----------|---------|-------|
| `<div className="flex">` | `<Group />` | Horizontal layout |
| `<div className="flex flex-col">` | `<Stack />` | Vertical layout |
| `<div className="grid">` | `<SimpleGrid />` | Multi-column grid |
| `<div className="mx-auto px-4">` | `<Container />` | Centered max-width container |
| `<div className="absolute">` | `<Box sx={{ position: 'absolute' }}>` | Custom positioning |

### Content Components
| Tailwind | Mantine | Notes |
|----------|---------|-------|
| `<h1 className="text-2xl">` | `<Title order={1} />` | Headings |
| `<p className="text-sm">` | `<Text size="sm" />` | Paragraphs |
| `<div className="bg-red-50">` | `<Alert>` | Alert boxes |
| Custom badge | `<Badge />` | Colored labels |
| Custom card | `<Paper />` or `<Card />` | Containers |

### Data Display
| Tailwind | Mantine | Notes |
|----------|---------|-------|
| `<table>` | `<Table />` | Data tables |
| Custom pagination | `<Pagination />` | Page navigation |
| Custom tabs | `<Tabs />` | Tab navigation |
| Custom breadcrumb | `<Breadcrumbs />` | Navigation breadcrumbs |

### Interaction Components
| Tailwind | Mantine | Notes |
|----------|---------|-------|
| `<button className="...">` | `<Button />` | Primary button |
| `<button className="...">` | `<ActionIcon />` | Icon button |
| Custom modal | `<Modal />` | Dialog box |
| Custom menu | `<Menu />` | Dropdown menu |
| Custom dropdown | `<Popover />` | Floating popup |
| Custom tooltip | `<Tooltip />` | Help text |
| Custom notification | `<Notification />` | Toast message |

### Icon Components
**OLD:** `import { IconName } from 'lucide-react'`

**NEW:** `import { IconName } from '@tabler/icons-react'`

**Icon Examples:**
```tsx
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconLogout,
  IconChevronUp,
  IconChevronDown,
  IconCalendar,
  IconClock,
  IconDownload,
  IconFilter,
  IconSort,
} from '@tabler/icons-react';

<Button leftSection={<IconPlus size={16} />}>Add Item</Button>
<ActionIcon><IconEdit size={16} /></ActionIcon>
```

---

## Step-by-Step Migration Template

### 1. Import Statements
```tsx
// OLD (Tailwind)
import { Search, Plus, Edit2, Trash2, LogOut } from 'lucide-react';

// NEW (Mantine)
import {
  Container,
  Group,
  Button,
  TextInput,
  Table,
  Pagination,
  Alert,
  Badge,
  ActionIcon,
  Title,
  Text,
  Stack,
  Center,
  Loader,
} from '@mantine/core';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconLogout,
} from '@tabler/icons-react';
```

### 2. Header Section
```tsx
// OLD (Tailwind)
<header className="bg-white shadow-sm">
  <div className="max-w-7xl mx-auto px-4 py-4">
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">{title}</h1>
      <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg">
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </div>
  </div>
</header>

// NEW (Mantine)
<div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
  <Container size="xl" py="md">
    <Group justify="space-between" align="center">
      <Title order={1}>{title}</Title>
      <Button
        onClick={handleLogout}
        color="red"
        leftSection={<IconLogout size={16} />}
      >
        Logout
      </Button>
    </Group>
  </Container>
</div>
```

### 3. Main Content Container
```tsx
// OLD (Tailwind)
<main className="max-w-7xl mx-auto px-4 py-8">
  {content}
</main>

// NEW (Mantine)
<Container size="xl" py="xl">
  {content}
</Container>
```

### 4. Search Bar
```tsx
// OLD (Tailwind)
<div className="relative">
  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
  <input
    type="text"
    placeholder="Search..."
    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
  />
</div>

// NEW (Mantine)
<TextInput
  placeholder="Search..."
  leftSection={<IconSearch size={16} />}
  style={{ flex: 1, maxWidth: '400px' }}
/>
```

### 5. Table Display
```tsx
// OLD (Tailwind)
<div className="bg-white rounded-lg shadow">
  <table className="w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-semibold">Column 1</th>
      </tr>
    </thead>
    <tbody>
      {items.map(item => (
        <tr key={item.id}>
          <td className="px-6 py-4">{item.name}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

// NEW (Mantine)
<Table striped highlightOnHover>
  <Table.Thead>
    <Table.Tr>
      <Table.Th>Column 1</Table.Th>
    </Table.Tr>
  </Table.Thead>
  <Table.Tbody>
    {items.map(item => (
      <Table.Tr key={item.id}>
        <Table.Td>{item.name}</Table.Td>
      </Table.Tr>
    ))}
  </Table.Tbody>
</Table>
```

### 6. Buttons and Actions
```tsx
// OLD (Tailwind)
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
  Click Me
</button>

// NEW (Mantine)
<Button>Click Me</Button>
<Button color="blue">Click Me (explicit)</Button>
<Button variant="light">Subtle</Button>
<Button leftSection={<IconPlus size={16} />}>With Icon</Button>
<ActionIcon><IconEdit size={16} /></ActionIcon>
```

### 7. Error Alerts
```tsx
// OLD (Tailwind)
{error && (
  <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
    {error}
  </div>
)}

// NEW (Mantine)
{error && (
  <Alert color="red" mb="lg">
    {error}
  </Alert>
)}
```

### 8. Pagination
```tsx
// OLD (Tailwind)
<div className="mt-6 flex items-center justify-center">
  <button onClick={() => setPage(page - 1)} disabled={page === 1}>Previous</button>
  {/* ... page buttons ... */}
  <button onClick={() => setPage(page + 1)} disabled={page === total}>Next</button>
</div>

// NEW (Mantine)
<Flex justify="center" mt="xl">
  <Pagination
    value={currentPage}
    onChange={setCurrentPage}
    total={totalPages}
  />
</Flex>
```

---

## Icon Name Conversion

**Common Lucide → Tabler Icons:**
```
Search → IconSearch
Plus → IconPlus
Edit2 → IconEdit
Trash2 → IconTrash
LogOut → IconLogout
ChevronUp → IconChevronUp
ChevronDown → IconChevronDown
Calendar → IconCalendar
Clock → IconClock
Download → IconDownload
Filter → IconFilter
Settings → IconSettings
Home → IconHome
User → IconUser
```

Find all icons at: https://tabler.io/icons

---

## Color System

### Mantine Color Palette
Your app is configured with **Cyan** as primary color:
```tsx
primaryColor: 'cyan',
colors: {
  cyan: [
    '#f0f9ff', // 0 - lightest
    '#e0f2fe', // 1
    '#bae6fd', // 2
    '#7dd3fc', // 3
    '#38bdf8', // 4
    '#0ea5e9', // 5 - primary
    '#0284c7', // 6
    '#0369a1', // 7
    '#075985', // 8
    '#0c4a6e', // 9 - darkest
  ],
}
```

### Using Colors
```tsx
<Button color="cyan">Primary (default)</Button>
<Button color="red">Error/Danger</Button>
<Button color="green">Success</Button>
<Button color="blue">Info</Button>
<Button color="yellow">Warning</Button>

<Alert color="red">Error</Alert>
<Alert color="green">Success</Alert>
<Alert color="blue">Info</Alert>

<Badge color="cyan">Label</Badge>
```

---

## Spacing System

Mantine uses a consistent spacing scale (8px base):

```tsx
<Container py="xl" px="md">  {/* padding */}
<Stack gap="lg">               {/* gap between items */}
<Group p="md" m="lg">          {/* padding and margin */}
<Title mt="xl" mb="md">        {/* margin-top, margin-bottom */}
<Text fs="italic" fw={700}>   {/* font-style, font-weight */}
```

**Sizes:** `xs` (4px), `sm` (8px), `md` (16px), `lg` (32px), `xl` (64px)

---

## Typography

```tsx
<Title order={1}>H1 Heading</Title>
<Title order={2}>H2 Heading</Title>
<Title order={3}>H3 Heading</Title>

<Text size="lg" fw={700}>Large bold text</Text>
<Text size="sm" c="dimmed">Small dimmed text</Text>
<Text truncate>This text will be truncated with ellipsis</Text>
```

---

## Responsive Design

Mantine uses responsive values with breakpoints:

```tsx
<Group
  justify={{ base: 'center', md: 'space-between' }}
  gap={{ base: 'xs', md: 'lg' }}
>
  {/* Responsive layout */}
</Group>
```

**Breakpoints:** `xs`, `sm`, `md`, `lg`, `xl` (same as Tailwind)

---

## Next Pages to Migrate

### High Priority (ASAP)
1. **Assignments Page** - Uses FormModal heavily
2. **Students Page** - Uses table and action buttons
3. **Teacher Dashboard** - Landing page

### Medium Priority (Next)
4. **Student Dashboard** - Same pattern as teacher
5. **Admin Dashboard** - Settings and management
6. **Profile Page** - User profile settings

### Lower Priority (Later)
7. **Auth Pages** - Login, Register, Verify Email
8. **Child Pages** - Assignments details, submissions
9. **Admin Settings** - Various config pages

---

## Testing After Migration

For each page migrated:

1. **Visual Check**
   - [ ] Header displays correctly
   - [ ] All buttons are visible and clickable
   - [ ] Forms render properly
   - [ ] Tables display correctly
   - [ ] Colors match original design
   - [ ] Responsive on mobile

2. **Functionality Check**
   - [ ] Search/filter works
   - [ ] Sort works
   - [ ] Pagination works
   - [ ] Form submission works
   - [ ] Modal opens/closes
   - [ ] Icons display

3. **Compilation Check**
   - [ ] No TypeScript errors
   - [ ] No console warnings
   - [ ] Page compiles < 1s

---

## Common Issues & Solutions

### Issue: `Cannot find module '@mantine/core'`
**Solution:** Run `npm install` to ensure all dependencies installed

### Issue: Icons not displaying
**Solution:** Change imports from lucide-react to @tabler/icons-react
```tsx
// Wrong
import { Search } from 'lucide-react';

// Right
import { IconSearch } from '@tabler/icons-react';
```

### Issue: Styles not applying
**Solution:** Use Mantine props instead of className
```tsx
// Wrong
<Box className="p-4 bg-blue-100">Content</Box>

// Right
<Box p="md" bg="cyan.0">Content</Box>
```

### Issue: Form inputs not working
**Solution:** Use controlled components with proper onChange handlers
```tsx
const [value, setValue] = useState('');
<TextInput
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

---

## File Checklist for Assignments Page Migration

Copy these imports:
```tsx
import {
  Container,
  Group,
  Button,
  TextInput,
  Table,
  Pagination,
  Alert,
  Badge,
  Text,
  Stack,
  Center,
  ActionIcon,
  Title,
  Loader,
  Select,
  Flex,
  Modal,
} from '@mantine/core';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconLogout,
  IconChevronUp,
  IconChevronDown,
} from '@tabler/icons-react';
```

Then follow the template patterns above to replace:
- [ ] Import statements
- [ ] Header section
- [ ] Main container
- [ ] Search bar
- [ ] Filter dropdown
- [ ] Table rendering
- [ ] Action buttons
- [ ] Pagination
- [ ] Modal for form
- [ ] Loading states
- [ ] Error alerts

---

## Resources

- **Mantine Docs**: https://mantine.dev/
- **Tabler Icons**: https://tabler.io/icons
- **Mantine UI Examples**: https://mantine.dev/showcase/
- **Color Picker**: https://mantine.dev/colors/

---

**Good luck with the migration! Follow the patterns established in the Courses page for consistency.** 🚀
