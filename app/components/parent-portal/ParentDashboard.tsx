'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  IconBook,
  IconUsers,
  IconMessage,
  IconBell,
  IconCalendar,
  IconFileText,
  IconAlertCircle,
  IconLoader,
  IconChartBar,
  IconTrendingDown,
} from '@tabler/icons-react';
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Button,
  Badge,
  Box,
  Center,
  Loader,
  Grid,
  Progress,
  RingProgress,
  ThemeIcon,
  Anchor,
} from '@mantine/core';

interface StudentSummary {
  student_id: number;
  user_name: string;
  email: string;
  relationship_type: string;
  is_primary: boolean;
  summary: {
    overall_gpa: string | null;
    attendance_percentage: number | null;
    pending_assignments: number;
    overdue_assignments: number;
    behavior_score: number | null;
    last_login: string | null;
  };
  unreadNotifications: number;
}

interface DashboardData {
  parent: {
    id: number;
    name: string;
    email: string;
  };
  students: StudentSummary[];
  stats: {
    total_students: number;
    unread_messages: number;
    pending_event_rsvps: number;
    total_unread_notifications: number;
  };
}

export default function ParentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/parent-portal/dashboard');

        if (!response.ok) {
          throw new Error('Failed to load dashboard');
        }

        const result = await response.json();
        setData(result.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Stack align="center" gap="md">
          <Loader size="xl" color="blue" />
          <Text c="dimmed">Loading dashboard...</Text>
        </Stack>
      </Center>
    );
  }

  if (error) {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Paper p="xl" shadow="sm" withBorder style={{ maxWidth: 450 }}>
          <Stack align="center" gap="md">
            <IconAlertCircle size={48} color="var(--mantine-color-red-6)" />
            <Title order={2} c="red">Error</Title>
            <Text c="red">{error}</Text>
          </Stack>
        </Paper>
      </Center>
    );
  }

  if (!data) return null;

  const { parent, students, stats } = data;

  return (
    <Box bg="gray.0" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <Paper shadow="xs" p="xl" mb="lg">
        <Container size="xl">
          <Group justify="space-between">
            <Box>
              <Title order={1}>Parent Portal</Title>
              <Text c="dimmed" mt={4}>Welcome, {parent.name}</Text>
            </Box>
          </Group>
        </Container>
      </Paper>

      <Container size="xl" py="xl">
        {/* Stats Overview */}
        <Grid mb="xl">
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper shadow="sm" p="lg">
              <Group justify="space-between">
                <Box>
                  <Text c="dimmed" size="sm" fw={500}>Students</Text>
                  <Title order={2} mt="xs">{stats.total_students}</Title>
                </Box>
                <ThemeIcon size={60} radius="md" variant="light" color="blue">
                  <IconUsers size={30} />
                </ThemeIcon>
              </Group>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper shadow="sm" p="lg">
              <Group justify="space-between">
                <Box>
                  <Text c="dimmed" size="sm" fw={500}>Unread Messages</Text>
                  <Title order={2} mt="xs">{stats.unread_messages}</Title>
                </Box>
                <ThemeIcon size={60} radius="md" variant="light" color="green">
                  <IconMessage size={30} />
                </ThemeIcon>
              </Group>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper shadow="sm" p="lg">
              <Group justify="space-between">
                <Box>
                  <Text c="dimmed" size="sm" fw={500}>Notifications</Text>
                  <Title order={2} mt="xs">{stats.total_unread_notifications}</Title>
                </Box>
                <ThemeIcon size={60} radius="md" variant="light" color="orange">
                  <IconBell size={30} />
                </ThemeIcon>
              </Group>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper shadow="sm" p="lg">
              <Group justify="space-between">
                <Box>
                  <Text c="dimmed" size="sm" fw={500}>Event RSVPs</Text>
                  <Title order={2} mt="xs">{stats.pending_event_rsvps}</Title>
                </Box>
                <ThemeIcon size={60} radius="md" variant="light" color="violet">
                  <IconCalendar size={30} />
                </ThemeIcon>
              </Group>
            </Paper>
          </Grid.Col>
        </Grid>

        {/* Students Grid */}
        <Box mb="xl">
          <Title order={2} mb="xl">Your Students</Title>

          {students.length === 0 ? (
            <Paper shadow="sm" p="xl">
              <Stack align="center" gap="md">
                <IconUsers size={48} color="var(--mantine-color-gray-5)" />
                <Text c="dimmed">No students linked yet</Text>
              </Stack>
            </Paper>
          ) : (
            <Grid>
              {students.map((student) => (
                <Grid.Col key={student.student_id} span={{ base: 12, md: 6, lg: 4 }}>
                  <Paper shadow="sm" withBorder style={{ height: '100%' }}>
                    {/* Student Header */}
                    <Box
                      p="xl"
                      style={{
                        background: 'linear-gradient(to right, var(--mantine-color-blue-6), var(--mantine-color-blue-7))',
                        color: 'white',
                      }}
                    >
                      <Group justify="space-between" align="start">
                        <Box>
                          <Title order={3}>{student.user_name}</Title>
                          <Text c="blue.1" size="sm" mt={4} tt="capitalize">
                            {student.relationship_type}
                          </Text>
                        </Box>
                        {student.is_primary && (
                          <Badge color="blue.5">Primary</Badge>
                        )}
                      </Group>
                    </Box>

                    {/* Student Stats */}
                    <Stack p="xl" gap="lg">
                      {/* GPA */}
                      <Box>
                        <Group justify="space-between" mb="xs">
                          <Text size="sm" fw={500} c="dimmed">Overall GPA</Text>
                          <IconChartBar size={16} color="var(--mantine-color-blue-6)" />
                        </Group>
                        <Title order={2}>{student.summary.overall_gpa || 'N/A'}</Title>
                      </Box>

                      {/* Attendance */}
                      <Box>
                        <Group justify="space-between" mb="xs">
                          <Text size="sm" fw={500} c="dimmed">Attendance</Text>
                          <IconBook size={16} color="var(--mantine-color-green-6)" />
                        </Group>
                        <Group gap="xs" align="center">
                          <Progress
                            value={student.summary.attendance_percentage || 0}
                            style={{ flex: 1 }}
                            color="green"
                          />
                          <Text size="sm" fw={600}>
                            {student.summary.attendance_percentage || 0}%
                          </Text>
                        </Group>
                      </Box>

                      {/* Assignments */}
                      <Box>
                        <Group justify="space-between" mb="xs">
                          <Text size="sm" fw={500} c="dimmed">Assignments</Text>
                          <IconFileText size={16} color="var(--mantine-color-orange-6)" />
                        </Group>
                        <Group grow>
                          <Box>
                            <Text size="xs" c="dimmed" mb={4}>Pending</Text>
                            <Title order={4} c="orange">
                              {student.summary.pending_assignments}
                            </Title>
                          </Box>
                          <Box>
                            <Text size="xs" c="dimmed" mb={4}>Overdue</Text>
                            <Title order={4} c="red">
                              {student.summary.overdue_assignments}
                            </Title>
                          </Box>
                        </Group>
                      </Box>

                      {/* Behavior Score */}
                      <Box>
                        <Group justify="space-between" mb="xs">
                          <Text size="sm" fw={500} c="dimmed">Behavior</Text>
                          <IconTrendingDown size={16} color="var(--mantine-color-violet-6)" />
                        </Group>
                        <Title order={2}>{student.summary.behavior_score || 'N/A'}</Title>
                      </Box>

                      {/* Notification Badge */}
                      {student.unreadNotifications > 0 && (
                        <Paper p="sm" withBorder bg="yellow.0">
                          <Group gap="xs">
                            <IconBell size={16} color="var(--mantine-color-yellow-6)" />
                            <Text size="sm" fw={500} c="yellow.9">
                              {student.unreadNotifications} new notification
                              {student.unreadNotifications > 1 ? 's' : ''}
                            </Text>
                          </Group>
                        </Paper>
                      )}

                      {/* Action Links */}
                      <Grid>
                        <Grid.Col span={6}>
                          <Button
                            component="a"
                            href={`/parent-portal/students/${student.student_id}/grades`}
                            variant="light"
                            fullWidth
                            size="sm"
                          >
                            View Grades
                          </Button>
                        </Grid.Col>
                        <Grid.Col span={6}>
                          <Button
                            component="a"
                            href={`/parent-portal/students/${student.student_id}/attendance`}
                            variant="light"
                            color="green"
                            fullWidth
                            size="sm"
                          >
                            Attendance
                          </Button>
                        </Grid.Col>
                      </Grid>
                    </Stack>
                  </Paper>
                </Grid.Col>
              ))}
            </Grid>
          )}
        </Box>

        {/* Quick Links */}
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper
              component="a"
              href="/parent-portal/messages"
              shadow="sm"
              p="lg"
              style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
              sx={{
                '&:hover': {
                  boxShadow: 'var(--mantine-shadow-lg)',
                },
              }}
            >
              <ThemeIcon size={40} radius="md" variant="light" color="green" mb="sm">
                <IconMessage size={24} />
              </ThemeIcon>
              <Title order={4}>Messages</Title>
              <Text size="sm" c="dimmed">Communicate with teachers</Text>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper
              component="a"
              href="/parent-portal/notifications"
              shadow="sm"
              p="lg"
              style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
              sx={{
                '&:hover': {
                  boxShadow: 'var(--mantine-shadow-lg)',
                },
              }}
            >
              <ThemeIcon size={40} radius="md" variant="light" color="orange" mb="sm">
                <IconBell size={24} />
              </ThemeIcon>
              <Title order={4}>Notifications</Title>
              <Text size="sm" c="dimmed">View all alerts</Text>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper
              component="a"
              href="/parent-portal/documents"
              shadow="sm"
              p="lg"
              style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
              sx={{
                '&:hover': {
                  boxShadow: 'var(--mantine-shadow-lg)',
                },
              }}
            >
              <ThemeIcon size={40} radius="md" variant="light" color="blue" mb="sm">
                <IconFileText size={24} />
              </ThemeIcon>
              <Title order={4}>Documents</Title>
              <Text size="sm" c="dimmed">Shared files & forms</Text>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper
              component="a"
              href="/parent-portal/events"
              shadow="sm"
              p="lg"
              style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
              sx={{
                '&:hover': {
                  boxShadow: 'var(--mantine-shadow-lg)',
                },
              }}
            >
              <ThemeIcon size={40} radius="md" variant="light" color="violet" mb="sm">
                <IconCalendar size={24} />
              </ThemeIcon>
              <Title order={4}>Events</Title>
              <Text size="sm" c="dimmed">RSVP to events</Text>
            </Paper>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}
