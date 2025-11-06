'use client';

import { useState, useEffect } from 'react';
import {
  IconArrowLeft,
  IconChartBar,
  IconTrendingUp,
  IconLoader,
  IconAlertCircle,
  IconFilter,
} from '@tabler/icons-react';
import Link from 'next/link';
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Button,
  Badge,
  Box,
  Center,
  Loader,
  ActionIcon,
  Grid,
  Progress,
  Divider,
} from '@mantine/core';

interface Grade {
  grade_id: number;
  score: number;
  max_score: number;
  percentage: number;
  grade_letter: string;
  grade_type: string;
  graded_at: string;
  feedback?: string;
  teacher_name?: string;
}

interface Course {
  course_id: number;
  course_name: string;
  course_code: string;
  course_average: string | null;
  total_assessments: number;
  final_grade_count: number;
  grades: Grade[];
}

interface GradesData {
  student_id: number;
  overall_gpa: string | null;
  courses: Course[];
  total_courses: number;
}

interface StudentGradesViewProps {
  studentId: string;
  studentName?: string;
}

const gradeColorMap: { [key: string]: string } = {
  'A': 'green',
  'B': 'blue',
  'C': 'yellow',
  'D': 'orange',
  'F': 'red',
};

export default function StudentGradesView({ studentId, studentName }: StudentGradesViewProps) {
  const [data, setData] = useState<GradesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/parent-portal/students/${studentId}/grades`);

        if (!response.ok) {
          throw new Error('Failed to load grades');
        }

        const result = await response.json();
        setData(result.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, [studentId]);

  if (loading) {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Stack align="center" gap="md">
          <Loader size="xl" color="blue" />
          <Text c="dimmed">Loading grades...</Text>
        </Stack>
      </Center>
    );
  }

  if (error) {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Paper p="xl" shadow="sm" withBorder style={{ maxWidth: 450 }}>
          <Stack align="center" gap="md">
            <IconAlertCircle size={48} color="var(--mantine-color-red-6)" />
            <Title order={2} c="red">Error</Title>
            <Text c="red">{error}</Text>
            <Button component="a" href="/parent-portal" color="red">
              Back to Dashboard
            </Button>
          </Stack>
        </Paper>
      </Center>
    );
  }

  if (!data) return null;

  const displayedCourses = selectedCourse
    ? data.courses.filter((c) => c.course_id === selectedCourse)
    : data.courses;

  return (
    <Box bg="gray.0" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <Paper shadow="xs" p="xl" mb="lg">
        <Container size="xl">
          <Group gap="md" mb="md">
            <ActionIcon
              component="a"
              href="/parent-portal"
              variant="subtle"
              size="lg"
            >
              <IconArrowLeft size={24} />
            </ActionIcon>
            <Box>
              <Title order={1}>Grades</Title>
              <Text c="dimmed" mt={4}>{studentName}</Text>
            </Box>
          </Group>
        </Container>
      </Paper>

      <Container size="xl" py="xl">
        {/* Overall GPA */}
        <Paper
          shadow="lg"
          p="xl"
          mb="xl"
          style={{
            background: 'linear-gradient(to right, var(--mantine-color-blue-6), var(--mantine-color-blue-7))',
            color: 'white',
          }}
        >
          <Group justify="space-between">
            <Box>
              <Text size="sm" c="blue.1" fw={500}>
                Overall GPA
              </Text>
              <Title order={1} mt="xs">{data.overall_gpa || 'N/A'}</Title>
            </Box>
            <Box>
              <IconChartBar size={64} opacity={0.3} />
            </Box>
          </Group>
        </Paper>

        {/* Course Filter */}
        <Box mb="xl">
          <Group gap="xs" mb="md">
            <IconFilter size={20} />
            <Title order={4}>Courses</Title>
          </Group>
          <Group gap="xs">
            <Button
              variant={selectedCourse === null ? 'filled' : 'default'}
              onClick={() => setSelectedCourse(null)}
            >
              All Courses ({data.total_courses})
            </Button>
            {data.courses.map((course) => (
              <Button
                key={course.course_id}
                variant={selectedCourse === course.course_id ? 'filled' : 'default'}
                onClick={() => setSelectedCourse(course.course_id)}
              >
                {course.course_code}
              </Button>
            ))}
          </Group>
        </Box>

        {/* Courses Grid */}
        {displayedCourses.length === 0 ? (
          <Paper shadow="sm" p="xl">
            <Stack align="center" gap="md">
              <IconTrendingUp size={48} color="var(--mantine-color-gray-5)" />
              <Text c="dimmed">No grades available</Text>
            </Stack>
          </Paper>
        ) : (
          <Stack gap="xl">
            {displayedCourses.map((course) => (
              <Paper key={course.course_id} shadow="sm" withBorder>
                {/* Course Header */}
                <Box p="xl" bg="gray.0" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                  <Group justify="space-between" align="start" mb="md">
                    <Box>
                      <Title order={3}>{course.course_name}</Title>
                      <Text c="dimmed" size="sm" mt={4}>{course.course_code}</Text>
                    </Box>
                    <Box ta="right">
                      <Text c="dimmed" size="sm">Course Average</Text>
                      <Title order={1} c="blue" mt={4}>
                        {course.course_average || 'N/A'}
                      </Title>
                    </Box>
                  </Group>

                  {/* Course Stats */}
                  <Grid>
                    <Grid.Col span={6}>
                      <Paper p="sm" withBorder>
                        <Text size="xs" c="dimmed" fw={500}>Total Assessments</Text>
                        <Title order={3} mt="xs">
                          {course.total_assessments}
                        </Title>
                      </Paper>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Paper p="sm" withBorder>
                        <Text size="xs" c="dimmed" fw={500}>Final Grades</Text>
                        <Title order={3} mt="xs">
                          {course.final_grade_count}
                        </Title>
                      </Paper>
                    </Grid.Col>
                  </Grid>
                </Box>

                {/* Grades List */}
                <Stack gap={0}>
                  {course.grades.map((grade) => (
                    <Box
                      key={grade.grade_id}
                      p="xl"
                      style={{
                        borderBottom: '1px solid var(--mantine-color-gray-2)',
                        transition: 'background-color 0.2s',
                      }}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'var(--mantine-color-gray-0)',
                        },
                      }}
                    >
                      <Group justify="space-between" align="start" mb="md">
                        <Box style={{ flex: 1 }}>
                          <Group gap="sm" mb="xs">
                            <Text size="sm" fw={600} tt="capitalize">
                              {grade.grade_type}
                            </Text>
                            <Badge
                              color={gradeColorMap[grade.grade_letter] || 'gray'}
                              size="lg"
                            >
                              {grade.grade_letter}
                            </Badge>
                          </Group>
                          {grade.teacher_name && (
                            <Text size="xs" c="dimmed">by {grade.teacher_name}</Text>
                          )}
                        </Box>
                        <Box ta="right">
                          <Title order={2}>
                            {grade.score}/{grade.max_score}
                          </Title>
                          <Text size="sm" c="dimmed">{grade.percentage.toFixed(1)}%</Text>
                        </Box>
                      </Group>

                      {/* Feedback */}
                      {grade.feedback && (
                        <Paper p="sm" withBorder bg="blue.0" mb="md">
                          <Text size="sm" fw={500} mb={4}>Feedback:</Text>
                          <Text size="sm">{grade.feedback}</Text>
                        </Paper>
                      )}

                      {/* Score Bar */}
                      <Box mb="sm">
                        <Progress
                          value={grade.percentage}
                          size="md"
                          radius="md"
                          color={
                            grade.percentage >= 90 ? 'green' :
                            grade.percentage >= 80 ? 'blue' :
                            grade.percentage >= 70 ? 'yellow' :
                            grade.percentage >= 60 ? 'orange' : 'red'
                          }
                        />
                      </Box>

                      {/* Date */}
                      <Text size="xs" c="dimmed">
                        {new Date(grade.graded_at).toLocaleDateString()}
                      </Text>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Container>
    </Box>
  );
}
