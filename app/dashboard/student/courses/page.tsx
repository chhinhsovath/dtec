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
  Group,
  Stack,
  Center,
  Loader,
  Alert,
  TextInput,
  Badge,
  Box,
  Divider
} from '@mantine/core';
import {
  IconSearch
} from '@tabler/icons-react';

interface Course {
  id: string;
  institution_id: string;
  code: string;
  name: string;
  description: string | null;
  enrollment_count: number;
  created_at: string;
  updated_at: string;
}

interface Enrollment {
  id: string;
  course_id: string;
  student_id: string;
  status: string;
  enrollment_date: string;
  course_code: string;
  course_name: string;
}

export default function StudentCoursesPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);
  const [droppingEnrollmentId, setDroppingEnrollmentId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const sess = getSession();
      if (!sess || sess.role !== 'student') {
        router.push('/auth/login');
        return;
      }
      setSession(sess);
      fetchCourses();
      fetchEnrolledCourses(sess.id);
    };

    checkAuth();
  }, [router]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/courses?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch courses');
      const data = await response.json();
      setAvailableCourses(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrolledCourses = async (studentId: string) => {
    try {
      const response = await fetch(`/api/enrollments?studentId=${studentId}`);
      if (!response.ok) throw new Error('Failed to fetch enrollments');
      const data = await response.json();
      setEnrolledCourses(data.data || []);
    } catch (err) {
      console.error('Error fetching enrollments:', err);
    }
  };

  const handleEnrollCourse = async (courseId: string) => {
    try {
      setError(null);
      setEnrollingCourseId(courseId);

      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          studentId: session.id,
          status: 'active',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to enroll');
      }

      const result = await response.json();

      // Add to enrolled courses
      setEnrolledCourses([...enrolledCourses, result.data]);

      // Remove from available courses
      setAvailableCourses(availableCourses.filter(c => c.id !== courseId));

      setEnrollingCourseId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enroll in course');
      setEnrollingCourseId(null);
    }
  };

  const handleDropCourse = async (enrollmentId: string) => {
    try {
      setError(null);
      const response = await fetch(`/api/enrollments/${enrollmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to drop course');

      // Find the enrollment and get course_id
      const enrollment = enrolledCourses.find(e => e.id === enrollmentId);

      // Remove from enrolled
      setEnrolledCourses(enrolledCourses.filter(e => e.id !== enrollmentId));

      // Re-fetch available courses to show the dropped course
      fetchCourses();

      setDroppingEnrollmentId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to drop course');
      setDroppingEnrollmentId(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCourses();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'green';
      case 'completed':
        return 'blue';
      case 'inactive':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  if (!session) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Box style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #EBF4FF 0%, #E0E7FF 100%)'
    }} p="xl" pt="48px">
      <Container size="xl">
        <Title order={2} mb="xl" style={{ fontFamily: 'Hanuman, serif' }}>
          ស្វាគមន៍ទៅវគ្គសិក្សា
        </Title>

        {/* Error Message */}
        {error && (
          <Alert color="red" mb="md" onClose={() => setError(null)} withCloseButton>
            {error}
          </Alert>
        )}

        {/* Your Enrolled Courses Section */}
        {enrolledCourses.length > 0 && (
          <Box mb="xl">
            <Title order={2} mb="lg">
              My Courses ({enrolledCourses.length})
            </Title>

            <Stack gap="md">
              {enrolledCourses.map((enrollment) => (
                <Paper key={enrollment.id} shadow="lg" p="xl" radius="md" withBorder>
                  <Group justify="space-between" align="flex-start" mb="md">
                    <Box style={{ flex: 1 }}>
                      <Group gap="sm" mb="xs">
                        <Badge size="lg" variant="filled" color="blue">
                          {enrollment.course_code}
                        </Badge>
                        <Badge size="sm" variant="filled" color={getStatusColor(enrollment.status)}>
                          {enrollment.status}
                        </Badge>
                      </Group>
                      <Title order={3}>
                        {enrollment.course_name}
                      </Title>
                    </Box>
                  </Group>

                  <Divider my="md" />

                  <Group justify="space-between">
                    <Box>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        Enrolled Date
                      </Text>
                      <Text size="sm" fw={600}>
                        {formatDate(enrollment.enrollment_date)}
                      </Text>
                    </Box>
                  </Group>

                  {enrollment.status === 'active' && (
                    <Box mt="md">
                      {droppingEnrollmentId !== enrollment.id ? (
                        <Button
                          color="red"
                          variant="light"
                          onClick={() => setDroppingEnrollmentId(enrollment.id)}
                        >
                          Drop Course
                        </Button>
                      ) : (
                        <Paper p="md" withBorder style={{ backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }}>
                          <Text size="sm" mb="md">
                            Are you sure you want to drop this course?
                          </Text>
                          <Group gap="xs">
                            <Button
                              color="red"
                              size="xs"
                              onClick={() => handleDropCourse(enrollment.id)}
                            >
                              Confirm Drop
                            </Button>
                            <Button
                              color="gray"
                              size="xs"
                              variant="light"
                              onClick={() => setDroppingEnrollmentId(null)}
                            >
                              Cancel
                            </Button>
                          </Group>
                        </Paper>
                      )}
                    </Box>
                  )}
                </Paper>
              ))}
            </Stack>

            <Divider my="xl" />
          </Box>
        )}

        {/* Available Courses Section */}
        <Box>
          <Title order={2} mb="lg">
            Available Courses
          </Title>

          {/* Search Bar */}
          <Box component="form" onSubmit={handleSearch} mb="xl">
            <Group gap="xs">
              <TextInput
                flex={1}
                placeholder="Search by course name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftSection={<IconSearch size={16} />}
              />
              <Button type="submit">
                Search
              </Button>
            </Group>
          </Box>

          {/* Courses Grid */}
          {loading ? (
            <Center py="xl">
              <Loader size="lg" />
            </Center>
          ) : availableCourses.length === 0 ? (
            <Paper shadow="lg" p="xl" radius="md" withBorder>
              <Text ta="center" c="dimmed" size="lg">
                {searchQuery
                  ? 'No courses found matching your search.'
                  : 'No available courses to enroll in.'}
              </Text>
            </Paper>
          ) : (
            <Stack gap="md">
              {availableCourses.map((course) => (
                <Paper key={course.id} shadow="lg" p="xl" radius="md" withBorder>
                  <Group justify="space-between" align="flex-start" mb="md">
                    <Box style={{ flex: 1 }}>
                      <Group gap="sm" mb="xs">
                        <Badge size="lg" variant="filled" color="blue">
                          {course.code}
                        </Badge>
                      </Group>
                      <Title order={3} mb="xs">
                        {course.name}
                      </Title>
                      {course.description && (
                        <Text c="dimmed" size="sm" mb="sm">
                          {course.description.substring(0, 150)}
                          {course.description.length > 150 ? '...' : ''}
                        </Text>
                      )}
                    </Box>
                  </Group>

                  <Divider my="md" />

                  <Group justify="space-between">
                    <Box>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        Students Enrolled
                      </Text>
                      <Text size="sm" fw={600}>
                        {course.enrollment_count || 0}
                      </Text>
                    </Box>
                  </Group>

                  <Box mt="md">
                    <Button
                      fullWidth
                      color="green"
                      onClick={() => handleEnrollCourse(course.id)}
                      disabled={enrollingCourseId === course.id}
                      loading={enrollingCourseId === course.id}
                    >
                      {enrollingCourseId === course.id ? 'Enrolling...' : 'Enroll Now'}
                    </Button>
                  </Box>
                </Paper>
              ))}
            </Stack>
          )}
        </Box>
      </Container>
    </Box>
  );
}
