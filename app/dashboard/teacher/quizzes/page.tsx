'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Container,
  Title,
  Text,
  Button,
  TextInput,
  Select,
  Modal,
  Paper,
  Group,
  Stack,
  Badge,
  Grid,
  Loader,
  Center,
  Textarea,
} from '@mantine/core';
import { IconPlus, IconTrash, IconEdit, IconEye } from '@tabler/icons-react';

interface Quiz {
  id: string;
  title: string;
  course_name: string;
  quiz_type: string;
  total_questions: number;
  is_published: boolean;
  due_date?: string;
  created_at: string;
}

interface Course {
  id: string;
  name: string;
}

export default function TeacherQuizzesPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [showNewQuizDialog, setShowNewQuizDialog] = useState(false);
  const [newQuizData, setNewQuizData] = useState({
    title: '',
    courseId: '',
    quizType: 'quiz',
    description: '',
  });

  // Fetch courses and quizzes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch courses
        const coursesRes = await fetch('/api/courses?limit=1000');
        if (coursesRes.ok) {
          const coursesData = await coursesRes.json();
          setCourses(coursesData.data || []);
        }

        // Fetch quizzes
        const quizzesRes = await fetch('/api/quizzes?limit=1000');
        if (quizzesRes.ok) {
          const quizzesData = await quizzesRes.json();
          setQuizzes(quizzesData.data || []);
        }
      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter quizzes
  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesSearch = quiz.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCourse =
      selectedCourse === 'all' || quiz.course_name === selectedCourse;
    return matchesSearch && matchesCourse;
  });

  // Create new quiz
  const handleCreateQuiz = async () => {
    if (!newQuizData.title || !newQuizData.courseId) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newQuizData,
          createdBy: localStorage.getItem('userId'),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/dashboard/teacher/quizzes/${data.data.id}/edit`);
      } else {
        setError('Failed to create quiz');
      }
    } catch (err) {
      setError('Error creating quiz');
      console.error(err);
    }
  };

  // Delete quiz
  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;

    try {
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setQuizzes(quizzes.filter((q) => q.id !== quizId));
      } else {
        setError('Failed to delete quiz');
      }
    } catch (err) {
      setError('Error deleting quiz');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <Center h="100vh">
        <Loader size="xl" />
      </Center>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <Stack gap="xs">
            <Title order={1}>Quizzes & Exams</Title>
            <Text c="dimmed">Create and manage quiz assessments</Text>
          </Stack>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setShowNewQuizDialog(true)}
          >
            New Quiz
          </Button>
        </Group>

        {/* Filters */}
        <Group gap="md">
          <TextInput
            placeholder="Search quizzes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.currentTarget.value)}
            style={{ flex: 1, maxWidth: 400 }}
          />
          <Select
            value={selectedCourse}
            onChange={(value) => setSelectedCourse(value || 'all')}
            data={[
              { value: 'all', label: 'All Courses' },
              ...courses.map((course) => ({
                value: course.name,
                label: course.name,
              })),
            ]}
            style={{ width: 200 }}
          />
        </Group>

        {/* Quizzes Grid */}
        {filteredQuizzes.length === 0 ? (
          <Paper withBorder p="xl" style={{ borderStyle: 'dashed' }}>
            <Stack align="center" gap="md">
              <Text c="dimmed">No quizzes found</Text>
              <Button
                variant="outline"
                leftSection={<IconPlus size={16} />}
                onClick={() => setShowNewQuizDialog(true)}
              >
                Create Your First Quiz
              </Button>
            </Stack>
          </Paper>
        ) : (
          <Grid>
            {filteredQuizzes.map((quiz) => (
              <Grid.Col key={quiz.id} span={{ base: 12, md: 6, lg: 4 }}>
                <Paper withBorder shadow="sm" h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
                  <Stack gap="md" p="md" style={{ flex: 1 }}>
                    <Group justify="space-between" align="flex-start">
                      <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                        <Text fw={600} truncate="end">{quiz.title}</Text>
                        <Text size="sm" c="dimmed">{quiz.course_name}</Text>
                      </Stack>
                      <Badge color={quiz.is_published ? 'green' : 'yellow'} size="sm">
                        {quiz.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </Group>

                    <Stack gap="xs">
                      <Text size="sm">
                        <Text span fw={500}>Type:</Text> {quiz.quiz_type}
                      </Text>
                      <Text size="sm">
                        <Text span fw={500}>Questions:</Text> {quiz.total_questions}
                      </Text>
                      {quiz.due_date && (
                        <Text size="sm">
                          <Text span fw={500}>Due:</Text>{' '}
                          {new Date(quiz.due_date).toLocaleDateString()}
                        </Text>
                      )}
                    </Stack>
                  </Stack>

                  <Group gap="xs" p="sm" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
                    <Link
                      href={`/dashboard/teacher/quizzes/${quiz.id}/edit`}
                      style={{ flex: 1, textDecoration: 'none' }}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        leftSection={<IconEdit size={16} />}
                        fullWidth
                      >
                        Edit
                      </Button>
                    </Link>
                    <Link
                      href={`/dashboard/teacher/quizzes/${quiz.id}/preview`}
                      style={{ flex: 1, textDecoration: 'none' }}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        leftSection={<IconEye size={16} />}
                        fullWidth
                      >
                        Preview
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      color="red"
                      onClick={() => handleDeleteQuiz(quiz.id)}
                    >
                      <IconTrash size={16} />
                    </Button>
                  </Group>
                </Paper>
              </Grid.Col>
            ))}
          </Grid>
        )}
      </Stack>

      {/* New Quiz Modal */}
      <Modal
        opened={showNewQuizDialog}
        onClose={() => setShowNewQuizDialog(false)}
        title="Create New Quiz"
        size="md"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Set up a new quiz or exam for your course
          </Text>

          <TextInput
            label="Quiz Title"
            placeholder="e.g., Chapter 5 Quiz"
            value={newQuizData.title}
            onChange={(e) =>
              setNewQuizData({
                ...newQuizData,
                title: e.currentTarget.value,
              })
            }
            required
            withAsterisk
          />

          <Select
            label="Course"
            placeholder="Select course"
            value={newQuizData.courseId}
            onChange={(value) =>
              setNewQuizData({
                ...newQuizData,
                courseId: value || '',
              })
            }
            data={courses.map((course) => ({
              value: course.id,
              label: course.name,
            }))}
            required
            withAsterisk
          />

          <Select
            label="Quiz Type"
            value={newQuizData.quizType}
            onChange={(value) =>
              setNewQuizData({
                ...newQuizData,
                quizType: value || 'quiz',
              })
            }
            data={[
              { value: 'quiz', label: 'Quiz' },
              { value: 'exam', label: 'Exam' },
              { value: 'practice', label: 'Practice' },
              { value: 'assignment', label: 'Assignment' },
            ]}
          />

          <TextInput
            label="Description"
            placeholder="Optional description"
            value={newQuizData.description}
            onChange={(e) =>
              setNewQuizData({
                ...newQuizData,
                description: e.currentTarget.value,
              })
            }
          />

          {error && (
            <Text c="red" size="sm">
              {error}
            </Text>
          )}

          <Button onClick={handleCreateQuiz} fullWidth>
            Create Quiz
          </Button>
        </Stack>
      </Modal>
    </Container>
  );
}
