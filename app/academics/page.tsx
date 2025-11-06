'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth/client-auth';
import { IconBook, IconAward, IconTrendingUp, IconCalendar, IconFileText } from '@tabler/icons-react';
import { Container, Title, Group, Button, Paper, Grid, Card, Text, Stack, Center, Loader, Box, Badge, RingProgress } from '@mantine/core';

interface AcademicRecord {
  id: string;
  semester: string;
  gpa: number;
  created_at: string;
}

interface Enrollment {
  id: string;
  status: string;
  courses: {
    title: string;
    description: string | null;
    credits: number;
  };
}

export default function AcademicsPage() {
  const [academicRecords, setAcademicRecords] = useState<AcademicRecord[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadAcademicData = async () => {
      try {
        const session = getSession();

        if (!session) {
          router.push('/auth/login');
          return;
        }

        // Fetch academic data from API
        const response = await fetch('/api/student/academics', {
          headers: {
            'x-student-id': session.id,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to load academic records');
        }

        const data = await response.json();
        setStudentId(session.id);
        setAcademicRecords(data.records || []);
        setEnrollments(data.enrollments || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadAcademicData();
  }, [router]);

  const calculateOverallGPA = (): string => {
    if (academicRecords.length === 0) return '0.00';
    const sum = academicRecords.reduce((acc, record) => acc + (record.gpa || 0), 0);
    return (sum / academicRecords.length).toFixed(2);
  };

  const getTotalCredits = () => {
    return enrollments
      .filter(e => e.status === 'completed')
      .reduce((acc, e) => acc + (e.courses?.credits || 0), 0);
  };

  const getGPAColor = (gpa: number | string): string => {
    const gpaNum = typeof gpa === 'string' ? parseFloat(gpa) : gpa;
    if (gpaNum >= 3.5) return 'green';
    if (gpaNum >= 3.0) return 'blue';
    if (gpaNum >= 2.5) return 'yellow';
    return 'red';
  };

  if (loading) {
    return (
      <Center h="100vh">
        <Stack align="center">
          <Loader size="xl" />
          <Text size="xl">កំពុងផ្ទុក...</Text>
        </Stack>
      </Center>
    );
  }

  if (error) {
    return (
      <Center h="100vh">
        <Stack align="center">
          <Text size="lg" c="red">{error}</Text>
          <Button onClick={() => router.push('/dashboard/student')}>← ត្រលប់ទៅផ្ទាំងគ្រប់គ្រង</Button>
        </Stack>
      </Center>
    );
  }

  return (
    <Box bg="gray.0" mih="100vh">
      {/* Header */}
      <Paper shadow="sm" p="md" mb="lg">
        <Container size="xl">
          <Group justify="space-between">
            <Group>
              <IconBook size={32} color="var(--mantine-color-blue-6)" />
              <Title order={1}>កំណត់ត្រាសិក្សា</Title>
            </Group>
            <Button variant="subtle" onClick={() => router.push('/dashboard/student')}>
              ← ត្រលប់ទៅផ្ទាំងគ្រប់គ្រង
            </Button>
          </Group>
        </Container>
      </Paper>

      {/* Main Content */}
      <Container size="xl" py="lg">
        {/* Academic Overview */}
        <Grid mb="xl">
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Card shadow="md" padding="lg">
              <Group justify="space-between" mb="md">
                <Box>
                  <Text size="sm" fw={500} c="dimmed">GPA ទូទៅ</Text>
                  <Title order={2 as const} c={getGPAColor(parseFloat(calculateOverallGPA()))} mt="sm">
                    {calculateOverallGPA()}
                  </Title>
                </Box>
                <IconAward size={48} color="var(--mantine-color-blue-6)" opacity={0.3} />
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 3 }}>
            <Card shadow="md" padding="lg">
              <Group justify="space-between">
                <Box>
                  <Text size="sm" fw={500} c="dimmed">ឯណទានសរុប</Text>
                  <Title order={2} mt="sm">{getTotalCredits()}</Title>
                </Box>
                <IconBook size={48} color="var(--mantine-color-green-6)" opacity={0.3} />
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 3 }}>
            <Card shadow="md" padding="lg">
              <Group justify="space-between">
                <Box>
                  <Text size="sm" fw={500} c="dimmed">វគ្គសិក្សាដែលបានចុះឈ្មោះ</Text>
                  <Title order={2} mt="sm">
                    {enrollments.filter(e => e.status === 'active').length}
                  </Title>
                </Box>
                <IconCalendar size={48} color="var(--mantine-color-blue-6)" opacity={0.3} />
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 3 }}>
            <Card shadow="md" padding="lg">
              <Group justify="space-between">
                <Box>
                  <Text size="sm" fw={500} c="dimmed">បានបញ្ចប់</Text>
                  <Title order={2} mt="sm">
                    {enrollments.filter(e => e.status === 'completed').length}
                  </Title>
                </Box>
                <IconTrendingUp size={48} color="var(--mantine-color-violet-6)" opacity={0.3} />
              </Group>
            </Card>
          </Grid.Col>
        </Grid>

        <Grid>
          {/* Semester Records */}
          <Grid.Col span={{ base: 12, lg: 6 }}>
            <Card shadow="md" padding="lg">
              <Title order={3} mb="md">កំណត់ត្រាឆមាស</Title>
              {academicRecords.length === 0 ? (
                <Center py="xl">
                  <Stack align="center">
                    <IconFileText size={48} color="var(--mantine-color-gray-4)" />
                    <Text c="dimmed">មិនទាន់មានកំណត់ត្រាសិក្សានៅឡើយទេ</Text>
                    <Text size="sm" c="dimmed">កំណត់ត្រានឹងបង្ហាញបន្ទាប់ពីបញ្ចប់ឆមាស</Text>
                  </Stack>
                </Center>
              ) : (
                <Stack gap="md">
                  {academicRecords.map((record) => (
                    <Paper key={record.id} p="md" withBorder>
                      <Group justify="space-between">
                        <Box>
                          <Text fw={600}>{record.semester}</Text>
                          <Text size="sm" c="dimmed">
                            {new Date(record.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                            })}
                          </Text>
                        </Box>
                        <Box ta="right">
                          <Text size="sm" c="dimmed">GPA</Text>
                          <Title order={3 as const} c={getGPAColor(record.gpa || 0)}>
                            {record.gpa?.toFixed(2) || 'N/A'}
                          </Title>
                        </Box>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Card>
          </Grid.Col>

          {/* Current Enrollments */}
          <Grid.Col span={{ base: 12, lg: 6 }}>
            <Card shadow="md" padding="lg">
              <Title order={3} mb="md">ការចុះឈ្មោះបច្ចុប្បន្ន</Title>
              {enrollments.filter(e => e.status === 'active').length === 0 ? (
                <Center py="xl">
                  <Stack align="center">
                    <IconBook size={48} color="var(--mantine-color-gray-4)" />
                    <Text c="dimmed">មិនមានការចុះឈ្មោះសកម្មទេ</Text>
                    <Button mt="md">រកមើលវគ្គសិក្សា</Button>
                  </Stack>
                </Center>
              ) : (
                <Stack gap="md">
                  {enrollments
                    .filter(e => e.status === 'active')
                    .map((enrollment) => (
                      <Paper key={enrollment.id} p="md" withBorder>
                        <Group justify="space-between" align="flex-start">
                          <Box style={{ flex: 1 }}>
                            <Text fw={600}>
                              {enrollment.courses?.title || 'វគ្គសិក្សាគ្មានចំណងជើង'}
                            </Text>
                            <Text size="sm" c="dimmed" mt="xs">
                              {enrollment.courses?.description || 'គ្មានការពិពណ៌នា'}
                            </Text>
                          </Box>
                          <Badge color="blue" variant="light">
                            {enrollment.courses?.credits || 0} ឯណទាន
                          </Badge>
                        </Group>
                      </Paper>
                    ))}
                </Stack>
              )}
            </Card>
          </Grid.Col>

          {/* Completed Courses */}
          <Grid.Col span={12}>
            <Card shadow="md" padding="lg">
              <Title order={3} mb="md">វគ្គសិក្សាដែលបានបញ្ចប់</Title>
              {enrollments.filter(e => e.status === 'completed').length === 0 ? (
                <Center py="xl">
                  <Stack align="center">
                    <IconAward size={48} color="var(--mantine-color-gray-4)" />
                    <Text c="dimmed">មិនទាន់មានវគ្គសិក្សាដែលបានបញ្ចប់នៅឡើយទេ</Text>
                  </Stack>
                </Center>
              ) : (
                <Grid>
                  {enrollments
                    .filter(e => e.status === 'completed')
                    .map((enrollment) => (
                      <Grid.Col key={enrollment.id} span={{ base: 12, md: 6 }}>
                        <Paper p="md" withBorder style={{ borderLeft: '4px solid var(--mantine-color-green-6)', backgroundColor: 'var(--mantine-color-green-0)' }}>
                          <Group justify="space-between" align="flex-start">
                            <Box style={{ flex: 1 }}>
                              <Text fw={600}>
                                {enrollment.courses?.title || 'វគ្គសិក្សាគ្មានចំណងជើង'}
                              </Text>
                              <Text size="sm" c="dimmed" mt="xs">
                                {enrollment.courses?.credits || 0} ឯណទាន
                              </Text>
                            </Box>
                            <IconAward size={24} color="var(--mantine-color-green-6)" />
                          </Group>
                        </Paper>
                      </Grid.Col>
                    ))}
                </Grid>
              )}
            </Card>
          </Grid.Col>
        </Grid>

        {/* GPA Trend (Placeholder for future chart) */}
        <Card shadow="md" padding="lg" mt="lg">
          <Title order={3} mb="md">និន្នាការ GPA</Title>
          <Center py="xl">
            <Stack align="center">
              <IconTrendingUp size={64} color="var(--mantine-color-gray-4)" />
              <Text size="lg" c="dimmed">ការបង្ហាញនិន្នាការ GPA នឹងមកដល់ឆាបៗនេះ</Text>
              <Text size="sm" c="dimmed">តាមដានវឌ្ឍនភាពសិក្សារបស់អ្នកតាមពេលវេលា</Text>
            </Stack>
          </Center>
        </Card>
      </Container>
    </Box>
  );
}
