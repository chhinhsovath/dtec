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
  Table,
  Modal,
  TextInput,
  Select,
  Textarea,
  Switch,
  NumberInput,
  Badge,
  ActionIcon,
  Tooltip,
  Card,
  SimpleGrid,
  Text,
  Loader,
  Center,
  Alert,
  Box,
  Grid
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconArrowLeft,
  IconAlertCircle,
  IconCheck
} from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import Link from 'next/link';

interface Question {
  id: string;
  assignment_id: string;
  question_number: number;
  question_type: 'multiple_choice' | 'short_answer' | 'essay' | 'h5p';
  question_text: string;
  question_description?: string;
  points: number;
  required: boolean;
  is_published: boolean;
  options?: QuestionOption[];
  created_at: string;
  updated_at: string;
}

interface QuestionOption {
  id: string;
  question_id: string;
  option_number: number;
  option_text: string;
  is_correct: boolean;
  explanation?: string;
}

interface Assignment {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  max_score: number;
  due_date: string;
  status: string;
}

export default function TeacherQuestionsPage() {
  const params = useParams();
  const assignmentId = params.id as string;
  const { t, isLoaded } = useTranslation();

  // State management
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    question_text: '',
    question_description: '',
    question_type: 'multiple_choice' as const,
    points: 1,
    required: true,
    is_published: true,
    options: [
      { option_text: '', is_correct: false, explanation: '' },
      { option_text: '', is_correct: false, explanation: '' }
    ]
  });

  const [savingQuestion, setSavingQuestion] = useState(false);
  const [deletingQuestion, setDeletingQuestion] = useState<string | null>(null);

  // Fetch assignment and questions
  useEffect(() => {
    const fetchAssignmentAndQuestions = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get assignment details
        const assignmentRes = await fetch(
          `/api/teacher/assignments/${assignmentId}`,
          {
            headers: { 'x-teacher-id': 'teacher-123' }
          }
        );

        if (!assignmentRes.ok) throw new Error('Failed to fetch assignment');
        const assignmentData = await assignmentRes.json();
        setAssignment(assignmentData.data);

        // Get questions
        const questionsRes = await fetch(
          `/api/teacher/assignments/${assignmentId}/questions`,
          {
            headers: { 'x-teacher-id': 'teacher-123' }
          }
        );

        if (!questionsRes.ok) throw new Error('Failed to fetch questions');
        const questionsData = await questionsRes.json();
        setQuestions(questionsData.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (assignmentId) {
      fetchAssignmentAndQuestions();
    }
  }, [assignmentId]);

  // Handle open modal for creating new question
  const handleNewQuestion = () => {
    setEditingQuestion(null);
    setFormData({
      question_text: '',
      question_description: '',
      question_type: 'multiple_choice',
      points: 1,
      required: true,
      is_published: true,
      options: [
        { option_text: '', is_correct: false, explanation: '' },
        { option_text: '', is_correct: false, explanation: '' }
      ]
    });
    setModalOpen(true);
  };

  // Handle edit question
  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      question_text: question.question_text,
      question_description: question.question_description || '',
      question_type: question.question_type,
      points: question.points,
      required: question.required,
      is_published: question.is_published,
      options: question.options || [
        { option_text: '', is_correct: false, explanation: '' },
        { option_text: '', is_correct: false, explanation: '' }
      ]
    });
    setModalOpen(true);
  };

  // Handle save question
  const handleSaveQuestion = async () => {
    try {
      setSavingQuestion(true);
      setError(null);

      if (!formData.question_text.trim()) {
        setError(t('assignments.questionTextPlaceholder'));
        return;
      }

      const method = editingQuestion ? 'PUT' : 'POST';
      const url = editingQuestion
        ? `/api/teacher/assignments/${assignmentId}/questions/${editingQuestion.id}`
        : `/api/teacher/assignments/${assignmentId}/questions`;

      const requestBody = {
        questionText: formData.question_text,
        questionDescription: formData.question_description,
        questionType: formData.question_type,
        points: formData.points,
        required: formData.required,
        isPublished: formData.is_published,
        ...(formData.question_type === 'multiple_choice' && {
          options: formData.options
            .filter(o => o.option_text.trim())
            .map((o, idx) => ({
              option_text: o.option_text,
              is_correct: o.is_correct,
              explanation: o.explanation
            }))
        })
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-teacher-id': 'teacher-123'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save question');
      }

      // Refresh questions
      const questionsRes = await fetch(
        `/api/teacher/assignments/${assignmentId}/questions`,
        {
          headers: { 'x-teacher-id': 'teacher-123' }
        }
      );

      if (questionsRes.ok) {
        const questionsData = await questionsRes.json();
        setQuestions(questionsData.data || []);
      }

      setModalOpen(false);
      setEditingQuestion(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSavingQuestion(false);
    }
  };

  // Handle delete question
  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm(t('assignments.confirmDeleteQuestion'))) return;

    try {
      setDeletingQuestion(questionId);
      const response = await fetch(
        `/api/teacher/assignments/${assignmentId}/questions/${questionId}`,
        {
          method: 'DELETE',
          headers: { 'x-teacher-id': 'teacher-123' }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete question');
      }

      setQuestions(questions.filter(q => q.id !== questionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setDeletingQuestion(null);
    }
  };

  // Handle option change
  const handleOptionChange = (
    index: number,
    field: 'option_text' | 'is_correct' | 'explanation',
    value: any
  ) => {
    const newOptions = [...formData.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setFormData({ ...formData, options: newOptions });
  };

  // Add new option
  const handleAddOption = () => {
    setFormData({
      ...formData,
      options: [
        ...formData.options,
        { option_text: '', is_correct: false, explanation: '' }
      ]
    });
  };

  // Remove option
  const handleRemoveOption = (index: number) => {
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index)
    });
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

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <Container size="lg" py="xl">
      {/* Header */}
      <Group justify="space-between" mb="xl">
        <div>
          <Group mb="md">
            <Link href={`/dashboard/teacher/assignments`}>
              <ActionIcon variant="subtle" size="lg">
                <IconArrowLeft size={20} />
              </ActionIcon>
            </Link>
            <div>
              <Title order={2}>{assignment.title}</Title>
              <Text size="sm" c="dimmed">
                {assignment.description}
              </Text>
            </div>
          </Group>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={handleNewQuestion}
          size="md"
        >
          {t('assignments.addQuestion')}
        </Button>
      </Group>

      {/* Error message */}
      {error && (
        <Alert icon={<IconAlertCircle />} title={t('common.error')} color="red" mb="md">
          {error}
        </Alert>
      )}

      {/* Stats */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
        <Card withBorder padding="lg" radius="md">
          <Stack gap={8}>
            <Text size="sm" c="dimmed" fw={500}>
              {t('assignments.questions')}
            </Text>
            <Text size="xl" fw="bold">
              {questions.length}
            </Text>
          </Stack>
        </Card>
        <Card withBorder padding="lg" radius="md">
          <Stack gap={8}>
            <Text size="sm" c="dimmed" fw={500}>
              {t('assignments.totalPoints')}
            </Text>
            <Text size="xl" fw="bold">
              {totalPoints}
            </Text>
          </Stack>
        </Card>
        <Card withBorder padding="lg" radius="md">
          <Stack gap={8}>
            <Text size="sm" c="dimmed" fw={500}>
              {t('common.status')}
            </Text>
            <Badge
              size="lg"
              variant="filled"
              color={assignment.status === 'published' ? 'green' : 'yellow'}
            >
              {assignment.status === 'published'
                ? t('assignments.published')
                : t('assignments.unpublished')}
            </Badge>
          </Stack>
        </Card>
      </SimpleGrid>

      {/* Questions table */}
      <Paper withBorder radius="md" overflow="hidden">
        {questions.length === 0 ? (
          <Center p="xl" minH={300}>
            <Stack align="center" gap="md">
              <Text c="dimmed" size="lg">
                {t('assignments.noResponses')}
              </Text>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={handleNewQuestion}
              >
                {t('assignments.addQuestion')}
              </Button>
            </Stack>
          </Center>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('assignments.questionNumber')}</Table.Th>
                <Table.Th>{t('assignments.questionText')}</Table.Th>
                <Table.Th>{t('assignments.questionType')}</Table.Th>
                <Table.Th w={80} ta="center">
                  {t('assignments.points')}
                </Table.Th>
                <Table.Th w={100} ta="center">
                  {t('common.status')}
                </Table.Th>
                <Table.Th w={120} ta="center">
                  {t('common.actions')}
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {questions.map((question) => (
                <Table.Tr key={question.id}>
                  <Table.Td fw={500}>{question.question_number}</Table.Td>
                  <Table.Td>
                    <Tooltip label={question.question_description} multiline>
                      <Text size="sm" truncate maw={300}>
                        {question.question_text}
                      </Text>
                    </Tooltip>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" size="sm">
                      {t(
                        `assignments.questionTypes.${question.question_type}` as any
                      )}
                    </Badge>
                  </Table.Td>
                  <Table.Td ta="center">{question.points}</Table.Td>
                  <Table.Td ta="center">
                    <Badge
                      size="sm"
                      variant="filled"
                      color={question.is_published ? 'blue' : 'gray'}
                    >
                      {question.is_published
                        ? t('assignments.published')
                        : t('assignments.unpublished')}
                    </Badge>
                  </Table.Td>
                  <Table.Td ta="center">
                    <Group gap={4} justify="center">
                      <Tooltip label={t('common.edit')}>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="blue"
                          onClick={() => handleEditQuestion(question)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label={t('common.delete')}>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="red"
                          loading={deletingQuestion === question.id}
                          onClick={() => handleDeleteQuestion(question.id)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      {/* Question modal */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingQuestion
            ? t('assignments.editQuestion')
            : t('assignments.createQuestion')
        }
        size="xl"
        scrollAreaComponent={Textarea}
      >
        <Stack gap="md">
          {/* Question text */}
          <TextInput
            label={t('assignments.questionText')}
            placeholder={t('assignments.questionTextPlaceholder')}
            value={formData.question_text}
            onChange={(e) =>
              setFormData({ ...formData, question_text: e.currentTarget.value })
            }
            required
          />

          {/* Question description */}
          <Textarea
            label={t('assignments.questionDescription')}
            placeholder={t('assignments.questionDescriptionPlaceholder')}
            value={formData.question_description}
            onChange={(e) =>
              setFormData({
                ...formData,
                question_description: e.currentTarget.value
              })
            }
            rows={3}
          />

          {/* Question type */}
          <Select
            label={t('assignments.questionType')}
            value={formData.question_type}
            onChange={(value) => {
              if (value) {
                setFormData({
                  ...formData,
                  question_type: value as any
                });
              }
            }}
            data={[
              {
                value: 'multiple_choice',
                label: t('assignments.questionTypes.multiple_choice')
              },
              {
                value: 'short_answer',
                label: t('assignments.questionTypes.short_answer')
              },
              {
                value: 'essay',
                label: t('assignments.questionTypes.essay')
              },
              {
                value: 'h5p',
                label: t('assignments.questionTypes.h5p')
              }
            ]}
          />

          {/* Points */}
          <NumberInput
            label={t('assignments.points')}
            placeholder={t('assignments.pointsPlaceholder')}
            value={formData.points}
            onChange={(value) =>
              setFormData({ ...formData, points: value || 1 })
            }
            min={0.5}
            max={100}
            step={0.5}
          />

          {/* Required checkbox */}
          <Switch
            label={t('assignments.required')}
            checked={formData.required}
            onChange={(e) =>
              setFormData({ ...formData, required: e.currentTarget.checked })
            }
          />

          {/* Published checkbox */}
          <Switch
            label={t('assignments.published')}
            checked={formData.is_published}
            onChange={(e) =>
              setFormData({ ...formData, is_published: e.currentTarget.checked })
            }
          />

          {/* MCQ Options */}
          {formData.question_type === 'multiple_choice' && (
            <Box>
              <Group justify="space-between" mb="md">
                <Text fw={500}>{t('assignments.options')}</Text>
                <Button
                  size="xs"
                  variant="light"
                  onClick={handleAddOption}
                  leftSection={<IconPlus size={14} />}
                >
                  {t('assignments.addOption')}
                </Button>
              </Group>

              <Stack gap="md">
                {formData.options.map((option, idx) => (
                  <Paper key={idx} p="md" withBorder radius="md">
                    <Stack gap="sm">
                      <TextInput
                        label={`${t('assignments.optionText')} ${idx + 1}`}
                        placeholder={t('assignments.optionTextPlaceholder')}
                        value={option.option_text}
                        onChange={(e) =>
                          handleOptionChange(
                            idx,
                            'option_text',
                            e.currentTarget.value
                          )
                        }
                      />

                      <Textarea
                        label={t('assignments.explanation')}
                        placeholder={t('assignments.explanationPlaceholder')}
                        value={option.explanation || ''}
                        onChange={(e) =>
                          handleOptionChange(
                            idx,
                            'explanation',
                            e.currentTarget.value
                          )
                        }
                        rows={2}
                      />

                      <Group justify="space-between">
                        <Switch
                          label={t('assignments.isCorrect')}
                          checked={option.is_correct}
                          onChange={(e) =>
                            handleOptionChange(
                              idx,
                              'is_correct',
                              e.currentTarget.checked
                            )
                          }
                        />
                        {formData.options.length > 2 && (
                          <ActionIcon
                            color="red"
                            variant="subtle"
                            onClick={() => handleRemoveOption(idx)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        )}
                      </Group>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Box>
          )}

          {/* Action buttons */}
          <Group justify="flex-end" mt="lg">
            <Button
              variant="default"
              onClick={() => setModalOpen(false)}
              disabled={savingQuestion}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSaveQuestion}
              loading={savingQuestion}
              leftSection={<IconCheck size={16} />}
            >
              {t('assignments.saveQuestion')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
