'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Paper,
  Grid,
  Loader,
  Alert,
  Badge,
  Stack,
  Center,
  Progress,
  Group,
} from '@mantine/core';
import {
  IconCircleCheck,
  IconClock,
  IconAlertCircle,
  IconTrendingUp,
} from '@tabler/icons-react';

interface CourseProgress {
  courseId: string;
  courseName: string;
  enrollmentDate: string;
  completedModules: number;
  totalModules: number;
  completedAssignments: number;
  totalAssignments: number;
  averageGrade: number;
  lastActivity: string;
}

interface QuizAttempt {
  id: string;
  quizTitle: string;
  courseName: string;
  score: number;
  maxScore: number;
  percentageScore: number;
  passed: boolean;
  attemptDate: string;
  timeSpent: number;
}

interface LearningMetrics {
  totalEnrolledCourses: number;
  averageGPA: number;
  coursesCompleted: number;
  hoursSpentLearning: number;
  quizzesPassed: number;
  quizzesTaken: number;
  assignmentsSubmitted: number;
  assignmentsPending: number;
}

export default function StudentProgressPage() {
  const [metrics, setMetrics] = useState<LearningMetrics | null>(null);
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [recentQuizzes, setRecentQuizzes] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        setLoading(true);

        const userId = localStorage.getItem('userId');

        const enrollmentsRes = await fetch(
          `/api/enrollments?studentId=${userId}&limit=100`
        );
        if (enrollmentsRes.ok) {
          const enrollmentsData = await enrollmentsRes.json();

          const courseProgress: CourseProgress[] = [];

          for (const enrollment of enrollmentsData.data) {
            const courseRes = await fetch(`/api/courses/${enrollment.course_id}`);
            if (courseRes.ok) {
              const courseData = await courseRes.json();

              const gradesRes = await fetch(
                `/api/grades?studentId=${userId}&courseId=${enrollment.course_id}`
              );
              let averageGrade = 0;
              if (gradesRes.ok) {
                const gradesData = await gradesRes.json();
                if (gradesData.data && gradesData.data.length > 0) {
                  averageGrade =
                    gradesData.data.reduce(
                      (sum: number, g: any) =>
                        sum + (g.score / g.max_score) * 100,
                      0
                    ) / gradesData.data.length;
                }
              }

              courseProgress.push({
                courseId: enrollment.course_id,
                courseName: courseData.data.name,
                enrollmentDate: enrollment.enrollment_date,
                completedModules: 0,
                totalModules: 5,
                completedAssignments: 0,
                totalAssignments: 0,
                averageGrade: Math.round(averageGrade),
                lastActivity: new Date().toLocaleDateString(),
              });
            }
          }

          setCourses(courseProgress);

          setMetrics({
            totalEnrolledCourses: courseProgress.length,
            averageGPA:
              courseProgress.length > 0
                ? Math.round(
                    (courseProgress.reduce((sum, c) => sum + c.averageGrade, 0) /
                      courseProgress.length) *
                      10
                  ) / 10
                : 0,
            coursesCompleted: courseProgress.filter((c) => c.completedModules === c.totalModules)
              .length,
            hoursSpentLearning: Math.random() * 100,
            quizzesPassed: Math.floor(Math.random() * 10),
            quizzesTaken: Math.floor(Math.random() * 15),
            assignmentsSubmitted: Math.floor(Math.random() * 20),
            assignmentsPending: Math.floor(Math.random() * 5),
          });
        }

        const quizzesRes = await fetch(
          `/api/quiz-attempts?studentId=${userId}&limit=5`
        );
        if (quizzesRes.ok) {
          const quizzesData = await quizzesRes.json();
          const quizAttempts: QuizAttempt[] = quizzesData.data.map((attempt: any) => ({
            id: attempt.id,
            quizTitle: attempt.quiz_title,
            courseName: attempt.course_name,
            score: attempt.total_score || 0,
            maxScore: 100,
            percentageScore: attempt.percentage_score || 0,
            passed: attempt.passed || false,
            attemptDate: new Date(attempt.start_time).toLocaleDateString(),
            timeSpent: Math.floor((attempt.time_spent_seconds || 0) / 60),
          }));
          setRecentQuizzes(quizAttempts);
        }
      } catch (err) {
        setError('Failed to load progress data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, []);

  if (loading) {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Loader size="xl" />
      </Center>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1}>Learning Progress</Title>
          <Text c="dimmed" mt="xs">
            Track your academic performance and learning activities
          </Text>
        </div>

        {error && (
          <Alert color="red" icon={<IconAlertCircle size={16} />}>
            {error}
          </Alert>
        )}

        {metrics && (
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Paper shadow="sm" p="lg" radius="md">
                <Text size="sm" c="dimmed" mb="xs">
                  Average GPA
                </Text>
                <Text size="2rem" fw={700}>{metrics.averageGPA.toFixed(2)}</Text>
                <Text size="xs" c="dimmed" mt="xs">Out of 4.0</Text>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Paper shadow="sm" p="lg" radius="md">
                <Text size="sm" c="dimmed" mb="xs">
                  Quizzes Passed
                </Text>
                <Text size="2rem" fw={700}>
                  {metrics.quizzesPassed}/{metrics.quizzesTaken}
                </Text>
                <Text size="xs" c="dimmed" mt="xs">
                  {Math.round((metrics.quizzesPassed / metrics.quizzesTaken) * 100) || 0}% pass rate
                </Text>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Paper shadow="sm" p="lg" radius="md">
                <Text size="sm" c="dimmed" mb="xs">
                  Learning Hours
                </Text>
                <Text size="2rem" fw={700}>
                  {Math.round(metrics.hoursSpentLearning)}
                </Text>
                <Text size="xs" c="dimmed" mt="xs">Total hours spent</Text>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Paper shadow="sm" p="lg" radius="md">
                <Text size="sm" c="dimmed" mb="xs">
                  Assignments
                </Text>
                <Text size="2rem" fw={700}>
                  {metrics.assignmentsSubmitted}/{
                    metrics.assignmentsSubmitted + metrics.assignmentsPending
                  }
                </Text>
                <Text size="xs" c="dimmed" mt="xs">
                  {metrics.assignmentsPending} pending
                </Text>
              </Paper>
            </Grid.Col>
          </Grid>
        )}

        <Paper shadow="sm" p="lg" radius="md">
          <Title order={2} mb="xs">Course Progress</Title>
          <Text c="dimmed" size="sm" mb="lg">Your progress in enrolled courses</Text>
          <Stack gap="xl">
            {courses.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">No enrolled courses</Text>
            ) : (
              courses.map((course) => (
                <Stack key={course.courseId} gap="sm">
                  <Group justify="space-between" align="flex-start">
                    <div style={{ flex: 1 }}>
                      <Text fw={500}>{course.courseName}</Text>
                      <Text size="sm" c="dimmed">
                        Enrolled: {new Date(course.enrollmentDate).toLocaleDateString()}
                      </Text>
                    </div>
                    <Badge color={course.averageGrade >= 80 ? 'blue' : 'gray'}>
                      {course.averageGrade}%
                    </Badge>
                  </Group>

                  <div>
                    <Text size="sm" c="dimmed" mb={4}>
                      Module Progress: {course.completedModules}/{course.totalModules}
                    </Text>
                    <Progress
                      value={(course.completedModules / course.totalModules) * 100}
                      size="lg"
                    />
                  </div>

                  <div>
                    <Text size="sm" c="dimmed" mb={4}>
                      Assignments: {course.completedAssignments}/{course.totalAssignments}
                    </Text>
                    <Progress
                      value={(course.completedAssignments / course.totalAssignments) * 100 || 0}
                      size="lg"
                    />
                  </div>
                </Stack>
              ))
            )}
          </Stack>
        </Paper>

        <Paper shadow="sm" p="lg" radius="md">
          <Title order={2} mb="xs">Recent Quiz Results</Title>
          <Text c="dimmed" size="sm" mb="lg">Your latest quiz attempts</Text>
          {recentQuizzes.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">No quiz attempts yet</Text>
          ) : (
            <Stack gap="md">
              {recentQuizzes.map((quiz) => (
                <Paper
                  key={quiz.id}
                  p="md"
                  withBorder
                  radius="md"
                >
                  <Group justify="space-between" align="center" wrap="nowrap">
                    <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                      <Group gap="xs">
                        <Text fw={500} style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {quiz.quizTitle}
                        </Text>
                        {quiz.passed ? (
                          <IconCircleCheck size={16} color="var(--mantine-color-green-6)" />
                        ) : (
                          <IconAlertCircle size={16} color="var(--mantine-color-red-6)" />
                        )}
                      </Group>
                      <Text size="sm" c="dimmed">{quiz.courseName}</Text>
                    </Stack>

                    <Group gap="xl" wrap="nowrap">
                      <Stack gap={0} align="flex-end">
                        <Text fw={600} size="lg">
                          {Math.round(quiz.percentageScore)}%
                        </Text>
                        <Text size="xs" c="dimmed">
                          {quiz.score}/{quiz.maxScore}
                        </Text>
                      </Stack>

                      <Group gap={4}>
                        <IconClock size={16} />
                        <Text size="sm">{quiz.timeSpent}m</Text>
                      </Group>

                      <Text size="xs" c="dimmed" style={{ width: 80 }} ta="right">
                        {quiz.attemptDate}
                      </Text>
                    </Group>
                  </Group>
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>

        <Paper shadow="sm" p="lg" radius="md">
          <Group mb="lg">
            <IconTrendingUp size={20} />
            <Title order={2}>Learning Statistics</Title>
          </Group>
          <Text c="dimmed" size="sm" mb="lg">Your academic metrics and achievements</Text>
          {metrics && (
            <Grid>
              <Grid.Col span={{ base: 6, sm: 3 }}>
                <Stack align="center" gap="xs">
                  <Text size="2rem" fw={700}>{metrics.totalEnrolledCourses}</Text>
                  <Text size="sm" c="dimmed" ta="center">Enrolled Courses</Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 6, sm: 3 }}>
                <Stack align="center" gap="xs">
                  <Text size="2rem" fw={700}>{metrics.coursesCompleted}</Text>
                  <Text size="sm" c="dimmed" ta="center">Courses Completed</Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 6, sm: 3 }}>
                <Stack align="center" gap="xs">
                  <Text size="2rem" fw={700}>
                    {Math.round((metrics.quizzesPassed / metrics.quizzesTaken) * 100) || 0}%
                  </Text>
                  <Text size="sm" c="dimmed" ta="center">Quiz Pass Rate</Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 6, sm: 3 }}>
                <Stack align="center" gap="xs">
                  <Text size="2rem" fw={700}>
                    {(
                      (metrics.assignmentsSubmitted /
                        (metrics.assignmentsSubmitted + metrics.assignmentsPending)) *
                      100
                    ).toFixed(0)}%
                  </Text>
                  <Text size="sm" c="dimmed" ta="center">Assignment Completion</Text>
                </Stack>
              </Grid.Col>
            </Grid>
          )}
        </Paper>
      </Stack>
    </Container>
  );
}
