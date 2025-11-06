'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getSession, clearSession } from '@/lib/auth/client-auth';
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Paper,
  Stack,
  Loader,
  Center,
  Alert,
  Badge,
  Progress,
  Box,
  Divider,
  SimpleGrid,
  ActionIcon,
  Collapse,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconLogout,
  IconClock,
  IconBook2,
  IconCheck,
  IconChevronDown,
  IconAlertCircle,
} from '@tabler/icons-react';

interface Course {
  id: string;
  name: string;
  code: string;
  description: string | null;
  order: number;
  is_required: boolean;
  prerequisite_course_id: string | null;
  prerequisite_course_name?: string;
}

interface LearningPath {
  id: string;
  name: string;
  description: string | null;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_hours: number;
  category: string | null;
  thumbnail_url: string | null;
  is_published: boolean;
  learning_objectives: string | null;
  courses?: Course[];
}

interface StudentProgress {
  id: string;
  path_id: string;
  student_id: string;
  status: 'enrolled' | 'in_progress' | 'completed';
  enrollment_date: string;
  completion_date: string | null;
  progress_percentage: number;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'green',
  intermediate: 'yellow',
  advanced: 'red',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export default function LearningPathDetailPage() {
  const router = useRouter();
  const params = useParams();
  const pathId = params.id as string;

  const [session, setSession] = useState<any>(null);
  const [path, setPath] = useState<LearningPath | null>(null);
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const sess = getSession();
      if (!sess || sess.role !== 'student') {
        router.push('/auth/login');
        return;
      }
      setSession(sess);
      fetchPathDetails();
      fetchStudentProgress(sess.id);
    };

    checkAuth();
  }, [router, pathId]);

  const fetchPathDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/learning-paths/${pathId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Learning path not found');
        }
        throw new Error('Failed to fetch learning path details');
      }

      const data = await response.json();
      setPath(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentProgress = async (studentId: string) => {
    try {
      const response = await fetch(
        `/api/learning-paths?studentId=${studentId}&pathId=${pathId}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          setProgress(data.data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching student progress:', err);
    }
  };

  const handleEnrollPath = async () => {
    try {
      setError(null);

      const response = await fetch('/api/learning-paths/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pathId,
          studentId: session.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to enroll');
      }

      fetchStudentProgress(session.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enroll in path');
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
    });
  };

  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'green';
    if (progress >= 75) return 'blue';
    if (progress >= 50) return 'yellow';
    return 'orange';
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

  if (error || !path) {
    return (
      <Box bg="gradient-to-br(from-blue-50,to-indigo-100)" mih="100vh" p="xl">
        <Container size="lg">
          <Button
            mb="md"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => router.push('/dashboard/student/learning-paths')}
          >
            Back to Learning Paths
          </Button>
          <Alert color="red" icon={<IconAlertCircle size={16} />}>
            {error || 'Learning path not found'}
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box bg="gradient-to-br(from-blue-50,to-indigo-100)" mih="100vh" p="xl">
      <Container size="lg">
        {/* Header */}
        <Group justify="space-between" mb="xl">
          <Button
            variant="filled"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => router.push('/dashboard/student/learning-paths')}
          >
            Back to Learning Paths
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
          <Alert color="red" mb="md" withCloseButton onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Main Card */}
        <Paper shadow="lg" mb="xl">
          {/* Thumbnail */}
          <Box
            h={256}
            bg="linear-gradient(135deg, var(--mantine-color-blue-4), var(--mantine-color-indigo-6))"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {path.thumbnail_url ? (
              <img
                src={path.thumbnail_url}
                alt={path.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <Text size="96px">📚</Text>
            )}
          </Box>

          {/* Content */}
          <Stack p="xl">
            {/* Header with Badges */}
            <Group gap="sm">
              <Badge
                color={DIFFICULTY_COLORS[path.difficulty_level]}
                size="lg"
              >
                {DIFFICULTY_LABELS[path.difficulty_level]}
              </Badge>
              {path.category && (
                <Badge color="indigo" size="lg" variant="light">
                  {path.category}
                </Badge>
              )}
              {progress?.status === 'completed' && (
                <Badge color="green" size="lg" leftSection={<IconCheck size={14} />}>
                  Completed
                </Badge>
              )}
            </Group>

            <Title order={1}>{path.name}</Title>

            {path.description && (
              <Text size="lg" c="dimmed">
                {path.description}
              </Text>
            )}

            {/* Key Metrics */}
            <SimpleGrid cols={3} spacing="lg" py="lg" style={{ borderTop: '1px solid var(--mantine-color-gray-3)', borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
              <Box>
                <Text size="xs" c="dimmed" tt="uppercase">
                  Total Duration
                </Text>
                <Text size="32px" fw={700}>
                  {path.estimated_hours}h
                </Text>
              </Box>
              <Box>
                <Text size="xs" c="dimmed" tt="uppercase">
                  Courses Included
                </Text>
                <Text size="32px" fw={700}>
                  {path.courses?.length || 0}
                </Text>
              </Box>
              <Box>
                <Text size="xs" c="dimmed" tt="uppercase">
                  {progress ? 'Your Progress' : 'Status'}
                </Text>
                <Text size="32px" fw={700}>
                  {progress ? `${progress.progress_percentage}%` : 'Not Enrolled'}
                </Text>
              </Box>
            </SimpleGrid>

            {/* Learning Objectives */}
            {path.learning_objectives && (
              <Paper p="lg" bg="blue.0" withBorder>
                <Title order={3} mb="sm">
                  Learning Objectives
                </Title>
                <Text c="dimmed" style={{ lineHeight: 1.6 }}>
                  {path.learning_objectives}
                </Text>
              </Paper>
            )}

            {/* Progress Bar */}
            {progress && (
              <Paper p="lg" bg="gray.0" withBorder>
                <Group justify="space-between" mb="sm">
                  <Title order={3}>Your Progress</Title>
                  <Text size="xl" fw={700}>
                    {progress.progress_percentage}%
                  </Text>
                </Group>
                <Progress
                  value={progress.progress_percentage}
                  color={getProgressColor(progress.progress_percentage)}
                  size="lg"
                  mb="md"
                />
                <Stack gap="xs">
                  <Group>
                    <Text size="sm" fw={600}>
                      Status:
                    </Text>
                    <Text size="sm" tt="capitalize">
                      {progress.status}
                    </Text>
                  </Group>
                  <Group>
                    <Text size="sm" fw={600}>
                      Enrolled:
                    </Text>
                    <Text size="sm">{formatDate(progress.enrollment_date)}</Text>
                  </Group>
                  {progress.completion_date && (
                    <Group>
                      <Text size="sm" fw={600}>
                        Completed:
                      </Text>
                      <Text size="sm">{formatDate(progress.completion_date)}</Text>
                    </Group>
                  )}
                </Stack>
              </Paper>
            )}

            {/* Enrollment Button */}
            {!progress && (
              <Button
                size="lg"
                fullWidth
                color="green"
                onClick={handleEnrollPath}
              >
                Enroll in This Path
              </Button>
            )}
          </Stack>
        </Paper>

        {/* Courses Section */}
        <Box>
          <Title order={2} mb="lg">
            Path Courses
          </Title>

          {path.courses && path.courses.length > 0 ? (
            <Stack>
              {path.courses
                .sort((a, b) => a.order - b.order)
                .map((course, index) => (
                  <Paper key={course.id} shadow="sm" withBorder>
                    {/* Course Header */}
                    <Group
                      p="lg"
                      style={{ cursor: 'pointer' }}
                      onClick={() =>
                        setExpandedCourseId(
                          expandedCourseId === course.id ? null : course.id
                        )
                      }
                    >
                      {/* Course Order Circle */}
                      <Center
                        w={48}
                        h={48}
                        bg="blue"
                        style={{ borderRadius: '50%', color: 'white', fontWeight: 700, fontSize: '1.125rem', flexShrink: 0 }}
                      >
                        {index + 1}
                      </Center>

                      {/* Course Info */}
                      <Stack flex={1} gap="xs">
                        <Group gap="sm">
                          <Title order={3}>{course.name}</Title>
                          <Badge size="xs" color="blue" variant="light">
                            {course.code}
                          </Badge>
                          {course.is_required ? (
                            <Badge size="xs" color="red">
                              Required
                            </Badge>
                          ) : (
                            <Badge size="xs" color="green">
                              Optional
                            </Badge>
                          )}
                        </Group>
                        {course.description && (
                          <Text size="sm" c="dimmed">
                            {course.description}
                          </Text>
                        )}
                      </Stack>

                      {/* Expand Icon */}
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        style={{
                          transform: expandedCourseId === course.id ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s',
                        }}
                      >
                        <IconChevronDown size={24} />
                      </ActionIcon>
                    </Group>

                    {/* Course Details (Expanded) */}
                    <Collapse in={expandedCourseId === course.id}>
                      <Box px="lg" pb="lg" pt={0} bg="gray.0" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
                        {course.prerequisite_course_id && (
                          <Alert color="yellow" mb="md" icon={<IconAlertCircle size={16} />}>
                            <Text size="sm">
                              <Text component="span" fw={700}>
                                Prerequisite:
                              </Text>{' '}
                              You must complete{' '}
                              <Text component="span" fw={600}>
                                {course.prerequisite_course_name || 'a required course'}
                              </Text>{' '}
                              before taking this course.
                            </Text>
                          </Alert>
                        )}

                        <Group grow>
                          <Button
                            onClick={() => router.push(`/dashboard/student/courses`)}
                          >
                            Open Course
                          </Button>
                          {course.prerequisite_course_id && (
                            <Button
                              variant="outline"
                              color="yellow"
                              onClick={() => router.push(`/dashboard/student/courses`)}
                            >
                              Complete Prerequisite
                            </Button>
                          )}
                        </Group>
                      </Box>
                    </Collapse>
                  </Paper>
                ))}
            </Stack>
          ) : (
            <Paper shadow="sm" p="xl">
              <Text c="dimmed" ta="center" size="lg">
                No courses in this learning path yet.
              </Text>
            </Paper>
          )}
        </Box>
      </Container>
    </Box>
  );
}
