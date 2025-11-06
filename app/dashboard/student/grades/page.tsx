'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth/client-auth';
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
  Modal,
  Center,
} from '@mantine/core';
import { IconTrophy, IconChartBar, IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';

interface Grade {
  id: string;
  score: number;
  feedback: string | null;
  graded_at: string;
  assignment_title: string;
  course_name: string;
  course_code: string;
  max_score: number;
}

export default function StudentGradesPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const sess = getSession();
      if (!sess || sess.role !== 'student') {
        router.push('/auth/login');
        return;
      }
      setSession(sess);
      fetchGrades(sess.id);
    };

    checkAuth();
  }, [router]);

  const fetchGrades = async (studentId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/grades?studentId=${studentId}`);
      if (!response.ok) throw new Error('Failed to fetch grades');
      const data = await response.json();
      setGrades(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'green';
    if (score >= 80) return 'blue';
    if (score >= 70) return 'yellow';
    return 'red';
  };

  const getGradeLabel = (score: number) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  if (!session) {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Loader size="xl" />
      </Center>
    );
  }

  const courseGroups = grades.reduce(
    (acc, grade) => {
      const courseKey = grade.course_code;
      if (!acc[courseKey]) {
        acc[courseKey] = {
          course_name: grade.course_name,
          course_code: grade.course_code,
          grades: [],
        };
      }
      acc[courseKey].grades.push(grade);
      return acc;
    },
    {} as Record<
      string,
      {
        course_name: string;
        course_code: string;
        grades: Grade[];
      }
    >
  );

  const averageScore =
    grades.length > 0 ? (grades.reduce((sum, g) => sum + g.score, 0) / grades.length).toFixed(1) : 'N/A';
  const highestScore = grades.length > 0 ? Math.max(...grades.map((g) => g.score)) : 'N/A';
  const lowestScore = grades.length > 0 ? Math.min(...grades.map((g) => g.score)) : 'N/A';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', paddingTop: '24px' }}>
      <Container size="xl" py="xl">
        <Title order={2} mb="xl" style={{ fontFamily: 'Hanuman' }}>
          ពិន្ទុរបស់ខ្ញុំ
        </Title>

        {error && (
        <Alert color="red" mb="md">
          {error}
        </Alert>
      )}

      <Grid mb="xl">
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Paper shadow="md" p="lg" radius="md">
            <Text size="sm" fw={600} c="dimmed" mb="xs">TOTAL GRADES</Text>
            <Text size="2rem" fw={700} c="blue">{grades.length}</Text>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Paper shadow="md" p="lg" radius="md">
            <Text size="sm" fw={600} c="dimmed" mb="xs">AVERAGE SCORE</Text>
            <Text size="2rem" fw={700} c="green">{averageScore}</Text>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Paper shadow="md" p="lg" radius="md">
            <Text size="sm" fw={600} c="dimmed" mb="xs">HIGHEST SCORE</Text>
            <Text size="2rem" fw={700} c="blue">{highestScore}</Text>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Paper shadow="md" p="lg" radius="md">
            <Text size="sm" fw={600} c="dimmed" mb="xs">LOWEST SCORE</Text>
            <Text size="2rem" fw={700} c="red">{lowestScore}</Text>
          </Paper>
        </Grid.Col>
      </Grid>

      {loading ? (
        <Center py="xl">
          <Loader size="xl" />
        </Center>
      ) : grades.length === 0 ? (
        <Paper shadow="md" p="xl" radius="md">
          <Center>
            <Stack align="center" gap="md">
              <Text size="lg" c="dimmed">No grades yet.</Text>
              <Text c="dimmed">Your grades will appear here once graded.</Text>
            </Stack>
          </Center>
        </Paper>
      ) : (
        <Stack gap="lg">
          {Object.entries(courseGroups).map(([courseCode, courseData]) => (
            <Paper key={courseCode} shadow="md" p="lg" radius="md">
              <Stack gap="md">
                <div>
                  <Title order={2} mb="xs">{courseData.course_name}</Title>
                  <Badge color="blue" size="lg">{courseCode}</Badge>
                </div>

                <Stack gap="md">
                  {courseData.grades.map((grade) => (
                    <Paper
                      key={grade.id}
                      withBorder
                      p="md"
                      radius="md"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedGrade(grade)}
                    >
                      <Group justify="space-between" align="flex-start">
                        <Stack gap="xs" style={{ flex: 1 }}>
                          <Text fw={700} size="lg">{grade.assignment_title}</Text>
                          <Text size="sm" c="dimmed">
                            Graded on {formatDate(grade.graded_at)}
                          </Text>
                        </Stack>
                        <Stack align="center" gap={0}>
                          <Badge
                            color={getScoreColor(parseFloat(grade.score as any))}
                            size="xl"
                            radius="md"
                            p="md"
                          >
                            <Stack gap={0} align="center">
                              <Text size="2rem" fw={700}>
                                {getGradeLabel(parseFloat(grade.score as any))}
                              </Text>
                              <Text size="sm">
                                {grade.score}/{grade.max_score}
                              </Text>
                            </Stack>
                          </Badge>
                        </Stack>
                      </Group>

                      {grade.feedback && (
                        <Alert
                          color="blue"
                          mt="md"
                          title="Teacher Feedback:"
                        >
                          {grade.feedback}
                        </Alert>
                      )}
                    </Paper>
                  ))}
                </Stack>

                <Paper bg="gray.0" p="md" radius="md">
                  <Text size="sm" c="dimmed">
                    <Text component="span" fw={600}>Course Average:</Text>{' '}
                    {(
                      courseData.grades.reduce((sum, g) => sum + parseFloat(g.score as any), 0) /
                      courseData.grades.length
                    ).toFixed(1)}
                  </Text>
                </Paper>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      <Modal
        opened={!!selectedGrade}
        onClose={() => setSelectedGrade(null)}
        title={
          <Stack gap={0}>
            <Title order={2}>{selectedGrade?.assignment_title}</Title>
            <Text c="dimmed">{selectedGrade?.course_name}</Text>
          </Stack>
        }
        size="lg"
      >
        {selectedGrade && (
          <Stack gap="md">
            <Badge
              color={getScoreColor(parseFloat(selectedGrade.score as any))}
              size="xl"
              radius="md"
              p="lg"
            >
              <Stack gap={0} align="center">
                <Text size="3rem" fw={700}>
                  {getGradeLabel(parseFloat(selectedGrade.score as any))}
                </Text>
                <Text size="lg">
                  {selectedGrade.score}/{selectedGrade.max_score}
                </Text>
              </Stack>
            </Badge>

            <Text size="sm" c="dimmed">
              Graded on {formatDate(selectedGrade.graded_at)}
            </Text>

            {selectedGrade.feedback && (
              <Alert color="blue" title="Teacher Feedback:">
                {selectedGrade.feedback}
              </Alert>
            )}

            <Button fullWidth onClick={() => setSelectedGrade(null)}>
              Close
            </Button>
          </Stack>
        )}
      </Modal>
      </Container>
    </div>
  );
}
