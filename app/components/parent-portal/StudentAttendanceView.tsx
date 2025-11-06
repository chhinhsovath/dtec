'use client';

import { useState, useEffect } from 'react';
import {
  IconArrowLeft,
  IconCalendar,
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconAlertCircle,
  IconLoader,
} from '@tabler/icons-react';
import Link from 'next/link';
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
  ActionIcon,
  Grid,
  RingProgress,
} from '@mantine/core';

interface AttendanceRecord {
  attendance_id: number;
  course_id: number;
  course_name: string;
  class_date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  marked_at: string;
  marked_by_name?: string;
}

interface AttendanceStatistics {
  total_classes: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendance_percentage: number;
}

interface AttendanceData {
  student_id: number;
  statistics: AttendanceStatistics;
  records: AttendanceRecord[];
}

interface StudentAttendanceViewProps {
  studentId: string;
  studentName?: string;
}

const statusConfig = {
  present: {
    icon: IconCircleCheck,
    color: 'green',
    label: 'Present',
  },
  absent: {
    icon: IconCircleX,
    color: 'red',
    label: 'Absent',
  },
  late: {
    icon: IconClock,
    color: 'yellow',
    label: 'Late',
  },
  excused: {
    icon: IconAlertCircle,
    color: 'blue',
    label: 'Excused',
  },
};

export default function StudentAttendanceView({ studentId, studentName }: StudentAttendanceViewProps) {
  const [data, setData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/parent-portal/students/${studentId}/attendance`);

        if (!response.ok) {
          throw new Error('Failed to load attendance');
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

    fetchAttendance();
  }, [studentId]);

  if (loading) {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Stack align="center" gap="md">
          <Loader size="xl" color="blue" />
          <Text c="dimmed">Loading attendance...</Text>
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
            <Button component="a" href="/parent-portal" color="red">
              Back to Dashboard
            </Button>
          </Stack>
        </Paper>
      </Center>
    );
  }

  if (!data) return null;

  const { statistics, records } = data;
  const attendanceColor =
    statistics.attendance_percentage >= 90
      ? 'green'
      : statistics.attendance_percentage >= 80
        ? 'blue'
        : statistics.attendance_percentage >= 70
          ? 'yellow'
          : 'red';

  return (
    <Box bg="gray.0" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <Paper shadow="xs" p="xl" mb="lg">
        <Container size="xl">
          <Group gap="md" mb="md">
            <ActionIcon
              component="a"
              href="/parent-portal"
              variant="subtle"
              size="lg"
            >
              <IconArrowLeft size={24} />
            </ActionIcon>
            <Box>
              <Title order={1}>Attendance</Title>
              <Text c="dimmed" mt={4}>{studentName}</Text>
            </Box>
          </Group>
        </Container>
      </Paper>

      <Container size="xl" py="xl">
        {/* Overall Attendance */}
        <Grid mb="xl">
          {/* Percentage Card */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper
              shadow="lg"
              p="xl"
              style={{
                background: 'linear-gradient(135deg, var(--mantine-color-blue-6) 0%, var(--mantine-color-blue-7) 100%)',
                color: 'white',
              }}
            >
              <Text size="sm" c="blue.1" fw={500}>
                Overall Attendance
              </Text>
              <Center mt="xl" mb="xl">
                <RingProgress
                  size={200}
                  thickness={16}
                  sections={[
                    { value: statistics.attendance_percentage, color: attendanceColor },
                  ]}
                  label={
                    <Center>
                      <Text size="60px" fw={700} c="white">
                        {statistics.attendance_percentage.toFixed(1)}%
                      </Text>
                    </Center>
                  }
                />
              </Center>
              <Text size="sm" c="blue.1" ta="center">
                Out of {statistics.total_classes} total classes
              </Text>
            </Paper>
          </Grid.Col>

          {/* Statistics Grid */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Grid>
              <Grid.Col span={6}>
                <Paper shadow="sm" p="lg" style={{ borderTop: '4px solid var(--mantine-color-green-6)' }}>
                  <Text size="sm" c="dimmed" fw={500}>Present</Text>
                  <Title order={2} c="green" mt="xs">{statistics.present}</Title>
                  <Text size="xs" c="dimmed" mt="xs">
                    {((statistics.present / statistics.total_classes) * 100).toFixed(1)}% of total
                  </Text>
                </Paper>
              </Grid.Col>

              <Grid.Col span={6}>
                <Paper shadow="sm" p="lg" style={{ borderTop: '4px solid var(--mantine-color-red-6)' }}>
                  <Text size="sm" c="dimmed" fw={500}>Absent</Text>
                  <Title order={2} c="red" mt="xs">{statistics.absent}</Title>
                  <Text size="xs" c="dimmed" mt="xs">
                    {((statistics.absent / statistics.total_classes) * 100).toFixed(1)}% of total
                  </Text>
                </Paper>
              </Grid.Col>

              <Grid.Col span={6}>
                <Paper shadow="sm" p="lg" style={{ borderTop: '4px solid var(--mantine-color-yellow-6)' }}>
                  <Text size="sm" c="dimmed" fw={500}>Late</Text>
                  <Title order={2} c="yellow" mt="xs">{statistics.late}</Title>
                  <Text size="xs" c="dimmed" mt="xs">
                    {((statistics.late / statistics.total_classes) * 100).toFixed(1)}% of total
                  </Text>
                </Paper>
              </Grid.Col>

              <Grid.Col span={6}>
                <Paper shadow="sm" p="lg" style={{ borderTop: '4px solid var(--mantine-color-blue-6)' }}>
                  <Text size="sm" c="dimmed" fw={500}>Excused</Text>
                  <Title order={2} c="blue" mt="xs">{statistics.excused}</Title>
                  <Text size="xs" c="dimmed" mt="xs">
                    {((statistics.excused / statistics.total_classes) * 100).toFixed(1)}% of total
                  </Text>
                </Paper>
              </Grid.Col>
            </Grid>
          </Grid.Col>
        </Grid>

        {/* Attendance Records */}
        <Box>
          <Title order={2} mb="xl">Attendance Records</Title>

          {records.length === 0 ? (
            <Paper shadow="sm" p="xl">
              <Stack align="center" gap="md">
                <IconCalendar size={48} color="var(--mantine-color-gray-5)" />
                <Text c="dimmed">No attendance records available</Text>
              </Stack>
            </Paper>
          ) : (
            <Stack gap="sm">
              {records.map((record) => {
                const status = record.status as keyof typeof statusConfig;
                const config = statusConfig[status];
                const Icon = config.icon;

                return (
                  <Paper
                    key={record.attendance_id}
                    shadow="sm"
                    p="md"
                    withBorder
                    style={{
                      borderLeftWidth: 4,
                      borderLeftColor: `var(--mantine-color-${config.color}-6)`,
                    }}
                  >
                    <Group justify="space-between" align="center">
                      <Group gap="md" style={{ flex: 1 }}>
                        <ActionIcon
                          variant="light"
                          color={config.color}
                          size="xl"
                          radius="md"
                        >
                          <Icon size={24} />
                        </ActionIcon>

                        <Box style={{ flex: 1 }}>
                          <Group gap="xs" mb="xs">
                            <Text fw={600}>{record.course_name}</Text>
                            <Badge color={config.color}>
                              {config.label}
                            </Badge>
                          </Group>
                          <Text size="sm" c="dimmed">
                            {new Date(record.class_date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </Text>
                          {record.marked_by_name && (
                            <Text size="xs" c="dimmed" mt={4}>
                              Marked by {record.marked_by_name}
                            </Text>
                          )}
                        </Box>
                      </Group>

                      <Box ta="right">
                        <Text size="xs" c="dimmed">
                          {new Date(record.marked_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </Box>
                    </Group>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Box>

        {/* Attendance Trend Chart Placeholder */}
        <Paper shadow="sm" p="xl" mt="xl">
          <Title order={3} mb="xl">Attendance Trend</Title>
          <Center h={250} bg="gray.0" style={{ border: '2px dashed var(--mantine-color-gray-3)', borderRadius: 'var(--mantine-radius-md)' }}>
            <Text c="dimmed">Chart visualization coming soon</Text>
          </Center>
        </Paper>
      </Container>
    </Box>
  );
}
