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
  Table,
  Badge,
  Progress,
  Modal,
  TextInput,
  Textarea,
  Select,
  SimpleGrid,
  ActionIcon,
  Tooltip,
  ThemeIcon,
  Input,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconBook,
  IconUsers,
  IconEye,
  IconArchive,
  IconCheck,
} from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface Course {
  course_id: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  status: 'draft' | 'published' | 'archived';
  student_count: number;
  created_at: string;
  published_at?: string;
}

export default function CoursesPage() {
  const { language } = useTranslation();
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form state for creating/editing course
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    subject_area: '',
  });

  // Mock courses data
  const mockCourses: Course[] = [
    {
      course_id: 'course-001',
      title: 'Introduction to Pedagogy',
      description: 'Fundamentals of teaching methods and classroom management',
      level: 'beginner',
      status: 'published',
      student_count: 45,
      created_at: '2025-08-15',
      published_at: '2025-08-20',
    },
    {
      course_id: 'course-002',
      title: 'Classroom Management Strategies',
      description: 'Advanced techniques for managing diverse classrooms',
      level: 'intermediate',
      status: 'published',
      student_count: 38,
      created_at: '2025-09-01',
      published_at: '2025-09-05',
    },
    {
      course_id: 'course-003',
      title: 'Assessment Methods',
      description: 'Designing and implementing effective assessments',
      level: 'intermediate',
      status: 'draft',
      student_count: 0,
      created_at: '2025-10-15',
    },
    {
      course_id: 'course-004',
      title: 'Student Engagement Techniques',
      description: 'Creating interactive learning experiences',
      level: 'advanced',
      status: 'published',
      student_count: 41,
      created_at: '2025-07-20',
      published_at: '2025-07-25',
    },
    {
      course_id: 'course-005',
      title: 'Technology in Education',
      description: 'Integrating digital tools in pedagogy',
      level: 'beginner',
      status: 'draft',
      student_count: 0,
      created_at: '2025-10-20',
    },
    {
      course_id: 'course-006',
      title: 'Inclusive Teaching Practices',
      description: 'Supporting diverse learners in your classroom',
      level: 'intermediate',
      status: 'archived',
      student_count: 0,
      created_at: '2025-06-10',
      published_at: '2025-06-15',
    },
  ];

  // Load courses
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        // In production, replace with API call:
        // const res = await fetch('/api/teacher/courses');
        // const data = await res.json();
        // setCourses(data.courses);

        // Using mock data
        setCourses(mockCourses);
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

  // Filter courses based on search and status
  useEffect(() => {
    let filtered = courses;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((course) => course.status === statusFilter);
    }

    setFilteredCourses(filtered);
  }, [searchQuery, statusFilter, courses]);

  // Create new course
  const handleCreateCourse = useCallback(async () => {
    if (!formData.title.trim()) {
      alert(language === 'km' ? 'សូមបញ្ចូលចំណងជើងវគ្គរៀន' : 'Please enter course title');
      return;
    }

    try {
      // In production, replace with API call:
      // const res = await fetch('/api/teacher/courses', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });
      // if (!res.ok) throw new Error('Failed to create course');
      // const data = await res.json();

      const newCourse: Course = {
        course_id: `course-${Date.now()}`,
        title: formData.title,
        description: formData.description,
        level: formData.level,
        status: 'draft',
        student_count: 0,
        created_at: new Date().toISOString().split('T')[0],
      };

      setCourses([newCourse, ...courses]);
      setIsCreateModalOpen(false);
      setFormData({
        title: '',
        description: '',
        level: 'beginner',
        subject_area: '',
      });

      // Navigate to course editor
      router.push(`/dashboard/teacher/courses/${newCourse.course_id}`);
    } catch (err) {
      console.error('Error creating course:', err);
      alert(err instanceof Error ? err.message : 'Failed to create course');
    }
  }, [formData, language, courses, router]);

  // Open edit modal
  const handleEditClick = useCallback((course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      level: course.level,
      subject_area: '',
    });
    setIsEditModalOpen(true);
  }, []);

  // Update course
  const handleUpdateCourse = useCallback(async () => {
    if (!editingCourse) return;

    try {
      // In production, replace with API call:
      // const res = await fetch(`/api/teacher/courses/${editingCourse.course_id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });
      // if (!res.ok) throw new Error('Failed to update course');

      const updatedCourses = courses.map((c) =>
        c.course_id === editingCourse.course_id
          ? { ...c, ...formData }
          : c
      );

      setCourses(updatedCourses);
      setIsEditModalOpen(false);
      setEditingCourse(null);
      setFormData({
        title: '',
        description: '',
        level: 'beginner',
        subject_area: '',
      });
    } catch (err) {
      console.error('Error updating course:', err);
      alert(err instanceof Error ? err.message : 'Failed to update course');
    }
  }, [editingCourse, formData, courses]);

  // Delete course
  const handleDeleteCourse = useCallback(
    async (courseId: string) => {
      if (!confirm(language === 'km' ? 'តើអ្នកប្រាកដថាលុបវគ្គរៀនទេ?' : 'Are you sure you want to delete this course?')) {
        return;
      }

      try {
        // In production, replace with API call:
        // const res = await fetch(`/api/teacher/courses/${courseId}`, {
        //   method: 'DELETE',
        // });
        // if (!res.ok) throw new Error('Failed to delete course');

        setCourses(courses.filter((c) => c.course_id !== courseId));
      } catch (err) {
        console.error('Error deleting course:', err);
        alert(err instanceof Error ? err.message : 'Failed to delete course');
      }
    },
    [courses, language]
  );

  // Publish course
  const handlePublishCourse = useCallback(
    async (courseId: string) => {
      try {
        // In production, replace with API call:
        // const res = await fetch(`/api/teacher/courses/${courseId}/publish`, {
        //   method: 'POST',
        // });
        // if (!res.ok) throw new Error('Failed to publish course');

        const updatedCourses = courses.map((c) =>
          c.course_id === courseId
            ? { ...c, status: 'published' as const, published_at: new Date().toISOString().split('T')[0] }
            : c
        );

        setCourses(updatedCourses);
      } catch (err) {
        console.error('Error publishing course:', err);
        alert(err instanceof Error ? err.message : 'Failed to publish course');
      }
    },
    [courses]
  );

  // Archive course
  const handleArchiveCourse = useCallback(
    async (courseId: string) => {
      try {
        // In production, replace with API call:
        // const res = await fetch(`/api/teacher/courses/${courseId}/archive`, {
        //   method: 'POST',
        // });
        // if (!res.ok) throw new Error('Failed to archive course');

        const updatedCourses = courses.map((c) =>
          c.course_id === courseId ? { ...c, status: 'archived' as const } : c
        );

        setCourses(updatedCourses);
      } catch (err) {
        console.error('Error archiving course:', err);
        alert(err instanceof Error ? err.message : 'Failed to archive course');
      }
    },
    [courses]
  );

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
            {language === 'km' ? 'វគ្គរៀនរបស់ខ្ញុំ' : 'My Courses'}
          </Title>
          <Text c="dimmed">
            {language === 'km'
              ? 'គ្រប់គ្រងវគ្គរៀនរបស់អ្នក និងមាតិកា'
              : 'Manage your courses and course content'}
          </Text>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          color="blue"
          size="lg"
          onClick={() => setIsCreateModalOpen(true)}
        >
          {language === 'km' ? 'បង្កើតវគ្គរៀន' : 'Create Course'}
        </Button>
      </Group>

      {/* Stats Cards */}
      <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="lg" mb="xl">
        <Card withBorder p="lg" radius="md">
          <Group justify="space-between" mb="lg">
            <Stack gap={0}>
              <Text fw={500} size="sm" c="dimmed">
                {language === 'km' ? 'វគ្គរៀនសរុប' : 'Total Courses'}
              </Text>
              <Title order={2}>{courses.length}</Title>
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
                {language === 'km' ? 'បានចេញផ្សាយ' : 'Published'}
              </Text>
              <Title order={2}>{courses.filter((c) => c.status === 'published').length}</Title>
            </Stack>
            <ThemeIcon variant="light" size={50} radius="md" color="green">
              <IconCheck size={28} />
            </ThemeIcon>
          </Group>
        </Card>

        <Card withBorder p="lg" radius="md">
          <Group justify="space-between" mb="lg">
            <Stack gap={0}>
              <Text fw={500} size="sm" c="dimmed">
                {language === 'km' ? 'ព草稿' : 'Drafts'}
              </Text>
              <Title order={2}>{courses.filter((c) => c.status === 'draft').length}</Title>
            </Stack>
            <ThemeIcon variant="light" size={50} radius="md" color="yellow">
              <IconBook size={28} />
            </ThemeIcon>
          </Group>
        </Card>

        <Card withBorder p="lg" radius="md">
          <Group justify="space-between" mb="lg">
            <Stack gap={0}>
              <Text fw={500} size="sm" c="dimmed">
                {language === 'km' ? 'សិស្សសរុប' : 'Total Students'}
              </Text>
              <Title order={2}>{courses.reduce((sum, c) => sum + c.student_count, 0)}</Title>
            </Stack>
            <ThemeIcon variant="light" size={50} radius="md" color="purple">
              <IconUsers size={28} />
            </ThemeIcon>
          </Group>
        </Card>
      </SimpleGrid>

      {/* Search and Filter */}
      <Group mb="xl" grow align="flex-end">
        <Input
          placeholder={language === 'km' ? 'ស្វាងរក' : 'Search courses...'}
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
        />
        <Select
          placeholder={language === 'km' ? 'ស្ថានភាព' : 'Filter by status'}
          data={[
            { value: 'draft', label: language === 'km' ? 'ព្រាង' : 'Draft' },
            { value: 'published', label: language === 'km' ? 'បានចេញផ្សាយ' : 'Published' },
            { value: 'archived', label: language === 'km' ? 'ប័ណ្ណសារ' : 'Archived' },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
          clearable
        />
      </Group>

      {/* Courses Table */}
      <Card withBorder radius="md" p="lg">
        {filteredCourses.length === 0 ? (
          <Center p="xl">
            <Text c="dimmed">
              {language === 'km' ? 'មិនមាននេះទេ' : 'No courses yet'}
            </Text>
          </Center>
        ) : (
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{language === 'km' ? 'ចំណងជើង' : 'Title'}</Table.Th>
                <Table.Th>{language === 'km' ? 'ស្ថានភាព' : 'Status'}</Table.Th>
                <Table.Th>{language === 'km' ? 'កម្រិត' : 'Level'}</Table.Th>
                <Table.Th>{language === 'km' ? 'សិស្ស' : 'Students'}</Table.Th>
                <Table.Th>{language === 'km' ? 'បង្កើត' : 'Created'}</Table.Th>
                <Table.Th>{language === 'km' ? 'សកម្មភាព' : 'Actions'}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredCourses.map((course) => (
                <Table.Tr key={course.course_id}>
                  <Table.Td>
                    <Stack gap={0}>
                      <Text fw={500} size="sm">
                        {course.title}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {course.description}
                      </Text>
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={
                        course.status === 'published'
                          ? 'green'
                          : course.status === 'draft'
                            ? 'yellow'
                            : 'gray'
                      }
                      variant="light"
                    >
                      {course.status === 'published'
                        ? language === 'km'
                          ? 'បានចេញផ្សាយ'
                          : 'Published'
                        : course.status === 'draft'
                          ? language === 'km'
                            ? 'ព្រាង'
                            : 'Draft'
                          : language === 'km'
                            ? 'ប័ណ្ណសារ'
                            : 'Archived'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light">
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
                  </Table.Td>
                  <Table.Td>{course.student_count}</Table.Td>
                  <Table.Td>{course.created_at}</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Tooltip label={language === 'km' ? 'មើល' : 'View'}>
                        <ActionIcon
                          size="sm"
                          variant="light"
                          color="blue"
                          onClick={() => router.push(`/dashboard/teacher/courses/${course.course_id}`)}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label={language === 'km' ? 'កែប្រែ' : 'Edit'}>
                        <ActionIcon
                          size="sm"
                          variant="light"
                          color="blue"
                          onClick={() => handleEditClick(course)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>
                      {course.status === 'draft' && (
                        <Tooltip label={language === 'km' ? 'ផ្សាយ' : 'Publish'}>
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="green"
                            onClick={() => handlePublishCourse(course.course_id)}
                          >
                            <IconCheck size={16} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                      {course.status !== 'archived' && (
                        <Tooltip label={language === 'km' ? 'ប័ណ្ណសារ' : 'Archive'}>
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="orange"
                            onClick={() => handleArchiveCourse(course.course_id)}
                          >
                            <IconArchive size={16} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                      <Tooltip label={language === 'km' ? 'លុប' : 'Delete'}>
                        <ActionIcon
                          size="sm"
                          variant="light"
                          color="red"
                          onClick={() => handleDeleteCourse(course.course_id)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>

      {/* Create Course Modal */}
      <Modal
        opened={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={language === 'km' ? 'បង្កើតវគ្គរៀនថ្មី' : 'Create New Course'}
        size="lg"
      >
        <Stack gap="md">
          <TextInput
            label={language === 'km' ? 'ចំណងជើងវគ្គរៀន' : 'Course Title'}
            placeholder={language === 'km' ? 'ឧទាហរណ៍៍: សេចក្តីណែនាំលម្អិត' : 'e.g., Introduction to Pedagogy'}
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.currentTarget.value })}
            required
          />
          <Textarea
            label={language === 'km' ? 'ការពិពណ៌នា' : 'Description'}
            placeholder={language === 'km' ? 'ពណ៌នាលម្អិតអំពីវគ្គរៀន' : 'Describe the course in detail'}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.currentTarget.value })}
            rows={3}
          />
          <Select
            label={language === 'km' ? 'កម្រិត' : 'Level'}
            placeholder={language === 'km' ? 'ជ្រើសរើលកម្រិត' : 'Select level'}
            data={[
              { value: 'beginner', label: language === 'km' ? 'ថ្មី' : 'Beginner' },
              { value: 'intermediate', label: language === 'km' ? 'មិនលម្អិត' : 'Intermediate' },
              { value: 'advanced', label: language === 'km' ? 'កម្រិតខ្ពស់' : 'Advanced' },
            ]}
            value={formData.level}
            onChange={(value) =>
              setFormData({
                ...formData,
                level: (value || 'beginner') as 'beginner' | 'intermediate' | 'advanced',
              })
            }
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setIsCreateModalOpen(false)}>
              {language === 'km' ? 'បោះបង់' : 'Cancel'}
            </Button>
            <Button onClick={handleCreateCourse}>
              {language === 'km' ? 'បង្កើត' : 'Create'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Edit Course Modal */}
      <Modal
        opened={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={language === 'km' ? 'កែប្រែវគ្គរៀន' : 'Edit Course'}
        size="lg"
      >
        <Stack gap="md">
          <TextInput
            label={language === 'km' ? 'ចំណងជើងវគ្គរៀន' : 'Course Title'}
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.currentTarget.value })}
            required
          />
          <Textarea
            label={language === 'km' ? 'ការពិពណ៌នា' : 'Description'}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.currentTarget.value })}
            rows={3}
          />
          <Select
            label={language === 'km' ? 'កម្រិត' : 'Level'}
            data={[
              { value: 'beginner', label: language === 'km' ? 'ថ្មី' : 'Beginner' },
              { value: 'intermediate', label: language === 'km' ? 'មិនលម្អិត' : 'Intermediate' },
              { value: 'advanced', label: language === 'km' ? 'កម្រិតខ្ពស់' : 'Advanced' },
            ]}
            value={formData.level}
            onChange={(value) =>
              setFormData({
                ...formData,
                level: (value || 'beginner') as 'beginner' | 'intermediate' | 'advanced',
              })
            }
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setIsEditModalOpen(false)}>
              {language === 'km' ? 'បោះបង់' : 'Cancel'}
            </Button>
            <Button onClick={handleUpdateCourse}>
              {language === 'km' ? 'រក្សាទុក' : 'Save'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
