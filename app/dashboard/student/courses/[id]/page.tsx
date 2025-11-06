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
  Progress,
  Badge,
  ThemeIcon,
  Tabs,
  Accordion,
  SimpleGrid,
  ActionIcon,
  Tooltip,
  Modal,
  FileInput,
  Textarea,
  Table,
  Divider,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconArrowLeft,
  IconBook,
  IconCheckCircle,
  IconClock,
  IconStar,
  IconUpload,
  IconDownload,
  IconMessage,
  IconFileText,
  IconVideo,
  IconLink,
  IconPlay,
  IconChevronRight,
} from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface Lesson {
  lesson_id: string;
  title: string;
  description: string;
  position: number;
  is_completed: boolean;
  duration_minutes: number;
}

interface Material {
  material_id: string;
  type: 'text' | 'file' | 'link' | 'h5p' | 'video';
  title: string;
  content: string;
}

interface Assignment {
  assignment_id: string;
  title: string;
  description: string;
  due_date: string;
  max_score: number;
  submission_status: 'pending' | 'submitted' | 'graded';
  score?: number;
  feedback?: string;
}

interface Course {
  course_id: string;
  title: string;
  instructor_name: string;
  description: string;
  progress: number;
  lessons_completed: number;
  total_lessons: number;
  current_grade: number;
}

export default function StudentCourseViewPage() {
  const { language } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<string | null>('lessons');
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionForm, setSubmissionForm] = useState({
    file: null as File | null,
    text: '',
  });

  // Mock data
  const mockCourse: Course = {
    course_id: courseId,
    title: 'Introduction to Pedagogy',
    instructor_name: 'Dr. Samreth',
    description: 'Learn the fundamentals of effective teaching methods and classroom management',
    progress: 35,
    lessons_completed: 7,
    total_lessons: 20,
    current_grade: 85,
  };

  const mockLessons: Lesson[] = [
    {
      lesson_id: 'lesson-001',
      title: 'Welcome to the Course',
      description: 'Course overview and learning objectives',
      position: 1,
      is_completed: true,
      duration_minutes: 15,
    },
    {
      lesson_id: 'lesson-002',
      title: 'Teaching Fundamentals',
      description: 'Core principles of effective teaching',
      position: 2,
      is_completed: true,
      duration_minutes: 45,
    },
    {
      lesson_id: 'lesson-003',
      title: 'Learning Styles & Differentiation',
      description: 'Understanding diverse learner needs',
      position: 3,
      is_completed: false,
      duration_minutes: 50,
    },
    {
      lesson_id: 'lesson-004',
      title: 'Classroom Environment',
      description: 'Creating a positive learning space',
      position: 4,
      is_completed: false,
      duration_minutes: 40,
    },
  ];

  const mockMaterials: Material[] = [
    {
      material_id: 'mat-001',
      type: 'text',
      title: 'Lesson Overview',
      content:
        'Welcome to this lesson on teaching fundamentals. In this module, you will learn about the core principles that effective teachers use to create engaging learning experiences.',
    },
    {
      material_id: 'mat-002',
      type: 'video',
      title: 'Teaching Fundamentals Video',
      content: 'https://example.com/video',
    },
    {
      material_id: 'mat-003',
      type: 'h5p',
      title: 'Interactive Quiz: Teaching Methods',
      content: 'Quiz on teaching methods understanding',
    },
    {
      material_id: 'mat-004',
      type: 'file',
      title: 'Lecture Notes PDF',
      content: 'lecture-notes.pdf',
    },
  ];

  const mockAssignments: Assignment[] = [
    {
      assignment_id: 'assign-001',
      title: 'Teaching Philosophy Essay',
      description: 'Write a 500-word essay about your teaching philosophy',
      due_date: '2025-10-20',
      max_score: 100,
      submission_status: 'graded',
      score: 85,
      feedback: 'Excellent essay with clear arguments. Consider adding more examples.',
    },
    {
      assignment_id: 'assign-002',
      title: 'Classroom Observation Report',
      description: 'Observe a classroom and write a detailed report',
      due_date: '2025-10-27',
      max_score: 100,
      submission_status: 'submitted',
    },
    {
      assignment_id: 'assign-003',
      title: 'Lesson Plan Design',
      description: 'Design a complete lesson plan for your subject area',
      due_date: '2025-11-03',
      max_score: 100,
      submission_status: 'pending',
    },
  ];

  // Load course data
  useEffect(() => {
    const loadCourse = async () => {
      try {
        setLoading(true);
        // In production, replace with API calls:
        // const res = await fetch(`/api/student/courses/${courseId}`);
        // const data = await res.json();

        setCourse(mockCourse);
        setLessons(mockLessons);
        setSelectedLesson(mockLessons[0]);
        setMaterials(mockMaterials);
        setAssignments(mockAssignments);
        setLoading(false);
      } catch (err) {
        console.error('Error loading course:', err);
        setError(err instanceof Error ? err.message : 'Failed to load course');
        setLoading(false);
      }
    };

    loadCourse();
  }, [courseId]);

  // Mark lesson as complete
  const handleCompleteLesson = useCallback(async () => {
    if (!selectedLesson) return;

    try {
      // In production, replace with API call:
      // const res = await fetch(`/api/student/lessons/${selectedLesson.lesson_id}/complete`, {
      //   method: 'POST',
      // });

      const updatedLessons = lessons.map((l) =>
        l.lesson_id === selectedLesson.lesson_id ? { ...l, is_completed: true } : l
      );

      setLessons(updatedLessons);
      setSelectedLesson({ ...selectedLesson, is_completed: true });
    } catch (err) {
      console.error('Error completing lesson:', err);
    }
  }, [selectedLesson, lessons]);

  // Submit assignment
  const handleSubmitAssignment = useCallback(async () => {
    if (!selectedAssignment || (!submissionForm.file && !submissionForm.text.trim())) {
      alert(language === 'km' ? 'សូមផ្តល់ឯកសារឬលម្អិត' : 'Please provide a file or text');
      return;
    }

    try {
      // In production, replace with API call:
      // const formData = new FormData();
      // if (submissionForm.file) formData.append('file', submissionForm.file);
      // if (submissionForm.text) formData.append('text', submissionForm.text);
      // const res = await fetch(`/api/assignments/${selectedAssignment.assignment_id}/submit`, {
      //   method: 'POST',
      //   body: formData,
      // });

      const updatedAssignments = assignments.map((a) =>
        a.assignment_id === selectedAssignment.assignment_id
          ? { ...a, submission_status: 'submitted' as const }
          : a
      );

      setAssignments(updatedAssignments);
      setIsSubmissionModalOpen(false);
      setSelectedAssignment(null);
      setSubmissionForm({ file: null, text: '' });
    } catch (err) {
      console.error('Error submitting assignment:', err);
      alert(err instanceof Error ? err.message : 'Failed to submit');
    }
  }, [selectedAssignment, submissionForm, assignments, language]);

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

  return (
    <Container size="xl" py="xl">
      {/* Header */}
      <Group mb="xl" justify="space-between">
        <Button
          variant="light"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => router.push('/dashboard/student/courses')}
        >
          {language === 'km' ? 'ត្រឡប់ក្រោយ' : 'Back'}
        </Button>
        <Button variant="light" leftSection={<IconDownload size={16} />}>
          {language === 'km' ? 'សក្ម្ម់សម្ភារ' : 'Download Materials'}
        </Button>
      </Group>

      {/* Course Info */}
      <Card withBorder radius="md" p="lg" mb="xl">
        <Stack gap="md">
          <div>
            <Title order={2}>{course.title}</Title>
            <Group gap="xs" mt="xs">
              <Text c="dimmed">{language === 'km' ? 'គ្រូបង្រៀន៖' : 'Instructor:'} {course.instructor_name}</Text>
              {course.current_grade > 0 && (
                <Badge color="green">
                  {language === 'km' ? 'ឯក្សរ៖' : 'Grade:'} {course.current_grade}%
                </Badge>
              )}
            </Group>
          </div>

          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
            <div>
              <Group justify="space-between" mb="xs">
                <Text fw={500} size="sm">
                  {language === 'km' ? 'វឌ្ឍន៍' : 'Progress'}
                </Text>
                <Text fw={500} size="sm">
                  {course.progress}%
                </Text>
              </Group>
              <Progress value={course.progress} size="sm" />
            </div>

            <div>
              <Group justify="space-between" mb="xs">
                <Text fw={500} size="sm">
                  {language === 'km' ? 'មេរៀនបានបញ្ចប់' : 'Lessons Completed'}
                </Text>
                <Text fw={500} size="sm">
                  {course.lessons_completed}/{course.total_lessons}
                </Text>
              </Group>
              <Progress value={(course.lessons_completed / course.total_lessons) * 100} size="sm" />
            </div>

            <Card withBorder p="sm" radius="md">
              <Group justify="space-between">
                <ThemeIcon variant="light" size="lg" radius="md" color="blue">
                  <IconStar size={20} />
                </ThemeIcon>
                <Stack gap={0} align="flex-end">
                  <Text fw={500}>{course.current_grade}%</Text>
                  <Text size="xs" c="dimmed">
                    {language === 'km' ? 'ឯក្សរបច្ចុប្បន្ន' : 'Current Grade'}
                  </Text>
                </Stack>
              </Group>
            </Card>
          </SimpleGrid>
        </Stack>
      </Card>

      {/* Main Content */}
      <Group align="flex-start" grow>
        {/* Lessons Sidebar */}
        <Stack flex={1} style={{ maxWidth: '300px' }}>
          <Card withBorder radius="md" p="lg">
            <Title order={3} mb="lg">
              {language === 'km' ? 'មេរៀន' : 'Lessons'}
            </Title>

            <Stack gap="xs">
              {lessons.map((lesson) => (
                <Button
                  key={lesson.lesson_id}
                  variant={selectedLesson?.lesson_id === lesson.lesson_id ? 'filled' : 'light'}
                  justify="space-between"
                  fullWidth
                  onClick={() => setSelectedLesson(lesson)}
                  rightSection={lesson.is_completed ? <IconCheckCircle size={16} /> : <IconChevronRight size={16} />}
                >
                  <Text truncate size="sm">
                    {lesson.title}
                  </Text>
                </Button>
              ))}
            </Stack>
          </Card>
        </Stack>

        {/* Main Content Area */}
        <Stack flex={3}>
          <Tabs value={activeTab} onTabChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab value="lessons" leftSection={<IconBook size={14} />}>
                {language === 'km' ? 'មេរៀន' : 'Lesson'}
              </Tabs.Tab>
              <Tabs.Tab value="assignments" leftSection={<IconFileText size={14} />}>
                {language === 'km' ? 'កិច្ចការ' : 'Assignments'} ({assignments.length})
              </Tabs.Tab>
              <Tabs.Tab value="grades" leftSection={<IconStar size={14} />}>
                {language === 'km' ? 'ឯក្សរ' : 'Grades'}
              </Tabs.Tab>
            </Tabs.List>

            {/* Lessons Tab */}
            <Tabs.Panel value="lessons" pt="xl">
              <Card withBorder radius="md" p="lg">
                {selectedLesson ? (
                  <Stack gap="md">
                    <div>
                      <Group justify="space-between" mb="xs">
                        <Title order={3}>{selectedLesson.title}</Title>
                        {selectedLesson.is_completed && <Badge color="green">{language === 'km' ? 'បានបញ្ចប់' : 'Completed'}</Badge>}
                      </Group>
                      <Text c="dimmed">{selectedLesson.description}</Text>
                      <Text size="sm" c="dimmed" mt="xs">
                        {language === 'km' ? 'រយៈពេល៖' : 'Duration:'} {selectedLesson.duration_minutes} {language === 'km' ? 'នាទី' : 'minutes'}
                      </Text>
                    </div>

                    <Divider />

                    {/* Materials */}
                    <Stack gap="md">
                      {materials.map((material) => {
                        const Icon =
                          material.type === 'video'
                            ? IconVideo
                            : material.type === 'link'
                              ? IconLink
                              : material.type === 'h5p'
                                ? IconPlay
                                : IconFileText;

                        return (
                          <Card key={material.material_id} withBorder p="md" radius="md">
                            <Group justify="space-between">
                              <Group gap="sm">
                                <ThemeIcon variant="light" size="lg" radius="md">
                                  <Icon size={20} />
                                </ThemeIcon>
                                <Stack gap={0}>
                                  <Text fw={500} size="sm">
                                    {material.title}
                                  </Text>
                                  <Badge size="sm" variant="light">
                                    {material.type}
                                  </Badge>
                                </Stack>
                              </Group>
                              <Button size="sm" variant="light">
                                {material.type === 'video' || material.type === 'h5p'
                                  ? language === 'km'
                                    ? 'ដើរលេង'
                                    : 'Play'
                                  : language === 'km'
                                    ? 'មើល'
                                    : 'View'}
                              </Button>
                            </Group>
                          </Card>
                        );
                      })}
                    </Stack>

                    <Divider />

                    {!selectedLesson.is_completed && (
                      <Button onClick={handleCompleteLesson} fullWidth color="green" leftSection={<IconCheckCircle size={16} />}>
                        {language === 'km' ? 'សម្គាល់ថាបានបញ្ចប់' : 'Mark as Complete'}
                      </Button>
                    )}
                  </Stack>
                ) : (
                  <Center p="xl">
                    <Text c="dimmed">{language === 'km' ? 'ជ្រើសរើសមេរៀន' : 'Select a lesson'}</Text>
                  </Center>
                )}
              </Card>
            </Tabs.Panel>

            {/* Assignments Tab */}
            <Tabs.Panel value="assignments" pt="xl">
              <Stack gap="lg">
                {assignments.map((assignment) => (
                  <Card key={assignment.assignment_id} withBorder p="lg" radius="md">
                    <Group justify="space-between" mb="md">
                      <Title order={4}>{assignment.title}</Title>
                      <Badge
                        color={
                          assignment.submission_status === 'graded'
                            ? 'green'
                            : assignment.submission_status === 'submitted'
                              ? 'blue'
                              : 'orange'
                        }
                      >
                        {assignment.submission_status === 'pending'
                          ? language === 'km'
                            ? 'រង់ចាំ'
                            : 'Pending'
                          : assignment.submission_status === 'submitted'
                            ? language === 'km'
                              ? 'ដាក់ស្នើម'
                              : 'Submitted'
                            : language === 'km'
                              ? 'វាយតម្លៃ'
                              : 'Graded'}
                      </Badge>
                    </Group>

                    <Text size="sm" mb="md">
                      {assignment.description}
                    </Text>

                    <Group justify="space-between" mb="md">
                      <Text size="sm" c="dimmed">
                        {language === 'km' ? 'ផ្តល់ដោយ៖' : 'Due:'} {assignment.due_date}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {language === 'km' ? 'ពិន្ទុ៖' : 'Max Score:'} {assignment.max_score}
                      </Text>
                    </Group>

                    {assignment.score !== undefined && (
                      <Card withBorder p="md" radius="md" mb="md" bg="green.0">
                        <Group justify="space-between">
                          <Text fw={500}>
                            {language === 'km' ? 'ពិន្ទុ៖' : 'Score:'} {assignment.score}/{assignment.max_score}
                          </Text>
                          <Badge>{Math.round((assignment.score / assignment.max_score) * 100)}%</Badge>
                        </Group>
                        {assignment.feedback && (
                          <Card withBorder p="sm" mt="md">
                            <Group gap="xs" mb="xs">
                              <IconMessage size={16} />
                              <Text fw={500} size="sm">
                                {language === 'km' ? 'មតិ៖' : 'Feedback:'}
                              </Text>
                            </Group>
                            <Text size="sm">{assignment.feedback}</Text>
                          </Card>
                        )}
                      </Card>
                    )}

                    {assignment.submission_status === 'pending' && (
                      <Button
                        fullWidth
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setIsSubmissionModalOpen(true);
                        }}
                        leftSection={<IconUpload size={16} />}
                      >
                        {language === 'km' ? 'ដាក់ស្នើម' : 'Submit'}
                      </Button>
                    )}
                  </Card>
                ))}
              </Stack>
            </Tabs.Panel>

            {/* Grades Tab */}
            <Tabs.Panel value="grades" pt="xl">
              <Card withBorder radius="md" p="lg">
                <Title order={3} mb="lg">
                  {language === 'km' ? 'ឯក្សរលម្អិត' : 'Grade Details'}
                </Title>

                <Table striped>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>{language === 'km' ? 'កិច្ចការ' : 'Assignment'}</Table.Th>
                      <Table.Th>{language === 'km' ? 'ពិន្ទុ' : 'Score'}</Table.Th>
                      <Table.Th>{language === 'km' ? 'ការអនុម័ត' : 'Status'}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {assignments.map((assignment) => (
                      <Table.Tr key={assignment.assignment_id}>
                        <Table.Td>{assignment.title}</Table.Td>
                        <Table.Td>
                          {assignment.score !== undefined ? (
                            <Text fw={500}>
                              {assignment.score}/{assignment.max_score}
                            </Text>
                          ) : (
                            <Text c="dimmed">-</Text>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={
                              assignment.submission_status === 'graded'
                                ? 'green'
                                : assignment.submission_status === 'submitted'
                                  ? 'blue'
                                  : 'orange'
                            }
                          >
                            {assignment.submission_status}
                          </Badge>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Card>
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </Group>

      {/* Submission Modal */}
      <Modal
        opened={isSubmissionModalOpen}
        onClose={() => {
          setIsSubmissionModalOpen(false);
          setSelectedAssignment(null);
          setSubmissionForm({ file: null, text: '' });
        }}
        title={language === 'km' ? 'ដាក់ស្នើមកិច្ចការ' : 'Submit Assignment'}
        size="lg"
      >
        {selectedAssignment && (
          <Stack gap="md">
            <Card withBorder p="md" radius="md" bg="blue.0">
              <Text fw={500}>{selectedAssignment.title}</Text>
              <Text size="sm" c="dimmed" mt="xs">
                {language === 'km' ? 'ផ្តល់ដោយ៖' : 'Due:'} {selectedAssignment.due_date}
              </Text>
            </Card>

            <FileInput
              label={language === 'km' ? 'ឯកសារ' : 'File Upload (Optional)'}
              placeholder={language === 'km' ? 'ជ្រើសរើសឯកសារ' : 'Choose a file'}
              value={submissionForm.file}
              onChange={(file) => setSubmissionForm({ ...submissionForm, file })}
            />

            <Textarea
              label={language === 'km' ? 'ពាក្យលម្អិត' : 'Text Submission (Optional)'}
              placeholder={language === 'km' ? 'ឬបញ្ចូលលម្អិត' : 'Or type your response here...'}
              value={submissionForm.text}
              onChange={(e) => setSubmissionForm({ ...submissionForm, text: e.currentTarget.value })}
              rows={4}
            />

            <Group justify="flex-end">
              <Button
                variant="default"
                onClick={() => {
                  setIsSubmissionModalOpen(false);
                  setSelectedAssignment(null);
                  setSubmissionForm({ file: null, text: '' });
                }}
              >
                {language === 'km' ? 'បោះបង់' : 'Cancel'}
              </Button>
              <Button onClick={handleSubmitAssignment} leftSection={<IconUpload size={16} />}>
                {language === 'km' ? 'ដាក់ស្នើម' : 'Submit'}
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Container>
  );
}
