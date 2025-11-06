'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getSession } from '@/lib/auth/client-auth';
import { IconArrowLeft, IconLoader, IconAlertCircle } from '@tabler/icons-react';
import { Container, Group, Title, Text, Button, Loader, Center, Stack, Paper, Alert, Badge } from '@mantine/core';

export default function StudentAssignmentsPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params?.studentId as string;
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const session = getSession();

        if (!session || !['parent', 'guardian'].includes(session.role)) {
          router.push('/auth/login');
          return;
        }

        // Fetch assignments
        const response = await fetch(`/api/parent-portal/students/${studentId}/assignments`);
        if (!response.ok) {
          throw new Error('Failed to load assignments');
        }

        const data = await response.json();
        setAssignments(data.assignments || []);
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
          <Text c="dimmed">Loading assignments...</Text>
        </Stack>
      </Center>
    );
  }

  if (!authorized) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'green';
      case 'overdue':
        return 'red';
      default:
        return 'yellow';
    }
  };

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
              <Title order={1}>Assignments</Title>
              <Text size="sm" c="dimmed">View pending and completed assignments</Text>
            </Stack>
          </Group>
        </Container>
      </Paper>

      {/* Content */}
      <Container size="xl" py="xl">
        {error && (
          <Alert icon={<IconAlertCircle size={18} />} title="Error loading assignments" color="red" mb="xl">
            {error}
          </Alert>
        )}

        {assignments.length === 0 ? (
          <Paper shadow="sm" p="xl" radius="md">
            <Text ta="center" c="dimmed">No assignments found for this student</Text>
          </Paper>
        ) : (
          <Stack gap="md">
            {assignments.map((assignment) => (
              <Paper key={assignment.id} shadow="sm" p="lg" radius="md">
                <Group justify="space-between" align="flex-start" mb="md">
                  <Stack gap="xs">
                    <Text fw={600} size="lg">{assignment.title}</Text>
                    <Text size="sm" c="dimmed">{assignment.course_name}</Text>
                  </Stack>
                  <Badge color={getStatusColor(assignment.status)} size="lg" radius="sm">
                    {assignment.status}
                  </Badge>
                </Group>
                <Text c="dimmed" size="sm" mb="md">{assignment.description}</Text>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Due: {new Date(assignment.due_date).toLocaleDateString()}
                  </Text>
                  {assignment.submitted_date && (
                    <Text size="sm" c="dimmed">
                      Submitted: {new Date(assignment.submitted_date).toLocaleDateString()}
                    </Text>
                  )}
                </Group>
              </Paper>
            ))}
          </Stack>
        )}
      </Container>
    </Stack>
  );
}
