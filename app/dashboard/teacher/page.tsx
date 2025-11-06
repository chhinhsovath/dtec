'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Card,
  Loader,
  Center,
  Alert,
  SimpleGrid,
  ThemeIcon,
  Badge,
  Progress,
  Table,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconPlus,
  IconBook,
  IconUsers,
  IconClipboardList,
  IconTrendingUp,
  IconClock,
  IconCheckCircle,
  IconMessageCircle,
  IconStar,
  IconCalendar,
} from '@tabler/icons-react';
import { getSession } from '@/lib/auth/client-auth';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface TeacherStats {
  total_courses: number;
  published_courses: number;
  draft_courses: number;
  total_students: number;
  active_students: number;
  pending_grades: number;
  upcoming_deadlines: number;
}

interface Course {
  course_id: string;
  title: string;
  status: 'draft' | 'published' | 'archived';
  student_count: number;
  completion_rate: number;
  created_at: string;
  published_at?: string;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  course_title: string;
  timestamp: string;
  icon: any;
}

export default function TeacherDashboard() {
  const { language } = useTranslation();
  const router = useRouter();

  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const session = getSession();

        if (!session) {
          router.push('/auth/login');
          return;
        }

        // Check if user has teacher role
        if (session.role !== 'teacher' && session.role !== 'admin') {
          router.push(`/dashboard/${session.role}`);
          return;
        }

        // Mock data
        const mockStats: TeacherStats = {
          total_courses: 8,
          published_courses: 5,
          draft_courses: 3,
          total_students: 124,
          active_students: 98,
          pending_grades: 12,
          upcoming_deadlines: 3,
        };

        const mockCourses: Course[] = [
          {
            course_id: 'course-001',
            title: 'Introduction to Pedagogy',
            status: 'published',
            student_count: 45,
            completion_rate: 78,
            created_at: '2025-08-15',
            published_at: '2025-08-20',
          },
          {
            course_id: 'course-002',
            title: 'Classroom Management Strategies',
            status: 'published',
            student_count: 38,
            completion_rate: 65,
            created_at: '2025-09-01',
            published_at: '2025-09-05',
          },
          {
            course_id: 'course-003',
            title: 'Assessment Methods',
            status: 'draft',
            student_count: 0,
            completion_rate: 0,
            created_at: '2025-10-15',
          },
          {
            course_id: 'course-004',
            title: 'Student Engagement Techniques',
            status: 'published',
            student_count: 41,
            completion_rate: 82,
            created_at: '2025-07-20',
            published_at: '2025-07-25',
          },
        ];

        const mockActivities: Activity[] = [
          {
            id: '1',
            type: 'submission',
            description: 'New assignment submitted',
            course_title: 'Introduction to Pedagogy',
            timestamp: '2 hours ago',
            icon: IconClipboardList,
          },
          {
            id: '2',
            type: 'enrollment',
            description: '5 new students enrolled',
            course_title: 'Classroom Management Strategies',
            timestamp: '4 hours ago',
            icon: IconUsers,
          },
          {
            id: '3',
            type: 'message',
            description: 'Student asked a question',
            course_title: 'Assessment Methods',
            timestamp: '1 day ago',
            icon: IconMessageCircle,
          },
          {
            id: '4',
            type: 'completion',
            description: 'Student completed course',
            course_title: 'Introduction to Pedagogy',
            timestamp: '2 days ago',
            icon: IconCheckCircle,
          },
        ];

        setStats(mockStats);
        setCourses(mockCourses);
        setActivities(mockActivities);
        setLoading(false);
      } catch (err) {
        console.error('Error loading dashboard:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  if (loading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  if (error) {
    return (
      <Container size="lg" py="xl">
        <Alert icon={<IconAlertCircle />} color="red" title="Error">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      {/* Header */}
      <Group mb="xl" justify="space-between">
        <div>
          <Title order={1}>{language === 'km' ? 'ផ្ទាំងគ្រូ' : 'Teacher Dashboard'}</Title>
          <Text c="dimmed">
            {language === 'km'
              ? 'គ្រប់គ្រងវគ្គរៀន ធានាផ្តល់ឱ្យសិស្ស និងលម្អិត'
              : 'Manage your courses, students, and content'}
          </Text>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          color="blue"
          size="lg"
          onClick={() => router.push('/dashboard/teacher/courses/new')}
        >
          {language === 'km' ? 'បង្កើតវគ្គរៀន' : 'Create Course'}
        </Button>
      </Group>

      {/* Quick Stats */}
      {stats && (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg" mb="xl">
          <Card withBorder p="lg" radius="md">
            <Group justify="space-between" mb="lg">
              <Stack gap={0}>
                <Text fw={500} size="sm" c="dimmed">
                  {language === 'km' ? 'វគ្គរៀនសរុប' : 'Total Courses'}
                </Text>
                <Title order={2}>{stats.total_courses}</Title>
              </Stack>
              <ThemeIcon variant="light" size={50} radius="md" color="blue">
                <IconBook size={28} />
              </ThemeIcon>
            </Group>
            <Group gap="xs">
              <Badge color="green">{stats.published_courses} published</Badge>
              <Badge color="yellow">{stats.draft_courses} draft</Badge>
            </Group>
          </Card>

          <Card withBorder p="lg" radius="md">
            <Group justify="space-between" mb="lg">
              <Stack gap={0}>
                <Text fw={500} size="sm" c="dimmed">
                  {language === 'km' ? 'សិស្សសរុប' : 'Total Students'}
                </Text>
                <Title order={2}>{stats.total_students}</Title>
              </Stack>
              <ThemeIcon variant="light" size={50} radius="md" color="purple">
                <IconUsers size={28} />
              </ThemeIcon>
            </Group>
            <Text size="xs" c="dimmed">
              {stats.active_students} {language === 'km' ? 'សកម្ម' : 'active'}
            </Text>
          </Card>

          <Card withBorder p="lg" radius="md">
            <Group justify="space-between" mb="lg">
              <Stack gap={0}>
                <Text fw={500} size="sm" c="dimmed">
                  {language === 'km' ? 'ដាក់ឲ្យដឹងបដិសេធ' : 'Pending Grades'}
                </Text>
                <Title order={2}>{stats.pending_grades}</Title>
              </Stack>
              <ThemeIcon variant="light" size={50} radius="md" color="orange">
                <IconClipboardList size={28} />
              </ThemeIcon>
            </Group>
            <Text size="xs" c="dimmed">
              {language === 'km' ? 'ច្បាប់ស្ដង់ដារ' : 'submissions to grade'}
            </Text>
          </Card>

          <Card withBorder p="lg" radius="md">
            <Group justify="space-between" mb="lg">
              <Stack gap={0}>
                <Text fw={500} size="sm" c="dimmed">
                  {language === 'km' ? 'ពេលវេលាថ្មីៗ' : 'Upcoming Deadlines'}
                </Text>
                <Title order={2}>{stats.upcoming_deadlines}</Title>
              </Stack>
              <ThemeIcon variant="light" size={50} radius="md" color="red">
                <IconCalendar size={28} />
              </ThemeIcon>
            </Group>
            <Text size="xs" c="dimmed">
              {language === 'km' ? 'ក្នុង 7 ថ្ងៃ' : 'in next 7 days'}
            </Text>
          </Card>
        </SimpleGrid>
      )}

      {/* Main Content Grid */}
      <Group align="flex-start" grow>
        {/* Active Courses */}
        <Stack flex={2}>
          <Card withBorder radius="md" p="lg">
            <Group justify="space-between" mb="lg">
              <Title order={3}>{language === 'km' ? 'វគ្គរៀនសកម្ម' : 'Active Courses'}</Title>
              <Button
                size="xs"
                variant="light"
                onClick={() => router.push('/dashboard/teacher/courses')}
              >
                {language === 'km' ? 'មើលទាំងអស់' : 'View All'}
              </Button>
            </Group>

            {courses.length === 0 ? (
              <Center p="xl">
                <Text c="dimmed">{language === 'km' ? 'មិនមាន' : 'No courses yet'}</Text>
              </Center>
            ) : (
              <Table striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{language === 'km' ? 'វគ្គរៀន' : 'Course'}</Table.Th>
                    <Table.Th>{language === 'km' ? 'សិស្ស' : 'Students'}</Table.Th>
                    <Table.Th>{language === 'km' ? 'វឌ្ឍន៍' : 'Progress'}</Table.Th>
                    <Table.Th>{language === 'km' ? 'សកម្មភាព' : 'Action'}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {courses.slice(0, 5).map((course) => (
                    <Table.Tr key={course.course_id}>
                      <Table.Td>
                        <Text fw={500} size="sm">
                          {course.title}
                        </Text>
                        <Badge
                          color={course.status === 'published' ? 'green' : 'yellow'}
                          size="sm"
                          variant="light"
                        >
                          {course.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{course.student_count}</Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Progress value={course.completion_rate} size="sm" style={{ flex: 1 }} />
                          <Text size="sm" fw={500}>
                            {course.completion_rate}%
                          </Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Tooltip label={language === 'km' ? 'កែប្រែ' : 'Edit'}>
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="blue"
                            onClick={() => router.push(`/dashboard/teacher/courses/${course.course_id}`)}
                          >
                            <IconBook size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Card>
        </Stack>

        {/* Recent Activity */}
        <Stack flex={1}>
          <Card withBorder radius="md" p="lg">
            <Title order={3} mb="lg">
              {language === 'km' ? 'សកម្មភាពថ្មីៗ' : 'Recent Activity'}
            </Title>

            <Stack gap="sm">
              {activities.map((activity) => {
                const Icon = activity.icon;
                return (
                  <Card key={activity.id} withBorder p="md" radius="md">
                    <Group gap="sm">
                      <ThemeIcon variant="light" size={40} radius="md">
                        <Icon size={20} />
                      </ThemeIcon>
                      <Stack gap={0} style={{ flex: 1 }}>
                        <Text fw={500} size="sm">
                          {activity.description}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {activity.course_title}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {activity.timestamp}
                        </Text>
                      </Stack>
                    </Group>
                  </Card>
                );
              })}
            </Stack>
          </Card>

          {/* Quick Actions */}
          <Card withBorder radius="md" p="lg">
            <Title order={3} mb="lg">
              {language === 'km' ? 'រហ័សលឿន' : 'Quick Actions'}
            </Title>

            <Stack gap="sm">
              <Button
                variant="light"
                justify="space-between"
                onClick={() => router.push('/dashboard/teacher/courses')}
              >
                {language === 'km' ? 'គ្រប់គ្រងវគ្គរៀន' : 'Manage Courses'}
                <IconBook size={16} />
              </Button>
              <Button
                variant="light"
                justify="space-between"
                onClick={() => router.push('/dashboard/teacher/gradebook')}
              >
                {language === 'km' ? 'ឲ្យពិន្ទុ' : 'Grade Assignments'}
                <IconClipboardList size={16} />
              </Button>
              <Button
                variant="light"
                justify="space-between"
                onClick={() => router.push('/dashboard/teacher/h5p-library')}
              >
                {language === 'km' ? 'H5P ខ្ទង់' : 'H5P Library'}
                <IconStar size={16} />
              </Button>
            </Stack>
          </Card>
        </Stack>
      </Group>
    </Container>
  );
}
