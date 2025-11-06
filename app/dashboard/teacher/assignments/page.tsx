'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth/client-auth';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { FormModal, FormField } from '@/app/components/FormModal';
import {
  Container,
  Group,
  Button,
  TextInput,
  Table,
  Pagination,
  Alert,
  Flex,
  Badge,
  Text,
  Stack,
  Center,
  ActionIcon,
  Title,
  Loader,
  Select,
} from '@mantine/core';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconChevronUp,
  IconChevronDown,
} from '@tabler/icons-react';

interface Assignment {
  id: string;
  course_id: string;
  course_code: string;
  course_title: string;
  title: string;
  description: string | null;
  assignment_type: string;
  due_date: string | null;
  max_score: number;
  status: string;
  created_at: string;
  updated_at: string;
  submission_count?: number;
}

interface Course {
  id: string;
  code: string;
  title: string;
}

type SortField = 'course_code' | 'title' | 'due_date' | 'max_score' | 'status';
type SortOrder = 'asc' | 'desc';

export default function TeacherAssignmentsPage() {
  const router = useRouter();
  const { t, language, isLoaded } = useTranslation();
  const [session, setSession] = useState<any>(null);
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('due_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    const checkAuth = async () => {
      const sess = getSession();
      if (!sess || sess.role !== 'teacher') {
        router.push('/auth/login');
        return;
      }
      setSession(sess);
      fetchCourses(sess.id);
      fetchAssignments(sess.id);
    };

    if (isLoaded) {
      checkAuth();
    }
  }, [router, isLoaded]);

  const fetchCourses = async (teacherId: string) => {
    try {
      const response = await fetch(`/api/teacher/courses`, {
        headers: {
          'x-teacher-id': teacherId,
        },
      });
      if (!response.ok) throw new Error(t('errors.serverError'));
      const data = await response.json();
      setCourses(data.courses || []);
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  };

  const fetchAssignments = async (teacherId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/teacher/assignments`, {
        headers: {
          'x-teacher-id': teacherId,
        },
      });
      if (!response.ok) throw new Error(t('errors.serverError'));
      const data = await response.json();
      setAllAssignments(data.assignments || []);
      setCurrentPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  // Filter assignments
  const filteredAssignments = allAssignments.filter(assignment => {
    const matchesSearch =
      assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.course_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (assignment.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Sort assignments
  const sortedAssignments = [...filteredAssignments].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    if (aVal === null || aVal === undefined) aVal = '';
    if (bVal === null || bVal === undefined) bVal = '';

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = (bVal as string).toLowerCase();
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginate
  const totalPages = Math.ceil(sortedAssignments.length / itemsPerPage);
  const paginatedAssignments = sortedAssignments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getAssignmentFormFields = (): FormField[] => [
    {
      name: 'course_id',
      label: t('dashboard.teacher.assignCourse'),
      type: 'select',
      required: true,
      options: courses.map(c => ({ value: c.id, label: `${c.code} - ${c.title}` })),
    },
    {
      name: 'title',
      label: t('dashboard.teacher.assignmentTitle'),
      type: 'text',
      required: true,
      placeholder: 'e.g., Homework 1',
    },
    {
      name: 'description',
      label: t('common.description'),
      type: 'textarea',
      placeholder: 'Assignment description...',
      rows: 4,
    },
    {
      name: 'max_score',
      label: t('dashboard.teacher.maxScore'),
      type: 'number',
      required: true,
      min: 0,
      max: 1000,
    },
    {
      name: 'due_date',
      label: t('dashboard.teacher.dueDate'),
      type: 'datetime-local',
    },
    {
      name: 'status',
      label: t('common.status'),
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'closed', label: 'Closed' },
        { value: 'draft', label: 'Draft' },
      ],
    },
  ];

  const handleSubmitAssignment = async (formData: Record<string, any>) => {
    if (!formData.course_id || !formData.title) {
      setError(t('forms.requiredFields'));
      throw new Error(t('forms.requiredFields'));
    }

    try {
      setSubmitting(true);
      setError(null);

      const url = editingAssignment ? `/api/teacher/assignments/${editingAssignment.id}` : '/api/teacher/assignments';
      const method = editingAssignment ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-teacher-id': session?.id || '',
        },
        body: JSON.stringify({
          courseId: formData.course_id,
          title: formData.title,
          description: formData.description || null,
          assignmentType: 'assignment',
          maxScore: formData.max_score,
          dueDate: formData.due_date || null,
          status: formData.status,
        }),
      });

      if (!response.ok) throw new Error(t('messages.errorTryAgain'));
      const result = await response.json();

      if (editingAssignment) {
        setAllAssignments(allAssignments.map(a => a.id === editingAssignment.id ? result.assignment : a));
      } else {
        setAllAssignments([...allAssignments, result.assignment]);
      }

      setIsModalOpen(false);
      setEditingAssignment(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenModal = () => {
    setEditingAssignment(null);
    setIsModalOpen(true);
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAssignment(null);
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm(t('messages.confirmAction'))) return;

    try {
      setError(null);
      const response = await fetch(`/api/teacher/assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: {
          'x-teacher-id': session?.id || '',
        },
      });

      if (!response.ok) throw new Error(t('messages.errorTryAgain'));

      setAllAssignments(allAssignments.filter(a => a.id !== assignmentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return t('assignments.noAssignments');
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'km' ? 'km-KH' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (loading || !session) {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Loader />
      </Center>
    );
  }

  if (!isLoaded) {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', paddingTop: '24px' }}>
      {/* Main Content */}
      <Container size="xl" py="xl">
        <Title order={2} mb="xl">{t('assignments.title')}</Title>
        {/* Error Message */}
        {error && (
          <Alert color="red" mb="lg">
            {error}
          </Alert>
        )}

        {/* Toolbar */}
        <Stack gap="md" mb="xl">
          <Group justify="space-between" align="flex-start">
            <Group gap="md" style={{ flex: 1 }}>
              <TextInput
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                leftSection={<IconSearch size={16} />}
                style={{ flex: 1, maxWidth: '300px' }}
              />
              <Select
                placeholder={t('common.status')}
                data={[
                  { value: 'all', label: `${t('common.all')} ${t('common.status')}` },
                  { value: 'active', label: t('courses.active') },
                  { value: 'closed', label: t('assignments.submissionBlocked') },
                  { value: 'draft', label: t('assignments.draft') },
                ]}
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value || 'all');
                  setCurrentPage(1);
                }}
                searchable
                clearable={false}
                style={{ minWidth: '200px' }}
              />
            </Group>
            <Button
              onClick={handleOpenModal}
              leftSection={<IconPlus size={16} />}
            >
              {t('dashboard.teacher.createAssignment')}
            </Button>
          </Group>
          <Text size="sm" c="dimmed">
            {t('common.showing')} {Math.min((currentPage - 1) * itemsPerPage + 1, sortedAssignments.length)} - {Math.min(currentPage * itemsPerPage, sortedAssignments.length)} {t('common.of')} {sortedAssignments.length} {t('assignments.assignment')}
          </Text>
        </Stack>

        {/* Assignment Form Modal */}
        <FormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmitAssignment}
          title={editingAssignment ? t('assignments.editAssignment') : t('dashboard.teacher.createAssignment')}
          fields={getAssignmentFormFields()}
          initialData={editingAssignment ? {
            course_id: editingAssignment.course_id,
            title: editingAssignment.title,
            description: editingAssignment.description || '',
            max_score: editingAssignment.max_score,
            due_date: editingAssignment.due_date ? new Date(editingAssignment.due_date).toISOString().slice(0, 16) : '',
            status: editingAssignment.status,
          } : null}
          isEditing={!!editingAssignment}
          isSubmitting={submitting}
          submitButtonLabel={submitting ? t('common.saving') : t('common.save')}
          cancelButtonLabel={t('common.cancel')}
          t={t}
        />

        {/* Assignments Table */}
        {loading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : allAssignments.length === 0 ? (
          <Stack align="center" justify="center" style={{ minHeight: '300px' }}>
            <Text size="lg">{t('assignments.noAssignments')}</Text>
            <Text c="dimmed">{t('dashboard.teacher.createAssignment')}</Text>
          </Stack>
        ) : filteredAssignments.length === 0 ? (
          <Stack align="center" justify="center" style={{ minHeight: '300px' }}>
            <Text size="lg">{t('common.noResults')}</Text>
          </Stack>
        ) : (
          <>
            {/* Table */}
            <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th
                      onClick={() => handleSort('course_code')}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                    >
                      <Group justify="space-between" gap={0}>
                        {t('dashboard.teacher.courseCode')}
                        {sortField === 'course_code' && (
                          sortOrder === 'asc' ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />
                        )}
                      </Group>
                    </Table.Th>
                    <Table.Th
                      onClick={() => handleSort('title')}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                    >
                      <Group justify="space-between" gap={0}>
                        {t('assignments.assignmentTitle')}
                        {sortField === 'title' && (
                          sortOrder === 'asc' ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />
                        )}
                      </Group>
                    </Table.Th>
                    <Table.Th
                      onClick={() => handleSort('due_date')}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                    >
                      <Group justify="space-between" gap={0}>
                        {t('assignments.dueDate')}
                        {sortField === 'due_date' && (
                          sortOrder === 'asc' ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />
                        )}
                      </Group>
                    </Table.Th>
                    <Table.Th
                      onClick={() => handleSort('max_score')}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                    >
                      <Group justify="space-between" gap={0}>
                        {t('assignments.pointsValue')}
                        {sortField === 'max_score' && (
                          sortOrder === 'asc' ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />
                        )}
                      </Group>
                    </Table.Th>
                    <Table.Th
                      onClick={() => handleSort('status')}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                    >
                      <Group justify="space-between" gap={0}>
                        {t('common.status')}
                        {sortField === 'status' && (
                          sortOrder === 'asc' ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />
                        )}
                      </Group>
                    </Table.Th>
                    <Table.Th>{t('common.actions')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedAssignments.map((assignment) => (
                    <Table.Tr key={assignment.id}>
                      <Table.Td>
                        <Badge>{assignment.course_code}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Stack gap={4}>
                          <Text size="sm" fw={500}>{assignment.title}</Text>
                          {assignment.description && (
                            <Text size="xs" c="dimmed" lineClamp={2}>{assignment.description}</Text>
                          )}
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Text
                          size="sm"
                          c={assignment.due_date && isOverdue(assignment.due_date) ? 'red' : undefined}
                        >
                          {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : '-'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={500}>{assignment.max_score}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={
                            assignment.status === 'active'
                              ? 'green'
                              : assignment.status === 'closed'
                              ? 'yellow'
                              : 'gray'
                          }
                        >
                          {assignment.status === 'active' ? t('courses.active') :
                           assignment.status === 'closed' ? t('assignments.submissionBlocked') :
                           t('assignments.draft')}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          <ActionIcon
                            size="sm"
                            variant="light"
                            onClick={() => handleEditAssignment(assignment)}
                          >
                            <IconEdit size={14} />
                          </ActionIcon>
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="red"
                            onClick={() => handleDeleteAssignment(assignment.id)}
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Flex justify="center" mt="xl">
                <Pagination
                  value={currentPage}
                  onChange={setCurrentPage}
                  total={totalPages}
                  boundaries={1}
                  siblings={2}
                />
              </Flex>
            )}
          </>
        )}
      </Container>
    </div>
  );
}
