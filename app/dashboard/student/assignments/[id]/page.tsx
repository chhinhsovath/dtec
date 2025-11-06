'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Radio,
  Textarea,
  TextInput,
  Card,
  Progress,
  Modal,
  Badge,
  ActionIcon,
  Tooltip,
  SimpleGrid,
  Box,
  Divider
} from '@mantine/core';
import {
  IconArrowLeft,
  IconAlertCircle,
  IconCheck,
  IconClock,
  IconFileText,
  IconQuestionMark,
  IconSend
} from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import Link from 'next/link';

interface Question {
  id: string;
  question_number: number;
  question_type: 'multiple_choice' | 'short_answer' | 'essay' | 'h5p';
  question_text: string;
  question_description?: string;
  points: number;
  required: boolean;
  options?: QuestionOption[];
}

interface QuestionOption {
  id: string;
  option_number: number;
  option_text: string;
}

interface Assignment {
  id: string;
  title: string;
  description?: string;
  max_score: number;
  due_date: string;
  status: string;
  course_name: string;
}

interface Response {
  [questionId: string]: {
    responseText?: string;
    selectedOptionId?: string;
  };
}

export default function StudentAssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.id as string;
  const { t, isLoaded } = useTranslation();

  // State management
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Response>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitConfirmModal, setSubmitConfirmModal] = useState(false);
  const [autoSaveTime, setAutoSaveTime] = useState<string | null>(null);

  // Fetch assignment and questions
  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/student/assignments/${assignmentId}`, {
          headers: { 'x-student-id': 'student-123' }
        });

        if (!res.ok) throw new Error('Failed to fetch assignment');
        const data = await res.json();

        setAssignment(data.data.assignment);
        setQuestions(data.data.questions);

        // Initialize responses from existing submission
        if (data.data.existingSubmission?.responses) {
          const initialResponses: Response = {};
          data.data.existingSubmission.responses.forEach((r: any) => {
            initialResponses[r.question_id] = {
              responseText: r.response_text,
              selectedOptionId: r.selected_option_id
            };
          });
          setResponses(initialResponses);
          setSubmitted(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (assignmentId) {
      fetchAssignment();
    }
  }, [assignmentId]);

  // Auto-save responses
  useEffect(() => {
    if (Object.keys(responses).length === 0 || submitted) return;

    const timer = setTimeout(() => {
      // In a real implementation, you would save to backend here
      const now = new Date().toLocaleTimeString('km-KH', {
        hour: '2-digit',
        minute: '2-digit'
      });
      setAutoSaveTime(now);
    }, 1000);

    return () => clearTimeout(timer);
  }, [responses, submitted]);

  // Handle response change
  const handleResponseChange = (
    questionId: string,
    field: 'responseText' | 'selectedOptionId',
    value: string
  ) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value
      }
    }));
  };

  // Handle submit
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Validate required questions are answered
      const unansweredRequired = questions
        .filter((q) => q.required)
        .filter((q) => {
          const resp = responses[q.id];
          if (q.question_type === 'multiple_choice') {
            return !resp?.selectedOptionId;
          }
          return !resp?.responseText?.trim();
        });

      if (unansweredRequired.length > 0) {
        setError(
          `${t('common.requiredFields')}: ${unansweredRequired.map((q) => `Q${q.question_number}`).join(', ')}`
        );
        return;
      }

      // Format responses for API
      const requestResponses = Object.entries(responses).map(
        ([questionId, response]) => ({
          questionId,
          responseText: response.responseText || null,
          selectedOptionId: response.selectedOptionId || null
        })
      );

      const res = await fetch(
        `/api/student/assignments/${assignmentId}/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-student-id': 'student-123'
          },
          body: JSON.stringify({ responses: requestResponses })
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit assignment');
      }

      setSubmitted(true);
      setSubmitConfirmModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
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
      <Container size="lg" py="xl">
        <Center minH={400}>
          <Loader />
        </Center>
      </Container>
    );
  }

  if (!assignment) {
    return (
      <Container size="lg" py="xl">
        <Alert icon={<IconAlertCircle />} title={t('common.error')} color="red">
          {t('assignments.noAssignments')}
        </Alert>
      </Container>
    );
  }

  const answeredCount = Object.keys(responses).length;
  const progressPercent = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <Container size="lg" py="xl">
      {/* Header */}
      <Group justify="space-between" mb="xl">
        <Group>
          <Link href={`/dashboard/student/assignments`}>
            <ActionIcon variant="subtle" size="lg">
              <IconArrowLeft size={20} />
            </ActionIcon>
          </Link>
          <div>
            <Title order={2}>{assignment.title}</Title>
            <Text size="sm" c="dimmed">
              {assignment.course_name}
            </Text>
          </div>
        </Group>
      </Group>

      {/* Error message */}
      {error && (
        <Alert
          icon={<IconAlertCircle />}
          title={t('common.error')}
          color="red"
          mb="md"
          withCloseButton
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Submitted message */}
      {submitted && (
        <Alert icon={<IconCheck />} title={t('common.success')} color="green" mb="md">
          {t('assignments.submitted')}
        </Alert>
      )}

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
        {/* Assignment info */}
        <Card withBorder padding="lg" radius="md">
          <Stack gap={8}>
            <Text size="sm" c="dimmed" fw={500}>
              {t('assignments.dueDate')}
            </Text>
            <Text size="sm">
              {new Date(assignment.due_date).toLocaleDateString('km-KH')}
            </Text>
          </Stack>
        </Card>

        <Card withBorder padding="lg" radius="md">
          <Stack gap={8}>
            <Text size="sm" c="dimmed" fw={500}>
              {t('assignments.totalPoints')}
            </Text>
            <Text size="sm" fw="bold">
              {totalPoints}
            </Text>
          </Stack>
        </Card>

        <Card withBorder padding="lg" radius="md">
          <Stack gap={8}>
            <Text size="sm" c="dimmed" fw={500}>
              {t('assignments.questions')}
            </Text>
            <Text size="sm">
              {answeredCount} / {questions.length}
            </Text>
          </Stack>
        </Card>

        <Card withBorder padding="lg" radius="md">
          <Stack gap={8}>
            <Text size="sm" c="dimmed" fw={500}>
              {t('common.status')}
            </Text>
            <Badge
              size="sm"
              variant="filled"
              color={submitted ? 'green' : 'blue'}
            >
              {submitted ? t('assignments.submitted') : t('assignments.pending')}
            </Badge>
          </Stack>
        </Card>
      </SimpleGrid>

      {/* Progress */}
      <Paper withBorder padding="md" radius="md" mb="xl">
        <Stack gap="md">
          <Group justify="space-between">
            <Text fw={500}>{t('common.progress')}</Text>
            <Text size="sm" c="dimmed">
              {Math.round(progressPercent)}%
            </Text>
          </Group>
          <Progress value={progressPercent} size="md" radius="md" />
        </Stack>
      </Paper>

      {/* Questions */}
      <Stack gap="lg" mb="xl">
        {questions.map((question, idx) => {
          const response = responses[question.id];
          const isAnswered =
            question.question_type === 'multiple_choice'
              ? !!response?.selectedOptionId
              : !!response?.responseText?.trim();

          return (
            <Paper key={question.id} withBorder padding="lg" radius="md">
              {/* Question header */}
              <Group justify="space-between" mb="md">
                <Stack gap={4}>
                  <Group gap="sm">
                    <Badge size="lg" variant="light">
                      Q{question.question_number}
                    </Badge>
                    <Title order={4}>{question.question_text}</Title>
                  </Group>
                  {question.question_description && (
                    <Text size="sm" c="dimmed" ml={50}>
                      {question.question_description}
                    </Text>
                  )}
                </Stack>
                <Stack align="flex-end" gap={4}>
                  <Text size="sm" fw={500}>
                    {question.points} {t('assignments.points')}
                  </Text>
                  {isAnswered && (
                    <Badge size="sm" color="green" variant="filled">
                      <IconCheck size={12} style={{ marginRight: 4 }} />
                      {t('common.ok')}
                    </Badge>
                  )}
                  {question.required && !isAnswered && (
                    <Badge size="sm" color="red" variant="light">
                      {t('common.required')}
                    </Badge>
                  )}
                </Stack>
              </Group>

              {/* Question type specific inputs */}
              {question.question_type === 'multiple_choice' && (
                <Radio.Group
                  value={response?.selectedOptionId || ''}
                  onChange={(value) =>
                    handleResponseChange(question.id, 'selectedOptionId', value)
                  }
                  disabled={submitted}
                >
                  <Stack gap="md" pt="md">
                    {question.options?.map((option) => (
                      <Radio
                        key={option.id}
                        value={option.id}
                        label={option.option_text}
                        description={`${t('assignments.optionText')} ${option.option_number}`}
                      />
                    ))}
                  </Stack>
                </Radio.Group>
              )}

              {question.question_type === 'short_answer' && (
                <TextInput
                  placeholder={t('assignments.optionTextPlaceholder')}
                  value={response?.responseText || ''}
                  onChange={(e) =>
                    handleResponseChange(
                      question.id,
                      'responseText',
                      e.currentTarget.value
                    )
                  }
                  disabled={submitted}
                  mt="md"
                />
              )}

              {question.question_type === 'essay' && (
                <Textarea
                  placeholder={t('assignments.optionTextPlaceholder')}
                  value={response?.responseText || ''}
                  onChange={(e) =>
                    handleResponseChange(
                      question.id,
                      'responseText',
                      e.currentTarget.value
                    )
                  }
                  disabled={submitted}
                  rows={6}
                  mt="md"
                />
              )}

              {question.question_type === 'h5p' && (
                <Alert icon={<IconFileText />} color="blue" mt="md">
                  <Text size="sm">
                    H5P Content - {t('statusMessage.initializing')}
                  </Text>
                </Alert>
              )}
            </Paper>
          );
        })}
      </Stack>

      {/* Auto-save indicator */}
      {autoSaveTime && !submitted && (
        <Text size="xs" c="dimmed" align="center" mb="md">
          <IconClock size={12} style={{ marginRight: 4, display: 'inline' }} />
          {t('statusMessage.saving')} {autoSaveTime}
        </Text>
      )}

      {/* Submit button */}
      {!submitted && (
        <Group justify="center">
          <Button
            size="lg"
            onClick={() => setSubmitConfirmModal(true)}
            disabled={questions.length === 0}
            leftSection={<IconSend size={16} />}
          >
            {t('common.submit')}
          </Button>
        </Group>
      )}

      {/* Submit confirmation modal */}
      <Modal
        opened={submitConfirmModal}
        onClose={() => setSubmitConfirmModal(false)}
        title={t('common.confirmation')}
        centered
      >
        <Stack gap="md">
          <Text>
            {t('common.confirmDelete')}
          </Text>

          {/* Check for unanswered required questions */}
          {questions.some((q) => {
            if (!q.required) return false;
            const resp = responses[q.id];
            if (q.question_type === 'multiple_choice') {
              return !resp?.selectedOptionId;
            }
            return !resp?.responseText?.trim();
          }) && (
            <Alert icon={<IconAlertCircle />} color="yellow" title={t('common.warning')}>
              <Text size="sm">
                {t('assignments.confirmDeleteQuestion')}
              </Text>
            </Alert>
          )}

          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => setSubmitConfirmModal(false)}
              disabled={submitting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              loading={submitting}
              leftSection={<IconCheck size={16} />}
            >
              {t('common.submit')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
