# Mantine UI Quick Reference Guide

**Use this as a cheat sheet when migrating pages from Tailwind to Mantine.**

---

## Import Template (Copy-Paste for New Pages)

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Container,
  Title,
  Text,
  Button,
  Paper,
  Group,
  Stack,
  SimpleGrid,
  TextInput,
  Textarea,
  Select,
  Checkbox,
  PasswordInput,
  Alert,
  Loader,
  Center,
  Table,
  Badge,
  ActionIcon,
  Modal,
  Anchor,
  Divider
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconSearch,
  IconDownload,
  IconUpload,
  IconX,
  IconCheck,
  IconAlertCircle
} from '@tabler/icons-react';
```

---

## 1-Minute Replacements

### Containers & Layout
| Tailwind | Mantine |
|----------|---------|
| `<div className="max-w-7xl mx-auto px-4">` | `<Container size="xl">` |
| `<div className="flex items-center gap-4">` | `<Group gap="md">` |
| `<div className="flex flex-col gap-4">` | `<Stack gap="md">` |
| `<div className="grid grid-cols-3 gap-4">` | `<SimpleGrid cols={3}>` |

### Spacing Values
| Tailwind | Mantine | Pixels |
|----------|---------|--------|
| `gap-1` | `gap="xs"` | 4px |
| `gap-2` | `gap="sm"` | 8px |
| `gap-4` | `gap="md"` | 16px |
| `gap-6` | `gap="lg"` | 24px |
| `gap-8` | `gap="xl"` | 32px |

### Typography
| Tailwind | Mantine |
|----------|---------|
| `<h1 className="text-3xl font-bold">` | `<Title order={1}>` |
| `<h2 className="text-2xl font-bold">` | `<Title order={2}>` |
| `<p className="text-gray-600">` | `<Text c="dimmed">` |
| `<p className="text-sm">` | `<Text size="sm">` |
| `<a className="text-blue-600 hover:text-blue-700">` | `<Anchor>` |

### Buttons
| Tailwind | Mantine |
|----------|---------|
| `<button className="px-4 py-2 bg-blue-600 text-white rounded">` | `<Button>` |
| `<button className="bg-red-600 text-white">` | `<Button color="red">` |
| `<button className="border border-gray-300">` | `<Button variant="outline">` |
| `<button className="bg-transparent">` | `<Button variant="subtle">` |

### Forms
| Tailwind | Mantine |
|----------|---------|
| `<input type="text" className="w-full border rounded px-4 py-2">` | `<TextInput />` |
| `<input type="password">` | `<PasswordInput />` |
| `<textarea className="w-full">` | `<Textarea />` |
| `<select className="w-full">` | `<Select data={[]} />` |
| `<input type="checkbox">` | `<Checkbox />` |

### Cards
| Tailwind | Mantine |
|----------|---------|
| `<div className="bg-white rounded-lg shadow-md p-6">` | `<Paper shadow="sm" p="xl" radius="md">` |
| `<div className="bg-blue-50 rounded p-4">` | `<Paper p="md" style={{backgroundColor: 'var(--mantine-color-blue-0)'}}>` |

### Alerts
| Tailwind | Mantine |
|----------|---------|
| `<div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded">` | `<Alert color="red">` |
| `<div className="bg-green-50 text-green-700">` | `<Alert color="green">` |
| `<div className="bg-blue-50 text-blue-700">` | `<Alert color="blue">` |

---

## Icons: Lucide → Tabler Mapping

### Common Icons
```tsx
// Before
import { LogOut, Users, BookOpen, Settings, Plus, Edit, Trash } from 'lucide-react';

// After
import { IconLogout, IconUsers, IconBook, IconSettings, IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
```

### Icon Size Conversion
```tsx
// Before
<LogOut className="h-4 w-4" />    // 16px
<Users className="h-6 w-6" />     // 24px
<BookOpen className="h-8 w-8" />  // 32px

// After
<IconLogout size={16} />
<IconUsers size={24} />
<IconBook size={32} />
```

### Top 20 Most Used Icons
| Lucide | Tabler | Use Case |
|--------|--------|----------|
| `LogOut` | `IconLogout` | Logout button |
| `Plus` | `IconPlus` | Add/Create actions |
| `Edit` | `IconEdit` | Edit actions |
| `Trash` | `IconTrash` | Delete actions |
| `Search` | `IconSearch` | Search bars |
| `Users` | `IconUsers` | User lists, students |
| `BookOpen` | `IconBook` | Courses, materials |
| `Calendar` | `IconCalendar` | Schedules, dates |
| `FileText` | `IconFileText` | Documents, assignments |
| `Settings` | `IconSettings` | Settings pages |
| `Bell` | `IconBell` | Notifications |
| `Home` | `IconHome` | Home/Dashboard |
| `Download` | `IconDownload` | Download files |
| `Upload` | `IconUpload` | Upload files |
| `Check` | `IconCheck` | Success, completion |
| `X` | `IconX` | Close, cancel |
| `Eye` | `IconEye` | View details |
| `Mail` | `IconMail` | Email, messages |
| `Phone` | `IconPhone` | Contact info |
| `BarChart` | `IconChartBar` | Statistics, analytics |

---

## Common Page Patterns

### Pattern 1: Dashboard Page
```tsx
export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  if (loading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Paper shadow="xs" p="md" mb="xl">
        <Container size="xl">
          <Group justify="space-between">
            <Title order={2}>Dashboard</Title>
            <Button leftSection={<IconPlus size={16} />}>
              Add New
            </Button>
          </Group>
        </Container>
      </Paper>

      <Container size="xl">
        <Stack gap="xl">
          {/* Your content */}
        </Stack>
      </Container>
    </div>
  );
}
```

### Pattern 2: Form Page
```tsx
export default function FormPage() {
  const [formData, setFormData] = useState({});
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle submission
  };

  return (
    <Container size="sm" py="xl">
      <Paper shadow="lg" p="xl" radius="md">
        <Title order={2} mb="lg">Form Title</Title>

        {error && (
          <Alert color="red" title="Error" mb="md">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="Field Name"
              placeholder="Enter value"
              required
            />
            <Button type="submit" fullWidth>
              Submit
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
```

### Pattern 3: List Page with Table
```tsx
export default function ListPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Group justify="space-between">
          <Title order={2}>Items</Title>
          <Button leftSection={<IconPlus size={16} />}>
            Add New
          </Button>
        </Group>

        <Paper shadow="sm" p="xl" radius="md">
          {loading ? (
            <Center py="xl">
              <Loader />
            </Center>
          ) : (
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data.map((item) => (
                  <Table.Tr key={item.id}>
                    <Table.Td>{item.name}</Table.Td>
                    <Table.Td>
                      <Badge color="green">Active</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon variant="subtle">
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" color="red">
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Paper>
      </Stack>
    </Container>
  );
}
```

---

## Color Reference

### Using Theme Colors
```tsx
// Backgrounds
style={{ backgroundColor: 'var(--mantine-color-blue-0)' }}   // Lightest
style={{ backgroundColor: 'var(--mantine-color-cyan-6)' }}   // Primary

// Text colors
<Text c="dimmed">      // Gray
<Text c="cyan">        // Primary color
<Text c="red">         // Red
<Title c="orange.6">   // Orange shade 6

// Button colors
<Button color="red">
<Button color="green">
<Button color="blue">
<Button color="cyan">     // Primary (default)
<Button color="grape">
<Button color="orange">
```

### Available Colors
- `blue`, `red`, `green`, `cyan` (primary)
- `grape`, `orange`, `yellow`, `teal`
- `indigo`, `violet`, `pink`, `lime`

---

## Responsive Design

### Breakpoint Values
```tsx
<SimpleGrid
  cols={{ base: 1, sm: 2, md: 3, lg: 4 }}
  spacing={{ base: 'sm', lg: 'xl' }}
>
```

| Name | Size | Device |
|------|------|--------|
| `base` | 0px | Mobile (default) |
| `xs` | 36em (576px) | Small mobile |
| `sm` | 48em (768px) | Tablet |
| `md` | 62em (992px) | Desktop |
| `lg` | 75em (1200px) | Large desktop |
| `xl` | 88em (1408px) | XL desktop |

---

## Quick Migration Checklist

When migrating a file:

1. **Find & Replace**
   - Search: `from 'lucide-react'`
   - Replace with Tabler imports

2. **Replace Common Classes**
   - `className="flex"` → `<Group>`
   - `className="grid"` → `<SimpleGrid>`
   - `className="bg-white"` → `<Paper>`
   - `className="text-"` → `<Text>` or `<Title>`

3. **Update Components**
   - `<input>` → `<TextInput>`
   - `<button>` → `<Button>`
   - `<select>` → `<Select>`
   - `<a>` → `<Anchor component={Link}>`

4. **Test**
   - Page loads ✓
   - Buttons work ✓
   - Forms submit ✓
   - Responsive ✓

---

## Common Issues & Solutions

### Issue: Button not full width
```tsx
// Solution
<Button fullWidth>Click</Button>
```

### Issue: Need space between elements
```tsx
// Solution: Use Stack or Group
<Stack gap="md">
  <Component1 />
  <Component2 />
</Stack>
```

### Issue: Icon too big/small
```tsx
// Solution: Adjust size prop
<IconPlus size={16} />  // Small (buttons)
<IconBook size={24} />  // Medium (cards)
<IconUser size={48} />  // Large (empty states)
```

### Issue: Custom color needed
```tsx
// Solution: Use style prop
style={{ color: '#0ea5e9' }}
style={{ backgroundColor: '#f0f9ff' }}
```

### Issue: Loading not centered
```tsx
// Solution: Use Center
<Center h="100vh">
  <Loader size="lg" />
</Center>
```

---

## Keyboard Shortcuts (VS Code)

- **Find & Replace**: `Cmd/Ctrl + H`
- **Find in Files**: `Cmd/Ctrl + Shift + F`
- **Multi-cursor**: `Cmd/Ctrl + D`
- **Format Document**: `Shift + Alt + F`

---

## Need Help?

1. Check migration examples:
   - `/app/auth/login/page.tsx`
   - `/app/dashboard/teacher/page.tsx`
   - `/app/dashboard/student/page.tsx`

2. Read full documentation:
   - `/MANTINE_MIGRATION_COMPLETE_SUMMARY.md`
   - `/MANTINE_MIGRATION_STATUS.md`

3. Official Mantine docs:
   - https://mantine.dev/core/button/
   - https://mantine.dev/core/text-input/
   - https://mantine.dev/core/paper/

---

**Last Updated**: November 5, 2024
**Pages Migrated**: 6/50+ (12%)
**Status**: In Progress
