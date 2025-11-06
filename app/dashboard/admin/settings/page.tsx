'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth/client-auth';
import Link from 'next/link';
import {
  Container,
  Title,
  Text,
  SimpleGrid,
  Paper,
  Group,
  Stack,
  Loader,
  Alert,
  Box,
  ThemeIcon,
} from '@mantine/core';
import {
  IconBuilding,
  IconSettings,
  IconUsers,
  IconMail,
  IconLock,
  IconChartBar,
  IconArrowRight,
  IconInfoCircle,
} from '@tabler/icons-react';

const settingsSections = [
  {
    title: 'Institution Settings',
    description: 'Manage institution details, branding, and contact information',
    icon: IconBuilding,
    href: '/dashboard/admin/settings/institution',
    color: 'blue',
  },
  {
    title: 'System Settings',
    description: 'Configure system behavior, features, and performance settings',
    icon: IconSettings,
    href: '/dashboard/admin/settings/system',
    color: 'violet',
  },
  {
    title: 'User Policies',
    description: 'Set password requirements and user management policies',
    icon: IconUsers,
    href: '/dashboard/admin/settings/users',
    color: 'green',
  },
  {
    title: 'Email Configuration',
    description: 'Configure SMTP settings and email templates',
    icon: IconMail,
    href: '/dashboard/admin/settings/emails',
    color: 'orange',
  },
  {
    title: 'Security Settings',
    description: 'Manage security options, backups, and audit logs',
    icon: IconLock,
    href: '/dashboard/admin/settings/security',
    color: 'red',
  },
  {
    title: 'Grade Scales',
    description: 'Configure grading systems and letter grades',
    icon: IconChartBar,
    href: '/dashboard/admin/settings/grades',
    color: 'indigo',
  },
];

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = getSession();

        if (!session || session.role !== 'admin') {
          router.push('/auth/login');
          return;
        }

        setAuthorized(true);
        setLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/auth/login');
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Stack align="center" justify="center" mih="70vh">
          <Loader size="lg" />
          <Text c="dimmed">Loading settings...</Text>
        </Stack>
      </Container>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <Box bg="gray.0" mih="100vh">
      {/* Header */}
      <Paper shadow="xs" mb="xl" p="xl">
        <Container size="xl">
          <Stack gap="xs">
            <Title order={1}>System Settings</Title>
            <Text c="dimmed">Manage your institution's configuration and system preferences</Text>
          </Stack>
        </Container>
      </Paper>

      {/* Main Content */}
      <Container size="xl" pb="xl">
        {/* Settings Grid */}
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg" mb="xl">
          {settingsSections.map((section) => {
            const IconComponent = section.icon;
            return (
              <Paper
                key={section.href}
                component="a"
                href={section.href}
                p="xl"
                shadow="sm"
                radius="md"
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
                sx={(theme) => ({
                  backgroundColor: theme.colors[section.color][0],
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows.md,
                  },
                })}
              >
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                  <Stack gap="md" style={{ flex: 1 }}>
                    <ThemeIcon
                      size="xl"
                      radius="md"
                      variant="light"
                      color={section.color}
                    >
                      <IconComponent size={28} />
                    </ThemeIcon>
                    <div>
                      <Title order={4} mb="xs">
                        {section.title}
                      </Title>
                      <Text size="sm" c="dimmed">
                        {section.description}
                      </Text>
                    </div>
                  </Stack>
                  <ThemeIcon
                    variant="subtle"
                    color={section.color}
                    size="md"
                    sx={(theme) => ({
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateX(4px)',
                      },
                    })}
                  >
                    <IconArrowRight size={20} />
                  </ThemeIcon>
                </Group>
              </Paper>
            );
          })}
        </SimpleGrid>

        {/* Info Box */}
        <Alert
          icon={<IconInfoCircle size={20} />}
          title="Quick Tips"
          color="blue"
          variant="light"
          radius="md"
        >
          <Stack gap="xs">
            <Text size="sm">Changes to system settings take effect immediately</Text>
            <Text size="sm">All setting changes are logged in the audit trail</Text>
            <Text size="sm">You can export and backup your settings at any time</Text>
            <Text size="sm">Contact support if you need help with any settings</Text>
          </Stack>
        </Alert>
      </Container>
    </Box>
  );
}
