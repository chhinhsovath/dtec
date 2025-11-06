'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth/client-auth';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { CourseFormModal, CourseFormData } from '@/app/components/CourseFormModal';
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
} from '@mantine/core';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconChevronUp,
  IconChevronDown,
} from '@tabler/icons-react';

interface Course {
  id: string;
  code: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  student_count: number;
}

type SortField = 'code' | 'title' | 'student_count' | 'created_at';
type SortOrder = 'asc' | 'desc';

export default function TeacherCoursesPage() {
  const router = useRouter();
  const { t, isLoaded } = useTranslation();
  const [session, setSession] = useState<any>(null);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('code');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  useEffect(() => {
    const checkAuth = async () => {
      const sess = getSession();
      if (!sess || sess.role !== 'teacher') {
        router.push('/auth/login');
        return;
      }
      setSession(sess);
      fetchCourses(sess.id);
    };

    if (isLoaded) {
      checkAuth();
    }
  }, [router, isLoaded]);

  const fetchCourses = async (teacherId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/teacher/courses`, {
        headers: {
          'x-teacher-id': teacherId,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch courses');
      const data = await response.json();
      setAllCourses(data.courses || []);
      setCurrentPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  // Filter courses by search query
  const filteredCourses = allCourses.filter(course =>
    course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (course.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  // Sort courses
  const sortedCourses = [...filteredCourses].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = (bVal as string).toLowerCase();
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginate
  const totalPages = Math.ceil(sortedCourses.length / itemsPerPage);
  const paginatedCourses = sortedCourses.slice(
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

  const handleSubmitCourse = async (formData: CourseFormData) => {
    if (!formData.code || !formData.name) {
      setError(t('common.requiredFields'));
      throw new Error(t('common.requiredFields'));
    }

    try {
      setSubmitting(true);
      setError(null);

      const url = editingCourse ? `/api/teacher/courses/${editingCourse.id}` : '/api/teacher/courses';
      const method = editingCourse ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-teacher-id': session?.id || '',
        },
        body: JSON.stringify({
          code: formData.code,
          title: formData.name,
          description: formData.description || null,
        }),
      });

      if (!response.ok) throw new Error(t('dashboard.teacher.courseError'));
      const result = await response.json();

      if (editingCourse) {
        setAllCourses(allCourses.map(c => c.id === editingCourse.id ? result.course : c));
      } else {
        setAllCourses([...allCourses, result.course]);
      }

      setIsModalOpen(false);
      setEditingCourse(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenModal = () => {
    setEditingCourse(null);
    setIsModalOpen(true);
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCourse(null);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm(t('common.confirmDelete'))) return;

    try {
      setError(null);
      const response = await fetch(`/api/teacher/courses/${courseId}`, {
        method: 'DELETE',
        headers: {
          'x-teacher-id': session?.id || '',
        },
      });

      if (!response.ok) throw new Error(t('dashboard.teacher.deleteError'));

      setAllCourses(allCourses.filter(c => c.id !== courseId));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
      <Container size="xl" py="xl">
        <Title order={2} mb="xl">
          {t('dashboard.teacher.myCourses')}
        </Title>
        {/* Error Message */}
        {error && (
          <Alert color="red" mb="lg">
            {error}
          </Alert>
        )}

        {/* Toolbar */}
        <Stack gap="md" mb="xl">
          <Group justify="space-between" align="flex-start">
            <TextInput
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              leftSection={<IconSearch size={16} />}
              style={{ flex: 1, maxWidth: '400px' }}
            />
            <Button
              onClick={handleOpenModal}
              leftSection={<IconPlus size={16} />}
            >
              {t('dashboard.teacher.createCourse')}
            </Button>
          </Group>
          <Text size="sm" c="dimmed">
            {t('common.showing')} {Math.min((currentPage - 1) * itemsPerPage + 1, sortedCourses.length)} - {Math.min(currentPage * itemsPerPage, sortedCourses.length)} {t('common.of')} {sortedCourses.length} {t('navigation.courses')}
          </Text>
        </Stack>

        {/* Course Form Modal */}
        <CourseFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmitCourse}
          initialData={editingCourse ? {
            code: editingCourse.code,
            name: editingCourse.title,
            description: editingCourse.description || '',
          } : null}
          isEditing={!!editingCourse}
          isSubmitting={submitting}
          t={t}
        />

        {/* Courses Table */}
        {loading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : allCourses.length === 0 ? (
          <Stack align="center" justify="center" style={{ minHeight: '300px' }}>
            <Text size="lg">{t('dashboard.teacher.noCourses')}</Text>
            <Text c="dimmed">{t('dashboard.teacher.createFirstCourse')}</Text>
          </Stack>
        ) : filteredCourses.length === 0 ? (
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
                      onClick={() => handleSort('code')}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                    >
                      <Group justify="space-between" gap={0}>
                        {t('dashboard.teacher.courseCode')}
                        {sortField === 'code' && (
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
                        {t('dashboard.teacher.courseName')}
                        {sortField === 'title' && (
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
                        {t('dashboard.teacher.studentsEnrolled')}
                        {sortField === 'student_count' && (
                          sortOrder === 'asc' ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />
                        )}
                      </Group>
                    </Table.Th>
                    <Table.Th
                      onClick={() => handleSort('created_at')}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                    >
                      <Group justify="space-between" gap={0}>
                        {t('common.created')}
                        {sortField === 'created_at' && (
                          sortOrder === 'asc' ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />
                        )}
                      </Group>
                    </Table.Th>
                    <Table.Th>{t('common.actions')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedCourses.map((course) => (
                    <Table.Tr key={course.id}>
                      <Table.Td>
                        <Badge>{course.code}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Stack gap={4}>
                          <Text size="sm" fw={500}>{course.title}</Text>
                          {course.description && (
                            <Text size="xs" c="dimmed" lineClamp={2}>{course.description}</Text>
                          )}
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={500}>{course.student_count || 0}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{formatDate(course.created_at)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          <ActionIcon
                            size="sm"
                            variant="light"
                            onClick={() => handleEditCourse(course)}
                          >
                            <IconEdit size={14} />
                          </ActionIcon>
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="red"
                            onClick={() => handleDeleteCourse(course.id)}
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
