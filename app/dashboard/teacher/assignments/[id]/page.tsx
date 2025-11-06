'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getSession, clearSession } from '@/lib/auth/client-auth';
import {
  Container,
  Title,
  Text,
  Button,
  TextInput,
  Select,
  Paper,
  Group,
  Stack,
  Badge,
  Grid,
  Loader,
  Center,
  Textarea,
  Alert,
  NumberInput,
} from '@mantine/core';
import { IconArrowLeft, IconLogout, IconEdit, IconTrash } from '@tabler/icons-react';

interface Assignment {
  id: string;
  course_id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  due_date: string;
  max_score: string;
  status: string;
  created_at: string;
  updated_at: string;
  submission_count?: number;
  graded_count?: number;
}

interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  submission_text: string | null;
  file_url: string | null;
  submitted_at: string | null;
  status: string;
  student_name: string;
  score?: string;
  feedback?: string;
}

export default function AssignmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.id as string;

  const [session, setSession] = useState<any>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxScore: 100,
    status: 'active',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const sess = getSession();
      if (!sess || sess.role !== 'teacher') {
        router.push('/auth/login');
        return;
      }
      setSession(sess);
      await fetchAssignment();
      await fetchSubmissions();
    };

    checkAuth();
  }, [router, assignmentId]);

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/assignments/${assignmentId}`);
      if (!response.ok) throw new Error('Failed to fetch assignment');
      const data = await response.json();
      const assign = data.data;
      setAssignment(assign);
      setFormData({
        title: assign.title,
        description: assign.description || '',
        dueDate: new Date(assign.due_date).toISOString().slice(0, 16),
        maxScore: parseInt(assign.max_score),
        status: assign.status,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await fetch(
        `/api/submissions?assignmentId=${assignmentId}&includeGrades=true`
      );
      if (!response.ok) throw new Error('Failed to fetch submissions');
      const data = await response.json();
      setSubmissions(data.data || []);
    } catch (err) {
      console.error('Error fetching submissions:', err);
    }
  };

  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.dueDate) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          dueDate: new Date(formData.dueDate).toISOString(),
          maxScore: formData.maxScore,
          status: formData.status,
        }),
      });

      if (!response.ok) throw new Error('Failed to update assignment');
      const result = await response.json();
      setAssignment(result.data);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAssignment = async () => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete assignment');
      router.push('/dashboard/teacher/assignments');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete assignment');
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    router.push('/');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!session) {
    return (
      <Center h="100vh">
        <Loader size="xl" />
      </Center>
    );
  }

  if (loading) {
    return (
      <Center h="100vh">
        <Loader size="xl" />
      </Center>
    );
  }

  if (!assignment) {
    return (
      <Container size="md" py="xl">
        <Paper withBorder shadow="lg" p="xl">
          <Stack align="center" gap="md">
            <Text c="dimmed" size="lg">
              Assignment not found.
            </Text>
            <Button onClick={() => router.push('/dashboard/teacher/assignments')}>
              Back to Assignments
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between">
          <Button
            variant="default"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => router.push('/dashboard/teacher/assignments')}
          >
            Back
          </Button>
          <Button
            color="red"
            leftSection={<IconLogout size={16} />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Group>

        {/* Error Message */}
        {error && (
          <Alert color="red" title="Error" withCloseButton onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid>
          {/* Assignment Details (Left) */}
          <Grid.Col span={{ base: 12, lg: 4 }}>
            <Paper withBorder shadow="lg" p="lg">
              <Stack gap="lg">
                <Title order={2}>Assignment Details</Title>

                {!isEditing ? (
                  <Stack gap="md">
                    <Stack gap={4}>
                      <Text size="sm" c="dimmed" tt="uppercase">
                        Title
                      </Text>
                      <Text size="lg" fw={600}>
                        {assignment.title}
                      </Text>
                    </Stack>

                    <Stack gap={4}>
                      <Text size="sm" c="dimmed" tt="uppercase">
                        Status
                      </Text>
                      <Badge
                        color={
                          assignment.status === 'active'
                            ? 'green'
                            : assignment.status === 'closed'
                            ? 'yellow'
                            : 'gray'
                        }
                        size="lg"
                      >
                        {assignment.status}
                      </Badge>
                    </Stack>

                    <Stack gap={4}>
                      <Text size="sm" c="dimmed" tt="uppercase">
                        Due Date
                      </Text>
                      <Text>{formatDate(assignment.due_date)}</Text>
                    </Stack>

                    <Stack gap={4}>
                      <Text size="sm" c="dimmed" tt="uppercase">
                        Max Score
                      </Text>
                      <Text>{assignment.max_score}</Text>
                    </Stack>

                    <Stack gap={4}>
                      <Text size="sm" c="dimmed" tt="uppercase">
                        Created
                      </Text>
                      <Text>{formatDate(assignment.created_at)}</Text>
                    </Stack>

                    <Button
                      leftSection={<IconEdit size={16} />}
                      onClick={() => setIsEditing(true)}
                      fullWidth
                    >
                      Edit Assignment
                    </Button>

                    <Button
                      color="red"
                      leftSection={<IconTrash size={16} />}
                      onClick={handleDeleteAssignment}
                      disabled={submitting}
                      fullWidth
                    >
                      {submitting ? 'Deleting...' : 'Delete Assignment'}
                    </Button>
                  </Stack>
                ) : (
                  <form onSubmit={handleUpdateAssignment}>
                    <Stack gap="md">
                      <TextInput
                        label="Title"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.currentTarget.value })
                        }
                        required
                      />

                      <Select
                        label="Status"
                        value={formData.status}
                        onChange={(value) =>
                          setFormData({ ...formData, status: value || 'active' })
                        }
                        data={[
                          { value: 'active', label: 'Active' },
                          { value: 'closed', label: 'Closed' },
                          { value: 'archived', label: 'Archived' },
                        ]}
                      />

                      <TextInput
                        label="Due Date"
                        type="datetime-local"
                        value={formData.dueDate}
                        onChange={(e) =>
                          setFormData({ ...formData, dueDate: e.currentTarget.value })
                        }
                        required
                      />

                      <NumberInput
                        label="Max Score"
                        value={formData.maxScore}
                        onChange={(value) =>
                          setFormData({
                            ...formData,
                            maxScore: typeof value === 'number' ? value : 100,
                          })
                        }
                        min={0}
                      />

                      <Group grow>
                        <Button type="submit" color="green" disabled={submitting}>
                          {submitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button
                          variant="default"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </Button>
                      </Group>
                    </Stack>
                  </form>
                )}
              </Stack>
            </Paper>
          </Grid.Col>

          {/* Submissions (Right) */}
          <Grid.Col span={{ base: 12, lg: 8 }}>
            <Paper withBorder shadow="lg" p="lg">
              <Stack gap="lg">
                <Title order={2}>Submissions ({submissions.length})</Title>

                {submissions.length === 0 ? (
                  <Center py="xl">
                    <Text c="dimmed">No submissions yet.</Text>
                  </Center>
                ) : (
                  <Stack gap="md">
                    {submissions.map((submission) => (
                      <Paper
                        key={submission.id}
                        withBorder
                        p="md"
                        style={{ cursor: 'pointer' }}
                        onClick={() =>
                          router.push(
                            `/dashboard/teacher/assignments/${assignmentId}/submissions/${submission.id}`
                          )
                        }
                      >
                        <Stack gap="sm">
                          <Group justify="space-between" align="flex-start">
                            <Stack gap={4}>
                              <Text fw={600}>{submission.student_name}</Text>
                              <Text size="sm" c="dimmed">
                                {submission.submitted_at
                                  ? formatDate(submission.submitted_at)
                                  : 'Not submitted'}
                              </Text>
                            </Stack>
                            <Stack gap="xs" align="flex-end">
                              <Badge
                                color={
                                  submission.status === 'graded'
                                    ? 'green'
                                    : submission.status === 'submitted'
                                    ? 'blue'
                                    : 'gray'
                                }
                              >
                                {submission.status === 'graded'
                                  ? 'Graded'
                                  : submission.status === 'submitted'
                                  ? 'Submitted'
                                  : 'Draft'}
                              </Badge>
                              {submission.score && (
                                <Text size="lg" fw={700} c="green">
                                  {submission.score}/{assignment.max_score}
                                </Text>
                              )}
                            </Stack>
                          </Group>

                          {submission.submission_text && (
                            <Text size="sm" c="dimmed" lineClamp={2}>
                              {submission.submission_text}
                            </Text>
                          )}
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}
