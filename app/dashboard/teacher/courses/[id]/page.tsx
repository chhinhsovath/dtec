'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  Tabs,
  Badge,
  Modal,
  TextInput,
  Textarea,
  Select,
  Table,
  ActionIcon,
  Tooltip,
  ThemeIcon,
  Accordion,
  Divider,
  Progress,
  SimpleGrid,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconArrowLeft,
  IconPlus,
  IconEdit,
  IconTrash,
  IconBook,
  IconUsers,
  IconChartLine,
  IconFileText,
  IconLink,
  IconVideo,
  IconGripVertical,
  IconCheck,
  IconClock,
} from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface Lesson {
  lesson_id: string;
  title: string;
  description: string;
  order_position: number;
}

interface Material {
  material_id: string;
  lesson_id: string;
  type: 'text' | 'file' | 'link' | 'h5p';
  title: string;
  content: string;
  position: number;
}

interface Course {
  course_id: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  status: 'draft' | 'published' | 'archived';
  subject_area?: string;
  duration_hours?: number;
  student_count: number;
  created_at: string;
  published_at?: string;
}

interface Student {
  student_id: string;
  name: string;
  email: string;
  enrolled_at: string;
  progress: number;
}

export default function CourseEditorPage() {
  const { language } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isAddLessonOpen, setIsAddLessonOpen] = useState(false);
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);

  // Form state
  const [lessonForm, setLessonForm] = useState({ title: '', description: '' });
  const [materialForm, setMaterialForm] = useState({
    type: 'text' as 'text' | 'file' | 'link' | 'h5p',
    title: '',
    content: '',
  });

  // Mock data
  const mockCourse: Course = {
    course_id: courseId,
    title: 'Introduction to Pedagogy',
    description: 'Fundamentals of teaching methods and classroom management',
    level: 'beginner',
    status: 'draft',
    subject_area: 'Teacher Training',
    duration_hours: 40,
    student_count: 0,
    created_at: '2025-08-15',
  };

  const mockLessons: Lesson[] = [
    {
      lesson_id: 'lesson-001',
      title: 'Welcome to the Course',
      description: 'Course overview and objectives',
      order_position: 1,
    },
    {
      lesson_id: 'lesson-002',
      title: 'Teaching Fundamentals',
      description: 'Core principles of effective teaching',
      order_position: 2,
    },
    {
      lesson_id: 'lesson-003',
      title: 'Classroom Management',
      description: 'Managing diverse classrooms and student behavior',
      order_position: 3,
    },
  ];

  const mockMaterials: Material[] = [
    {
      material_id: 'mat-001',
      lesson_id: 'lesson-001',
      type: 'text',
      title: 'Course Welcome Message',
      content: 'Welcome to this pedagogy course...',
      position: 1,
    },
    {
      material_id: 'mat-002',
      lesson_id: 'lesson-001',
      type: 'video',
      title: 'Course Overview Video',
      content: 'https://example.com/video',
      position: 2,
    },
    {
      material_id: 'mat-003',
      lesson_id: 'lesson-002',
      type: 'file',
      title: 'Teaching Fundamentals PDF',
      content: 'document.pdf',
      position: 1,
    },
  ];

  const mockStudents: Student[] = [
    {
      student_id: 'student-001',
      name: 'Rith Mony',
      email: 'rith.mony@example.com',
      enrolled_at: '2025-10-15',
      progress: 45,
    },
    {
      student_id: 'student-002',
      name: 'Chea Sophany',
      email: 'chea.sophany@example.com',
      enrolled_at: '2025-10-16',
      progress: 60,
    },
  ];

  // Load course data
  useEffect(() => {
    const loadCourse = async () => {
      try {
        setLoading(true);
        // In production, replace with API call:
        // const res = await fetch(`/api/teacher/courses/${courseId}`);
        // const data = await res.json();

        setCourse(mockCourse);
        setLessons(mockLessons);
        setMaterials(mockMaterials);
        setStudents(mockStudents);
        setLoading(false);
      } catch (err) {
        console.error('Error loading course:', err);
        setError(err instanceof Error ? err.message : 'Failed to load course');
        setLoading(false);
      }
    };

    loadCourse();
  }, [courseId]);

  // Add lesson
  const handleAddLesson = useCallback(async () => {
    if (!lessonForm.title.trim()) {
      alert(language === 'km' ? 'សូមបញ្ចូលចំណងជើងមេរៀន' : 'Please enter lesson title');
      return;
    }

    const newLesson: Lesson = {
      lesson_id: `lesson-${Date.now()}`,
      title: lessonForm.title,
      description: lessonForm.description,
      order_position: lessons.length + 1,
    };

    setLessons([...lessons, newLesson]);
    setLessonForm({ title: '', description: '' });
    setIsAddLessonOpen(false);
  }, [lessonForm, lessons, language]);

  // Delete lesson
  const handleDeleteLesson = useCallback((lessonId: string) => {
    if (!confirm(language === 'km' ? 'តើអ្នកប្រាកដថាលុបមេរៀនទេ?' : 'Are you sure you want to delete this lesson?')) {
      return;
    }
    setLessons(lessons.filter((l) => l.lesson_id !== lessonId));
    setMaterials(materials.filter((m) => m.lesson_id !== lessonId));
  }, [lessons, materials, language]);

  // Add material to lesson
  const handleAddMaterial = useCallback(async () => {
    if (!selectedLesson) {
      alert(language === 'km' ? 'សូមជ្រើសរើសមេរៀន' : 'Please select a lesson');
      return;
    }
    if (!materialForm.title.trim()) {
      alert(language === 'km' ? 'សូមបញ្ចូលចំណងជើងលម្អិត' : 'Please enter material title');
      return;
    }

    const newMaterial: Material = {
      material_id: `mat-${Date.now()}`,
      lesson_id: selectedLesson,
      type: materialForm.type,
      title: materialForm.title,
      content: materialForm.content,
      position: materials.filter((m) => m.lesson_id === selectedLesson).length + 1,
    };

    setMaterials([...materials, newMaterial]);
    setMaterialForm({ type: 'text', title: '', content: '' });
    setIsAddMaterialOpen(false);
  }, [selectedLesson, materialForm, materials, language]);

  // Delete material
  const handleDeleteMaterial = useCallback((materialId: string) => {
    setMaterials(materials.filter((m) => m.material_id !== materialId));
  }, [materials]);

  // Publish course
  const handlePublishCourse = useCallback(async () => {
    if (!course) return;
    if (lessons.length === 0) {
      alert(language === 'km' ? 'សូមបន្ថែមមេរៀនយ៉ាងតិចមួយ' : 'Please add at least one lesson');
      return;
    }

    try {
      // In production, replace with API call:
      // const res = await fetch(`/api/teacher/courses/${courseId}/publish`, {
      //   method: 'POST',
      // });

      setCourse({
        ...course,
        status: 'published',
        published_at: new Date().toISOString().split('T')[0],
      });
    } catch (err) {
      console.error('Error publishing course:', err);
      alert(err instanceof Error ? err.message : 'Failed to publish course');
    }
  }, [course, courseId, lessons, language]);

  if (loading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  if (error || !course) {
    return (
      <Container size="lg" py="xl">
        <Alert icon={<IconAlertCircle />} color="red" title="Error">
          {error || 'Course not found'}
        </Alert>
      </Container>
    );
  }

  const lessonMaterials = (lessonId: string) => materials.filter((m) => m.lesson_id === lessonId);
  const avgProgress = students.length > 0 ? Math.round(students.reduce((sum, s) => sum + s.progress, 0) / students.length) : 0;

  return (
    <Container size="xl" py="xl">
      {/* Header */}
      <Group mb="xl" justify="space-between">
        <Button
          variant="light"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => router.push('/dashboard/teacher/courses')}
        >
          {language === 'km' ? 'ត្រឡប់ក្រោយ' : 'Back'}
        </Button>
        <Group>
          {course.status === 'draft' && (
            <Button color="green" onClick={handlePublishCourse} leftSection={<IconCheck size={16} />}>
              {language === 'km' ? 'ផ្សាយ' : 'Publish'}
            </Button>
          )}
          {course.status === 'published' && <Badge color="green">{language === 'km' ? 'បានចេញផ្សាយ' : 'Published'}</Badge>}
        </Group>
      </Group>

      {/* Course Info Card */}
      <Card withBorder radius="md" p="lg" mb="xl">
        <Stack gap="md">
          <div>
            <Title order={2}>{course.title}</Title>
            <Text c="dimmed" mt="xs">
              {course.description}
            </Text>
          </div>
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
            <div>
              <Text fw={500} size="sm" c="dimmed">
                {language === 'km' ? 'កម្រិត' : 'Level'}
              </Text>
              <Badge>
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
            </div>
            <div>
              <Text fw={500} size="sm" c="dimmed">
                {language === 'km' ? 'រយៈពេល' : 'Duration'}
              </Text>
              <Text fw={500}>{course.duration_hours} hours</Text>
            </div>
            <div>
              <Text fw={500} size="sm" c="dimmed">
                {language === 'km' ? 'សិស្ស' : 'Students'}
              </Text>
              <Text fw={500}>{students.length} enrolled</Text>
            </div>
          </SimpleGrid>
        </Stack>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="lessons" mb="xl">
        <Tabs.List>
          <Tabs.Tab value="lessons" leftSection={<IconBook size={14} />}>
            {language === 'km' ? 'មេរៀន' : 'Lessons'} ({lessons.length})
          </Tabs.Tab>
          <Tabs.Tab value="materials" leftSection={<IconFileText size={14} />}>
            {language === 'km' ? 'លម្អិត' : 'Materials'} ({materials.length})
          </Tabs.Tab>
          <Tabs.Tab value="students" leftSection={<IconUsers size={14} />}>
            {language === 'km' ? 'សិស្ស' : 'Students'} ({students.length})
          </Tabs.Tab>
          <Tabs.Tab value="analytics" leftSection={<IconChartLine size={14} />}>
            {language === 'km' ? 'ការវិភាគ' : 'Analytics'}
          </Tabs.Tab>
        </Tabs.List>

        {/* Lessons Tab */}
        <Tabs.Panel value="lessons" pt="xl">
          <Card withBorder radius="md" p="lg">
            <Group mb="lg" justify="space-between">
              <Title order={3}>{language === 'km' ? 'គ្រប់គ្រងមេរៀន' : 'Manage Lessons'}</Title>
              <Button size="sm" leftSection={<IconPlus size={14} />} onClick={() => setIsAddLessonOpen(true)}>
                {language === 'km' ? 'បន្ថែមមេរៀន' : 'Add Lesson'}
              </Button>
            </Group>

            {lessons.length === 0 ? (
              <Center p="xl">
                <Text c="dimmed">{language === 'km' ? 'មិនមាននេះទេ' : 'No lessons yet'}</Text>
              </Center>
            ) : (
              <Accordion>
                {lessons.map((lesson) => (
                  <Accordion.Item key={lesson.lesson_id} value={lesson.lesson_id}>
                    <Accordion.Control>
                      <Group justify="space-between" style={{ flex: 1 }}>
                        <div>
                          <Text fw={500}>{lesson.title}</Text>
                          <Text size="sm" c="dimmed">
                            {lessonMaterials(lesson.lesson_id).length} {language === 'km' ? 'លម្អិត' : 'materials'}
                          </Text>
                        </div>
                      </Group>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <Stack gap="md">
                        <Text>{lesson.description}</Text>

                        {/* Materials in this lesson */}
                        <div>
                          <Group mb="sm" justify="space-between">
                            <Text fw={500}>{language === 'km' ? 'លម្អិត' : 'Materials'}</Text>
                            <Button
                              size="xs"
                              variant="light"
                              onClick={() => {
                                setSelectedLesson(lesson.lesson_id);
                                setIsAddMaterialOpen(true);
                              }}
                            >
                              {language === 'km' ? 'បន្ថែម' : 'Add'}
                            </Button>
                          </Group>

                          {lessonMaterials(lesson.lesson_id).length === 0 ? (
                            <Text size="sm" c="dimmed">
                              {language === 'km' ? 'មិនមាននេះទេ' : 'No materials'}
                            </Text>
                          ) : (
                            <Stack gap="xs">
                              {lessonMaterials(lesson.lesson_id).map((material) => (
                                <Card key={material.material_id} withBorder p="md" radius="md">
                                  <Group justify="space-between">
                                    <Group>
                                      <ThemeIcon variant="light" size="lg" radius="md">
                                        {material.type === 'video' ? (
                                          <IconVideo size={20} />
                                        ) : material.type === 'link' ? (
                                          <IconLink size={20} />
                                        ) : (
                                          <IconFileText size={20} />
                                        )}
                                      </ThemeIcon>
                                      <div>
                                        <Text fw={500} size="sm">
                                          {material.title}
                                        </Text>
                                        <Badge size="sm" variant="light">
                                          {material.type}
                                        </Badge>
                                      </div>
                                    </Group>
                                    <ActionIcon
                                      size="sm"
                                      variant="light"
                                      color="red"
                                      onClick={() => handleDeleteMaterial(material.material_id)}
                                    >
                                      <IconTrash size={16} />
                                    </ActionIcon>
                                  </Group>
                                </Card>
                              ))}
                            </Stack>
                          )}
                        </div>

                        <Divider />
                        <Button
                          variant="subtle"
                          color="red"
                          size="sm"
                          onClick={() => handleDeleteLesson(lesson.lesson_id)}
                        >
                          {language === 'km' ? 'លុបមេរៀន' : 'Delete Lesson'}
                        </Button>
                      </Stack>
                    </Accordion.Panel>
                  </Accordion.Item>
                ))}
              </Accordion>
            )}
          </Card>
        </Tabs.Panel>

        {/* Materials Tab */}
        <Tabs.Panel value="materials" pt="xl">
          <Card withBorder radius="md" p="lg">
            <Title order={3} mb="lg">
              {language === 'km' ? 'ឯកសារលម្អិត' : 'All Materials'}
            </Title>

            {materials.length === 0 ? (
              <Center p="xl">
                <Text c="dimmed">{language === 'km' ? 'មិនមាននេះទេ' : 'No materials yet'}</Text>
              </Center>
            ) : (
              <Table striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{language === 'km' ? 'ចំណងជើង' : 'Title'}</Table.Th>
                    <Table.Th>{language === 'km' ? 'ប្រភេទ' : 'Type'}</Table.Th>
                    <Table.Th>{language === 'km' ? 'មេរៀន' : 'Lesson'}</Table.Th>
                    <Table.Th>{language === 'km' ? 'សកម្មភាព' : 'Actions'}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {materials.map((material) => {
                    const lesson = lessons.find((l) => l.lesson_id === material.lesson_id);
                    return (
                      <Table.Tr key={material.material_id}>
                        <Table.Td>{material.title}</Table.Td>
                        <Table.Td>
                          <Badge>{material.type}</Badge>
                        </Table.Td>
                        <Table.Td>{lesson?.title}</Table.Td>
                        <Table.Td>
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="red"
                            onClick={() => handleDeleteMaterial(material.material_id)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            )}
          </Card>
        </Tabs.Panel>

        {/* Students Tab */}
        <Tabs.Panel value="students" pt="xl">
          <Card withBorder radius="md" p="lg">
            <Title order={3} mb="lg">
              {language === 'km' ? 'សិស្សលម្អិត' : 'Enrolled Students'}
            </Title>

            {students.length === 0 ? (
              <Center p="xl">
                <Text c="dimmed">{language === 'km' ? 'មិនមាននេះទេ' : 'No students enrolled yet'}</Text>
              </Center>
            ) : (
              <Stack gap="md">
                {students.map((student) => (
                  <Card key={student.student_id} withBorder p="md" radius="md">
                    <Group justify="space-between" mb="xs">
                      <div>
                        <Text fw={500}>{student.name}</Text>
                        <Text size="sm" c="dimmed">
                          {student.email}
                        </Text>
                      </div>
                      <Badge>{student.progress}%</Badge>
                    </Group>
                    <Progress value={student.progress} size="sm" mb="xs" />
                    <Text size="xs" c="dimmed">
                      {language === 'km' ? 'ចូលរៀន៖' : 'Enrolled:'} {student.enrolled_at}
                    </Text>
                  </Card>
                ))}
              </Stack>
            )}
          </Card>
        </Tabs.Panel>

        {/* Analytics Tab */}
        <Tabs.Panel value="analytics" pt="xl">
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mb="xl">
            <Card withBorder p="lg" radius="md">
              <Group justify="space-between" mb="lg">
                <Stack gap={0}>
                  <Text fw={500} size="sm" c="dimmed">
                    {language === 'km' ? 'សិស្សលម្អិត' : 'Enrolled Students'}
                  </Text>
                  <Title order={2}>{students.length}</Title>
                </Stack>
                <ThemeIcon variant="light" size={50} radius="md" color="blue">
                  <IconUsers size={28} />
                </ThemeIcon>
              </Group>
            </Card>

            <Card withBorder p="lg" radius="md">
              <Group justify="space-between" mb="lg">
                <Stack gap={0}>
                  <Text fw={500} size="sm" c="dimmed">
                    {language === 'km' ? 'មេរៀនលម្អិត' : 'Lessons Created'}
                  </Text>
                  <Title order={2}>{lessons.length}</Title>
                </Stack>
                <ThemeIcon variant="light" size={50} radius="md" color="green">
                  <IconBook size={28} />
                </ThemeIcon>
              </Group>
            </Card>

            <Card withBorder p="lg" radius="md">
              <Group justify="space-between" mb="lg">
                <Stack gap={0}>
                  <Text fw={500} size="sm" c="dimmed">
                    {language === 'km' ? 'វឌ្ឍន៍ជាមធ្យម' : 'Avg Progress'}
                  </Text>
                  <Title order={2}>{avgProgress}%</Title>
                </Stack>
                <ThemeIcon variant="light" size={50} radius="md" color="purple">
                  <IconChartLine size={28} />
                </ThemeIcon>
              </Group>
              <Progress value={avgProgress} size="sm" />
            </Card>
          </SimpleGrid>

          <Card withBorder p="lg" radius="md">
            <Title order={3} mb="lg">
              {language === 'km' ? 'សិស្សវឌ្ឍន៍' : 'Student Progress'}
            </Title>
            <Stack gap="md">
              {students.length === 0 ? (
                <Center p="xl">
                  <Text c="dimmed">{language === 'km' ? 'មិនមាននេះទេ' : 'No data'}</Text>
                </Center>
              ) : (
                students.map((student) => (
                  <div key={student.student_id}>
                    <Group justify="space-between" mb="xs">
                      <Text fw={500} size="sm">
                        {student.name}
                      </Text>
                      <Text size="sm">{student.progress}%</Text>
                    </Group>
                    <Progress value={student.progress} size="sm" radius="md" />
                  </div>
                ))
              )}
            </Stack>
          </Card>
        </Tabs.Panel>
      </Tabs>

      {/* Add Lesson Modal */}
      <Modal opened={isAddLessonOpen} onClose={() => setIsAddLessonOpen(false)} title={language === 'km' ? 'បន្ថែមមេរៀនថ្មី' : 'Add New Lesson'} size="lg">
        <Stack gap="md">
          <TextInput
            label={language === 'km' ? 'ចំណងជើងមេរៀន' : 'Lesson Title'}
            placeholder={language === 'km' ? 'ឧទាហរណ៍៍: សេចក្តីណែនាំ' : 'e.g., Introduction'}
            value={lessonForm.title}
            onChange={(e) => setLessonForm({ ...lessonForm, title: e.currentTarget.value })}
          />
          <Textarea
            label={language === 'km' ? 'ការពិពណ៌នា' : 'Description'}
            placeholder={language === 'km' ? 'ពណ៌នាមេរៀន' : 'Describe the lesson'}
            value={lessonForm.description}
            onChange={(e) => setLessonForm({ ...lessonForm, description: e.currentTarget.value })}
            rows={3}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setIsAddLessonOpen(false)}>
              {language === 'km' ? 'បោះបង់' : 'Cancel'}
            </Button>
            <Button onClick={handleAddLesson}>{language === 'km' ? 'បន្ថែម' : 'Add'}</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Add Material Modal */}
      <Modal
        opened={isAddMaterialOpen}
        onClose={() => setIsAddMaterialOpen(false)}
        title={language === 'km' ? 'បន្ថែមលម្អិត' : 'Add Material'}
        size="lg"
      >
        <Stack gap="md">
          <Select
            label={language === 'km' ? 'ប្រភេទ' : 'Material Type'}
            placeholder={language === 'km' ? 'ជ្រើសរើលប្រភេទ' : 'Select type'}
            data={[
              { value: 'text', label: language === 'km' ? 'អត្ថបទ' : 'Text' },
              { value: 'file', label: language === 'km' ? 'ឯកសារ' : 'File' },
              { value: 'link', label: language === 'km' ? 'តំណ' : 'Link' },
              { value: 'h5p', label: 'H5P' },
            ]}
            value={materialForm.type}
            onChange={(value) => setMaterialForm({ ...materialForm, type: (value || 'text') as any })}
          />
          <TextInput
            label={language === 'km' ? 'ចំណងជើង' : 'Title'}
            placeholder={language === 'km' ? 'ចំណងជើងលម្អិត' : 'Material title'}
            value={materialForm.title}
            onChange={(e) => setMaterialForm({ ...materialForm, title: e.currentTarget.value })}
          />
          <Textarea
            label={language === 'km' ? 'មាតិកា' : 'Content'}
            placeholder={language === 'km' ? 'មាតិកា ឬ URL ឬឯកសារ' : 'Content, URL, or file path'}
            value={materialForm.content}
            onChange={(e) => setMaterialForm({ ...materialForm, content: e.currentTarget.value })}
            rows={3}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setIsAddMaterialOpen(false)}>
              {language === 'km' ? 'បោះបង់' : 'Cancel'}
            </Button>
            <Button onClick={handleAddMaterial}>{language === 'km' ? 'បន្ថែម' : 'Add'}</Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
