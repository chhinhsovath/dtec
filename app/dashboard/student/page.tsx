'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth/client-auth';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  Container,
  Title,
  Text,
  Button,
  Stack,
  SimpleGrid,
  Center,
  Loader,
  Alert,
  Box,
  Paper,
  Group,
} from '@mantine/core';
import {
  IconBook,
  IconCalendar,
  IconFileText,
  IconChartBar,
} from '@tabler/icons-react';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
}

interface StudentData {
  profile: Profile;
  gpa: number;
  coursesCount: number;
  attendanceRate: number;
}

export default function StudentDashboard() {
  const { t, isLoaded } = useTranslation();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadProfile = async () => {
      const session = getSession();

      if (!session) {
        router.push('/auth/login');
        return;
      }

      if (session.role !== 'student') {
        router.push(`/dashboard/${session.role}`);
        return;
      }

      try {
        const response = await fetch(`/api/students/profile?email=${session.email}`);
        if (response.ok) {
          const data = await response.json();
          setStudentData(data);
        } else {
          setStudentData({
            profile: session,
            gpa: 3.75,
            coursesCount: 2,
            attendanceRate: 94,
          });
        }
      } catch (error) {
        console.log('Error fetching student data:', error);
        setStudentData({
          profile: session,
          gpa: 3.75,
          coursesCount: 2,
          attendanceRate: 94,
        });
      }
      setLoading(false);
    };

    loadProfile();
  }, [router]);

  if (loading || !isLoaded) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  if (!studentData) {
    return (
      <Center h="100vh">
        <Alert color="red" title="Error">
          {t('messages.error')}
        </Alert>
      </Center>
    );
  }

  return (
    <Box style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', paddingTop: '24px' }}>
      {/* Main Content */}
      <Container size="xl">
        <Stack gap="xl">
          {/* Page Title */}
          <Title order={2}>{t('dashboard.student.title')}</Title>
          {/* Quick Stats */}
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
            <StatCard
              icon={<IconBook size={32} />}
              title={t('dashboard.student.enrolledCourses')}
              value={studentData.coursesCount.toString()}
              color="blue"
            />
            <StatCard
              icon={<IconFileText size={32} />}
              title={t('dashboard.student.assignments')}
              value="0"
              color="green"
            />
            <StatCard
              icon={<IconCalendar size={32} />}
              title={t('dashboard.student.attendance')}
              value={`${studentData.attendanceRate}%`}
              color="grape"
            />
            <StatCard
              icon={<IconChartBar size={32} />}
              title={t('dashboard.student.gpa')}
              value={studentData.gpa.toFixed(2)}
              color="orange"
            />
          </SimpleGrid>

          {/* Main Sections */}
          <SimpleGrid cols={{ base: 1, lg: 2 }}>
            {/* My Courses */}
            <Paper shadow="sm" p="xl" radius="md">
              <Title order={3} mb="md">{t('dashboard.student.myCourses')}</Title>
              {studentData.coursesCount > 0 ? (
                <Stack gap="md">
                  <Text c="dimmed">
                    {t('dashboard.student.enrolledCount')}: {studentData.coursesCount}
                  </Text>
                  <Button
                    onClick={() => router.push('/academics')}
                  >
                    {t('dashboard.student.viewRecords')}
                  </Button>
                </Stack>
              ) : (
                <Stack align="center" py="xl">
                  <IconBook size={48} color="gray" />
                  <Text c="dimmed">{t('dashboard.student.noCoursesEnrolled')}</Text>
                  <Button
                    onClick={() => router.push('/academics')}
                  >
                    {t('dashboard.student.viewAvailableCourses')}
                  </Button>
                </Stack>
              )}
            </Paper>

            {/* Recent Assignments */}
            <Paper shadow="sm" p="xl" radius="md">
              <Title order={3} mb="md">{t('dashboard.student.recentAssignments')}</Title>
              <Stack align="center" py="xl">
                <IconFileText size={48} color="gray" />
                <Text c="dimmed">{t('dashboard.student.noAssignments')}</Text>
              </Stack>
            </Paper>

            {/* Upcoming Schedule */}
            <Paper shadow="sm" p="xl" radius="md">
              <Title order={3} mb="md">{t('dashboard.student.upcomingSchedule')}</Title>
              <Stack align="center" py="xl">
                <IconCalendar size={48} color="gray" />
                <Text c="dimmed">{t('dashboard.student.noScheduledClasses')}</Text>
              </Stack>
            </Paper>

            {/* Performance Overview */}
            <Paper shadow="sm" p="xl" radius="md">
              <Title order={3} mb="md">{t('dashboard.student.performanceOverview')}</Title>
              <Stack gap="md">
                <Paper p="md" radius="md" style={{ backgroundColor: 'var(--mantine-color-orange-0)' }}>
                  <Text size="sm" c="dimmed" fw={500}>
                    {t('dashboard.student.currentGPA')}
                  </Text>
                  <Title order={2} c="orange.6" mt="xs">
                    {studentData.gpa.toFixed(2)}
                  </Title>
                </Paper>
                <Paper p="md" radius="md" style={{ backgroundColor: 'var(--mantine-color-grape-0)' }}>
                  <Text size="sm" c="dimmed" fw={500}>
                    {t('dashboard.student.attendanceRate')}
                  </Text>
                  <Title order={2} c="grape.6" mt="xs">
                    {studentData.attendanceRate}%
                  </Title>
                </Paper>
              </Stack>
            </Paper>
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
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
    <Paper shadow="sm" p="lg" radius="md" style={{ backgroundColor: `var(--mantine-color-${color}-0)` }}>
      <Group justify="space-between">
        <Stack gap="xs">
          <Text size="sm" c="dimmed" fw={500}>{title}</Text>
          <Title order={2}>{value}</Title>
        </Stack>
        <Box style={{ color: `var(--mantine-color-${color}-6)` }}>
          {icon}
        </Box>
      </Group>
    </Paper>
  );
}
