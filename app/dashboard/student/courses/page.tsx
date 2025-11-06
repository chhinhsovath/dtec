'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
  Badge,
  ThemeIcon,
  SimpleGrid,
  Input,
  Select,
  RatingInput,
  Progress,
  Tooltip,
  Modal,
  Textarea,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconSearch,
  IconStar,
  IconUsers,
  IconBook,
  IconCheck,
  IconClock,
  IconGraduationCap,
} from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface Course {
  course_id: string;
  title: string;
  description: string;
  instructor_name: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  status: 'draft' | 'published';
  student_count: number;
  rating: number;
  total_ratings: number;
  duration_hours?: number;
  created_at: string;
  published_at?: string;
}

interface EnrolledCourse extends Course {
  enrolled_at: string;
  progress: number;
}

export default function StudentCoursesPage() {
  const { language } = useTranslation();
  const router = useRouter();

  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'available' | 'enrolled'>('available');

  // Enrollment modal
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [enrollReason, setEnrollReason] = useState('');

  // Mock data
  const mockCourses: Course[] = [
    {
      course_id: 'course-001',
      title: 'Introduction to Pedagogy',
      description: 'Learn the fundamentals of effective teaching methods and classroom management',
      instructor_name: 'Dr. Samreth',
      level: 'beginner',
      status: 'published',
      student_count: 45,
      rating: 4.5,
      total_ratings: 12,
      duration_hours: 40,
      created_at: '2025-08-15',
      published_at: '2025-08-20',
    },
    {
      course_id: 'course-002',
      title: 'Classroom Management Strategies',
      description: 'Advanced techniques for managing diverse classrooms and student behavior',
      instructor_name: 'Ms. Nary',
      level: 'intermediate',
      status: 'published',
      student_count: 38,
      rating: 4.8,
      total_ratings: 18,
      duration_hours: 35,
      created_at: '2025-09-01',
      published_at: '2025-09-05',
    },
    {
      course_id: 'course-003',
      title: 'Student Engagement Techniques',
      description: 'Creating interactive and engaging learning experiences for students',
      instructor_name: 'Mr. Rith',
      level: 'advanced',
      status: 'published',
      student_count: 41,
      rating: 4.3,
      total_ratings: 9,
      duration_hours: 45,
      created_at: '2025-07-20',
      published_at: '2025-07-25',
    },
    {
      course_id: 'course-004',
      title: 'Technology in Education',
      description: 'Integrating digital tools and technology in modern pedagogy',
      instructor_name: 'Dr. Sophany',
      level: 'beginner',
      status: 'published',
      student_count: 28,
      rating: 4.6,
      total_ratings: 15,
      duration_hours: 30,
      created_at: '2025-10-01',
      published_at: '2025-10-05',
    },
    {
      course_id: 'course-005',
      title: 'Inclusive Teaching Practices',
      description: 'Supporting diverse learners and creating inclusive learning environments',
      instructor_name: 'Ms. Chea',
      level: 'intermediate',
      status: 'published',
      student_count: 32,
      rating: 4.9,
      total_ratings: 20,
      duration_hours: 38,
      created_at: '2025-09-10',
      published_at: '2025-09-15',
    },
    {
      course_id: 'course-006',
      title: 'Assessment and Evaluation',
      description: 'Designing effective assessments and evaluating student learning',
      instructor_name: 'Dr. Mony',
      level: 'advanced',
      status: 'published',
      student_count: 25,
      rating: 4.4,
      total_ratings: 11,
      duration_hours: 42,
      created_at: '2025-08-25',
      published_at: '2025-08-30',
    },
  ];

  const mockEnrolledCourses: EnrolledCourse[] = [
    {
      ...mockCourses[0],
      enrolled_at: '2025-10-10',
      progress: 35,
    },
    {
      ...mockCourses[2],
      enrolled_at: '2025-10-05',
      progress: 60,
    },
  ];

  // Load courses
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        // In production, replace with API call:
        // const res = await fetch('/api/student/courses');
        // const data = await res.json();

        setAllCourses(mockCourses);
        setEnrolledCourses(mockEnrolledCourses);
        setFilteredCourses(mockCourses);
        setLoading(false);
      } catch (err) {
        console.error('Error loading courses:', err);
        setError(err instanceof Error ? err.message : 'Failed to load courses');
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  // Filter courses
  useEffect(() => {
    let filtered = viewMode === 'enrolled' ? enrolledCourses : allCourses;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.instructor_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by level
    if (levelFilter) {
      filtered = filtered.filter((course) => course.level === levelFilter);
    }

    // Sort
    if (sortBy === 'rating') {
      filtered = [...filtered].sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'students') {
      filtered = [...filtered].sort((a, b) => b.student_count - a.student_count);
    } else if (sortBy === 'newest') {
      filtered = [...filtered].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    setFilteredCourses(filtered);
  }, [searchQuery, levelFilter, sortBy, viewMode, allCourses, enrolledCourses]);

  // Enroll in course
  const handleEnroll = useCallback(async () => {
    if (!selectedCourse) return;

    try {
      // In production, replace with API call:
      // const res = await fetch(`/api/student/courses/${selectedCourse.course_id}/enroll`, {
      //   method: 'POST',
      //   body: JSON.stringify({ reason: enrollReason }),
      // });

      const newEnrollment: EnrolledCourse = {
        ...selectedCourse,
        enrolled_at: new Date().toISOString().split('T')[0],
        progress: 0,
      };

      setEnrolledCourses([...enrolledCourses, newEnrollment]);
      setAllCourses(allCourses.filter((c) => c.course_id !== selectedCourse.course_id));

      setIsEnrollModalOpen(false);
      setSelectedCourse(null);
      setEnrollReason('');
    } catch (err) {
      console.error('Error enrolling in course:', err);
      alert(err instanceof Error ? err.message : 'Failed to enroll');
    }
  }, [selectedCourse, enrollReason, allCourses, enrolledCourses]);

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
          <Title order={1}>
            {viewMode === 'available' ? (language === 'km' ? 'សូត្របាក់' : 'Explore Courses') : language === 'km' ? 'វគ្គរៀនរបស់ខ្ញុំ' : 'My Courses'}
          </Title>
          <Text c="dimmed">
            {viewMode === 'available'
              ? language === 'km'
                ? 'រកមើលវគ្គរៀនថ្មីដើម្បីចូលរៀន'
                : 'Discover and enroll in new courses'
              : language === 'km'
                ? 'តាមដាននីតិវិធីលម្អិតរបស់អ្នក'
                : 'Track your learning progress'}
          </Text>
        </div>
        <Group>
          <Button
            variant={viewMode === 'available' ? 'filled' : 'light'}
            onClick={() => setViewMode('available')}
            leftSection={<IconBook size={16} />}
          >
            {language === 'km' ? 'ដែលមាន' : 'Available'} ({allCourses.length})
          </Button>
          <Button
            variant={viewMode === 'enrolled' ? 'filled' : 'light'}
            onClick={() => setViewMode('enrolled')}
            leftSection={<IconGraduationCap size={16} />}
          >
            {language === 'km' ? 'ចូលរៀន' : 'Enrolled'} ({enrolledCourses.length})
          </Button>
        </Group>
      </Group>

      {/* Filters */}
      {viewMode === 'available' && (
        <Group mb="xl" grow align="flex-end">
          <Input
            placeholder={language === 'km' ? 'ស្វាងរក' : 'Search courses...'}
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
          />
          <Select
            placeholder={language === 'km' ? 'កម្រិត' : 'Filter by level'}
            data={[
              { value: 'beginner', label: language === 'km' ? 'ថ្មី' : 'Beginner' },
              { value: 'intermediate', label: language === 'km' ? 'មិនលម្អិត' : 'Intermediate' },
              { value: 'advanced', label: language === 'km' ? 'កម្រិតខ្ពស់' : 'Advanced' },
            ]}
            value={levelFilter}
            onChange={setLevelFilter}
            clearable
          />
          <Select
            placeholder={language === 'km' ? 'ចែក' : 'Sort by'}
            data={[
              { value: 'rating', label: language === 'km' ? 'វាយតម្លៃខ្ពស់ជាង' : 'Highest Rated' },
              { value: 'students', label: language === 'km' ? 'សិស្សច្រើន' : 'Most Popular' },
              { value: 'newest', label: language === 'km' ? 'ថ្មីបំផុត' : 'Newest' },
            ]}
            value={sortBy}
            onChange={setSortBy}
            clearable
          />
        </Group>
      )}

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <Center p="xl">
          <Stack align="center" gap="sm">
            <Text c="dimmed">{language === 'km' ? 'មិនមាននេះទេ' : 'No courses found'}</Text>
            {viewMode === 'available' && (
              <Button
                variant="light"
                onClick={() => {
                  setSearchQuery('');
                  setLevelFilter(null);
                  setSortBy(null);
                }}
              >
                {language === 'km' ? 'ដកចេញតម្រង' : 'Clear filters'}
              </Button>
            )}
          </Stack>
        </Center>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {filteredCourses.map((course) => {
            const isEnrolled = enrolledCourses.some((ec) => ec.course_id === course.course_id);
            const progress = enrolledCourses.find((ec) => ec.course_id === course.course_id)?.progress || 0;

            return (
              <Card key={course.course_id} withBorder radius="md" p="lg" className="hover:shadow-md transition-shadow">
                {/* Header */}
                <Card.Section inheritPadding py="md" withBorder>
                  <Group justify="space-between" mb="xs">
                    <Badge color={course.level === 'beginner' ? 'blue' : course.level === 'intermediate' ? 'yellow' : 'orange'}>
                      {course.level === 'beginner'
                        ? language === 'km'
                          ? 'ថ្មី'
                          : 'Beginner'
                        : course.level === 'intermediate'
                          ? language === 'km'
                            ? 'មិនលម្អិត'
                            : 'Intermediate'
                          : language === 'km'
                            ? 'កម្រិតខ្ពស់'
                            : 'Advanced'}
                    </Badge>
                    {isEnrolled && <Badge color="green">{language === 'km' ? 'ចូលរៀន' : 'Enrolled'}</Badge>}
                  </Group>
                  <Title order={4}>{course.title}</Title>
                </Card.Section>

                <Stack gap="md" mt="md">
                  {/* Instructor */}
                  <Text size="sm" c="dimmed">
                    {language === 'km' ? 'គ្រូបង្រៀន៖' : 'Instructor:'} <Text fw={500} component="span">{course.instructor_name}</Text>
                  </Text>

                  {/* Description */}
                  <Text size="sm" lineClamp={2}>
                    {course.description}
                  </Text>

                  {/* Stats */}
                  <Group gap="lg">
                    <Group gap="xs">
                      <IconUsers size={16} />
                      <Text size="sm">{course.student_count}</Text>
                    </Group>
                    <Group gap="xs">
                      <IconClock size={16} />
                      <Text size="sm">{course.duration_hours}h</Text>
                    </Group>
                  </Group>

                  {/* Rating */}
                  <Group gap="xs">
                    <Group gap={2}>
                      {[...Array(5)].map((_, i) => (
                        <IconStar
                          key={i}
                          size={16}
                          fill={i < Math.floor(course.rating) ? 'currentColor' : 'none'}
                          color={i < Math.floor(course.rating) ? 'gold' : 'gray'}
                        />
                      ))}
                    </Group>
                    <Text size="sm" fw={500}>
                      {course.rating}
                    </Text>
                    <Text size="xs" c="dimmed">
                      ({course.total_ratings})
                    </Text>
                  </Group>

                  {/* Progress or Enroll Button */}
                  {isEnrolled ? (
                    <Stack gap="xs">
                      <Group justify="space-between">
                        <Text fw={500} size="sm">
                          {language === 'km' ? 'វឌ្ឍន៍' : 'Progress'}
                        </Text>
                        <Text fw={500} size="sm">
                          {progress}%
                        </Text>
                      </Group>
                      <Progress value={progress} size="sm" />
                      <Button
                        variant="light"
                        size="sm"
                        fullWidth
                        onClick={() => router.push(`/dashboard/student/courses/${course.course_id}`)}
                      >
                        {language === 'km' ? 'ចូលក្រៅ' : 'Continue'}
                      </Button>
                    </Stack>
                  ) : (
                    <Button
                      fullWidth
                      onClick={() => {
                        setSelectedCourse(course);
                        setIsEnrollModalOpen(true);
                      }}
                      leftSection={<IconCheck size={16} />}
                    >
                      {language === 'km' ? 'ចូលរៀន' : 'Enroll Now'}
                    </Button>
                  )}
                </Stack>
              </Card>
            );
          })}
        </SimpleGrid>
      )}

      {/* Enrollment Modal */}
      <Modal
        opened={isEnrollModalOpen}
        onClose={() => {
          setIsEnrollModalOpen(false);
          setSelectedCourse(null);
          setEnrollReason('');
        }}
        title={language === 'km' ? 'ចូលរៀនក្នុងវគ្គរៀន' : 'Enroll in Course'}
        size="lg"
      >
        {selectedCourse && (
          <Stack gap="md">
            <Card withBorder p="md" radius="md" bg="blue.0">
              <Title order={4}>{selectedCourse.title}</Title>
              <Text size="sm" c="dimmed" mt="xs">
                {language === 'km' ? 'គ្រូបង្រៀន៖' : 'Instructor:'} {selectedCourse.instructor_name}
              </Text>
            </Card>

            <Textarea
              label={language === 'km' ? 'ហេតុផលក្នុងការចូលរៀន (ឯកស្វ័យ)' : 'Why do you want to take this course? (Optional)'}
              placeholder={language === 'km' ? 'ចែករំលែកលក្ষ្យណ៍របស់អ្នក...' : 'Tell us about your goals...'}
              value={enrollReason}
              onChange={(e) => setEnrollReason(e.currentTarget.value)}
              rows={3}
            />

            <Group justify="flex-end">
              <Button
                variant="default"
                onClick={() => {
                  setIsEnrollModalOpen(false);
                  setSelectedCourse(null);
                  setEnrollReason('');
                }}
              >
                {language === 'km' ? 'បោះបង់' : 'Cancel'}
              </Button>
              <Button onClick={handleEnroll} leftSection={<IconCheck size={16} />}>
                {language === 'km' ? 'ចូលរៀន' : 'Confirm Enrollment'}
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Container>
  );
}
