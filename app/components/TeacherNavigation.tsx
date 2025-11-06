'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Group,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
  Badge,
  Divider,
  Tooltip,
} from '@mantine/core';
import {
  IconBook,
  IconFileText,
  IconUsers,
  IconHome,
  IconBell,
  IconUpload,
  IconChecklist,
  IconClipboardList,
  IconStar,
} from '@tabler/icons-react';

interface NavLink {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
  color?: string;
}

export function TeacherNavigation() {
  const pathname = usePathname();

  const mainLinks: NavLink[] = [
    { label: 'Dashboard', icon: <IconHome size={16} />, href: '/dashboard/teacher' },
    { label: 'Courses', icon: <IconBook size={16} />, href: '/dashboard/teacher/courses', color: 'blue' },
  ];

  const contentLinks: NavLink[] = [
    { label: 'Announcements', icon: <IconBell size={16} />, href: '/dashboard/teacher/announcements', color: 'cyan' },
    { label: 'Course Materials', icon: <IconUpload size={16} />, href: '/dashboard/teacher/materials', color: 'teal' },
    { label: 'Assessments', icon: <IconChecklist size={16} />, href: '/dashboard/teacher/assessments', color: 'grape' },
  ];

  const gradingLinks: NavLink[] = [
    { label: 'Submissions', icon: <IconClipboardList size={16} />, href: '/dashboard/teacher/submissions', color: 'orange' },
    { label: 'Grades', icon: <IconStar size={16} />, href: '/dashboard/teacher/grades', color: 'red' },
  ];

  const otherLinks: NavLink[] = [
    { label: 'Students', icon: <IconUsers size={16} />, href: '/dashboard/teacher/students', color: 'green' },
  ];

  const renderNavLink = (link: NavLink) => {
    const isActive = pathname === link.href || pathname.startsWith(link.href + '/');

    return (
      <Tooltip label={link.label} position="right" disabled={false} key={link.href}>
        <UnstyledButton
          component="a"
          href={link.href}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '12px 16px',
            borderRadius: '8px',
            color: isActive ? 'var(--mantine-color-cyan-6)' : 'var(--mantine-color-gray-7)',
            backgroundColor: isActive ? 'var(--mantine-color-cyan-0)' : 'transparent',
            fontSize: '14px',
            fontWeight: isActive ? 600 : 500,
            transition: 'all 0.2s ease',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            if (!isActive) {
              e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-1)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <Group gap="xs" style={{ flex: 1 }}>
            <ThemeIcon
              variant="light"
              size="lg"
              color={isActive ? link.color || 'cyan' : 'gray'}
            >
              {link.icon}
            </ThemeIcon>
            <span>{link.label}</span>
          </Group>
          {link.badge && <Badge size="sm">{link.badge}</Badge>}
        </UnstyledButton>
      </Tooltip>
    );
  };

  return (
    <nav style={{
      width: '100%',
      height: '100%',
      padding: '16px',
      backgroundColor: '#f8f9fa',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'auto'
    }}>
      <Stack gap="md" style={{ flex: 1 }}>
        {/* Main Navigation */}
        <div>
          <Text size="xs" fw={700} c="dimmed" mb="xs" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Menu
          </Text>
          <Stack gap="xs">
            {mainLinks.map(renderNavLink)}
          </Stack>
        </div>

        <Divider />

        {/* Content Management */}
        <div>
          <Text size="xs" fw={700} c="dimmed" mb="xs" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Content
          </Text>
          <Stack gap="xs">
            {contentLinks.map(renderNavLink)}
          </Stack>
        </div>

        <Divider />

        {/* Grading & Assessment */}
        <div>
          <Text size="xs" fw={700} c="dimmed" mb="xs" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Grading
          </Text>
          <Stack gap="xs">
            {gradingLinks.map(renderNavLink)}
          </Stack>
        </div>

        <Divider />

        {/* Other */}
        <div>
          <Text size="xs" fw={700} c="dimmed" mb="xs" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            More
          </Text>
          <Stack gap="xs">
            {otherLinks.map(renderNavLink)}
          </Stack>
        </div>
      </Stack>

      {/* Footer */}
      <div style={{ marginTop: 'auto' }}>
        <Divider mb="md" />
        <Group justify="center" gap="xs">
          <Text size="xs" c="dimmed">
            DGTech v1.0
          </Text>
        </Group>
      </div>
    </nav>
  );
}
