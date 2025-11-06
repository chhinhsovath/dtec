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
  Textarea,
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
  Card,
  Checkbox,
  Select,
} from '@mantine/core';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconX,
  IconPin,
} from '@tabler/icons-react';

interface Announcement {
  id: string;
  course_id: string;
  course_name: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

interface Course {
  id: string;
  code: string;
  title: string;
}

interface FormData {
  course_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
}

export default function AnnouncementsPage() {
  const router = useRouter();
  const { t, isLoaded } = useTranslation();
  const [session, setSession] = useState<any>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    course_id: '',
    title: '',
    content: '',
    is_pinned: false,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const checkAuth = async () => {
      const sess = getSession();
      if (!sess || sess.role !== 'teacher') {
        router.push('/auth/login');
        return;
      }
      setSession(sess);
      fetchCourses(sess.id);
      fetchAnnouncements(sess.id);
    };

    if (isLoaded) {
      checkAuth();
    }
  }, [router, isLoaded]);

  const fetchCourses = async (teacherId: string) => {
    try {
      const response = await fetch(`/api/teacher/courses`, {
        headers: { 'x-teacher-id': teacherId },
      });
      if (!response.ok) throw new Error('Failed to fetch courses');
      const data = await response.json();
      setCourses(data.courses || []);
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  };

  const fetchAnnouncements = async (teacherId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/teacher/announcements`, {
        headers: { 'x-teacher-id': teacherId },
      });
      if (!response.ok) throw new Error('Failed to fetch announcements');
      const data = await response.json();
      setAnnouncements(data.announcements || []);
      setCurrentPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const filteredAnnouncements = announcements
    .filter(a =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(a => !selectedCourse || a.course_id === selectedCourse);

  const paginatedAnnouncements = filteredAnnouncements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenModal = (announcement?: Announcement) => {
    if (announcement) {
      setEditingId(announcement.id);
      setFormData({
        course_id: announcement.course_id,
        title: announcement.title,
        content: announcement.content,
        is_pinned: announcement.is_pinned,
      });
    } else {
      setEditingId(null);
      setFormData({
        course_id: courses[0]?.id || '',
        title: '',
        content: '',
        is_pinned: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      course_id: '',
      title: '',
      content: '',
      is_pinned: false,
    });
  };

  const handleSubmit = async () => {
    if (!formData.course_id || !formData.title || !formData.content) {
      setError(t('common.requiredFields'));
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const url = editingId
        ? `/api/teacher/announcements/${editingId}`
        : '/api/teacher/announcements';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-teacher-id': session?.id || '',
        },
        body: JSON.stringify({
          courseId: formData.course_id,
          title: formData.title,
          content: formData.content,
          isPinned: formData.is_pinned,
        }),
      });

      if (!response.ok) throw new Error('Failed to save announcement');
      const result = await response.json();

      if (editingId) {
        setAnnouncements(
          announcements.map(a => (a.id === editingId ? result.announcement : a))
        );
      } else {
        setAnnouncements([result.announcement, ...announcements]);
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
      const response = await fetch(`/api/teacher/announcements/${id}`, {
        method: 'DELETE',
        headers: { 'x-teacher-id': session?.id || '' },
      });

      if (!response.ok) throw new Error('Failed to delete announcement');

      setAnnouncements(announcements.filter(a => a.id !== id));
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

  const totalPages = Math.ceil(filteredAnnouncements.length / itemsPerPage);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', paddingTop: '24px' }}>
      <Container size="xl" py="xl">
        <Title order={2} mb="xl">
          Announcements
        </Title>
        {error && (
          <Alert color="red" mb="lg" title="Error">
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
              style={{ flex: 1, maxWidth: '300px' }}
            />
            <Button onClick={() => handleOpenModal()} leftSection={<IconPlus size={16} />}>
              New Announcement
            </Button>
          </Group>

          <Select
            label="Filter by Course"
            placeholder="All Courses"
            data={[
              { value: '', label: 'All Courses' },
              ...courses.map(c => ({ value: c.id, label: c.title })),
            ]}
            value={selectedCourse}
            onChange={setSelectedCourse}
            clearable
            style={{ maxWidth: '300px' }}
          />
        </Stack>

        {/* Announcements List */}
        {announcements.length === 0 ? (
          <Stack align="center" justify="center" style={{ minHeight: '300px' }}>
            <Text size="lg">{t('common.noResults')}</Text>
          </Stack>
        ) : filteredAnnouncements.length === 0 ? (
          <Stack align="center" justify="center" style={{ minHeight: '300px' }}>
            <Text size="lg">{t('common.noResults')}</Text>
          </Stack>
        ) : (
          <>
            <Stack gap="md">
              {paginatedAnnouncements.map(announcement => (
                <Card key={announcement.id} shadow="sm" padding="lg" radius="md" withBorder>
                  <Group justify="space-between" mb="md">
                    <div>
                      <Group gap="xs">
                        {announcement.is_pinned && <IconPin size={18} color="orange" />}
                        <Title order={4}>{announcement.title}</Title>
                      </Group>
                      <Badge mt="xs">{announcement.course_name}</Badge>
                    </div>
                    <Group gap={4}>
                      <ActionIcon
                        size="sm"
                        variant="light"
                        onClick={() => handleOpenModal(announcement)}
                      >
                        <IconEdit size={14} />
                      </ActionIcon>
                      <ActionIcon
                        size="sm"
                        variant="light"
                        color="red"
                        onClick={() => handleDelete(announcement.id)}
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>
                  </Group>
                  <Text size="sm" mb="md" lineClamp={3}>
                    {announcement.content}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {new Date(announcement.created_at).toLocaleDateString()}
                  </Text>
                </Card>
              ))}
            </Stack>

            {totalPages > 1 && (
              <Flex justify="center" mt="xl">
                <Pagination
                  value={currentPage}
                  onChange={setCurrentPage}
                  total={totalPages}
                />
              </Flex>
            )}
          </>
        )}
      </Container>

      {/* Modal */}
      <Modal
        opened={isModalOpen}
        onClose={handleCloseModal}
        title={editingId ? 'Edit Announcement' : 'New Announcement'}
        size="lg"
        centered
      >
        <Stack gap="lg">
          <Select
            label="Course"
            placeholder="Select a course"
            data={courses.map(c => ({ value: c.id, label: c.title }))}
            value={formData.course_id}
            onChange={(value) =>
              setFormData({ ...formData, course_id: value || '' })
            }
            required
            disabled={submitting}
          />

          <TextInput
            label="Title"
            placeholder="Announcement title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            required
            disabled={submitting}
          />

          <Textarea
            label="Content"
            placeholder="Announcement content"
            value={formData.content}
            onChange={(e) =>
              setFormData({ ...formData, content: e.target.value })
            }
            rows={6}
            required
            disabled={submitting}
          />

          <Checkbox
            label="Pin this announcement"
            checked={formData.is_pinned}
            onChange={(e) =>
              setFormData({ ...formData, is_pinned: e.currentTarget.checked })
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
