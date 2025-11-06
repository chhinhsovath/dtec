'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Title,
  Text,
  Card,
  Badge,
  Loader,
  Center,
  Stack,
  Group,
  Alert,
  Button,
  SimpleGrid,
  ThemeIcon,
  Progress,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconAlertCircle,
  IconUsers,
  IconBookmarks,
  IconFileCheck,
  IconTrendingUp,
  IconAward,
  IconClock,
  IconChartBar,
  IconSettings,
} from '@tabler/icons-react';
import { getSession } from '@/lib/auth/client-auth';

interface CoordinatorStats {
  totalStudents: number;
  activeStudents: number;
  completedCertifications: number;
  pendingCertifications: number;
  averageCompletionRate: number;
  totalMentors: number;
  activeMentorships: number;
  programPhase: string;
}

export default function CoordinatorDashboard() {
  const [stats, setStats] = useState<CoordinatorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        const session = getSession();

        if (!session) {
          router.push('/auth/login');
          return;
        }

        if (session.role !== 'admin') {
          router.push(`/dashboard/${session.role}`);
          return;
        }

        // Mock data for now - in production this would come from the API
        setStats({
          totalStudents: 48,
          activeStudents: 42,
          completedCertifications: 6,
          pendingCertifications: 12,
          averageCompletionRate: 68,
          totalMentors: 12,
          activeMentorships: 42,
          programPhase: 'Phase 3: Teaching Practice',
        });

        setLoading(false);
      } catch (err) {
        console.error('Error loading dashboard:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  if (loading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  if (error) {
    return (
      <Container size="lg" py="xl">
        <Alert icon={<IconAlertCircle />} color="red" title="Error">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      {/* Header */}
      <Group mb="xl">
        <Button
          variant="default"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => router.back()}
        >
          Back
        </Button>
        <div style={{ flex: 1 }}>
          <Title order={1}>Coordinator Dashboard / ផ្ទាំងគ្រប់គ្រង</Title>
          <Text c="dimmed">Program oversight and student certification management</Text>
        </div>
      </Group>

      {/* Program Status Alert */}
      {stats && (
        <Alert color="blue" title={`Current Program Phase: ${stats.programPhase}`} mb="xl">
          You are managing the Contract Teacher Training Program. Monitor student progress, manage mentor assignments,
          and issue certificates to graduating students.
        </Alert>
      )}

      {/* Key Statistics */}
      {stats && (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg" mb="xl">
          {/* Total Students */}
          <Card withBorder p="lg" radius="md">
            <Group justify="space-between" mb="lg">
              <Stack gap={0}>
                <Text fw={500} size="sm" c="dimmed">
                  Total Students / សិស្សសរុប
                </Text>
                <Title order={2}>{stats.totalStudents}</Title>
              </Stack>
              <ThemeIcon variant="light" size={50} radius="md" color="blue">
                <IconUsers size={28} />
              </ThemeIcon>
            </Group>
            <Group gap="xs">
              <Badge color="green" variant="light">
                {stats.activeStudents} Active
              </Badge>
              <Badge color="yellow" variant="light">
                {stats.totalStudents - stats.activeStudents} Inactive
              </Badge>
            </Group>
          </Card>

          {/* Certifications */}
          <Card withBorder p="lg" radius="md">
            <Group justify="space-between" mb="lg">
              <Stack gap={0}>
                <Text fw={500} size="sm" c="dimmed">
                  Certifications / សង្សយម
                </Text>
                <Title order={2}>{stats.completedCertifications}</Title>
              </Stack>
              <ThemeIcon variant="light" size={50} radius="md" color="teal">
                <IconAward size={28} />
              </ThemeIcon>
            </Group>
            <Group gap="xs">
              <Badge color="teal" variant="light">
                {stats.completedCertifications} Issued
              </Badge>
              <Badge color="yellow" variant="light">
                {stats.pendingCertifications} Pending
              </Badge>
            </Group>
          </Card>

          {/* Completion Rate */}
          <Card withBorder p="lg" radius="md">
            <Group justify="space-between" mb="lg">
              <Stack gap={0}>
                <Text fw={500} size="sm" c="dimmed">
                  Avg. Completion / ជាមធ្យម
                </Text>
                <Title order={2}>{stats.averageCompletionRate}%</Title>
              </Stack>
              <ThemeIcon variant="light" size={50} radius="md" color="violet">
                <IconTrendingUp size={28} />
              </ThemeIcon>
            </Group>
            <Progress
              value={stats.averageCompletionRate}
              color={stats.averageCompletionRate >= 70 ? 'teal' : 'yellow'}
              size="md"
            />
          </Card>

          {/* Mentorships */}
          <Card withBorder p="lg" radius="md">
            <Group justify="space-between" mb="lg">
              <Stack gap={0}>
                <Text fw={500} size="sm" c="dimmed">
                  Mentors / គ្រូលម្អិត
                </Text>
                <Title order={2}>{stats.totalMentors}</Title>
              </Stack>
              <ThemeIcon variant="light" size={50} radius="md" color="orange">
                <IconUsers size={28} />
              </ThemeIcon>
            </Group>
            <Text size="sm" c="dimmed">
              {stats.activeMentorships} active mentorships
            </Text>
          </Card>
        </SimpleGrid>
      )}

      {/* Quick Actions */}
      <Card withBorder p="lg" radius="md" mb="xl">
        <Title order={3} mb="lg">
          Quick Actions / ឧបាយដ៏រហ័ស
        </Title>

        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          <Button
            variant="light"
            fullWidth
            leftSection={<IconUsers size={16} />}
            onClick={() => router.push('/dashboard/coordinator/students')}
          >
            View Students / មើលសិស្ស
          </Button>

          <Button
            variant="light"
            fullWidth
            leftSection={<IconUsers size={16} />}
            onClick={() => router.push('/dashboard/coordinator/mentors')}
          >
            Manage Mentors / គ្រូលម្អិត
          </Button>

          <Button
            variant="light"
            fullWidth
            leftSection={<IconFileCheck size={16} />}
            onClick={() => router.push('/dashboard/coordinator/certification-issuance')}
          >
            Issue Certificates / ឯកសារ
          </Button>

          <Button
            variant="light"
            fullWidth
            leftSection={<IconChartBar size={16} />}
            onClick={() => router.push('/dashboard/coordinator/reports')}
          >
            View Reports / របាយការណ៍
          </Button>

          <Button
            variant="light"
            fullWidth
            leftSection={<IconBookmarks size={16} />}
            onClick={() => router.push('/dashboard/coordinator/competencies')}
          >
            Competencies / សមត្ថភាព
          </Button>

          <Button
            variant="light"
            fullWidth
            leftSection={<IconSettings size={16} />}
            onClick={() => router.push('/dashboard/coordinator/settings')}
          >
            Program Settings / ការកំណត់
          </Button>
        </SimpleGrid>
      </Card>

      {/* Program Information */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        {/* Coordinator Responsibilities */}
        <Card withBorder p="lg" radius="md">
          <Title order={3} mb="lg">
            Your Responsibilities / ទីកន្លែងកិច្ចការ
          </Title>

          <Stack gap="md">
            <div>
              <Group gap="xs" mb="xs">
                <Badge size="lg" variant="dot" color="blue">
                  Student Management
                </Badge>
              </Group>
              <Text size="sm" c="dimmed">
                Monitor student progress, track competency assessments, and manage admissions
              </Text>
            </div>

            <div>
              <Group gap="xs" mb="xs">
                <Badge size="lg" variant="dot" color="violet">
                  Mentor Assignment
                </Badge>
              </Group>
              <Text size="sm" c="dimmed">
                Assign and manage mentor-student relationships throughout the program
              </Text>
            </div>

            <div>
              <Group gap="xs" mb="xs">
                <Badge size="lg" variant="dot" color="teal">
                  Certification Issuance
                </Badge>
              </Group>
              <Text size="sm" c="dimmed">
                Review completed requirements and issue teaching certificates to graduates
              </Text>
            </div>

            <div>
              <Group gap="xs" mb="xs">
                <Badge size="lg" variant="dot" color="orange">
                  Program Reporting
                </Badge>
              </Group>
              <Text size="sm" c="dimmed">
                Generate reports on program metrics, completion rates, and student success
              </Text>
            </div>
          </Stack>
        </Card>

        {/* Program Overview */}
        <Card withBorder p="lg" radius="md">
          <Title order={3} mb="lg">
            Program Overview / ទិដ្ឋភាពសរុប
          </Title>

          <Stack gap="md">
            <div>
              <Group justify="space-between" mb="xs">
                <Text fw={500}>Program Name</Text>
                <Badge color="blue" variant="light">
                  Contract Teacher Training
                </Badge>
              </Group>
              <Text size="sm" c="dimmed">
                6-month graduate teacher certification program
              </Text>
            </div>

            <div>
              <Group justify="space-between" mb="xs">
                <Text fw={500}>Program Duration</Text>
                <Text fw={700}>6 Months</Text>
              </Group>
              <Text size="sm" c="dimmed">
                From initial training through final certification
              </Text>
            </div>

            <div>
              <Group justify="space-between" mb="xs">
                <Text fw={500}>Core Competencies</Text>
                <Badge color="violet" variant="light">
                  10 Total
                </Badge>
              </Group>
              <Text size="sm" c="dimmed">
                Self-Awareness, Subject Matter, Curriculum Design, Teaching Strategies, Classroom Management,
                Assessment, Differentiation, Communication, Ethics, Technology
              </Text>
            </div>

            <div>
              <Group justify="space-between" mb="xs">
                <Text fw={500}>Teaching Practice Requirement</Text>
                <Badge color="orange" variant="light">
                  120+ Hours
                </Badge>
              </Group>
              <Text size="sm" c="dimmed">
                Supervised teaching in partner schools
              </Text>
            </div>
          </Stack>
        </Card>
      </SimpleGrid>
    </Container>
  );
}
