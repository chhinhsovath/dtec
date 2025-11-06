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
  Tabs,
  Table,
  Badge,
  Modal,
  NumberInput,
  Textarea,
  SimpleGrid,
  Input,
  Select,
  ActionIcon,
  Tooltip,
  ThemeIcon,
  Progress,
  Divider,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconArrowLeft,
  IconSearch,
  IconDownload,
  IconMessageCircle,
  IconCheck,
  IconX,
  IconClock,
  IconUser,
  IconStar,
  IconFileText,
  IconChartLine,
} from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface Assignment {
  assignment_id: string;
  course_id: string;
  course_title: string;
  title: string;
  due_date: string;
  max_score: number;
  submissions: number;
  graded: number;
}

interface Submission {
  submission_id: string;
  assignment_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  submitted_at: string;
  status: 'pending' | 'graded' | 'returned';
  score?: number;
  max_score: number;
  feedback?: string;
}

interface StudentGrade {
  student_id: string;
  student_name: string;
  course_id: string;
  course_title: string;
  quiz_average: number;
  assignment_average: number;
  final_grade: number;
  letter_grade: string;
}

export default function GradebookPage() {
  const { language } = useTranslation();
  const router = useRouter();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<string | null>('grading');
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);

  // Grading form state
  const [gradingForm, setGradingForm] = useState({
    score: 0,
    feedback: '',
  });

  // Mock data
  const mockAssignments: Assignment[] = [
    {
      assignment_id: 'assign-001',
      course_id: 'course-001',
      course_title: 'Introduction to Pedagogy',
      title: 'Teaching Philosophy Essay',
      due_date: '2025-10-20',
      max_score: 100,
      submissions: 12,
      graded: 8,
    },
    {
      assignment_id: 'assign-002',
      course_id: 'course-001',
      course_title: 'Introduction to Pedagogy',
      title: 'Classroom Observation Report',
      due_date: '2025-10-27',
      max_score: 100,
      submissions: 10,
      graded: 5,
    },
    {
      assignment_id: 'assign-003',
      course_id: 'course-002',
      course_title: 'Classroom Management Strategies',
      title: 'Behavior Management Plan',
      due_date: '2025-11-03',
      max_score: 50,
      submissions: 15,
      graded: 15,
    },
    {
      assignment_id: 'assign-004',
      course_id: 'course-002',
      course_title: 'Classroom Management Strategies',
      title: 'Case Study Analysis',
      due_date: '2025-11-10',
      max_score: 75,
      submissions: 0,
      graded: 0,
    },
  ];

  const mockSubmissions: Submission[] = [
    {
      submission_id: 'sub-001',
      assignment_id: 'assign-001',
      student_id: 'student-001',
      student_name: 'Rith Mony',
      student_email: 'rith@example.com',
      submitted_at: '2025-10-19',
      status: 'pending',
      max_score: 100,
    },
    {
      submission_id: 'sub-002',
      assignment_id: 'assign-001',
      student_id: 'student-002',
      student_name: 'Chea Sophany',
      student_email: 'chea@example.com',
      submitted_at: '2025-10-18',
      status: 'graded',
      score: 85,
      max_score: 100,
      feedback: 'Excellent essay with clear arguments. Consider adding more examples.',
    },
    {
      submission_id: 'sub-003',
      assignment_id: 'assign-002',
      student_id: 'student-001',
      student_name: 'Rith Mony',
      student_email: 'rith@example.com',
      submitted_at: '2025-10-25',
      status: 'pending',
      max_score: 100,
    },
    {
      submission_id: 'sub-004',
      assignment_id: 'assign-003',
      student_id: 'student-003',
      student_name: 'Nary Touch',
      student_email: 'nary@example.com',
      submitted_at: '2025-10-30',
      status: 'graded',
      score: 45,
      max_score: 50,
      feedback: 'Good plan but needs more detail on implementation strategy.',
    },
  ];

  const mockStudentGrades: StudentGrade[] = [
    {
      student_id: 'student-001',
      student_name: 'Rith Mony',
      course_id: 'course-001',
      course_title: 'Introduction to Pedagogy',
      quiz_average: 78,
      assignment_average: 82,
      final_grade: 80,
      letter_grade: 'B',
    },
    {
      student_id: 'student-002',
      student_name: 'Chea Sophany',
      course_id: 'course-001',
      course_title: 'Introduction to Pedagogy',
      quiz_average: 92,
      assignment_average: 88,
      final_grade: 90,
      letter_grade: 'A',
    },
    {
      student_id: 'student-003',
      student_name: 'Nary Touch',
      course_id: 'course-002',
      course_title: 'Classroom Management Strategies',
      quiz_average: 70,
      assignment_average: 75,
      final_grade: 72,
      letter_grade: 'C',
    },
  ];

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // In production, replace with API calls:
        // const res = await fetch('/api/teacher/assignments');
        // const assignRes = await res.json();

        setAssignments(mockAssignments);
        setFilteredAssignments(mockAssignments);
        setSubmissions(mockSubmissions);
        setStudentGrades(mockStudentGrades);
        setLoading(false);
      } catch (err) {
        console.error('Error loading gradebook:', err);
        setError(err instanceof Error ? err.message : 'Failed to load gradebook');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter assignments
  useEffect(() => {
    let filtered = assignments;

    if (searchQuery) {
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.course_title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (courseFilter) {
      filtered = filtered.filter((a) => a.course_id === courseFilter);
    }

    setFilteredAssignments(filtered);
  }, [searchQuery, courseFilter, assignments]);

  // Grade submission
  const handleGradeSubmission = useCallback(async () => {
    if (!selectedSubmission) return;

    if (gradingForm.score < 0 || gradingForm.score > selectedSubmission.max_score) {
      alert(
        language === 'km'
          ? `សូមបញ្ចូលពិន្ទុរវាង 0 និង ${selectedSubmission.max_score}`
          : `Please enter a score between 0 and ${selectedSubmission.max_score}`
      );
      return;
    }

    try {
      // In production, replace with API call:
      // const res = await fetch(`/api/assignments/${selectedSubmission.assignment_id}/grade`, {
      //   method: 'PUT',
      //   body: JSON.stringify({
      //     submission_id: selectedSubmission.submission_id,
      //     score: gradingForm.score,
      //     feedback: gradingForm.feedback,
      //   }),
      // });

      const updatedSubmissions = submissions.map((sub) =>
        sub.submission_id === selectedSubmission.submission_id
          ? {
              ...sub,
              score: gradingForm.score,
              feedback: gradingForm.feedback,
              status: 'graded' as const,
            }
          : sub
      );

      setSubmissions(updatedSubmissions);
      setIsGradingModalOpen(false);
      setSelectedSubmission(null);
      setGradingForm({ score: 0, feedback: '' });
    } catch (err) {
      console.error('Error grading submission:', err);
      alert(err instanceof Error ? err.message : 'Failed to save grade');
    }
  }, [selectedSubmission, gradingForm, submissions, language]);

  // Open grading modal
  const handleOpenGrading = useCallback((submission: Submission) => {
    setSelectedSubmission(submission);
    setGradingForm({
      score: submission.score || 0,
      feedback: submission.feedback || '',
    });
    setIsGradingModalOpen(true);
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

  const pendingCount = submissions.filter((s) => s.status === 'pending').length;
  const gradedCount = submissions.filter((s) => s.status === 'graded').length;
  const courses = [...new Set(assignments.map((a) => ({ id: a.course_id, title: a.course_title })))];
  const avgScore = submissions.length > 0 ? (submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length).toFixed(1) : '0';

  return (
    <Container size="xl" py="xl">
      {/* Header */}
      <Group mb="xl" justify="space-between">
        <div>
          <Title order={1}>{language === 'km' ? 'ថ្នាក់សៀវភៅ' : 'Gradebook'}</Title>
          <Text c="dimmed">
            {language === 'km'
              ? 'វាយតម្លៃ និងដាក់ឯកសារលម្អិត'
              : 'View submissions, grade assignments, and provide feedback'}
          </Text>
        </div>
        <Button variant="light" leftSection={<IconDownload size={16} />}>
          {language === 'km' ? 'នាំចេញ' : 'Export'}
        </Button>
      </Group>

      {/* Tabs */}
      <Tabs value={activeTab} onTabChange={setActiveTab} mb="xl">
        <Tabs.List>
          <Tabs.Tab value="grading" leftSection={<IconFileText size={14} />}>
            {language === 'km' ? 'វាយតម្លៃ' : 'Grading'} ({pendingCount} {language === 'km' ? 'រង់ចាំ' : 'pending'})
          </Tabs.Tab>
          <Tabs.Tab value="gradebook" leftSection={<IconChartLine size={14} />}>
            {language === 'km' ? 'ថ្នាក់ថ្នាក់' : 'Grade Report'}
          </Tabs.Tab>
        </Tabs.List>

        {/* Grading Tab */}
        <Tabs.Panel value="grading" pt="xl">
          {/* Stats */}
          <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="lg" mb="xl">
            <Card withBorder p="lg" radius="md">
              <Group justify="space-between" mb="lg">
                <Stack gap={0}>
                  <Text fw={500} size="sm" c="dimmed">
                    {language === 'km' ? 'សរុបលម្អិត' : 'Total Submissions'}
                  </Text>
                  <Title order={2}>{submissions.length}</Title>
                </Stack>
                <ThemeIcon variant="light" size={50} radius="md" color="blue">
                  <IconFileText size={28} />
                </ThemeIcon>
              </Group>
            </Card>

            <Card withBorder p="lg" radius="md">
              <Group justify="space-between" mb="lg">
                <Stack gap={0}>
                  <Text fw={500} size="sm" c="dimmed">
                    {language === 'km' ? 'វាយតម្លៃរង់ចាំ' : 'Pending Grades'}
                  </Text>
                  <Title order={2}>{pendingCount}</Title>
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
                    {language === 'km' ? 'វាយតម្លៃ' : 'Graded'}
                  </Text>
                  <Title order={2}>{gradedCount}</Title>
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
                    {language === 'km' ? 'រៀងរាល់ពិន្ទុ' : 'Average Score'}
                  </Text>
                  <Title order={2}>{avgScore}</Title>
                </Stack>
                <ThemeIcon variant="light" size={50} radius="md" color="purple">
                  <IconStar size={28} />
                </ThemeIcon>
              </Group>
            </Card>
          </SimpleGrid>

          {/* Filters */}
          <Group mb="xl" grow align="flex-end">
            <Input
              placeholder={language === 'km' ? 'ស្វាងរក' : 'Search assignments...'}
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
            />
            <Select
              placeholder={language === 'km' ? 'វគ្គរៀន' : 'Filter by course'}
              data={courses.map((c) => ({ value: c.id, label: c.title }))}
              value={courseFilter}
              onChange={setCourseFilter}
              clearable
            />
          </Group>

          {/* Assignments List */}
          <Stack gap="lg">
            {filteredAssignments.map((assignment) => {
              const assignmentSubmissions = submissions.filter((s) => s.assignment_id === assignment.assignment_id);
              const pendingSubmissions = assignmentSubmissions.filter((s) => s.status === 'pending');

              return (
                <Card key={assignment.assignment_id} withBorder radius="md" p="lg">
                  <Group justify="space-between" mb="md">
                    <div>
                      <Title order={3}>{assignment.title}</Title>
                      <Group gap="xs" mt="xs">
                        <Badge>{assignment.course_title}</Badge>
                        <Text size="sm" c="dimmed">
                          Due: {assignment.due_date}
                        </Text>
                      </Group>
                    </div>
                    <Stack gap={0} align="flex-end">
                      <Text fw={500} size="sm">
                        {assignment.graded}/{assignment.submissions}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {language === 'km' ? 'វាយតម្លៃ' : 'graded'}
                      </Text>
                    </Stack>
                  </Group>

                  <Progress
                    value={(assignment.graded / assignment.submissions) * 100}
                    mb="md"
                    size="sm"
                    color={pendingSubmissions.length === 0 ? 'green' : 'orange'}
                  />

                  {/* Submissions Table */}
                  <Table striped size="sm">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>{language === 'km' ? 'សិស្ស' : 'Student'}</Table.Th>
                        <Table.Th>{language === 'km' ? 'ដាក់ស្នើម' : 'Submitted'}</Table.Th>
                        <Table.Th>{language === 'km' ? 'ស្ថានភាព' : 'Status'}</Table.Th>
                        <Table.Th>{language === 'km' ? 'ពិន្ទុ' : 'Score'}</Table.Th>
                        <Table.Th>{language === 'km' ? 'សកម្មភាព' : 'Action'}</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {assignmentSubmissions.length === 0 ? (
                        <Table.Tr>
                          <Table.Td colSpan={5}>
                            <Center py="xl">
                              <Text c="dimmed" size="sm">
                                {language === 'km' ? 'មិនមាននេះទេ' : 'No submissions yet'}
                              </Text>
                            </Center>
                          </Table.Td>
                        </Table.Tr>
                      ) : (
                        assignmentSubmissions.map((submission) => (
                          <Table.Tr key={submission.submission_id}>
                            <Table.Td>
                              <Stack gap={0}>
                                <Text fw={500} size="sm">
                                  {submission.student_name}
                                </Text>
                                <Text size="xs" c="dimmed">
                                  {submission.student_email}
                                </Text>
                              </Stack>
                            </Table.Td>
                            <Table.Td>{submission.submitted_at}</Table.Td>
                            <Table.Td>
                              <Badge color={submission.status === 'pending' ? 'orange' : 'green'}>
                                {submission.status === 'pending'
                                  ? language === 'km'
                                    ? 'រង់ចាំ'
                                    : 'Pending'
                                  : language === 'km'
                                    ? 'វាយតម្លៃ'
                                    : 'Graded'}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              {submission.score !== undefined ? (
                                <Text fw={500}>
                                  {submission.score}/{submission.max_score}
                                </Text>
                              ) : (
                                <Text c="dimmed">-</Text>
                              )}
                            </Table.Td>
                            <Table.Td>
                              <Button
                                size="xs"
                                variant="light"
                                onClick={() => handleOpenGrading(submission)}
                              >
                                {submission.status === 'pending'
                                  ? language === 'km'
                                    ? 'វាយតម្លៃ'
                                    : 'Grade'
                                  : language === 'km'
                                    ? 'កែប្រែ'
                                    : 'Edit'}
                              </Button>
                            </Table.Td>
                          </Table.Tr>
                        ))
                      )}
                    </Table.Tbody>
                  </Table>
                </Card>
              );
            })}
          </Stack>
        </Tabs.Panel>

        {/* Gradebook Tab */}
        <Tabs.Panel value="gradebook" pt="xl">
          <Card withBorder radius="md" p="lg">
            <Title order={3} mb="lg">
              {language === 'km' ? 'ថ្នាក់របស់សិស្ស' : 'Student Grades by Course'}
            </Title>

            {studentGrades.length === 0 ? (
              <Center p="xl">
                <Text c="dimmed">{language === 'km' ? 'មិនមាននេះទេ' : 'No grades yet'}</Text>
              </Center>
            ) : (
              <Stack gap="lg">
                {studentGrades.map((grade) => (
                  <Card key={`${grade.student_id}-${grade.course_id}`} withBorder p="md" radius="md">
                    <Group justify="space-between" mb="md">
                      <div>
                        <Group gap="xs">
                          <ThemeIcon variant="light" radius="md" size="lg">
                            <IconUser size={20} />
                          </ThemeIcon>
                          <Stack gap={0}>
                            <Text fw={500}>{grade.student_name}</Text>
                            <Text size="sm" c="dimmed">
                              {grade.course_title}
                            </Text>
                          </Stack>
                        </Group>
                      </div>
                      <Stack gap={0} align="flex-end">
                        <Group gap="xs">
                          <Text fw={700} size="lg">
                            {grade.final_grade}%
                          </Text>
                          <Badge size="lg" color={grade.final_grade >= 80 ? 'green' : grade.final_grade >= 70 ? 'yellow' : 'red'}>
                            {grade.letter_grade}
                          </Badge>
                        </Group>
                      </Stack>
                    </Group>

                    <Divider />

                    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mt="md">
                      <div>
                        <Text fw={500} size="sm" c="dimmed" mb="xs">
                          {language === 'km' ? 'ប្រឡង' : 'Quiz Average'}
                        </Text>
                        <Group justify="space-between">
                          <Text fw={500}>{grade.quiz_average}%</Text>
                          <Progress value={grade.quiz_average} size="sm" style={{ flex: 1 }} />
                        </Group>
                      </div>
                      <div>
                        <Text fw={500} size="sm" c="dimmed" mb="xs">
                          {language === 'km' ? 'កិច្ចការលម្អិត' : 'Assignment Average'}
                        </Text>
                        <Group justify="space-between">
                          <Text fw={500}>{grade.assignment_average}%</Text>
                          <Progress value={grade.assignment_average} size="sm" style={{ flex: 1 }} />
                        </Group>
                      </div>
                      <div>
                        <Text fw={500} size="sm" c="dimmed" mb="xs">
                          {language === 'km' ? 'ថ្នាក់ចុងក្រោយ' : 'Final Grade'}
                        </Text>
                        <Group justify="space-between">
                          <Text fw={500}>{grade.final_grade}%</Text>
                          <Progress value={grade.final_grade} size="sm" style={{ flex: 1 }} />
                        </Group>
                      </div>
                    </SimpleGrid>
                  </Card>
                ))}
              </Stack>
            )}
          </Card>
        </Tabs.Panel>
      </Tabs>

      {/* Grading Modal */}
      <Modal
        opened={isGradingModalOpen}
        onClose={() => {
          setIsGradingModalOpen(false);
          setSelectedSubmission(null);
        }}
        title={language === 'km' ? 'វាយតម្លៃលម្អិត' : 'Grade Submission'}
        size="lg"
      >
        {selectedSubmission && (
          <Stack gap="md">
            <Card withBorder p="md" radius="md" bg="blue.0">
              <Group justify="space-between">
                <div>
                  <Text fw={500}>{selectedSubmission.student_name}</Text>
                  <Text size="sm" c="dimmed">
                    {selectedSubmission.student_email}
                  </Text>
                  <Text size="sm" c="dimmed" mt="xs">
                    {language === 'km' ? 'ដាក់ស្នើម៖' : 'Submitted:'} {selectedSubmission.submitted_at}
                  </Text>
                </div>
              </Group>
            </Card>

            <NumberInput
              label={language === 'km' ? 'ពិន្ទុ' : 'Score'}
              description={`Max: ${selectedSubmission.max_score}`}
              placeholder="0"
              value={gradingForm.score}
              onChange={(value) => setGradingForm({ ...gradingForm, score: value as number })}
              min={0}
              max={selectedSubmission.max_score}
            />

            <Textarea
              label={language === 'km' ? 'មតិ' : 'Feedback'}
              placeholder={language === 'km' ? 'ផ្តល់មតិយោបល់របស់អ្នក' : 'Provide your feedback...'}
              value={gradingForm.feedback}
              onChange={(e) => setGradingForm({ ...gradingForm, feedback: e.currentTarget.value })}
              rows={4}
            />

            <Group justify="flex-end">
              <Button
                variant="default"
                onClick={() => {
                  setIsGradingModalOpen(false);
                  setSelectedSubmission(null);
                }}
              >
                {language === 'km' ? 'បោះបង់' : 'Cancel'}
              </Button>
              <Button onClick={handleGradeSubmission} leftSection={<IconCheck size={16} />}>
                {language === 'km' ? 'រក្សាទុកលម្អិត' : 'Save Grade'}
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Container>
  );
}
