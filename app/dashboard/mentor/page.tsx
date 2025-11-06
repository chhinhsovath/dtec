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
  ThemeIcon,
  Alert,
  SimpleGrid,
  Button,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconAlertCircle,
  IconUsers,
  IconClipboardCheck,
  IconBriefcase,
  IconMessageCircle,
} from '@tabler/icons-react';
import { getSession } from '@/lib/auth/client-auth';

interface MentorStats {
  totalMentees: number;
  activeSessions: number;
  pendingAssessments: number;
  portfoliosReviewing: number;
}

export default function MentorDashboardPage() {
  const [stats, setStats] = useState<MentorStats | null>(null);
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

        // For mentor, check if role is "teacher" (since mentors are teachers in the system)
        // In a complete system, this would check for "mentor" role
        if (session.role !== 'teacher' && session.role !== 'admin') {
          router.push(`/dashboard/${session.role}`);
          return;
        }

        // Fetch mentor statistics from API
        const res = await fetch('/api/mentor/dashboard');
        if (!res.ok) {
          throw new Error('Failed to fetch mentor dashboard data');
        }

        const result = await res.json();

        // Use mock data for now
        setStats({
          totalMentees: 8,
          activeSessions: 3,
          pendingAssessments: 5,
          portfoliosReviewing: 4,
        });

        setLoading(false);
      } catch (err) {
        console.error('Error loading dashboard:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
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
          <Title order={1}>Mentor Dashboard / ផ្ទាំងគ្រប់គ្រងគ្រូលម្អិត</Title>
          <Text c="dimmed">Manage your mentees and track their progress</Text>
        </div>
      </Group>

      {/* Summary Cards */}
      {stats && (
        <SimpleGrid cols={{ base: 1, md: 2, lg: 4 }} spacing="lg" mb="xl">
          <Card withBorder p="lg" radius="md">
            <Group justify="space-between" mb="lg">
              <Stack gap={0}>
                <Text fw={500} c="dimmed" size="sm">
                  Total Mentees / សិស្សម៉ាក់សរុប
                </Text>
                <Title order={2}>{stats.totalMentees}</Title>
              </Stack>
              <ThemeIcon variant="light" size={50} radius="md" color="blue">
                <IconUsers size={28} />
              </ThemeIcon>
            </Group>
            <Text size="xs" c="dimmed">
              Assigned graduate students
            </Text>
          </Card>

          <Card withBorder p="lg" radius="md">
            <Group justify="space-between" mb="lg">
              <Stack gap={0}>
                <Text fw={500} c="dimmed" size="sm">
                  Active Sessions / វគ្គសកម្មក្រុង
                </Text>
                <Title order={2}>{stats.activeSessions}</Title>
              </Stack>
              <ThemeIcon variant="light" size={50} radius="md" color="cyan">
                <IconMessageCircle size={28} />
              </ThemeIcon>
            </Group>
            <Text size="xs" c="dimmed">
              Upcoming mentorship sessions
            </Text>
          </Card>

          <Card withBorder p="lg" radius="md">
            <Group justify="space-between" mb="lg">
              <Stack gap={0}>
                <Text fw={500} c="dimmed" size="sm">
                  Pending Assessments / ការវាយតម្លៃរង្វង់
                </Text>
                <Title order={2}>{stats.pendingAssessments}</Title>
              </Stack>
              <ThemeIcon variant="light" size={50} radius="md" color="yellow">
                <IconClipboardCheck size={28} />
              </ThemeIcon>
            </Group>
            <Text size="xs" c="dimmed">
              Competency assessments to complete
            </Text>
          </Card>

          <Card withBorder p="lg" radius="md">
            <Group justify="space-between" mb="lg">
              <Stack gap={0}>
                <Text fw={500} c="dimmed" size="sm">
                  Portfolios Reviewing / សាលក្រម
                </Text>
                <Title order={2}>{stats.portfoliosReviewing}</Title>
              </Stack>
              <ThemeIcon variant="light" size={50} radius="md" color="teal">
                <IconBriefcase size={28} />
              </ThemeIcon>
            </Group>
            <Text size="xs" c="dimmed">
              Student portfolios awaiting feedback
            </Text>
          </Card>
        </SimpleGrid>
      )}

      {/* Quick Actions */}
      <Card withBorder p="lg" radius="md" mb="xl">
        <Title order={3} mb="lg">
          Quick Actions / សកម្មភាពលឿន
        </Title>
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
          <Card
            p="md"
            bg="gray.0"
            style={{ cursor: 'pointer' }}
            onClick={() => router.push('/dashboard/mentor/competency-assessment')}
          >
            <Group mb="sm">
              <IconClipboardCheck size={24} color="#0ea5e9" />
              <Title order={5}>Assess Competencies</Title>
            </Group>
            <Text size="sm" c="dimmed">
              Evaluate mentee competency levels
            </Text>
          </Card>

          <Card
            p="md"
            bg="gray.0"
            style={{ cursor: 'pointer' }}
            onClick={() => router.push('/dashboard/mentor/portfolio-review')}
          >
            <Group mb="sm">
              <IconBriefcase size={24} color="#15aabf" />
              <Title order={5}>Review Portfolios</Title>
            </Group>
            <Text size="sm" c="dimmed">
              Provide feedback on evidence
            </Text>
          </Card>

          <Card
            p="md"
            bg="gray.0"
            style={{ cursor: 'pointer' }}
            onClick={() => router.push('/dashboard/mentor/mentorship-sessions')}
          >
            <Group mb="sm">
              <IconMessageCircle size={24} color="#37b24d" />
              <Title order={5}>Schedule Sessions</Title>
            </Group>
            <Text size="sm" c="dimmed">
              Plan mentorship sessions with mentees
            </Text>
          </Card>
        </SimpleGrid>
      </Card>

      {/* Recent Activity */}
      <Card withBorder p="lg" radius="md">
        <Title order={3} mb="lg">
          Pedagogy LMS Features / លក្ខណៈពិសេស
        </Title>
        <Stack gap="md">
          <div>
            <Group justify="space-between" mb="xs">
              <Text fw={500}>Competency Assessment System</Text>
              <Badge color="teal">Active</Badge>
            </Group>
            <Text size="sm" c="dimmed">
              Track and assess 10 core teaching competencies with proficiency levels 1-5
            </Text>
          </div>

          <div>
            <Group justify="space-between" mb="xs">
              <Text fw={500}>Portfolio Management</Text>
              <Badge color="teal">Active</Badge>
            </Group>
            <Text size="sm" c="dimmed">
              Review student evidence collections and provide detailed feedback
            </Text>
          </div>

          <div>
            <Group justify="space-between" mb="xs">
              <Text fw={500}>Mentorship Session Tracking</Text>
              <Badge color="teal">Active</Badge>
            </Group>
            <Text size="sm" c="dimmed">
              Schedule sessions, document feedback, and track progress toward 10+ sessions
            </Text>
          </div>

          <div>
            <Group justify="space-between" mb="xs">
              <Text fw={500}>Bilingual Support</Text>
              <Badge color="teal">Active</Badge>
            </Group>
            <Text size="sm" c="dimmed">
              Full Khmer and English support throughout the platform
            </Text>
          </div>
        </Stack>
      </Card>
    </Container>
  );
}
