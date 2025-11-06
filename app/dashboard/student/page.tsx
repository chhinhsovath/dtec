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
  Badge,
  ThemeIcon,
  Progress,
  Table,
  ActionIcon,
  Tooltip,
  RingProgress,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconPlus,
  IconBook,
  IconGraduationCap,
  IconTrendingUp,
  IconStar,
  IconClock,
  IconCheckCircle,
  IconMessageCircle,
  IconArrowRight,
  IconTarget,
} from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface StudentCourse {
  course_id: string;
  title: string;
  instructor_name: string;
  progress: number;
  current_grade: number;
  rating: number;
  enrolled_at: string;
  lessons_completed: number;
  total_lessons: number;
}

interface Activity {
  id: string;
  type: 'lesson' | 'grade' | 'feedback' | 'assignment';
  description: string;
  course_title: string;
  timestamp: string;
  icon: any;
}

interface StudentStats {
  total_courses: number;
  in_progress_courses: number;
  completed_courses: number;
  average_grade: number;
  overall_progress: number;
  learning_streak: number;
}

export default function StudentDashboard() {
  const { language } = useTranslation();
  const router = useRouter();

  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data
  const mockStats: StudentStats = {
    total_courses: 3,
    in_progress_courses: 2,
    completed_courses: 1,
    average_grade: 82,
    overall_progress: 48,
    learning_streak: 7,
  };

  const mockCourses: StudentCourse[] = [
    {
      course_id: 'course-001',
      title: 'Introduction to Pedagogy',
      instructor_name: 'Dr. Samreth',
      progress: 35,
      current_grade: 85,
      rating: 4.5,
      enrolled_at: '2025-10-10',
      lessons_completed: 7,
      total_lessons: 20,
    },
    {
      course_id: 'course-002',
      title: 'Classroom Management Strategies',
      instructor_name: 'Ms. Nary',
      progress: 60,
      current_grade: 88,
      rating: 4.8,
      enrolled_at: '2025-09-15',
      lessons_completed: 12,
      total_lessons: 20,
    },
    {
      course_id: 'course-003',
      title: 'Student Engagement Techniques',
      instructor_name: 'Mr. Rith',
      progress: 100,
      current_grade: 92,
      rating: 4.3,
      enrolled_at: '2025-08-01',
      lessons_completed: 18,
      total_lessons: 18,
    },
  ];

  const mockActivities: Activity[] = [
    {
      id: '1',
      type: 'lesson',
      description: 'Completed lesson: Classroom Rules & Procedures',
      course_title: 'Classroom Management Strategies',
      timestamp: '2 hours ago',
      icon: IconCheckCircle,
    },
    {
      id: '2',
      type: 'grade',
      description: 'Quiz: Classroom Management Assessment - Score: 88/100',
      course_title: 'Classroom Management Strategies',
      timestamp: '1 day ago',
      icon: IconStar,
    },
    {
      id: '3',
      type: 'feedback',
      description: 'Received feedback on: Teaching Philosophy Essay',
      course_title: 'Introduction to Pedagogy',
      timestamp: '2 days ago',
      icon: IconMessageCircle,
    },
    {
      id: '4',
      type: 'assignment',
      description: 'Assignment available: Behavior Management Plan',
      course_title: 'Classroom Management Strategies',
      timestamp: '3 days ago',
      icon: IconTarget,
    },
  ];

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // In production, replace with API calls:
        // const res = await fetch('/api/student/dashboard');
        // const data = await res.json();

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
  }, []);

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
          <Title order={1}>{language === 'km' ? 'ផ្ទាំងសិស្ស' : 'Student Dashboard'}</Title>
          <Text c="dimmed">
            {language === 'km'
              ? 'តាមដាននីតិវិធីលម្អិត និងវឌ្ឍន៍របស់អ្នក'
              : 'Track your learning progress and achievements'}
          </Text>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          color="blue"
          size="lg"
          onClick={() => router.push('/dashboard/student/courses')}
        >
          {language === 'km' ? 'ចូលរៀនវគ្គរៀន' : 'Enroll in Course'}
        </Button>
      </Group>

      {/* Quick Stats */}
      {stats && (
        <SimpleGrid cols={{ base: 1, sm: 3, md: 6 }} spacing="lg" mb="xl">
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
          </Card>

          <Card withBorder p="lg" radius="md">
            <Group justify="space-between" mb="lg">
              <Stack gap={0}>
                <Text fw={500} size="sm" c="dimmed">
                  {language === 'km' ? 'កំពុងដំណើរការ' : 'In Progress'}
                </Text>
                <Title order={2}>{stats.in_progress_courses}</Title>
              </Stack>
              <ThemeIcon variant="light" size={50} radius="md" color="orange">
                <IconClock size={28} />
              </ThemeIcon>
            </Group>
          </Card>

          <Card withBorder p="lg" radius="md">
            <Group justify="space-between" mb="lg">
              <Stack gap={0}>
                <Text fw={500} size="sm" c="dimmed">
                  {language === 'km' ? 'បានបញ្ចប់' : 'Completed'}
                </Text>
                <Title order={2}>{stats.completed_courses}</Title>
              </Stack>
              <ThemeIcon variant="light" size={50} radius="md" color="green">
                <IconCheckCircle size={28} />
              </ThemeIcon>
            </Group>
          </Card>

          <Card withBorder p="lg" radius="md">
            <Group justify="space-between" mb="lg">
              <Stack gap={0}>
                <Text fw={500} size="sm" c="dimmed">
                  {language === 'km' ? 'ឯក្សរយាងជាមធ្យម' : 'Average Grade'}
                </Text>
                <Title order={2}>{stats.average_grade}%</Title>
              </Stack>
              <ThemeIcon variant="light" size={50} radius="md" color="blue">
                <IconStar size={28} />
              </ThemeIcon>
            </Group>
          </Card>

          <Card withBorder p="lg" radius="md">
            <Group justify="space-between" mb="lg">
              <Stack gap={0}>
                <Text fw={500} size="sm" c="dimmed">
                  {language === 'km' ? 'សរុបវឌ្ឍន៍' : 'Overall Progress'}
                </Text>
                <Title order={2}>{stats.overall_progress}%</Title>
              </Stack>
              <ThemeIcon variant="light" size={50} radius="md" color="purple">
                <IconTrendingUp size={28} />
              </ThemeIcon>
            </Group>
            <Progress value={stats.overall_progress} size="sm" />
          </Card>

          <Card withBorder p="lg" radius="md">
            <Group justify="space-between" mb="lg">
              <Stack gap={0}>
                <Text fw={500} size="sm" c="dimmed">
                  {language === 'km' ? 'ខ្សែសង្វាក់ដែលសិក្សា' : 'Learning Streak'}
                </Text>
                <Title order={2}>{stats.learning_streak}d</Title>
              </Stack>
              <ThemeIcon variant="light" size={50} radius="md" color="red">
                <IconGraduationCap size={28} />
              </ThemeIcon>
            </Group>
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
                onClick={() => router.push('/dashboard/student/courses')}
              >
                {language === 'km' ? 'មើលទាំងអស់' : 'View All'}
              </Button>
            </Group>

            {courses.length === 0 ? (
              <Center p="xl">
                <Text c="dimmed">{language === 'km' ? 'មិនមាននេះទេ' : 'No courses yet'}</Text>
              </Center>
            ) : (
              <Stack gap="md">
                {courses.slice(0, 3).map((course) => (
                  <Card key={course.course_id} withBorder p="md" radius="md">
                    <Group justify="space-between" mb="md">
                      <div>
                        <Text fw={500}>{course.title}</Text>
                        <Text size="sm" c="dimmed">
                          {language === 'km' ? 'គ្រូបង្រៀន៖' : 'Instructor:'} {course.instructor_name}
                        </Text>
                      </div>
                      <Group gap="xs">
                        <Badge color={course.progress === 100 ? 'green' : 'blue'}>
                          {course.progress}%
                        </Badge>
                        <ActionIcon
                          variant="light"
                          color="blue"
                          onClick={() => router.push(`/dashboard/student/courses/${course.course_id}`)}
                        >
                          <IconArrowRight size={16} />
                        </ActionIcon>
                      </Group>
                    </Group>

                    <Progress value={course.progress} size="sm" mb="md" />

                    <Group justify="space-between" mb="md">
                      <Text size="xs" c="dimmed">
                        {course.lessons_completed}/{course.total_lessons} {language === 'km' ? 'មេរៀន' : 'lessons'}
                      </Text>
                      <Group gap="xs">
                        <Text size="xs" fw={500}>
                          {course.current_grade}%
                        </Text>
                        <IconStar size={14} style={{ fill: 'gold' }} />
                      </Group>
                    </Group>
                  </Card>
                ))}
              </Stack>
            )}
          </Card>
        </Stack>

        {/* Recent Activity & Quick Actions */}
        <Stack flex={1}>
          {/* Recent Activity */}
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
                onClick={() => router.push('/dashboard/student/courses')}
              >
                {language === 'km' ? 'ចូលរៀនវគ្គរៀន' : 'Browse Courses'}
                <IconBook size={16} />
              </Button>
              <Button
                variant="light"
                justify="space-between"
                onClick={() => router.push('/dashboard/student/grades')}
              >
                {language === 'km' ? 'ពិន្ទុរបស់ខ្ញុំ' : 'My Grades'}
                <IconStar size={16} />
              </Button>
              <Button
                variant="light"
                justify="space-between"
                onClick={() => router.push('/dashboard/student/certificates')}
              >
                {language === 'km' ? 'វិស័យ័' : 'Certificates'}
                <IconGraduationCap size={16} />
              </Button>
            </Stack>
          </Card>
        </Stack>
      </Group>
    </Container>
  );
}
