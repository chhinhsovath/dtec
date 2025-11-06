'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getSession, clearSession } from '@/lib/auth/client-auth';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  Container,
  Group,
  Button,
  TextInput,
  Select,
  Alert,
  Flex,
  Text,
  Stack,
  Center,
  ActionIcon,
  Title,
  Loader,
  Modal,
  Card,
  Grid,
  Badge,
  Table,
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconLogout,
  IconArrowLeft,
  IconClock,
  IconMapPin,
} from '@tabler/icons-react';

interface Schedule {
  id: string;
  course_id: string;
  day: string;
  time: string;
  location: string | null;
  created_at: string;
}

interface FormData {
  day: string;
  time: string;
  location: string;
}

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export default function CourseSchedulePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const { t, language, changeLanguage, isLoaded } = useTranslation();

  const [session, setSession] = useState<any>(null);
  const [courseName, setCourseName] = useState('');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    day: 'Monday',
    time: '09:00',
    location: '',
  });

  useEffect(() => {
    const checkAuth = async () => {
      const sess = getSession();
      if (!sess || sess.role !== 'teacher') {
        router.push('/auth/login');
        return;
      }
      setSession(sess);
      fetchSchedules(sess.id);
    };

    if (isLoaded) {
      checkAuth();
    }
  }, [router, isLoaded]);

  const fetchSchedules = async (teacherId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/teacher/courses/${courseId}/schedule`,
        {
          headers: { 'x-teacher-id': teacherId },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch schedules');
      const data = await response.json();
      setSchedules(data.schedules || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (schedule?: Schedule) => {
    if (schedule) {
      setEditingId(schedule.id);
      setFormData({
        day: schedule.day,
        time: schedule.time,
        location: schedule.location || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        day: 'Monday',
        time: '09:00',
        location: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!formData.day || !formData.time) {
      setError('Day and time are required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const url = editingId
        ? `/api/teacher/courses/${courseId}/schedule/${editingId}`
        : `/api/teacher/courses/${courseId}/schedule`;
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-teacher-id': session?.id || '',
        },
        body: JSON.stringify({
          day: formData.day,
          time: formData.time,
          location: formData.location || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to save schedule');
      const result = await response.json();

      if (editingId) {
        setSchedules(
          schedules.map(s => (s.id === editingId ? result.schedule : s))
        );
      } else {
        setSchedules([...schedules, result.schedule]);
      }

      handleCloseModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirmDelete'))) return;

    try {
      setError(null);
      const response = await fetch(
        `/api/teacher/courses/${courseId}/schedule/${id}`,
        {
          method: 'DELETE',
          headers: { 'x-teacher-id': session?.id || '' },
        }
      );

      if (!response.ok) throw new Error('Failed to delete schedule');

      setSchedules(schedules.filter(s => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    }
  };

  const handleLogout = () => {
    clearSession();
    router.push('/');
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

  // Sort schedules by day and time
  const sortedSchedules = [...schedules].sort((a, b) => {
    const dayOrder = {
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
      Sunday: 7,
    };
    const dayCompare =
      (dayOrder[a.day as keyof typeof dayOrder] || 0) -
      (dayOrder[b.day as keyof typeof dayOrder] || 0);
    if (dayCompare !== 0) return dayCompare;
    return a.time.localeCompare(b.time);
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Container size="xl" py="md">
          <Group justify="space-between" align="center">
            <div>
              <Button
                variant="subtle"
                leftSection={<IconArrowLeft size={16} />}
                onClick={() => router.back()}
                mb="sm"
              >
                Back
              </Button>
              <Title order={1}>Course Schedule</Title>
            </div>
            <Group gap="md">
              <Group gap="xs">
                <Button
                  onClick={() => changeLanguage('en')}
                  variant={language === 'en' ? 'filled' : 'light'}
                  size="xs"
                >
                  EN
                </Button>
                <Button
                  onClick={() => changeLanguage('km')}
                  variant={language === 'km' ? 'filled' : 'light'}
                  size="xs"
                >
                  ខ្មែរ
                </Button>
              </Group>
              <Button onClick={handleLogout} color="red" leftSection={<IconLogout size={16} />}>
                {t('common.logout')}
              </Button>
            </Group>
          </Group>
        </Container>
      </div>

      {/* Main Content */}
      <Container size="xl" py="xl">
        {error && (
          <Alert color="red" mb="lg" title="Error">
            {error}
          </Alert>
        )}

        {/* Toolbar */}
        <Group justify="space-between" mb="xl">
          <div>
            <Text size="lg" fw={500}>
              Class Schedule
            </Text>
            <Text size="sm" c="dimmed">
              Add class times and locations
            </Text>
          </div>
          <Button onClick={() => handleOpenModal()} leftSection={<IconPlus size={16} />}>
            Add Class Time
          </Button>
        </Group>

        {/* Schedule Grid */}
        {schedules.length === 0 ? (
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack align="center" justify="center" py="xl">
              <Text size="lg" fw={500}>
                No schedule yet
              </Text>
              <Text size="sm" c="dimmed">
                Add class times and locations for this course
              </Text>
              <Button onClick={() => handleOpenModal()} leftSection={<IconPlus size={16} />}>
                Add First Class Time
              </Button>
            </Stack>
          </Card>
        ) : (
          <>
            {/* Desktop View - Table */}
            <div
              style={{
                display: 'none',
                '@media (min-width: 768px)': { display: 'block' },
                backgroundColor: 'white',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Day</Table.Th>
                    <Table.Th>Time</Table.Th>
                    <Table.Th>Location</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {sortedSchedules.map(schedule => (
                    <Table.Tr key={schedule.id}>
                      <Table.Td>
                        <Badge>{schedule.day}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <IconClock size={16} />
                          <Text size="sm">{schedule.time}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        {schedule.location ? (
                          <Group gap="xs">
                            <IconMapPin size={16} />
                            <Text size="sm">{schedule.location}</Text>
                          </Group>
                        ) : (
                          <Text size="sm" c="dimmed">
                            -
                          </Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          <ActionIcon
                            size="sm"
                            variant="light"
                            onClick={() => handleOpenModal(schedule)}
                          >
                            <IconEdit size={14} />
                          </ActionIcon>
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="red"
                            onClick={() => handleDelete(schedule.id)}
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

            {/* Mobile View - Cards */}
            <Stack gap="md" style={{ display: 'block', '@media (min-width: 768px)': { display: 'none' } }}>
              {sortedSchedules.map(schedule => (
                <Card key={schedule.id} shadow="sm" padding="lg" radius="md" withBorder>
                  <Group justify="space-between" mb="md">
                    <Badge>{schedule.day}</Badge>
                    <Group gap={4}>
                      <ActionIcon
                        size="sm"
                        variant="light"
                        onClick={() => handleOpenModal(schedule)}
                      >
                        <IconEdit size={14} />
                      </ActionIcon>
                      <ActionIcon
                        size="sm"
                        variant="light"
                        color="red"
                        onClick={() => handleDelete(schedule.id)}
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>
                  </Group>

                  <Stack gap="sm">
                    <Group gap="xs">
                      <IconClock size={16} />
                      <Text size="sm">{schedule.time}</Text>
                    </Group>
                    {schedule.location && (
                      <Group gap="xs">
                        <IconMapPin size={16} />
                        <Text size="sm">{schedule.location}</Text>
                      </Group>
                    )}
                  </Stack>
                </Card>
              ))}
            </Stack>
          </>
        )}
      </Container>

      {/* Modal */}
      <Modal
        opened={isModalOpen}
        onClose={handleCloseModal}
        title={editingId ? 'Edit Class Time' : 'Add Class Time'}
        size="md"
        centered
      >
        <Stack gap="lg">
          <Select
            label="Day of Week"
            placeholder="Select day"
            data={DAYS.map(day => ({ value: day, label: day }))}
            value={formData.day}
            onChange={(value) =>
              setFormData({ ...formData, day: value || 'Monday' })
            }
            required
            disabled={submitting}
          />

          <TextInput
            label="Time"
            type="time"
            value={formData.time}
            onChange={(e) =>
              setFormData({ ...formData, time: e.target.value })
            }
            required
            disabled={submitting}
          />

          <TextInput
            label="Location (optional)"
            placeholder="e.g., Room 101, Building A"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            disabled={submitting}
          />

          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={handleCloseModal} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={submitting}>
              {submitting ? 'Saving...' : 'Save'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}
