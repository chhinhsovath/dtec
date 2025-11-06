'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth/client-auth';
import {
  Container,
  Title,
  Text,
  Button,
  Select,
  Paper,
  Group,
  Stack,
  Grid,
  Loader,
  Center,
  Alert,
  Table,
  Badge,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconFilter,
} from '@tabler/icons-react';

interface Grade {
  id: string;
  score: number;
  feedback: string | null;
  graded_at: string;
  assignment_title: string;
  course_name: string;
  course_code: string;
  student_name: string;
  student_email: string;
}

export default function TeacherGradesPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCourse, setFilterCourse] = useState('');
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const sess = getSession();
      if (!sess || sess.role !== 'teacher') {
        router.push('/auth/login');
        return;
      }
      setSession(sess);
      fetchGrades();
      fetchCourses();
    };

    checkAuth();
  }, [router]);

  const fetchGrades = async (courseId?: string) => {
    try {
      setLoading(true);
      setError(null);
      let url = '/api/grades';
      if (courseId) {
        url += '?courseId=' + courseId;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch grades');
      const data = await response.json();
      setGrades(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      if (!response.ok) throw new Error('Failed to fetch courses');
      const data = await response.json();
      setCourses(data.data || []);
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  };

  const handleFilterChange = (courseId: string) => {
    setFilterCourse(courseId);
    fetchGrades(courseId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'green';
    if (score >= 80) return 'blue';
    if (score >= 70) return 'yellow';
    return 'red';
  };

  if (!session) {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Loader size="xl" />
      </Center>
    );
  }

  const averageScore =
    grades.length > 0 ? (grades.reduce((sum, g) => sum + g.score, 0) / grades.length).toFixed(1) : 'N/A';
  const highestScore = grades.length > 0 ? Math.max(...grades.map((g) => g.score)) : 'N/A';
  const lowestScore = grades.length > 0 ? Math.min(...grades.map((g) => g.score)) : 'N/A';

  const courseOptions = [
    { value: '', label: 'All Courses' },
    ...courses.map((course) => ({
      value: course.id,
      label: `${course.code} - ${course.name}`,
    })),
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', paddingTop: '24px' }}>
      <Container size="xl" py="xl">
        <Title order={2} mb="xl">
          Grade Management
        </Title>

        {error && (
          <Alert icon={<IconAlertCircle />} color="red" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Paper shadow="sm" p="md" withBorder>
          <Group mb="md">
            <IconFilter size={20} />
            <Text fw={700}>Filters</Text>
          </Group>
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label="Filter by Course"
                placeholder="Select a course"
                data={courseOptions}
                value={filterCourse}
                onChange={(value) => handleFilterChange(value || '')}
              />
            </Grid.Col>
          </Grid>
        </Paper>

        {loading ? (
          <Center py={60}>
            <Stack align="center" gap="md">
              <Loader size="lg" />
              <Text c="dimmed">Loading grades...</Text>
            </Stack>
          </Center>
        ) : grades.length === 0 ? (
          <Paper shadow="sm" p="xl" withBorder>
            <Center>
              <Stack align="center">
                <Text size="lg" c="dimmed">
                  No grades yet.
                </Text>
                <Text size="sm" c="dimmed">
                  Grade submissions to get started.
                </Text>
              </Stack>
            </Center>
          </Paper>
        ) : (
          <>
            <Paper shadow="sm" withBorder>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Student</Table.Th>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Course</Table.Th>
                    <Table.Th>Assignment</Table.Th>
                    <Table.Th>Score</Table.Th>
                    <Table.Th>Graded Date</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {grades.map((grade) => (
                    <Table.Tr key={grade.id}>
                      <Table.Td>
                        <Text fw={600}>{grade.student_name}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {grade.student_email}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" color="blue">
                          {grade.course_code}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text>{grade.assignment_title}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text
                          fw={700}
                          size="lg"
                          c={getScoreColor(parseFloat(grade.score as any))}
                        >
                          {grade.score}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {formatDate(grade.graded_at)}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>

            <Paper shadow="sm" p="md" withBorder>
              <Title order={3} mb="md">
                Grade Summary
              </Title>
              <Grid>
                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                  <Paper p="md" bg="gray.0" withBorder>
                    <Text size="xs" fw={600} c="dimmed" mb="xs">
                      TOTAL GRADES
                    </Text>
                    <Text size="xl" fw={700} c="blue">
                      {grades.length}
                    </Text>
                  </Paper>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                  <Paper p="md" bg="gray.0" withBorder>
                    <Text size="xs" fw={600} c="dimmed" mb="xs">
                      AVERAGE SCORE
                    </Text>
                    <Text size="xl" fw={700} c="green">
                      {averageScore}
                    </Text>
                  </Paper>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                  <Paper p="md" bg="gray.0" withBorder>
                    <Text size="xs" fw={600} c="dimmed" mb="xs">
                      HIGHEST SCORE
                    </Text>
                    <Text size="xl" fw={700} c="blue">
                      {highestScore}
                    </Text>
                  </Paper>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                  <Paper p="md" bg="gray.0" withBorder>
                    <Text size="xs" fw={600} c="dimmed" mb="xs">
                      LOWEST SCORE
                    </Text>
                    <Text size="xl" fw={700} c="red">
                      {lowestScore}
                    </Text>
                  </Paper>
                </Grid.Col>
              </Grid>
            </Paper>
          </>
        )}
      </Container>
    </div>
  );
}
