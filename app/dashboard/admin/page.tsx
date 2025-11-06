'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth/client-auth';
import {
  IconUsers,
  IconBook,
  IconBuilding,
  IconChartBar,
} from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  Container,
  Title,
  Group,
  Button,
  Stack,
  Text,
  Grid,
  Center,
  Loader,
  Card,
  Paper,
} from '@mantine/core';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
}

interface Stats {
  users: {
    total: number;
    students: number;
    teachers: number;
    admins: number;
  };
  courses: {
    total: number;
    active: number;
  };
  enrollments: {
    total: number;
    active: number;
  };
  recentActivity: any[];
}

export default function AdminDashboard() {
  const { t, language, changeLanguage, isLoaded } = useTranslation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadProfile = async () => {
      const session = getSession();

      if (!session) {
        router.push('/auth/login');
        return;
      }

      if (session.role !== 'admin') {
        router.push(`/dashboard/${session.role}`);
        return;
      }

      setProfile(session);
      loadStats();
    };

    const loadStats = async () => {
      try {
        const response = await fetch('/api/admin/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  if (loading || !isLoaded) {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text size="xl">{t('common.loading')}</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack gap={0} style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', paddingTop: '24px' }}>
      {/* Main Content */}
      <Container size="xl" py="xl">
        <Title order={2} mb="xl">{t('dashboard.admin.title')}</Title>
        {/* Quick Stats */}
        <Grid mb="xl">
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={<IconUsers size={32} stroke={1.5} />}
              title={t('dashboard.admin.totalUsers')}
              value={stats?.users.total.toString() || '0'}
              color="blue"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={<IconBook size={32} stroke={1.5} />}
              title={t('dashboard.admin.totalCourses')}
              value={stats?.courses.total.toString() || '0'}
              color="green"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={<IconBuilding size={32} stroke={1.5} />}
              title={t('dashboard.admin.totalSchools')}
              value="1"
              color="violet"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={<IconChartBar size={32} stroke={1.5} />}
              title={t('dashboard.admin.activeUsers')}
              value={stats?.enrollments.active.toString() || '0'}
              color="orange"
            />
          </Grid.Col>
        </Grid>

        {/* Action Buttons */}
        <Grid mb="xl">
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Button
              onClick={() => router.push('/dashboard/admin/users')}
              color="blue"
              variant="filled"
              fullWidth
              size="lg"
              fw={600}
            >
              {t('dashboard.admin.userManagement')}
            </Button>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Button
              onClick={() => router.push('/dashboard/admin/courses')}
              color="green"
              variant="filled"
              fullWidth
              size="lg"
              fw={600}
            >
              {t('dashboard.admin.schoolManagement')}
            </Button>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Button
              onClick={() => router.push('/students')}
              color="violet"
              variant="filled"
              fullWidth
              size="lg"
              fw={600}
            >
              {t('navigation.students')}
            </Button>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Button
              onClick={() => router.push('/dashboard/admin/users')}
              color="orange"
              variant="filled"
              fullWidth
              size="lg"
              fw={600}
            >
              {t('navigation.teachers')}
            </Button>
          </Grid.Col>
        </Grid>

        {/* Main Sections */}
        <Grid>
          {/* User Management */}
          <Grid.Col span={{ base: 12, lg: 6 }}>
            <Card shadow="md" p="lg" radius="md">
              <Group justify="space-between" mb="md">
                <Title order={2} size="h3">{t('dashboard.admin.userManagement')}</Title>
                <IconUsers size={24} color="var(--mantine-color-gray-6)" />
              </Group>
              <Stack gap="sm">
                <Paper bg="gray.0" p="sm" radius="md">
                  <Group justify="space-between">
                    <Text c="gray.7">{t('navigation.students')}</Text>
                    <Text fw={700}>{stats?.users.students || 0}</Text>
                  </Group>
                </Paper>
                <Paper bg="gray.0" p="sm" radius="md">
                  <Group justify="space-between">
                    <Text c="gray.7">{t('navigation.teachers')}</Text>
                    <Text fw={700}>{stats?.users.teachers || 0}</Text>
                  </Group>
                </Paper>
                <Paper bg="gray.0" p="sm" radius="md">
                  <Group justify="space-between">
                    <Text c="gray.7">{t('navigation.admin')}</Text>
                    <Text fw={700}>{stats?.users.admins || 0}</Text>
                  </Group>
                </Paper>
              </Stack>
              <Button
                onClick={() => router.push('/dashboard/admin/users')}
                color="blue"
                variant="filled"
                fullWidth
                mt="md"
              >
                {t('common.view')} {t('navigation.users').toLowerCase()}
              </Button>
            </Card>
          </Grid.Col>

          {/* Institution Management */}
          <Grid.Col span={{ base: 12, lg: 6 }}>
            <Card shadow="md" p="lg" radius="md">
              <Group justify="space-between" mb="md">
                <Title order={2} size="h3">{t('dashboard.admin.schoolManagement')}</Title>
                <IconBuilding size={24} color="var(--mantine-color-gray-6)" />
              </Group>
              <Center py="xl">
                <Stack align="center" gap="sm">
                  <IconBuilding size={48} color="var(--mantine-color-gray-6)" stroke={1.5} />
                  <Text c="gray.6">{t('dashboard.admin.systemOverview')}</Text>
                  <Text size="sm" c="gray.6" mt="xs">{t('dashboard.admin.schoolManagement')}</Text>
                </Stack>
              </Center>
            </Card>
          </Grid.Col>

          {/* Course Overview */}
          <Grid.Col span={{ base: 12, lg: 6 }}>
            <Card shadow="md" p="lg" radius="md">
              <Group justify="space-between" mb="md">
                <Title order={2} size="h3">{t('dashboard.admin.systemReports')}</Title>
                <IconBook size={24} color="var(--mantine-color-gray-6)" />
              </Group>
              <Stack py="md">
                <Group justify="space-between" mb="sm">
                  <Text c="gray.7">{t('dashboard.admin.totalCourses')}</Text>
                  <Text fw={700}>{stats?.courses.total || 0}</Text>
                </Group>
                <Group justify="space-between" mb="sm">
                  <Text c="gray.7">{t('common.status')}</Text>
                  <Text fw={700}>{stats?.courses.active || 0}</Text>
                </Group>
                <Button
                  onClick={() => router.push('/dashboard/admin/courses')}
                  color="blue"
                  variant="filled"
                  fullWidth
                  mt="md"
                >
                  {t('navigation.courses')}
                </Button>
              </Stack>
            </Card>
          </Grid.Col>

          {/* System Analytics */}
          <Grid.Col span={{ base: 12, lg: 6 }}>
            <Card shadow="md" p="lg" radius="md">
              <Group justify="space-between" mb="md">
                <Title order={2} size="h3">{t('dashboard.admin.systemHealth')}</Title>
                <IconChartBar size={24} color="var(--mantine-color-gray-6)" />
              </Group>
              <Center py="xl">
                <Stack align="center" gap="sm">
                  <IconChartBar size={48} color="var(--mantine-color-gray-6)" stroke={1.5} />
                  <Text c="gray.6">{t('dashboard.admin.noAnalyticsData')}</Text>
                  <Button color="blue" variant="filled" mt="md">
                    {t('dashboard.admin.viewReports')}
                  </Button>
                </Stack>
              </Center>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Recent Activity */}
        <Card shadow="md" p="lg" radius="md" mt="lg">
          <Title order={2} size="h3" mb="md">{t('dashboard.admin.activityLogs')}</Title>
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <Stack gap="sm">
              {stats.recentActivity.map((activity, index) => (
                <Paper key={index} bg="gray.0" p="sm" radius="md">
                  <Group justify="space-between">
                    <Text c="gray.7">{activity.description}</Text>
                    <Text size="sm" c="gray.6">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </Text>
                  </Group>
                </Paper>
              ))}
            </Stack>
          ) : (
            <Center py="xl">
              <Text c="gray.6">{t('dashboard.admin.noAnalyticsData')}</Text>
            </Center>
          )}
        </Card>
      </Container>
    </Stack>
  );
}

function StatCard({
  icon,
  title,
  value,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  color: string;
}) {
  return (
    <Paper bg={`${color}.0`} p="lg" radius="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Text size="sm" fw={500} c="gray.7">{title}</Text>
          <Text size="xl" fw={700} mt="sm">{value}</Text>
        </div>
        <div style={{ color: `var(--mantine-color-${color}-6)` }}>
          {icon}
        </div>
      </Group>
    </Paper>
  );
}
