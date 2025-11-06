'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getSession } from '@/lib/auth/client-auth';
import { IconArrowLeft, IconLoader, IconAlertCircle } from '@tabler/icons-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Container, Group, Title, Text, Button, Loader, Center, Stack, Paper, Grid, Alert, Progress, SimpleGrid } from '@mantine/core';

export default function StudentProgressPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params?.studentId as string;
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [progress, setProgress] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const session = getSession();

        if (!session || !['parent', 'guardian'].includes(session.role)) {
          router.push('/auth/login');
          return;
        }

        // Fetch progress data
        const response = await fetch(`/api/parent-portal/students/${studentId}/progress`);
        if (!response.ok) {
          throw new Error('Failed to load progress');
        }

        const data = await response.json();
        setProgress(data);
        setAuthorized(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router, studentId]);

  if (loading) {
    return (
      <Center h="100vh" bg="gray.0">
        <Stack align="center" gap="md">
          <Loader size="lg" color="blue" />
          <Text c="dimmed">Loading progress...</Text>
        </Stack>
      </Center>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <Stack gap={0} mih="100vh" bg="gray.0">
      {/* Header */}
      <Paper withBorder p="md">
        <Container size="xl">
          <Group gap="md">
            <Button
              variant="subtle"
              color="gray"
              onClick={() => router.push('/dashboard/parent')}
              leftSection={<IconArrowLeft size={18} />}
            >
            </Button>
            <Stack gap={4}>
              <Title order={1}>Student Progress</Title>
              <Text size="sm" c="dimmed">View overall academic progress and analytics</Text>
            </Stack>
          </Group>
        </Container>
      </Paper>

      {/* Content */}
      <Container size="xl" py="xl">
        {error && (
          <Alert icon={<IconAlertCircle size={18} />} title="Error loading progress" color="red" mb="xl">
            {error}
          </Alert>
        )}

        {progress && (
          <Stack gap="xl">
            {/* Key Metrics */}
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
              <Paper shadow="sm" p="lg" radius="md">
                <Text size="sm" fw={500} c="dimmed">Overall GPA</Text>
                <Text size="xl" fw={700} mt="xs">{progress.overall_gpa || 'N/A'}</Text>
              </Paper>
              <Paper shadow="sm" p="lg" radius="md">
                <Text size="sm" fw={500} c="dimmed">Attendance</Text>
                <Text size="xl" fw={700} mt="xs">{progress.attendance_percentage || 0}%</Text>
              </Paper>
              <Paper shadow="sm" p="lg" radius="md">
                <Text size="sm" fw={500} c="dimmed">Courses Completed</Text>
                <Text size="xl" fw={700} mt="xs">{progress.courses_completed || 0}</Text>
              </Paper>
              <Paper shadow="sm" p="lg" radius="md">
                <Text size="sm" fw={500} c="dimmed">Last Login</Text>
                <Text size="sm" fw={600} mt="xs">
                  {progress.last_login ? new Date(progress.last_login).toLocaleDateString() : 'N/A'}
                </Text>
              </Paper>
            </SimpleGrid>

            {/* Course Performance */}
            {progress.courses && progress.courses.length > 0 && (
              <Paper shadow="sm" p="lg" radius="md">
                <Title order={2} size="h3" mb="lg">Course Performance</Title>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={progress.courses}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="grade" fill="#3b82f6" name="Grade %" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            )}

            {/* Course List */}
            {progress.courses && progress.courses.length > 0 && (
              <Paper shadow="sm" p="lg" radius="md">
                <Title order={2} size="h3" mb="lg">Enrolled Courses</Title>
                <Stack gap="md">
                  {progress.courses.map((course: any) => (
                    <Paper key={course.id} withBorder p="md" radius="md">
                      <Group justify="space-between" align="flex-start" mb="sm">
                        <Stack gap={4}>
                          <Text fw={600}>{course.name}</Text>
                          <Text size="sm" c="dimmed">Instructor: {course.instructor || 'N/A'}</Text>
                        </Stack>
                        <Stack gap={0} align="flex-end">
                          <Text size="xl" fw={700}>{course.grade || 0}%</Text>
                          <Text size="sm" c="dimmed">{course.grade_letter || 'N/A'}</Text>
                        </Stack>
                      </Group>
                      <Progress value={course.grade || 0} color="blue" size="sm" radius="xl" />
                    </Paper>
                  ))}
                </Stack>
              </Paper>
            )}
          </Stack>
        )}
      </Container>
    </Stack>
  );
}
