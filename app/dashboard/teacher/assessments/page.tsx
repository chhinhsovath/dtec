'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth/client-auth';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  Container,
  Group,
  Button,
  TextInput,
  Textarea,
  Table,
  Pagination,
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
  Checkbox,
  Grid,
  Tabs,
} from '@mantine/core';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconClock,
  IconQuestionMark,
  IconUsers,
} from '@tabler/icons-react';

interface Assessment {
  id: string;
  course_id: string;
  course_name: string;
  title: string;
  description: string | null;
  assessment_type: 'quiz' | 'assignment' | 'exam';
  total_points: number;
  due_date: string | null;
  allow_retakes: boolean;
  max_attempts: number;
  show_answers: boolean;
  shuffle_questions: boolean;
  time_limit_minutes: number | null;
  is_published: boolean;
  question_count: number;
  submission_count: number;
  created_at: string;
  updated_at: string;
}

interface Course {
  id: string;
  code: string;
  title: string;
}

interface FormData {
  course_id: string;
  title: string;
  description: string;
  assessment_type: 'quiz' | 'assignment' | 'exam';
  total_points: number | string;
  due_date: string;
  allow_retakes: boolean;
  max_attempts: number | string;
  show_answers: boolean;
  shuffle_questions: boolean;
  time_limit_minutes: number | string;
  is_published: boolean;
}

export default function AssessmentsPage() {
  const router = useRouter();
  const { t, isLoaded } = useTranslation();
  const [session, setSession] = useState<any>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    course_id: '',
    title: '',
    description: '',
    assessment_type: 'quiz',
    total_points: 100,
    due_date: '',
    allow_retakes: false,
    max_attempts: 1,
    show_answers: false,
    shuffle_questions: false,
    time_limit_minutes: '',
    is_published: false,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const checkAuth = async () => {
      const sess = getSession();
      if (!sess || sess.role !== 'teacher') {
        router.push('/auth/login');
        return;
      }
      setSession(sess);
      fetchCourses(sess.id);
      fetchAssessments(sess.id);
    };

    if (isLoaded) {
      checkAuth();
    }
  }, [router, isLoaded]);

  const fetchCourses = async (teacherId: string) => {
    try {
      const response = await fetch(`/api/teacher/courses`, {
        headers: { 'x-teacher-id': teacherId },
      });
      if (!response.ok) throw new Error('Failed to fetch courses');
      const data = await response.json();
      setCourses(data.courses || []);
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  };

  const fetchAssessments = async (teacherId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/teacher/assessments`, {
        headers: { 'x-teacher-id': teacherId },
      });
      if (!response.ok) throw new Error('Failed to fetch assessments');
      const data = await response.json();
      setAssessments(data.assessments || []);
      setCurrentPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const filteredAssessments = assessments
    .filter(a =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(a => !selectedCourse || a.course_id === selectedCourse);

  const paginatedAssessments = filteredAssessments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenModal = (assessment?: Assessment) => {
    if (assessment) {
      setEditingId(assessment.id);
      setFormData({
        course_id: assessment.course_id,
        title: assessment.title,
        description: assessment.description || '',
        assessment_type: assessment.assessment_type,
        total_points: assessment.total_points,
        due_date: assessment.due_date ? assessment.due_date.split('T')[0] : '',
        allow_retakes: assessment.allow_retakes,
        max_attempts: assessment.max_attempts,
        show_answers: assessment.show_answers,
        shuffle_questions: assessment.shuffle_questions,
        time_limit_minutes: assessment.time_limit_minutes || '',
        is_published: assessment.is_published,
      });
    } else {
      setEditingId(null);
      setFormData({
        course_id: courses[0]?.id || '',
        title: '',
        description: '',
        assessment_type: 'quiz',
        total_points: 100,
        due_date: '',
        allow_retakes: false,
        max_attempts: 1,
        show_answers: false,
        shuffle_questions: false,
        time_limit_minutes: '',
        is_published: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!formData.course_id || !formData.title || !formData.assessment_type) {
      setError(t('common.requiredFields'));
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const url = editingId
        ? `/api/teacher/assessments/${editingId}`
        : '/api/teacher/assessments';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-teacher-id': session?.id || '',
        },
        body: JSON.stringify({
          courseId: formData.course_id,
          title: formData.title,
          description: formData.description || null,
          assessmentType: formData.assessment_type,
          totalPoints: parseInt(formData.total_points.toString()),
          dueDate: formData.due_date ? new Date(formData.due_date).toISOString() : null,
          allowRetakes: formData.allow_retakes,
          maxAttempts: parseInt(formData.max_attempts.toString()),
          showAnswers: formData.show_answers,
          shuffleQuestions: formData.shuffle_questions,
          timeLimitMinutes: formData.time_limit_minutes
            ? parseInt(formData.time_limit_minutes.toString())
            : null,
          isPublished: formData.is_published,
        }),
      });

      if (!response.ok) throw new Error('Failed to save assessment');
      const result = await response.json();

      if (editingId) {
        setAssessments(
          assessments.map(a => (a.id === editingId ? result.assessment : a))
        );
      } else {
        setAssessments([result.assessment, ...assessments]);
      }

      setIsModalOpen(false);
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
      const response = await fetch(`/api/teacher/assessments/${id}`, {
        method: 'DELETE',
        headers: { 'x-teacher-id': session?.id || '' },
      });

      if (!response.ok) throw new Error('Failed to delete assessment');

      setAssessments(assessments.filter(a => a.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    }
  };

  const handleViewQuestions = (assessmentId: string) => {
    router.push(`/dashboard/teacher/assessments/${assessmentId}/questions`);
  };

  const handleViewSubmissions = (assessmentId: string) => {
    router.push(`/dashboard/teacher/submissions?assessmentId=${assessmentId}`);
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

  const totalPages = Math.ceil(filteredAssessments.length / itemsPerPage);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', paddingTop: '24px' }}>
      <Container size="xl" py="xl">
        <Title order={2} mb="xl">
          Assessments
        </Title>
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
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              leftSection={<IconSearch size={16} />}
              style={{ flex: 1, maxWidth: '300px' }}
            />
            <Button onClick={() => handleOpenModal()} leftSection={<IconPlus size={16} />}>
              New Assessment
            </Button>
          </Group>

          <Select
            label="Filter by Course"
            placeholder="All Courses"
            data={[
              { value: '', label: 'All Courses' },
              ...courses.map(c => ({ value: c.id, label: c.title })),
            ]}
            value={selectedCourse}
            onChange={setSelectedCourse}
            clearable
            style={{ maxWidth: '300px' }}
          />
        </Stack>

        {/* Assessments List */}
        {assessments.length === 0 ? (
          <Stack align="center" justify="center" style={{ minHeight: '300px' }}>
            <Text size="lg">{t('common.noResults')}</Text>
          </Stack>
        ) : filteredAssessments.length === 0 ? (
          <Stack align="center" justify="center" style={{ minHeight: '300px' }}>
            <Text size="lg">{t('common.noResults')}</Text>
          </Stack>
        ) : (
          <>
            <Stack gap="md">
              {paginatedAssessments.map(assessment => (
                <Card key={assessment.id} shadow="sm" padding="lg" radius="md" withBorder>
                  <Group justify="space-between" mb="md">
                    <div>
                      <Group gap="xs">
                        <Title order={4}>{assessment.title}</Title>
                        <Badge>{assessment.assessment_type}</Badge>
                        {assessment.is_published && (
                          <Badge color="green" variant="light">
                            Published
                          </Badge>
                        )}
                      </Group>
                      <Text size="sm" c="dimmed" mt="xs">
                        {assessment.course_name}
                      </Text>
                    </div>
                    <Group gap={4}>
                      <ActionIcon
                        size="sm"
                        variant="light"
                        onClick={() => handleOpenModal(assessment)}
                      >
                        <IconEdit size={14} />
                      </ActionIcon>
                      <ActionIcon
                        size="sm"
                        variant="light"
                        color="red"
                        onClick={() => handleDelete(assessment.id)}
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>
                  </Group>

                  {assessment.description && (
                    <Text size="sm" mb="md" lineClamp={2}>
                      {assessment.description}
                    </Text>
                  )}

                  <Grid gutter="md" mb="md">
                    <Grid.Col span={{ base: 6, sm: 3 }}>
                      <div>
                        <Text size="xs" c="dimmed">
                          Points
                        </Text>
                        <Text fw={500}>{assessment.total_points}</Text>
                      </div>
                    </Grid.Col>
                    <Grid.Col span={{ base: 6, sm: 3 }}>
                      <div>
                        <Group gap={4}>
                          <IconQuestionMark size={14} />
                          <Text size="xs" c="dimmed">
                            Questions
                          </Text>
                        </Group>
                        <Text fw={500}>{assessment.question_count}</Text>
                      </div>
                    </Grid.Col>
                    <Grid.Col span={{ base: 6, sm: 3 }}>
                      <div>
                        <Group gap={4}>
                          <IconUsers size={14} />
                          <Text size="xs" c="dimmed">
                            Submissions
                          </Text>
                        </Group>
                        <Text fw={500}>{assessment.submission_count}</Text>
                      </div>
                    </Grid.Col>
                    <Grid.Col span={{ base: 6, sm: 3 }}>
                      {assessment.time_limit_minutes && (
                        <div>
                          <Group gap={4}>
                            <IconClock size={14} />
                            <Text size="xs" c="dimmed">
                              Time Limit
                            </Text>
                          </Group>
                          <Text fw={500}>{assessment.time_limit_minutes} min</Text>
                        </div>
                      )}
                    </Grid.Col>
                  </Grid>

                  <Group gap="xs">
                    <Button
                      size="xs"
                      variant="light"
                      onClick={() => handleViewQuestions(assessment.id)}
                    >
                      Manage Questions
                    </Button>
                    <Button
                      size="xs"
                      variant="light"
                      onClick={() => handleViewSubmissions(assessment.id)}
                    >
                      View Submissions
                    </Button>
                  </Group>
                </Card>
              ))}
            </Stack>

            {totalPages > 1 && (
              <Flex justify="center" mt="xl">
                <Pagination
                  value={currentPage}
                  onChange={setCurrentPage}
                  total={totalPages}
                />
              </Flex>
            )}
          </>
        )}
      </Container>

      {/* Modal */}
      <Modal
        opened={isModalOpen}
        onClose={handleCloseModal}
        title={editingId ? 'Edit Assessment' : 'New Assessment'}
        size="lg"
        centered
      >
        <Stack gap="lg">
          <Select
            label="Course"
            placeholder="Select a course"
            data={courses.map(c => ({ value: c.id, label: c.title }))}
            value={formData.course_id}
            onChange={(value) =>
              setFormData({ ...formData, course_id: value || '' })
            }
            required
            disabled={submitting}
          />

          <Select
            label="Assessment Type"
            placeholder="Select type"
            data={[
              { value: 'quiz', label: 'Quiz' },
              { value: 'assignment', label: 'Assignment' },
              { value: 'exam', label: 'Exam' },
            ]}
            value={formData.assessment_type}
            onChange={(value) =>
              setFormData({ ...formData, assessment_type: (value as any) || 'quiz' })
            }
            required
            disabled={submitting}
          />

          <TextInput
            label="Title"
            placeholder="Assessment title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            required
            disabled={submitting}
          />

          <Textarea
            label="Description"
            placeholder="Assessment description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            disabled={submitting}
          />

          <Grid>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <NumberInput
                label="Total Points"
                value={formData.total_points}
                onChange={(value) =>
                  setFormData({ ...formData, total_points: value || 100 })
                }
                min={0}
                disabled={submitting}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Due Date"
                type="date"
                value={formData.due_date}
                onChange={(e) =>
                  setFormData({ ...formData, due_date: e.target.value })
                }
                disabled={submitting}
              />
            </Grid.Col>
          </Grid>

          <Grid>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <NumberInput
                label="Max Attempts"
                value={formData.max_attempts}
                onChange={(value) =>
                  setFormData({ ...formData, max_attempts: value || 1 })
                }
                min={1}
                disabled={submitting}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <NumberInput
                label="Time Limit (minutes)"
                value={formData.time_limit_minutes}
                onChange={(value) =>
                  setFormData({ ...formData, time_limit_minutes: value || '' })
                }
                min={0}
                disabled={submitting}
              />
            </Grid.Col>
          </Grid>

          <Checkbox
            label="Allow Retakes"
            checked={formData.allow_retakes}
            onChange={(e) =>
              setFormData({ ...formData, allow_retakes: e.currentTarget.checked })
            }
            disabled={submitting}
          />

          <Checkbox
            label="Show Correct Answers to Students"
            checked={formData.show_answers}
            onChange={(e) =>
              setFormData({ ...formData, show_answers: e.currentTarget.checked })
            }
            disabled={submitting}
          />

          <Checkbox
            label="Shuffle Questions"
            checked={formData.shuffle_questions}
            onChange={(e) =>
              setFormData({ ...formData, shuffle_questions: e.currentTarget.checked })
            }
            disabled={submitting}
          />

          <Checkbox
            label="Publish Assessment"
            checked={formData.is_published}
            onChange={(e) =>
              setFormData({ ...formData, is_published: e.currentTarget.checked })
            }
            disabled={submitting}
          />

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
