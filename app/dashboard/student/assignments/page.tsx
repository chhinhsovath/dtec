'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth/client-auth';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  Paper,
  Grid,
  Loader,
  Alert,
  Badge,
  Stack,
  Textarea,
  Center,
  Collapse,
} from '@mantine/core';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';

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
  created_at: string;
  updated_at: string;
  score?: string;
  feedback?: string;
  graded_at?: string;
}

export default function StudentAssignmentsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [session, setSession] = useState<any>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<{ [key: string]: Submission }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<string | null>(null);
  const [submissionText, setSubmissionText] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const sess = getSession();
      if (!sess || sess.role !== 'student') {
        router.push('/auth/login');
        return;
      }
      setSession(sess);
      fetchAssignments();
      fetchSubmissions();
    };

    checkAuth();
  }, [router]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/assignments?status=active');
      if (!response.ok) throw new Error('Failed to fetch assignments');
      const data = await response.json();
      setAssignments(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      if (!session) return;
      const response = await fetch(`/api/submissions?studentId=${session.id}&includeGrades=true`);
      if (!response.ok) throw new Error('Failed to fetch submissions');
      const data = await response.json();

      const submissionsMap: { [key: string]: Submission } = {};
      data.data.forEach((submission: any) => {
        submissionsMap[submission.assignment_id] = submission;
      });
      setSubmissions(submissionsMap);
    } catch (err) {
      console.error('Error fetching submissions:', err);
    }
  };

  const handleSubmitAssignment = async (assignmentId: string) => {
    if (!submissionText[assignmentId]?.trim()) {
      setError('Please enter your submission');
      return;
    }

    try {
      setSubmitting(assignmentId);
      setError(null);

      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId,
          studentId: session.id,
          submissionText: submissionText[assignmentId],
          fileUrl: null,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit assignment');
      const result = await response.json();

      setSubmissions({
        ...submissions,
        [assignmentId]: result.data,
      });
      setSubmissionText({ ...submissionText, [assignmentId]: '' });
      setExpandedAssignmentId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit assignment');
    } finally {
      setSubmitting(null);
    }
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

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const getSubmissionStatus = (assignmentId: string) => {
    const submission = submissions[assignmentId];
    if (!submission) return 'not-submitted';
    if (submission.status === 'graded') return 'graded';
    if (submission.status === 'submitted') return 'submitted';
    return 'draft';
  };

  if (!session) {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Loader size="xl" />
      </Center>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', paddingTop: '24px' }}>
      <Container size="xl" py="xl">
        <Title order={2} mb="xl" style={{ fontFamily: 'Hanuman' }}>
          ភារកិច្ច
        </Title>

        {error && (
        <Alert color="red" mb="md">
          {error}
        </Alert>
      )}

      {loading ? (
        <Center py="xl">
          <Loader size="xl" />
        </Center>
      ) : assignments.length === 0 ? (
        <Paper shadow="md" p="xl" radius="md">
          <Center>
            <Stack align="center" gap="md">
              <Text size="lg" c="dimmed">{t('assignments.noAssignments')}</Text>
              <Text c="dimmed">{t('assignments.checkBackLater')}</Text>
            </Stack>
          </Center>
        </Paper>
      ) : (
        <Stack gap="lg">
          {assignments.map((assignment) => {
            const submission = submissions[assignment.id];
            const status = getSubmissionStatus(assignment.id);
            const isExpanded = expandedAssignmentId === assignment.id;

            return (
              <Paper
                key={assignment.id}
                shadow="md"
                radius="md"
                withBorder
              >
                <Paper
                  p="lg"
                  style={{ cursor: 'pointer' }}
                  onClick={() =>
                    setExpandedAssignmentId(isExpanded ? null : assignment.id)
                  }
                >
                  <Group justify="space-between" align="flex-start">
                    <Stack gap="xs" style={{ flex: 1 }}>
                      <Title order={3}>{assignment.title}</Title>
                      {assignment.description && (
                        <Text size="sm" c="dimmed" lineClamp={2}>
                          {assignment.description}
                        </Text>
                      )}
                    </Stack>
                    <Stack align="flex-end" gap="xs">
                      <Badge
                        color={
                          status === 'graded'
                            ? 'green'
                            : status === 'submitted'
                            ? 'blue'
                            : status === 'draft'
                            ? 'yellow'
                            : 'gray'
                        }
                      >
                        {status === 'graded'
                          ? t('assignments.graded')
                          : status === 'submitted'
                          ? t('assignments.submitted')
                          : status === 'draft'
                          ? t('assignments.draft')
                          : t('assignments.notSubmitted')}
                      </Badge>
                      {isExpanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
                    </Stack>
                  </Group>

                  <Grid mt="md" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                      <Text size="xs" tt="uppercase" c="dimmed" mb={4}>{t('assignments.dueDate')}</Text>
                      <Text
                        size="sm"
                        fw={600}
                        c={isOverdue(assignment.due_date) ? 'red' : undefined}
                      >
                        {formatDate(assignment.due_date)}
                      </Text>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                      <Text size="xs" tt="uppercase" c="dimmed" mb={4}>{t('assignments.maxScore')}</Text>
                      <Text size="sm" fw={600}>{assignment.max_score}</Text>
                    </Grid.Col>
                    {submission?.score && (
                      <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                        <Text size="xs" tt="uppercase" c="dimmed" mb={4}>{t('assignments.yourScore')}</Text>
                        <Text size="sm" fw={600} c="green">{submission.score}</Text>
                      </Grid.Col>
                    )}
                  </Grid>
                </Paper>

                <Collapse in={isExpanded}>
                  <Paper p="lg" bg="gray.0">
                    <Stack gap="lg">
                      {assignment.description && (
                        <div>
                          <Text size="sm" fw={600} c="dimmed" mb="xs">
                            {t('assignments.description')}
                          </Text>
                          <Text c="dimmed">{assignment.description}</Text>
                        </div>
                      )}

                      {submission?.status === 'graded' && (
                        <Alert color="green" title={t('assignments.teacherFeedback')}>
                          <Text size="sm">
                            {submission.feedback || t('assignments.noFeedback')}
                          </Text>
                          <Text size="xs" c="dimmed" mt="xs">
                            {t('assignments.gradedOn')} {formatDate(submission.graded_at || '')}
                          </Text>
                        </Alert>
                      )}

                      {submission?.status !== 'graded' && (
                        <div>
                          <Text size="sm" fw={600} c="dimmed" mb="md">
                            {submission ? t('assignments.updateSubmission') : t('assignments.submitWork')}
                          </Text>
                          <Textarea
                            value={submissionText[assignment.id] || ''}
                            onChange={(e) =>
                              setSubmissionText({
                                ...submissionText,
                                [assignment.id]: e.target.value,
                              })
                            }
                            placeholder={t('assignments.submissionPlaceholder')}
                            minRows={6}
                            mb="md"
                          />
                          <Button
                            fullWidth
                            onClick={() => handleSubmitAssignment(assignment.id)}
                            loading={submitting === assignment.id}
                          >
                            {submission ? t('assignments.updateButton') : t('assignments.submitButton')}
                          </Button>
                        </div>
                      )}

                      {submission && (
                        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--mantine-color-gray-3)' }}>
                          <Text size="xs" c="dimmed">
                            <Text component="span" fw={600}>{t('assignments.lastUpdated')}</Text>{' '}
                            {formatDate(submission.updated_at || '')}
                          </Text>
                        </div>
                      )}
                    </Stack>
                  </Paper>
                </Collapse>
              </Paper>
            );
          })}
        </Stack>
      )}
      </Container>
    </div>
  );
}
