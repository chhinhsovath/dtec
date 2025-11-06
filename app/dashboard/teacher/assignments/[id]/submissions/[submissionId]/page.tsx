'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Container,
  Paper,
  Title,
  Button,
  Group,
  Stack,
  Text,
  Loader,
  Center,
  Alert,
  NumberInput,
  Textarea,
  ActionIcon,
  Tooltip,
  Card,
  SimpleGrid,
  LinearProgress,
  Badge,
  Divider,
  Box
} from '@mantine/core';
import {
  IconArrowLeft,
  IconAlertCircle,
  IconCheck,
  IconUser,
  IconCalendar,
  IconCheck
} from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import Link from 'next/link';

interface Submission {
  id: string;
  student_id: string;
  assignment_id: string;
  status: string;
  submitted_at: string;
  user_id: string;
  full_name: string;
  email: string;
}

interface Response {
  id: string;
  question_id: string;
  question_number: number;
  question_type: string;
  question_text: string;
  points: number;
  response_text?: string;
  selected_option_id?: string;
  selected_option_text?: string;
  score?: number;
  is_auto_graded: boolean;
  teacher_feedback?: string;
  submitted_at: string;
  graded_at?: string;
}

interface GradingStats {
  totalQuestions: number;
  gradedQuestions: number;
  totalPossiblePoints: number;
  totalEarnedPoints: number;
  percentageGraded: string;
}

interface GradeUpdate {
  responseId: string;
  score?: number;
  feedback?: string;
}

export default function TeacherGradingPage() {
  const params = useParams();
  const assignmentId = params.id as string;
  const submissionId = params.submissionId as string;
  const { t, isLoaded } = useTranslation();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [stats, setStats] = useState<GradingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [gradeUpdates, setGradeUpdates] = useState<GradeUpdate[]>([]);

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/teacher/assignments/${assignmentId}/submissions/${submissionId}/responses`,
          { headers: { 'x-teacher-id': 'teacher-123' } }
        );

        if (!res.ok) throw new Error('Failed to fetch responses');
        const data = await res.json();

        setSubmission(data.data.submission);
        setResponses(data.data.responses);
        setStats(data.data.stats);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (assignmentId && submissionId) {
      fetchResponses();
    }
  }, [assignmentId, submissionId]);

  const handleScoreChange = (responseId: string, score: number | undefined) => {
    setGradeUpdates((prev) => {
      const existing = prev.find((u) => u.responseId === responseId);
      if (existing) {
        return prev.map((u) =>
          u.responseId === responseId ? { ...u, score } : u
        );
      }
      return [...prev, { responseId, score }];
    });

    setResponses((prev) =>
      prev.map((r) =>
        r.id === responseId ? { ...r, score } : r
      )
    );
  };

  const handleFeedbackChange = (responseId: string, feedback: string) => {
    setGradeUpdates((prev) => {
      const existing = prev.find((u) => u.responseId === responseId);
      if (existing) {
        return prev.map((u) =>
          u.responseId === responseId ? { ...u, feedback } : u
        );
      }
      return [...prev, { responseId, feedback }];
    });

    setResponses((prev) =>
      prev.map((r) =>
        r.id === responseId ? { ...r, teacher_feedback: feedback } : r
      )
    );
  };

  const handleSaveGrades = async () => {
    try {
      setSaving(true);
      setError(null);

      const res = await fetch(
        `/api/teacher/assignments/${assignmentId}/submissions/${submissionId}/responses`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-teacher-id': 'teacher-123'
          },
          body: JSON.stringify({
            responseUpdates: gradeUpdates.map((update) => ({
              responseId: update.responseId,
              score: update.score,
              feedback: update.feedback
            }))
          })
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save grades');
      }

      setGradeUpdates([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded) {
    return (
      <Center minH="100vh">
        <Loader />
      </Center>
    );
  }

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Center minH={400}>
          <Loader />
        </Center>
      </Container>
    );
  }

  if (!submission || !stats) {
    return (
      <Container size="xl" py="xl">
        <Alert icon={<IconAlertCircle />} title={t('common.error')} color="red">
          {t('assignments.noResponses')}
        </Alert>
      </Container>
    );
  }

  const gradePercentage = stats.totalPossiblePoints > 0
    ? (stats.totalEarnedPoints / stats.totalPossiblePoints) * 100
    : 0;

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Group>
          <Link href={`/dashboard/teacher/assignments/${assignmentId}`}>
            <ActionIcon variant="subtle" size="lg">
              <IconArrowLeft size={20} />
            </ActionIcon>
          </Link>
          <div>
            <Title order={2}>{t('assignments.grading') || 'Grading'}</Title>
            <Text size="sm" c="dimmed">
              {submission.full_name} ({submission.email})
            </Text>
          </div>
        </Group>
        {gradeUpdates.length > 0 && (
          <Button
            onClick={handleSaveGrades}
            loading={saving}
            leftSection={<IconCheck size={16} />}
          >
            {t('common.save')}
          </Button>
        )}
      </Group>

      {error && (
        <Alert
          icon={<IconAlertCircle />}
          title={t('common.error')}
          color="red"
          mb="md"
        >
          {error}
        </Alert>
      )}

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
        <Card withBorder padding="lg" radius="md">
          <Stack gap={8}>
            <Text size="sm" c="dimmed" fw={500}>
              {t('common.status')}
            </Text>
            <Badge color="blue" variant="filled">
              {submission.status}
            </Badge>
          </Stack>
        </Card>

        <Card withBorder padding="lg" radius="md">
          <Stack gap={8}>
            <Text size="sm" c="dimmed" fw={500}>
              {t('assignments.submittedAt')}
            </Text>
            <Text size="sm">
              {new Date(submission.submitted_at).toLocaleDateString('km-KH')}
            </Text>
          </Stack>
        </Card>

        <Card withBorder padding="lg" radius="md">
          <Stack gap={8}>
            <Text size="sm" c="dimmed" fw={500}>
              {t('assignments.totalPoints')}
            </Text>
            <Text size="sm" fw="bold">
              {stats.totalEarnedPoints} / {stats.totalPossiblePoints}
            </Text>
          </Stack>
        </Card>

        <Card withBorder padding="lg" radius="md">
          <Stack gap={8}>
            <Text size="sm" c="dimmed" fw={500}>
              Grade
            </Text>
            <Text size="sm" fw="bold">
              {Math.round(gradePercentage)}%
            </Text>
          </Stack>
        </Card>
      </SimpleGrid>

      <Paper withBorder padding="md" radius="md" mb="xl">
        <Stack gap="md">
          <Group justify="space-between">
            <Text fw={500}>{t('assignments.graded')}</Text>
            <Text size="sm" c="dimmed">
              {stats.gradedQuestions} / {stats.totalQuestions}
            </Text>
          </Group>
          <LinearProgress
            value={(stats.gradedQuestions / stats.totalQuestions) * 100}
            size="md"
            radius="md"
          />
        </Stack>
      </Paper>

      <Stack gap="lg" mb="xl">
        {responses.map((response) => {
          const hasUpdate = gradeUpdates.find((u) => u.responseId === response.id);
          const isEssayOrShortAnswer = ['essay', 'short_answer'].includes(
            response.question_type
          );

          return (
            <Paper key={response.id} withBorder padding="lg" radius="md">
              <Group justify="space-between" mb="md">
                <Stack gap={4}>
                  <Group gap="sm">
                    <Badge size="lg" variant="light">
                      Q{response.question_number}
                    </Badge>
                    <Title order={4}>{response.question_text}</Title>
                  </Group>
                </Stack>
                <Stack align="flex-end" gap={4}>
                  <Text size="sm" fw={500}>
                    {response.points} {t('assignments.points')}
                  </Text>
                  {response.is_auto_graded && (
                    <Badge size="sm" color="green" variant="light">
                      Auto-graded
                    </Badge>
                  )}
                </Stack>
              </Group>

              <Divider mb="md" />

              <Stack gap="md" mb="md">
                <div>
                  <Text fw={500} size="sm" mb={8}>
                    {t('assignments.studentResponse')}
                  </Text>
                  <Paper p="md" radius="md" bg="gray.0">
                    {response.question_type === 'multiple_choice' && (
                      <Text size="sm">
                        {response.selected_option_text || 'N/A'}
                      </Text>
                    )}

                    {(response.question_type === 'short_answer' ||
                      response.question_type === 'essay') && (
                      <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                        {response.response_text || 'No answer'}
                      </Text>
                    )}
                  </Paper>
                </div>
              </Stack>

              {isEssayOrShortAnswer && (
                <Stack gap="md">
                  <Divider />
                  <NumberInput
                    label={t('assignments.score')}
                    value={response.score || 0}
                    onChange={(value) =>
                      handleScoreChange(response.id, value || 0)
                    }
                    min={0}
                    max={response.points}
                    step={0.5}
                  />
                  <Textarea
                    label={t('assignments.feedback')}
                    value={response.teacher_feedback || ''}
                    onChange={(e) =>
                      handleFeedbackChange(response.id, e.currentTarget.value)
                    }
                    rows={4}
                  />
                </Stack>
              )}

              {response.question_type === 'multiple_choice' && (
                <Stack gap="md">
                  <Divider />
                  <Group justify="space-between">
                    <Text fw={500} size="sm">
                      Score:
                    </Text>
                    <Badge size="lg" color={response.score === response.points ? 'green' : 'red'}>
                      {response.score} / {response.points}
                    </Badge>
                  </Group>
                </Stack>
              )}
            </Paper>
          );
        })}
      </Stack>

      {gradeUpdates.length > 0 && (
        <Group justify="center">
          <Button
            size="lg"
            onClick={handleSaveGrades}
            loading={saving}
            leftSection={<IconCheck size={16} />}
          >
            {t('common.save')}
          </Button>
        </Group>
      )}
    </Container>
  );
}
