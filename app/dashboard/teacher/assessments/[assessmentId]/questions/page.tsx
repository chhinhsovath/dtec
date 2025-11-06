'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getSession, clearSession } from '@/lib/auth/client-auth';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  Container,
  Group,
  Button,
  TextInput,
  Textarea,
  Alert,
  Flex,
  Badge,
  Text,
  Stack,
  Center,
  ActionIcon,
  Title,
  Loader,
  Modal,
  Card,
  Select,
  NumberInput,
  Grid,
} from '@mantine/core';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconLogout,
  IconArrowUp,
  IconArrowDown,
  IconX,
} from '@tabler/icons-react';

interface Question {
  id: string;
  assessment_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'short_answer' | 'essay';
  points: number;
  order_position: number;
  explanation: string | null;
  options?: QuestionOption[];
  created_at: string;
  updated_at: string;
}

interface QuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  order_position: number;
  created_at: string;
  updated_at: string;
}

interface FormData {
  question_text: string;
  question_type: 'multiple_choice' | 'short_answer' | 'essay';
  points: number | string;
  explanation: string;
  options: { text: string; is_correct: boolean }[];
}

export default function QuestionsPage() {
  const router = useRouter();
  const params = useParams();
  const assessmentId = params.assessmentId as string;
  const { t, language, changeLanguage, isLoaded } = useTranslation();

  const [session, setSession] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    question_text: '',
    question_type: 'multiple_choice',
    points: 1,
    explanation: '',
    options: [
      { text: '', is_correct: true },
      { text: '', is_correct: false },
    ],
  });

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const sess = getSession();
      if (!sess || sess.role !== 'teacher') {
        router.push('/auth/login');
        return;
      }
      setSession(sess);
      fetchQuestions(sess.id);
    };

    if (isLoaded) {
      checkAuth();
    }
  }, [router, isLoaded]);

  const fetchQuestions = async (teacherId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/teacher/assessments/${assessmentId}/questions`,
        {
          headers: { 'x-teacher-id': teacherId },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch questions');
      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions = questions.filter(q =>
    q.question_text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (question?: Question) => {
    if (question) {
      setEditingId(question.id);
      setFormData({
        question_text: question.question_text,
        question_type: question.question_type,
        points: question.points,
        explanation: question.explanation || '',
        options: question.options
          ? question.options.map(o => ({
              text: o.option_text,
              is_correct: o.is_correct,
            }))
          : [
              { text: '', is_correct: true },
              { text: '', is_correct: false },
            ],
      });
    } else {
      setEditingId(null);
      setFormData({
        question_text: '',
        question_type: 'multiple_choice',
        points: 1,
        explanation: '',
        options: [
          { text: '', is_correct: true },
          { text: '', is_correct: false },
        ],
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!formData.question_text || !formData.question_type) {
      setError(t('common.requiredFields'));
      return;
    }

    if (
      formData.question_type === 'multiple_choice' &&
      formData.options.some(o => !o.text)
    ) {
      setError('All options must have text');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const url = editingId
        ? `/api/teacher/assessments/${assessmentId}/questions/${editingId}`
        : `/api/teacher/assessments/${assessmentId}/questions`;
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-teacher-id': session?.id || '',
        },
        body: JSON.stringify({
          questionText: formData.question_text,
          questionType: formData.question_type,
          points: parseInt(formData.points.toString()),
          explanation: formData.explanation || null,
          options: formData.options,
        }),
      });

      if (!response.ok) throw new Error('Failed to save question');

      await fetchQuestions(session?.id);
      handleCloseModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirmDelete'))) return;

    try {
      setError(null);
      const response = await fetch(
        `/api/teacher/assessments/${assessmentId}/questions/${id}`,
        {
          method: 'DELETE',
          headers: { 'x-teacher-id': session?.id || '' },
        }
      );

      if (!response.ok) throw new Error('Failed to delete question');

      setQuestions(questions.filter(q => q.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    }
  };

  const handleLogout = () => {
    clearSession();
    router.push('/');
  };

  if (loading || !session) {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Loader />
      </Center>
    );
  }

  if (!isLoaded) {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Container size="xl" py="md">
          <Group justify="space-between" align="center">
            <div>
              <Button
                variant="subtle"
                onClick={() => router.back()}
                mb="sm"
              >
                ← Back
              </Button>
              <Title order={1}>Manage Questions</Title>
            </div>
            <Group gap="md">
              <Group gap="xs">
                <Button
                  onClick={() => changeLanguage('en')}
                  variant={language === 'en' ? 'filled' : 'light'}
                  size="xs"
                >
                  EN
                </Button>
                <Button
                  onClick={() => changeLanguage('km')}
                  variant={language === 'km' ? 'filled' : 'light'}
                  size="xs"
                >
                  ខ្មែរ
                </Button>
              </Group>
              <Button onClick={handleLogout} color="red" leftSection={<IconLogout size={16} />}>
                {t('common.logout')}
              </Button>
            </Group>
          </Group>
        </Container>
      </div>

      {/* Main Content */}
      <Container size="xl" py="xl">
        {error && (
          <Alert color="red" mb="lg" title="Error">
            {error}
          </Alert>
        )}

        {/* Toolbar */}
        <Stack gap="md" mb="xl">
          <Group justify="space-between" align="flex-start">
            <TextInput
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftSection={<IconSearch size={16} />}
              style={{ flex: 1, maxWidth: '300px' }}
            />
            <Button onClick={() => handleOpenModal()} leftSection={<IconPlus size={16} />}>
              Add Question
            </Button>
          </Group>

          <Text size="sm" c="dimmed">
            {filteredQuestions.length} question{filteredQuestions.length !== 1 ? 's' : ''}
          </Text>
        </Stack>

        {/* Questions List */}
        {questions.length === 0 ? (
          <Stack align="center" justify="center" style={{ minHeight: '300px' }}>
            <Text size="lg">{t('common.noResults')}</Text>
            <Button onClick={() => handleOpenModal()} leftSection={<IconPlus size={16} />}>
              Add First Question
            </Button>
          </Stack>
        ) : filteredQuestions.length === 0 ? (
          <Stack align="center" justify="center" style={{ minHeight: '300px' }}>
            <Text size="lg">{t('common.noResults')}</Text>
          </Stack>
        ) : (
          <Stack gap="md">
            {filteredQuestions.map((question, index) => (
              <Card key={question.id} shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between" mb="md">
                  <div style={{ flex: 1 }}>
                    <Group gap="xs" mb="xs">
                      <Badge size="lg">{index + 1}</Badge>
                      <Badge>{question.question_type.replace('_', ' ')}</Badge>
                      <Badge variant="light">{question.points} pts</Badge>
                    </Group>
                    <Text fw={500} mb="xs">
                      {question.question_text}
                    </Text>
                    {question.explanation && (
                      <Text size="sm" c="dimmed">
                        Explanation: {question.explanation}
                      </Text>
                    )}
                  </div>
                  <Group gap={4}>
                    <ActionIcon
                      size="sm"
                      variant="light"
                      onClick={() => handleOpenModal(question)}
                    >
                      <IconEdit size={14} />
                    </ActionIcon>
                    <ActionIcon
                      size="sm"
                      variant="light"
                      color="red"
                      onClick={() => handleDelete(question.id)}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Group>
                </Group>

                {question.options && question.options.length > 0 && (
                  <Stack gap="xs" ml="md">
                    <Text size="sm" fw={500} c="dimmed">
                      Options:
                    </Text>
                    {question.options.map((option, idx) => (
                      <Group key={option.id} gap="xs">
                        <Badge size="sm" variant="outline">
                          {String.fromCharCode(65 + idx)}
                        </Badge>
                        <Text size="sm">{option.option_text}</Text>
                        {option.is_correct && (
                          <Badge color="green" size="sm">
                            Correct
                          </Badge>
                        )}
                      </Group>
                    ))}
                  </Stack>
                )}
              </Card>
            ))}
          </Stack>
        )}
      </Container>

      {/* Modal */}
      <Modal
        opened={isModalOpen}
        onClose={handleCloseModal}
        title={editingId ? 'Edit Question' : 'Add Question'}
        size="lg"
        centered
      >
        <Stack gap="lg">
          <Select
            label="Question Type"
            placeholder="Select type"
            data={[
              { value: 'multiple_choice', label: 'Multiple Choice' },
              { value: 'short_answer', label: 'Short Answer' },
              { value: 'essay', label: 'Essay' },
            ]}
            value={formData.question_type}
            onChange={(value) =>
              setFormData({
                ...formData,
                question_type: (value as any) || 'multiple_choice',
              })
            }
            required
            disabled={submitting}
          />

          <Textarea
            label="Question Text"
            placeholder="Enter your question"
            value={formData.question_text}
            onChange={(e) =>
              setFormData({ ...formData, question_text: e.target.value })
            }
            rows={4}
            required
            disabled={submitting}
          />

          <NumberInput
            label="Points"
            value={formData.points}
            onChange={(value) =>
              setFormData({ ...formData, points: value || 1 })
            }
            min={0}
            disabled={submitting}
          />

          <Textarea
            label="Explanation (optional)"
            placeholder="Explain the answer"
            value={formData.explanation}
            onChange={(e) =>
              setFormData({ ...formData, explanation: e.target.value })
            }
            rows={3}
            disabled={submitting}
          />

          {formData.question_type === 'multiple_choice' && (
            <div>
              <Group justify="space-between" mb="sm">
                <Text fw={500} size="sm">
                  Options
                </Text>
                <Button
                  size="xs"
                  variant="light"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      options: [
                        ...formData.options,
                        { text: '', is_correct: false },
                      ],
                    })
                  }
                  disabled={submitting}
                >
                  Add Option
                </Button>
              </Group>

              <Stack gap="sm">
                {formData.options.map((option, idx) => (
                  <Group key={idx} gap="xs">
                    <TextInput
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      value={option.text}
                      onChange={(e) => {
                        const newOptions = [...formData.options];
                        newOptions[idx].text = e.target.value;
                        setFormData({ ...formData, options: newOptions });
                      }}
                      style={{ flex: 1 }}
                      disabled={submitting}
                    />
                    <Button
                      size="xs"
                      variant={option.is_correct ? 'filled' : 'light'}
                      color={option.is_correct ? 'green' : 'gray'}
                      onClick={() => {
                        const newOptions = [...formData.options];
                        newOptions.forEach((o, i) => {
                          o.is_correct = i === idx;
                        });
                        setFormData({ ...formData, options: newOptions });
                      }}
                      disabled={submitting}
                    >
                      Correct
                    </Button>
                    {formData.options.length > 2 && (
                      <ActionIcon
                        color="red"
                        variant="light"
                        onClick={() => {
                          const newOptions = formData.options.filter(
                            (_, i) => i !== idx
                          );
                          setFormData({ ...formData, options: newOptions });
                        }}
                        disabled={submitting}
                      >
                        <IconX size={14} />
                      </ActionIcon>
                    )}
                  </Group>
                ))}
              </Stack>
            </div>
          )}

          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={handleCloseModal} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={submitting}>
              {submitting ? 'Saving...' : 'Save'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}
