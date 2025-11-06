'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth/client-auth';
import {
  Container,
  Title,
  Text,
  Button,
  Paper,
  SimpleGrid,
  Stack,
  Group,
  Progress,
  Badge,
  Table,
  Loader,
  Alert,
  Center,
} from '@mantine/core';
import {
  IconBook,
  IconRoute,
  IconCertificate,
  IconChartBar,
  IconClock,
  IconTrophy,
} from '@tabler/icons-react';

interface AnalyticsData {
  overall_stats: {
    enrolled_courses: number;
    enrolled_paths: number;
    certificates_earned: number;
    average_quiz_score: number;
    total_learning_minutes: number;
  };
  course_progress: Array<{
    id: string;
    name: string;
    status: string;
    completion_percentage: number;
    average_quiz_score: number;
    time_spent_minutes: number;
  }>;
  path_progress: Array<{
    id: string;
    name: string;
    difficulty_level: string;
    status: string;
    progress_percentage: number;
    completed_courses: number;
    total_courses: number;
  }>;
  quiz_performance: Array<{
    id: string;
    title: string;
    course_name: string;
    score: number;
    total_points: number;
    percentage: number;
    completion_date: string;
  }>;
  achievements: Array<{
    type: string;
    id: string;
    title: string;
    earned_date: string;
    category_name: string;
  }>;
  engagement: {
    total_time_minutes: number;
    last_activity: string | null;
    engagement_score: number;
    engagement_level: string;
  };
  time_distribution: Array<{
    course_name: string;
    time_minutes: number;
  }>;
}

export default function StudentAnalyticsDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const sess = getSession();
      if (!sess || sess.role !== 'student') {
        router.push('/auth/login');
        return;
      }
      setSession(sess);
      fetchAnalytics(sess.id);
    };

    checkAuth();
  }, [router]);

  const fetchAnalytics = async (studentId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/student/analytics?studentId=${studentId}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');

      const data = await response.json();
      setAnalytics(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatMinutesToHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getEngagementColor = (level: string): 'green' | 'cyan' | 'yellow' | 'red' => {
    switch (level) {
      case 'Excellent':
        return 'green';
      case 'Good':
        return 'cyan';
      case 'Average':
        return 'yellow';
      default:
        return 'red';
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'cyan';
    if (score >= 40) return 'yellow';
    return 'red';
  };

  const getStatusColor = (status: string): 'cyan' | 'green' | 'gray' => {
    if (status === 'active') return 'cyan';
    if (status === 'completed') return 'green';
    return 'gray';
  };

  const getDifficultyColor = (level: string): 'green' | 'yellow' | 'red' => {
    if (level === 'beginner') return 'green';
    if (level === 'intermediate') return 'yellow';
    return 'red';
  };

  if (!session) {
    return (
      <Center h="100vh">
        <Loader size="xl" color="cyan" />
      </Center>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', paddingTop: '24px' }}>
      <Container size="xl" py="xl">
        <Stack gap="xl">
          <Title order={2} mb="xl" style={{ fontFamily: 'Hanuman' }}>
            ឯកសារវិភាគស្ថិតិ
          </Title>

          {/* Error Message */}
        {error && (
          <Alert color="red" title="Error">
            {error}
          </Alert>
        )}

        {loading ? (
          <Center py="xl">
            <Loader size="xl" color="cyan" />
          </Center>
        ) : analytics ? (
          <>
            {/* Key Metrics Cards */}
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 5 }}>
              <Paper shadow="sm" p="lg" radius="md" withBorder>
                <Stack gap="xs" align="center">
                  <IconBook size={32} color="var(--mantine-color-cyan-6)" />
                  <Text size="sm" c="dimmed" fw={600}>
                    Enrolled Courses
                  </Text>
                  <Text size="2.5rem" fw={700} c="cyan">
                    {analytics.overall_stats.enrolled_courses}
                  </Text>
                </Stack>
              </Paper>

              <Paper shadow="sm" p="lg" radius="md" withBorder>
                <Stack gap="xs" align="center">
                  <IconRoute size={32} color="var(--mantine-color-violet-6)" />
                  <Text size="sm" c="dimmed" fw={600}>
                    Learning Paths
                  </Text>
                  <Text size="2.5rem" fw={700} c="violet">
                    {analytics.overall_stats.enrolled_paths}
                  </Text>
                </Stack>
              </Paper>

              <Paper shadow="sm" p="lg" radius="md" withBorder>
                <Stack gap="xs" align="center">
                  <IconCertificate size={32} color="var(--mantine-color-green-6)" />
                  <Text size="sm" c="dimmed" fw={600}>
                    Certificates
                  </Text>
                  <Text size="2.5rem" fw={700} c="green">
                    {analytics.overall_stats.certificates_earned}
                  </Text>
                </Stack>
              </Paper>

              <Paper shadow="sm" p="lg" radius="md" withBorder>
                <Stack gap="xs" align="center">
                  <IconChartBar size={32} color={`var(--mantine-color-${getScoreColor(analytics.overall_stats.average_quiz_score)}-6)`} />
                  <Text size="sm" c="dimmed" fw={600}>
                    Avg Quiz Score
                  </Text>
                  <Text size="2.5rem" fw={700} c={getScoreColor(analytics.overall_stats.average_quiz_score)}>
                    {analytics.overall_stats.average_quiz_score}%
                  </Text>
                </Stack>
              </Paper>

              <Paper shadow="sm" p="lg" radius="md" withBorder>
                <Stack gap="xs" align="center">
                  <IconClock size={32} color="var(--mantine-color-orange-6)" />
                  <Text size="sm" c="dimmed" fw={600}>
                    Learning Time
                  </Text>
                  <Text size="xl" fw={700} c="orange">
                    {formatMinutesToHours(analytics.overall_stats.total_learning_minutes)}
                  </Text>
                </Stack>
              </Paper>
            </SimpleGrid>

            {/* Engagement Summary */}
            {analytics.engagement && (
              <Paper shadow="sm" p="lg" radius="md" withBorder>
                <Stack gap="md">
                  <Title order={2} size="h2">
                    Engagement Overview
                  </Title>
                  <SimpleGrid cols={{ base: 1, sm: 3 }}>
                    <Stack gap="xs">
                      <Text size="sm" c="dimmed">
                        Engagement Score
                      </Text>
                      <Group gap="md">
                        <Progress value={analytics.engagement.engagement_score} color="cyan" size="lg" style={{ flex: 1 }} />
                        <Text fw={700} size="lg">
                          {analytics.engagement.engagement_score}
                        </Text>
                      </Group>
                    </Stack>

                    <Stack gap="xs">
                      <Text size="sm" c="dimmed">
                        Engagement Level
                      </Text>
                      <Badge
                        size="lg"
                        color={getEngagementColor(analytics.engagement.engagement_level)}
                        variant="light"
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        {analytics.engagement.engagement_level}
                      </Badge>
                    </Stack>

                    <Stack gap="xs">
                      <Text size="sm" c="dimmed">
                        Last Activity
                      </Text>
                      <Text fw={600}>
                        {formatDate(analytics.engagement.last_activity)}
                      </Text>
                    </Stack>
                  </SimpleGrid>
                </Stack>
              </Paper>
            )}

            {/* Course Progress */}
            {analytics.course_progress && analytics.course_progress.length > 0 && (
              <Paper shadow="sm" p="lg" radius="md" withBorder>
                <Stack gap="lg">
                  <Title order={2} size="h2">
                    Course Progress
                  </Title>
                  <Stack gap="md">
                    {analytics.course_progress.map((course) => (
                      <Paper key={course.id} withBorder p="md" radius="md">
                        <Stack gap="md">
                          <Group justify="space-between" align="flex-start">
                            <Text size="lg" fw={600}>
                              {course.name}
                            </Text>
                            <Badge color={getStatusColor(course.status)} variant="light">
                              {course.status}
                            </Badge>
                          </Group>

                          <Stack gap="xs">
                            <Group justify="space-between">
                              <Text size="sm" c="dimmed">
                                Completion
                              </Text>
                              <Text fw={600} size="sm">
                                {Math.round(course.completion_percentage)}%
                              </Text>
                            </Group>
                            <Progress value={course.completion_percentage} color="cyan" size="md" />
                          </Stack>

                          <SimpleGrid cols={{ base: 1, sm: 2 }}>
                            <Stack gap={4}>
                              <Text size="sm" c="dimmed">
                                Avg Quiz Score
                              </Text>
                              <Text fw={600} size="lg" c={getScoreColor(course.average_quiz_score)}>
                                {course.average_quiz_score}%
                              </Text>
                            </Stack>
                            <Stack gap={4}>
                              <Text size="sm" c="dimmed">
                                Time Spent
                              </Text>
                              <Text fw={600}>
                                {formatMinutesToHours(course.time_spent_minutes)}
                              </Text>
                            </Stack>
                          </SimpleGrid>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </Stack>
              </Paper>
            )}

            {/* Learning Path Progress */}
            {analytics.path_progress && analytics.path_progress.length > 0 && (
              <Paper shadow="sm" p="lg" radius="md" withBorder>
                <Stack gap="lg">
                  <Title order={2} size="h2">
                    Learning Paths
                  </Title>
                  <SimpleGrid cols={{ base: 1, md: 2 }}>
                    {analytics.path_progress.map((path) => (
                      <Paper key={path.id} withBorder p="md" radius="md">
                        <Stack gap="md">
                          <Group justify="space-between" align="flex-start">
                            <Text size="lg" fw={600}>
                              {path.name}
                            </Text>
                            <Badge size="sm" color={getDifficultyColor(path.difficulty_level)} variant="light">
                              {path.difficulty_level}
                            </Badge>
                          </Group>

                          <Text size="sm" c="dimmed">
                            {path.completed_courses} of {path.total_courses} courses completed
                          </Text>

                          <Stack gap="xs">
                            <Group justify="space-between">
                              <Text size="sm" c="dimmed">
                                Progress
                              </Text>
                              <Text fw={600} size="sm">
                                {Math.round(path.progress_percentage)}%
                              </Text>
                            </Group>
                            <Progress value={path.progress_percentage} color="violet" size="md" />
                          </Stack>

                          <Text size="xs" c="dimmed">
                            Status: {path.status}
                          </Text>
                        </Stack>
                      </Paper>
                    ))}
                  </SimpleGrid>
                </Stack>
              </Paper>
            )}

            {/* Recent Quiz Performance */}
            {analytics.quiz_performance && analytics.quiz_performance.length > 0 && (
              <Paper shadow="sm" p="lg" radius="md" withBorder>
                <Stack gap="lg">
                  <Title order={2} size="h2">
                    Recent Quiz Performance
                  </Title>
                  <Table.ScrollContainer minWidth={600}>
                    <Table striped highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Quiz Title</Table.Th>
                          <Table.Th>Course</Table.Th>
                          <Table.Th style={{ textAlign: 'center' }}>Score</Table.Th>
                          <Table.Th style={{ textAlign: 'center' }}>Percentage</Table.Th>
                          <Table.Th>Date</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {analytics.quiz_performance.map((quiz) => (
                          <Table.Tr key={quiz.id}>
                            <Table.Td>{quiz.title}</Table.Td>
                            <Table.Td>{quiz.course_name}</Table.Td>
                            <Table.Td style={{ textAlign: 'center' }}>
                              <Text fw={600}>
                                {quiz.score} / {quiz.total_points}
                              </Text>
                            </Table.Td>
                            <Table.Td style={{ textAlign: 'center' }}>
                              <Text fw={600} c={getScoreColor(quiz.percentage)}>
                                {quiz.percentage}%
                              </Text>
                            </Table.Td>
                            <Table.Td>{formatDate(quiz.completion_date)}</Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>
                </Stack>
              </Paper>
            )}

            {/* Recent Achievements */}
            {analytics.achievements && analytics.achievements.length > 0 && (
              <Paper shadow="sm" p="lg" radius="md" withBorder>
                <Stack gap="lg">
                  <Title order={2} size="h2">
                    Recent Achievements
                  </Title>
                  <SimpleGrid cols={{ base: 1, sm: 3, md: 5 }}>
                    {analytics.achievements.map((achievement) => (
                      <Paper
                        key={achievement.id}
                        p="md"
                        radius="md"
                        withBorder
                        style={{
                          background: 'linear-gradient(135deg, #fef3c7 0%, #fef9e7 100%)',
                        }}
                      >
                        <Stack gap="xs" align="center">
                          <IconTrophy size={48} color="var(--mantine-color-yellow-6)" />
                          <Text
                            fw={600}
                            size="sm"
                            ta="center"
                            lineClamp={2}
                          >
                            {achievement.title}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {achievement.category_name}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {formatDate(achievement.earned_date)}
                          </Text>
                        </Stack>
                      </Paper>
                    ))}
                  </SimpleGrid>
                </Stack>
              </Paper>
            )}
          </>
        ) : null}
        </Stack>
      </Container>
    </div>
  );
}
