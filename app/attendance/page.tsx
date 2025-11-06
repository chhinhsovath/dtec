'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth/client-auth';
import { IconCalendar, IconCircleCheck, IconCircleX, IconClock, IconTrendingUp } from '@tabler/icons-react';
import { Container, Title, Group, Button, Paper, Grid, Card, Text, Stack, Center, Loader, Box, Badge } from '@mantine/core';

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  session_id: string;
  created_at: string;
}

export default function AttendancePage() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const router = useRouter();

  useEffect(() => {
    const loadAttendance = async () => {
      try {
        const session = getSession();

        if (!session) {
          router.push('/auth/login');
          return;
        }

        // Fetch attendance records from API
        const response = await fetch('/api/student/attendance', {
          headers: {
            'x-student-id': session.id,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to load attendance records');
        }

        const data = await response.json();
        setAttendanceRecords(data.records || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadAttendance();
  }, [router]);

  const calculateAttendanceRate = () => {
    if (attendanceRecords.length === 0) return 0;
    const present = attendanceRecords.filter(r => r.status === 'present').length;
    return ((present / attendanceRecords.length) * 100).toFixed(1);
  };

  const getMonthRecords = () => {
    return attendanceRecords.filter(record => {
      const date = new Date(record.date);
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <IconCircleCheck size={20} color="var(--mantine-color-green-6)" />;
      case 'absent':
        return <IconCircleX size={20} color="var(--mantine-color-red-6)" />;
      case 'late':
        return <IconClock size={20} color="var(--mantine-color-yellow-6)" />;
      default:
        return <IconClock size={20} color="var(--mantine-color-gray-4)" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'green';
      case 'absent':
        return 'red';
      case 'late':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) {
    return (
      <Center h="100vh">
        <Stack align="center">
          <Loader size="xl" />
          <Text size="xl">Loading...</Text>
        </Stack>
      </Center>
    );
  }

  if (error) {
    return (
      <Center h="100vh">
        <Stack align="center">
          <Text size="lg" c="red">{error}</Text>
          <Button onClick={() => router.back()}>← Back</Button>
        </Stack>
      </Center>
    );
  }

  const monthRecords = getMonthRecords();
  const presentCount = monthRecords.filter(r => r.status === 'present').length;
  const absentCount = monthRecords.filter(r => r.status === 'absent').length;
  const lateCount = monthRecords.filter(r => r.status === 'late').length;

  return (
    <>

    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <Paper shadow="sm" p="md" mb="lg">
        <Container size="xl">
          <Group justify="space-between">
            <Group>
              <IconCalendar size={32} color="var(--mantine-color-blue-6)" />
              <Title order={1}>Attendance</Title>
            </Group>
            <Button variant="subtle" onClick={() => router.back()}>
              ← Back
            </Button>
          </Group>
        </Container>
      </Paper>

      {/* Main Content */}
      <Container size="xl" py="lg">
        {/* Stats Overview */}
        <Grid mb="xl">
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Card shadow="md" padding="lg">
              <Group justify="space-between">
                <Box>
                  <Text size="sm" fw={500} c="dimmed">Attendance Rate</Text>
                  <Title order={2} c="blue" mt="sm">{calculateAttendanceRate()}%</Title>
                </Box>
                <IconTrendingUp size={48} color="var(--mantine-color-blue-6)" opacity={0.3} />
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 3 }}>
            <Card shadow="md" padding="lg">
              <Group justify="space-between">
                <Box>
                  <Text size="sm" fw={500} c="dimmed">Present</Text>
                  <Title order={2} c="green" mt="sm">{presentCount}</Title>
                </Box>
                <IconCircleCheck size={48} color="var(--mantine-color-green-6)" opacity={0.3} />
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 3 }}>
            <Card shadow="md" padding="lg">
              <Group justify="space-between">
                <Box>
                  <Text size="sm" fw={500} c="dimmed">Absent</Text>
                  <Title order={2} c="red" mt="sm">{absentCount}</Title>
                </Box>
                <IconCircleX size={48} color="var(--mantine-color-red-6)" opacity={0.3} />
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 3 }}>
            <Card shadow="md" padding="lg">
              <Group justify="space-between">
                <Box>
                  <Text size="sm" fw={500} c="dimmed">Late</Text>
                  <Title order={2} c="yellow" mt="sm">{lateCount}</Title>
                </Box>
                <IconClock size={48} color="var(--mantine-color-yellow-6)" opacity={0.3} />
              </Group>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Month Selector */}
        <Paper shadow="md" p="md" mb="md">
          <Group justify="space-between">
            <Button
              variant="light"
              size="sm"
              onClick={() => {
                if (selectedMonth === 0) {
                  setSelectedMonth(11);
                  setSelectedYear(selectedYear - 1);
                } else {
                  setSelectedMonth(selectedMonth - 1);
                }
              }}
            >
              ← Previous
            </Button>
            <Title order={3}>
              {monthNames[selectedMonth]} {selectedYear}
            </Title>
            <Button
              variant="light"
              size="sm"
              onClick={() => {
                if (selectedMonth === 11) {
                  setSelectedMonth(0);
                  setSelectedYear(selectedYear + 1);
                } else {
                  setSelectedMonth(selectedMonth + 1);
                }
              }}
            >
              Next →
            </Button>
          </Group>
        </Paper>

        {/* Attendance Records */}
        <Card shadow="md" padding="lg">
          <Title order={3} mb="md">Attendance Records</Title>
          {monthRecords.length === 0 ? (
            <Center py="xl">
              <Stack align="center">
                <IconCalendar size={64} color="var(--mantine-color-gray-4)" />
                <Text size="lg" c="dimmed">No attendance records for this month</Text>
                <Text size="sm" c="dimmed">Records will appear as you attend classes</Text>
              </Stack>
            </Center>
          ) : (
            <Stack gap="sm">
              {monthRecords.map((record) => (
                <Paper key={record.id} p="md" withBorder>
                  <Group justify="space-between">
                    <Group>
                      {getStatusIcon(record.status)}
                      <Box>
                        <Text fw={600}>
                          {new Date(record.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </Text>
                        <Text size="sm" c="dimmed">
                          Session ID: {record.session_id}
                        </Text>
                      </Box>
                    </Group>
                    <Badge color={getStatusBadgeColor(record.status)} variant="light" tt="capitalize">
                      {record.status}
                    </Badge>
                  </Group>
                </Paper>
              ))}
            </Stack>
          )}
        </Card>

        {/* Attendance Tips */}
        <Card shadow="md" padding="lg" mt="lg">
          <Title order={3} mb="md">Attendance Tips</Title>
          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="md" style={{ backgroundColor: 'var(--mantine-color-green-0)' }}>
                <IconCircleCheck size={32} color="var(--mantine-color-green-6)" />
                <Text fw={600} mt="sm" mb="xs">Be Punctual</Text>
                <Text size="sm" c="dimmed">
                  Arrive on time to maintain a good attendance record
                </Text>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="md" style={{ backgroundColor: 'var(--mantine-color-blue-0)' }}>
                <IconCalendar size={32} color="var(--mantine-color-blue-6)" />
                <Text fw={600} mt="sm" mb="xs">Track Progress</Text>
                <Text size="sm" c="dimmed">
                  Monitor your attendance rate regularly
                </Text>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="md" style={{ backgroundColor: 'var(--mantine-color-violet-0)' }}>
                <IconTrendingUp size={32} color="var(--mantine-color-violet-6)" />
                <Text fw={600} mt="sm" mb="xs">Stay Consistent</Text>
                <Text size="sm" c="dimmed">
                  Maintain 90%+ attendance for best results
                </Text>
              </Paper>
            </Grid.Col>
          </Grid>
        </Card>
      </Container>
    </div>
    </>
  );
}
