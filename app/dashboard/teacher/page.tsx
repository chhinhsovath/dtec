'use client';

import React, { useEffect, useState } from 'react';
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
  Paper,
  Group
} from '@mantine/core';
import {
  IconBook,
  IconUsers,
  IconFileText,
  IconCalendar,
} from '@tabler/icons-react';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
}

export default function TeacherDashboard() {
  const { t, language, changeLanguage, isLoaded } = useTranslation();
  console.log('t:', t, 'isLoaded:', isLoaded);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadProfile = async () => {
      const session = getSession();

      if (!session) {
        router.push('/auth/login');
        return;
      }

      if (session.role !== 'teacher') {
        router.push(`/dashboard/${session.role}`);
        return;
      }

      setProfile(session);
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', paddingTop: '24px' }}>
      {/* Main Content */}
      <Container size="xl">
        <Stack gap="xl">
          {/* Page Title */}
          <Title order={2}>{t('dashboard.teacher.title')}</Title>
          {/* Quick Stats */}
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
            <StatCard
              icon={<IconBook size={32} />}
              title={t('dashboard.teacher.myCourses')}
              value="0"
              color="blue"
            />
            <StatCard
              icon={<IconUsers size={32} />}
              title={t('dashboard.teacher.totalStudents')}
              value="0"
              color="green"
            />
            <StatCard
              icon={<IconFileText size={32} />}
              title={t('dashboard.teacher.pendingGrading')}
              value="0"
              color="grape"
            />
            <StatCard
              icon={<IconCalendar size={32} />}
              title={t('dashboard.teacher.todaysClasses')}
              value="0"
              color="orange"
            />
          </SimpleGrid>

          {/* Action Buttons */}
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
            <Button
              size="lg"
              onClick={() => router.push('/dashboard/teacher/courses')}
            >
              {t('dashboard.teacher.myCourses')}
            </Button>
            <Button
              size="lg"
              color="cyan"
              onClick={() => router.push('/dashboard/teacher/announcements')}
            >
              {t('dashboard.teacher.announcements')}
            </Button>
            <Button
              size="lg"
              color="teal"
              onClick={() => router.push('/dashboard/teacher/materials')}
            >
              {t('dashboard.teacher.courseMaterials')}
            </Button>
            <Button
              size="lg"
              color="grape"
              onClick={() => router.push('/dashboard/teacher/assessments')}
            >
              {t('dashboard.teacher.assessments')}
            </Button>
            <Button
              size="lg"
              color="orange"
              onClick={() => router.push('/dashboard/teacher/submissions')}
            >
              {t('dashboard.teacher.submissions')}
            </Button>
            <Button
              size="lg"
              color="red"
              onClick={() => router.push('/dashboard/teacher/grades')}
            >
              {t('dashboard.teacher.grades')}
            </Button>
            <Button
              size="lg"
              color="green"
              onClick={() => router.push('/dashboard/teacher/students')}
            >
              {t('dashboard.teacher.viewAllStudents')}
            </Button>
            <Button
              size="lg"
              color="violet"
              onClick={() => router.push('/dashboard/teacher/profile')}
            >
              {t('dashboard.teacher.myProfile')}
            </Button>
          </SimpleGrid>

          {/* Main Sections */}
          <SimpleGrid cols={{ base: 1, lg: 2 }}>
            {/* My Courses */}
            <Paper shadow="sm" p="xl" radius="md">
              <Title order={3} mb="md">{t('dashboard.teacher.myCourses')}</Title>
              <Stack align="center" py="xl">
                <IconBook size={48} color="gray" />
                <Text c="dimmed">{t('dashboard.teacher.noCourses')}</Text>
                <Button
                  onClick={() => router.push('/dashboard/teacher/courses')}
                >
                  {t('dashboard.teacher.createFirstCourse')}
                </Button>
              </Stack>
            </Paper>

            {/* Recent Submissions */}
            <Paper shadow="sm" p="xl" radius="md">
              <Title order={3} mb="md">{t('dashboard.teacher.recentSubmissions')}</Title>
              <Stack align="center" py="xl">
                <IconFileText size={48} color="gray" />
                <Text c="dimmed">{t('dashboard.teacher.noSubmissionsToGrade')}</Text>
              </Stack>
            </Paper>

            {/* Today's Schedule */}
            <Paper shadow="sm" p="xl" radius="md">
              <Title order={3} mb="md">{t('dashboard.teacher.todaysSchedule')}</Title>
              <Stack align="center" py="xl">
                <IconCalendar size={48} color="gray" />
                <Text c="dimmed">{t('dashboard.teacher.noScheduledClasses')}</Text>
              </Stack>
            </Paper>

            {/* Student Performance */}
            <Paper shadow="sm" p="xl" radius="md">
              <Title order={3} mb="md">{t('dashboard.teacher.studentPerformance')}</Title>
              <Stack align="center" py="xl">
                <IconUsers size={48} color="gray" />
                <Text c="dimmed">{t('dashboard.teacher.noPerformanceData')}</Text>
              </Stack>
            </Paper>
          </SimpleGrid>
        </Stack>
      </Container>
    </div>
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
        <div style={{ color: `var(--mantine-color-${color}-6)` }}>
          {icon}
        </div>
      </Group>
    </Paper>
  );
}
