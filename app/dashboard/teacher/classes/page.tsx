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
  IconUsers,
} from '@tabler/icons-react';

interface ClassData {
  id: string;
  class_code: string;
  class_name: string;
  description: string | null;
  grade_level: string;
  room_number: string | null;
  semester: string;
  student_count: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Course {
  id: string;
  code: string;
  title: string;
}

type SortField = 'class_code' | 'class_name' | 'grade_level' | 'semester' | 'student_count' | 'status';
type SortOrder = 'asc' | 'desc';

export default function TeacherClassesPage() {
  const router = useRouter();
  const { t, isLoaded } = useTranslation();
  const [session, setSession] = useState<any>(null);
  const [allClasses, setAllClasses] = useState<ClassData[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('class_code');
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
      fetchClasses(sess.id);
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

  const fetchClasses = async (teacherId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/teacher/classes`, {
        headers: {
          'x-teacher-id': teacherId,
        },
      });
      if (!response.ok) throw new Error(t('errors.serverError'));
      const data = await response.json();
      setAllClasses(data.classes || []);
      setCurrentPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  // Filter classes
  const filteredClasses = allClasses.filter(classItem => {
    const matchesSearch =
      classItem.class_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      classItem.class_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (classItem.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || classItem.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Sort classes
  const sortedClasses = [...filteredClasses].sort((a, b) => {
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
  const totalPages = Math.ceil(sortedClasses.length / itemsPerPage);
  const paginatedClasses = sortedClasses.slice(
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

  const getClassFormFields = (): FormField[] => [
    {
      name: 'class_code',
      label: t('dashboard.teacher.classCode') || 'Class Code',
      type: 'text',
      required: true,
      placeholder: 'e.g., CLASS-001',
    },
    {
      name: 'class_name',
      label: t('dashboard.teacher.className') || 'Class Name',
      type: 'text',
      required: true,
      placeholder: 'e.g., Grade 10 - Section A',
    },
    {
      name: 'description',
      label: t('common.description'),
      type: 'textarea',
      placeholder: 'Class description...',
      rows: 3,
    },
    {
      name: 'grade_level',
      label: t('dashboard.teacher.gradeLevel') || 'Grade Level',
      type: 'text',
      required: true,
      placeholder: 'e.g., 10',
    },
    {
      name: 'room_number',
      label: t('dashboard.teacher.roomNumber') || 'Room Number',
      type: 'text',
      placeholder: 'e.g., 105',
    },
    {
      name: 'semester',
      label: t('dashboard.teacher.semester') || 'Semester',
      type: 'select',
      required: true,
      options: [
        { value: '1', label: 'Semester 1' },
        { value: '2', label: 'Semester 2' },
      ],
    },
    {
      name: 'status',
      label: t('common.status'),
      type: 'select',
      options: [
        { value: 'active', label: t('courses.active') || 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'archived', label: 'Archived' },
      ],
    },
  ];

  const handleSubmitClass = async (formData: Record<string, any>) => {
    if (!formData.class_code || !formData.class_name) {
      setError(t('forms.requiredFields'));
      throw new Error(t('forms.requiredFields'));
    }

    try {
      setSubmitting(true);
      setError(null);

      const url = editingClass ? `/api/teacher/classes/${editingClass.id}` : '/api/teacher/classes';
      const method = editingClass ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-teacher-id': session?.id || '',
        },
        body: JSON.stringify({
          classCode: formData.class_code,
          className: formData.class_name,
          description: formData.description || null,
          gradeLevel: formData.grade_level,
          roomNumber: formData.room_number || null,
          semester: formData.semester,
          status: formData.status || 'active',
        }),
      });

      if (!response.ok) throw new Error(t('messages.errorTryAgain'));
      const result = await response.json();

      if (editingClass) {
        setAllClasses(allClasses.map(c => c.id === editingClass.id ? result.class : c));
      } else {
        setAllClasses([...allClasses, result.class]);
      }

      setIsModalOpen(false);
      setEditingClass(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenModal = () => {
    setEditingClass(null);
    setIsModalOpen(true);
  };

  const handleEditClass = (classItem: ClassData) => {
    setEditingClass(classItem);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClass(null);
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm(t('messages.confirmAction'))) return;

    try {
      setError(null);
      const response = await fetch(`/api/teacher/classes/${classId}`, {
        method: 'DELETE',
        headers: {
          'x-teacher-id': session?.id || '',
        },
      });

      if (!response.ok) throw new Error(t('messages.errorTryAgain'));

      setAllClasses(allClasses.filter(c => c.id !== classId));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    }
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
        <Title order={2} mb="xl">{t('dashboard.teacher.myCourses') || 'My Classes'}</Title>

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
                  { value: 'active', label: t('courses.active') || 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'archived', label: 'Archived' },
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
              {t('dashboard.teacher.createAssignment') || 'Create Class'}
            </Button>
          </Group>
          <Text size="sm" c="dimmed">
            {t('common.showing')} {Math.min((currentPage - 1) * itemsPerPage + 1, sortedClasses.length)} - {Math.min(currentPage * itemsPerPage, sortedClasses.length)} {t('common.of')} {sortedClasses.length} {t('common.classes') || 'classes'}
          </Text>
        </Stack>

        {/* Class Form Modal */}
        <FormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmitClass}
          title={editingClass ? t('common.edit') || 'Edit Class' : t('common.create') || 'Create Class'}
          fields={getClassFormFields()}
          initialData={editingClass ? {
            class_code: editingClass.class_code,
            class_name: editingClass.class_name,
            description: editingClass.description || '',
            grade_level: editingClass.grade_level,
            room_number: editingClass.room_number || '',
            semester: editingClass.semester,
            status: editingClass.status,
          } : null}
          isEditing={!!editingClass}
          isSubmitting={submitting}
          submitButtonLabel={submitting ? t('common.saving') : t('common.save')}
          cancelButtonLabel={t('common.cancel')}
          t={t}
        />

        {/* Classes Table */}
        {loading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : allClasses.length === 0 ? (
          <Stack align="center" justify="center" style={{ minHeight: '300px' }}>
            <Text size="lg">{t('common.noResults')}</Text>
            <Text c="dimmed">{t('dashboard.teacher.createAssignment') || 'Create a class to get started'}</Text>
          </Stack>
        ) : filteredClasses.length === 0 ? (
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
                      onClick={() => handleSort('class_code')}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                    >
                      <Group justify="space-between" gap={0}>
                        {t('dashboard.teacher.classCode') || 'Class Code'}
                        {sortField === 'class_code' && (
                          sortOrder === 'asc' ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />
                        )}
                      </Group>
                    </Table.Th>
                    <Table.Th
                      onClick={() => handleSort('class_name')}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                    >
                      <Group justify="space-between" gap={0}>
                        {t('dashboard.teacher.className') || 'Class Name'}
                        {sortField === 'class_name' && (
                          sortOrder === 'asc' ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />
                        )}
                      </Group>
                    </Table.Th>
                    <Table.Th
                      onClick={() => handleSort('grade_level')}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                    >
                      <Group justify="space-between" gap={0}>
                        {t('dashboard.teacher.gradeLevel') || 'Grade'}
                        {sortField === 'grade_level' && (
                          sortOrder === 'asc' ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />
                        )}
                      </Group>
                    </Table.Th>
                    <Table.Th
                      onClick={() => handleSort('semester')}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                    >
                      <Group justify="space-between" gap={0}>
                        {t('dashboard.teacher.semester') || 'Semester'}
                        {sortField === 'semester' && (
                          sortOrder === 'asc' ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />
                        )}
                      </Group>
                    </Table.Th>
                    <Table.Th
                      onClick={() => handleSort('student_count')}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                    >
                      <Group justify="space-between" gap={0}>
                        {t('common.students') || 'Students'}
                        {sortField === 'student_count' && (
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
                  {paginatedClasses.map((classItem) => (
                    <Table.Tr key={classItem.id}>
                      <Table.Td>
                        <Badge>{classItem.class_code}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Stack gap={4}>
                          <Text size="sm" fw={500}>{classItem.class_name}</Text>
                          {classItem.description && (
                            <Text size="xs" c="dimmed" lineClamp={1}>{classItem.description}</Text>
                          )}
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{classItem.grade_level}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">Semester {classItem.semester}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          <IconUsers size={16} />
                          <Text size="sm" fw={500}>{classItem.student_count}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={
                            classItem.status === 'active'
                              ? 'green'
                              : classItem.status === 'inactive'
                              ? 'yellow'
                              : 'gray'
                          }
                        >
                          {classItem.status === 'active' ? t('courses.active') || 'Active' :
                           classItem.status === 'inactive' ? 'Inactive' :
                           'Archived'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          <ActionIcon
                            size="sm"
                            variant="light"
                            onClick={() => handleEditClass(classItem)}
                          >
                            <IconEdit size={14} />
                          </ActionIcon>
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="red"
                            onClick={() => handleDeleteClass(classItem.id)}
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
