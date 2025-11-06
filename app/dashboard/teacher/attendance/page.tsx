'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth/client-auth';
import { useTranslation } from '@/lib/i18n/useTranslation';
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
  Modal,
  Select,
  Grid,
  Card,
  SimpleGrid,
} from '@mantine/core';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconChevronUp,
  IconChevronDown,
  IconCheck,
  IconX,
  IconClock,
} from '@tabler/icons-react';

interface AttendanceRecord {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

interface Student {
  id: string;
  full_name: string;
  email: string;
}

type SortField = 'date' | 'student_name' | 'status';
type SortOrder = 'asc' | 'desc';

export default function TeacherAttendancePage() {
  const router = useRouter();
  const { t, isLoaded } = useTranslation();
  const [session, setSession] = useState<any>(null);
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    student_id: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present' as 'present' | 'absent' | 'late',
    remarks: '',
  });

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Stats
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0 });

  useEffect(() => {
    const checkAuth = async () => {
      const sess = getSession();
      if (!sess || sess.role !== 'teacher') {
        router.push('/auth/login');
        return;
      }
      setSession(sess);
      fetchStudents(sess.id);
      fetchAttendance(sess.id);
    };

    if (isLoaded) {
      checkAuth();
    }
  }, [router, isLoaded]);

  const fetchStudents = async (teacherId: string) => {
    try {
      const response = await fetch(`/api/teacher/students`, {
        headers: {
          'x-teacher-id': teacherId,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch students');
      const data = await response.json();

      // Get unique students
      const uniqueStudents = Array.from(
        new Map(
          (data.students || []).map((s: any) => [s.id, { id: s.id, full_name: s.full_name, email: s.email }])
        ).values()
      );

      setStudents(uniqueStudents);
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const fetchAttendance = async (teacherId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/teacher/attendance`, {
        headers: {
          'x-teacher-id': teacherId,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch attendance');
      const data = await response.json();
      setAllRecords(data.records || []);

      // Calculate stats
      const records = data.records || [];
      const present = records.filter((r: AttendanceRecord) => r.status === 'present').length;
      const absent = records.filter((r: AttendanceRecord) => r.status === 'absent').length;
      const late = records.filter((r: AttendanceRecord) => r.status === 'late').length;
      setStats({ present, absent, late });

      setCurrentPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  // Filter records
  const filteredRecords = allRecords.filter(record => {
    const matchesSearch =
      record.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.student_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.date.includes(searchQuery);

    const matchesStatus = !statusFilter || record.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Sort records
  const sortedRecords = [...filteredRecords].sort((a, b) => {
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
  const totalPages = Math.ceil(sortedRecords.length / itemsPerPage);
  const paginatedRecords = sortedRecords.slice(
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

  const handleOpenModal = (record?: AttendanceRecord) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        student_id: record.student_id,
        date: record.date,
        status: record.status,
        remarks: record.remarks || '',
      });
    } else {
      setEditingRecord(null);
      setFormData({
        student_id: '',
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        remarks: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
  };

  const handleSubmit = async () => {
    if (!formData.student_id || !formData.date) {
      setError(t('common.requiredFields'));
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const url = editingRecord
        ? `/api/teacher/attendance/${editingRecord.id}`
        : '/api/teacher/attendance';
      const method = editingRecord ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-teacher-id': session?.id || '',
        },
        body: JSON.stringify({
          studentId: formData.student_id,
          date: formData.date,
          status: formData.status,
          remarks: formData.remarks || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to save attendance');
      const result = await response.json();

      if (editingRecord) {
        setAllRecords(allRecords.map(r => (r.id === editingRecord.id ? result.record : r)));
      } else {
        setAllRecords([result.record, ...allRecords]);
      }

      handleCloseModal();
      fetchAttendance(session?.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (recordId: string) => {
    if (!confirm(t('common.confirmDelete'))) return;

    try {
      setError(null);
      const response = await fetch(`/api/teacher/attendance/${recordId}`, {
        method: 'DELETE',
        headers: {
          'x-teacher-id': session?.id || '',
        },
      });

      if (!response.ok) throw new Error('Failed to delete attendance');

      setAllRecords(allRecords.filter(r => r.id !== recordId));
      fetchAttendance(session?.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <IconCheck size={16} style={{ color: 'var(--mantine-color-green-6)' }} />;
      case 'absent':
        return <IconX size={16} style={{ color: 'var(--mantine-color-red-6)' }} />;
      case 'late':
        return <IconClock size={16} style={{ color: 'var(--mantine-color-yellow-6)' }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'green';
      case 'absent':
        return 'red';
      case 'late':
        return 'yellow';
      default:
        return 'gray';
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
      <Container size="xl" py="xl">
        <Title order={2} mb="xl">
          {t('dashboard.teacher.attendance')}
        </Title>

        {/* Error Message */}
        {error && (
          <Alert color="red" mb="lg">
            {error}
          </Alert>
        )}

        {/* Stats */}
        <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" align="flex-start">
              <div>
                <Text size="sm" c="dimmed">
                  {t('attendance.present')}
                </Text>
                <Text size="xl" fw={700} c="green" mt="xs">
                  {stats.present}
                </Text>
              </div>
              <IconCheck size={32} style={{ color: 'var(--mantine-color-green-6)', opacity: 0.3 }} />
            </Group>
          </Card>

          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" align="flex-start">
              <div>
                <Text size="sm" c="dimmed">
                  {t('attendance.absent')}
                </Text>
                <Text size="xl" fw={700} c="red" mt="xs">
                  {stats.absent}
                </Text>
              </div>
              <IconX size={32} style={{ color: 'var(--mantine-color-red-6)', opacity: 0.3 }} />
            </Group>
          </Card>

          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" align="flex-start">
              <div>
                <Text size="sm" c="dimmed">
                  {t('attendance.late')}
                </Text>
                <Text size="xl" fw={700} c="yellow" mt="xs">
                  {stats.late}
                </Text>
              </div>
              <IconClock size={32} style={{ color: 'var(--mantine-color-yellow-6)', opacity: 0.3 }} />
            </Group>
          </Card>
        </SimpleGrid>

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
              style={{ flex: 1, maxWidth: '300px' }}
            />
            <Button onClick={() => handleOpenModal()} leftSection={<IconPlus size={16} />}>
              {t('dashboard.teacher.markAttendance')}
            </Button>
          </Group>

          <Group gap="md">
            <Select
              placeholder={t('common.filterStatus')}
              data={[
                { value: '', label: `${t('common.all')} ${t('attendance.statuses')}` },
                { value: 'present', label: t('attendance.present') },
                { value: 'absent', label: t('attendance.absent') },
                { value: 'late', label: t('attendance.late') },
              ]}
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
              clearable
              style={{ maxWidth: '200px' }}
            />
          </Group>

          <Text size="sm" c="dimmed">
            {t('common.showing')} {Math.min((currentPage - 1) * itemsPerPage + 1, sortedRecords.length)} -{' '}
            {Math.min(currentPage * itemsPerPage, sortedRecords.length)} {t('common.of')} {sortedRecords.length}{' '}
            {t('attendance.records')}
          </Text>
        </Stack>

        {/* Attendance Table */}
        {allRecords.length === 0 ? (
          <Stack align="center" justify="center" style={{ minHeight: '300px' }}>
            <Text size="lg">{t('common.noResults')}</Text>
            <Text c="dimmed">{t('dashboard.teacher.noAttendanceRecords')}</Text>
          </Stack>
        ) : filteredRecords.length === 0 ? (
          <Stack align="center" justify="center" style={{ minHeight: '300px' }}>
            <Text size="lg">{t('common.noResults')}</Text>
          </Stack>
        ) : (
          <>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('auth.register.firstName')} {t('auth.register.lastName')}</Table.Th>
                    <Table.Th>{t('auth.register.email')}</Table.Th>
                    <Table.Th
                      onClick={() => handleSort('date')}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                    >
                      <Group justify="space-between" gap={0}>
                        {t('common.date')}
                        {sortField === 'date' && (sortOrder === 'asc' ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />)}
                      </Group>
                    </Table.Th>
                    <Table.Th
                      onClick={() => handleSort('status')}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                    >
                      <Group justify="space-between" gap={0}>
                        {t('attendance.status')}
                        {sortField === 'status' && (sortOrder === 'asc' ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />)}
                      </Group>
                    </Table.Th>
                    <Table.Th>{t('common.remarks')}</Table.Th>
                    <Table.Th>{t('common.actions')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedRecords.map((record) => (
                    <Table.Tr key={record.id}>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          {record.student_name}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{record.student_email}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{new Date(record.date).toLocaleDateString()}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={getStatusColor(record.status)} leftSection={getStatusIcon(record.status)}>
                          {record.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed" lineClamp={1}>
                          {record.remarks || '-'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          <ActionIcon size="sm" variant="light" onClick={() => handleOpenModal(record)}>
                            <IconEdit size={14} />
                          </ActionIcon>
                          <ActionIcon size="sm" variant="light" color="red" onClick={() => handleDelete(record.id)}>
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

      {/* Attendance Form Modal */}
      <Modal
        opened={isModalOpen}
        onClose={handleCloseModal}
        title={editingRecord ? t('common.editAttendance') : t('common.markAttendance')}
        centered
      >
        <Stack gap="lg">
          <Select
            label={t('attendance.student')}
            placeholder={t('common.selectStudent')}
            data={students.map((s) => ({
              value: s.id,
              label: `${s.full_name} (${s.email})`,
            }))}
            value={formData.student_id}
            onChange={(value) => setFormData({ ...formData, student_id: value || '' })}
            searchable
            required
            disabled={submitting}
          />

          <TextInput
            label={t('common.date')}
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
            disabled={submitting}
          />

          <Select
            label={t('attendance.status')}
            placeholder={t('common.selectStatus')}
            data={[
              { value: 'present', label: t('attendance.present') },
              { value: 'absent', label: t('attendance.absent') },
              { value: 'late', label: t('attendance.late') },
            ]}
            value={formData.status}
            onChange={(value) => setFormData({ ...formData, status: (value || 'present') as any })}
            required
            disabled={submitting}
          />

          <TextInput
            label={t('common.remarks')}
            placeholder={t('common.optionalRemarks')}
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            disabled={submitting}
          />

          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={handleCloseModal} disabled={submitting}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmit} loading={submitting}>
              {submitting ? t('common.saving') : t('common.save')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}
