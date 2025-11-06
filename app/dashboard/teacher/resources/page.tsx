'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  Container,
  Title,
  Group,
  Button,
  Stack,
  Text,
  Grid,
  Center,
  Loader,
  Card,
  Paper,
  Table,
  Badge,
  Modal,
  TextInput,
  Textarea,
  Select,
  Checkbox,
  Alert,
  Pagination,
  Input,
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconSearch,
  IconChevronUp,
  IconChevronDown,
  IconAlertCircle,
} from '@tabler/icons-react';
import { getSession } from '@/lib/auth/client-auth';
import { useRouter } from 'next/navigation';

interface Resource {
  id: string;
  course_id: string;
  course_title?: string;
  title: string;
  description: string | null;
  material_type: string;
  file_url: string;
  file_size_mb: number | null;
  file_type: string | null;
  is_published: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

interface Course {
  id: string;
  title: string;
}

export default function ResourcesPage() {
  const router = useRouter();
  const { t, isLoaded } = useTranslation();
  const [resources, setResources] = useState<Resource[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'title' | 'created_at' | 'view_count'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    course_id: '',
    title: '',
    description: '',
    material_type: 'lecture_notes',
    file_url: '',
    file_type: '',
    is_published: true,
  });

  const itemsPerPage = 10;

  // Fetch resources and courses
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [resourcesRes, coursesRes] = await Promise.all([
        fetch('/api/teacher/resources'),
        fetch('/api/teacher/courses?limit=999'),
      ]);

      if (!resourcesRes.ok) throw new Error('Failed to fetch resources');
      if (!coursesRes.ok) throw new Error('Failed to fetch courses');

      const resourcesData = await resourcesRes.json();
      const coursesData = await coursesRes.json();

      setResources(resourcesData.data || []);
      setCourses(coursesData.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.push('/auth/login');
      return;
    }
    fetchData();
  }, [router]);

  // Filter and sort resources
  const filteredResources = resources
    .filter((r) => {
      const matchesSearch =
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = !typeFilter || r.material_type === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      let compareValue = 0;
      if (sortField === 'title') {
        compareValue = a.title.localeCompare(b.title);
      } else if (sortField === 'created_at') {
        compareValue = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortField === 'view_count') {
        compareValue = a.view_count - b.view_count;
      }
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

  const paginatedResources = filteredResources.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const stats = {
    total: resources.length,
    published: resources.filter((r) => r.is_published).length,
    by_type: Object.fromEntries(
      [...new Set(resources.map((r) => r.material_type))].map((type) => [
        type,
        resources.filter((r) => r.material_type === type).length,
      ])
    ),
  };

  const handleOpenModal = (resource?: Resource) => {
    if (resource) {
      setEditingId(resource.id);
      setFormData({
        course_id: resource.course_id,
        title: resource.title,
        description: resource.description || '',
        material_type: resource.material_type,
        file_url: resource.file_url,
        file_type: resource.file_type || '',
        is_published: resource.is_published,
      });
    } else {
      setEditingId(null);
      setFormData({
        course_id: '',
        title: '',
        description: '',
        material_type: 'lecture_notes',
        file_url: '',
        file_type: '',
        is_published: true,
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.course_id || !formData.title || !formData.file_url) {
        setError('Please fill in all required fields');
        return;
      }

      const url = editingId ? `/api/teacher/resources/${editingId}` : '/api/teacher/resources';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save resource');

      setModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/teacher/resources/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete resource');
      setDeleteConfirm(null);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  if (loading || !isLoaded) {
    return (
      <Center h="100vh">
        <Stack align="center">
          <Loader size="xl" />
          <Text size="xl">{t('common.loading')}</Text>
        </Stack>
      </Center>
    );
  }

  const materialTypeLabel: Record<string, string> = {
    lecture_notes: t('resources.lectureNotes'),
    textbook: t('resources.textbook'),
    slides: t('resources.slides'),
    video: t('resources.video'),
    reference: t('resources.reference'),
    assignment: t('resources.assignment'),
  };

  return (
    <Container size="xl" py="xl">
      {error && (
        <Alert icon={<IconAlertCircle />} color="red" mb="md" title={t('common.error')}>
          {error}
        </Alert>
      )}

      <Group justify="space-between" mb="lg">
        <Title>{t('resources.title')}</Title>
        <Button leftSection={<IconPlus />} onClick={() => handleOpenModal()}>
          {t('resources.createNew')}
        </Button>
      </Group>

      {/* Stats */}
      <Grid mb="lg">
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="md" padding="lg" radius="md">
            <Text size="sm" fw={500} c="dimmed">
              {t('resources.total')}
            </Text>
            <Title order={2} mt="sm">
              {stats.total}
            </Title>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="md" padding="lg" radius="md">
            <Text size="sm" fw={500} c="dimmed">
              {t('resources.published')}
            </Text>
            <Title order={2} mt="sm">
              {stats.published}
            </Title>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Filters and Search */}
      <Paper p="md" mb="lg" radius="md" withBorder>
        <Stack gap="md">
          <Input
            placeholder={t('resources.searchPlaceholder')}
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.currentTarget.value);
              setCurrentPage(1);
            }}
          />
          <Group grow>
            <Select
              label={t('resources.filterByType')}
              placeholder={t('resources.all')}
              clearable
              value={typeFilter}
              onChange={setTypeFilter}
              data={[
                { value: 'lecture_notes', label: t('resources.lectureNotes') },
                { value: 'textbook', label: t('resources.textbook') },
                { value: 'slides', label: t('resources.slides') },
                { value: 'video', label: t('resources.video') },
                { value: 'reference', label: t('resources.reference') },
                { value: 'assignment', label: t('resources.assignment') },
              ]}
            />
            <Select
              label={t('resources.sortBy')}
              placeholder={t('common.select')}
              value={sortField}
              onChange={(value) => setSortField((value as any) || 'created_at')}
              data={[
                { value: 'title', label: t('resources.sortByTitle') },
                { value: 'created_at', label: t('resources.sortByDate') },
                { value: 'view_count', label: t('resources.sortByViews') },
              ]}
            />
            <Button
              variant="light"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
            </Button>
          </Group>
        </Stack>
      </Paper>

      {/* Resources Table */}
      {paginatedResources.length > 0 ? (
        <Paper p="md" radius="md" withBorder mb="lg">
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('resources.resourceTitle')}</Table.Th>
                <Table.Th>{t('resources.type')}</Table.Th>
                <Table.Th>{t('resources.course')}</Table.Th>
                <Table.Th>{t('resources.viewCount')}</Table.Th>
                <Table.Th>{t('resources.status')}</Table.Th>
                <Table.Th>{t('resources.action')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paginatedResources.map((resource) => (
                <Table.Tr key={resource.id}>
                  <Table.Td>{resource.title}</Table.Td>
                  <Table.Td>
                    <Badge size="sm">
                      {materialTypeLabel[resource.material_type] || resource.material_type}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {courses.find((c) => c.id === resource.course_id)?.title || t('common.unknown')}
                  </Table.Td>
                  <Table.Td>{resource.view_count}</Table.Td>
                  <Table.Td>
                    {resource.is_published ? (
                      <Badge color="green" size="sm">
                        {t('resources.published')}
                      </Badge>
                    ) : (
                      <Badge color="gray" size="sm">
                        {t('resources.unpublished')}
                      </Badge>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Group gap={0} justify="flex-end">
                      <Button
                        variant="subtle"
                        size="xs"
                        onClick={() => handleOpenModal(resource)}
                        leftSection={<IconEdit size={14} />}
                      >
                        {t('resources.edit')}
                      </Button>
                      <Button
                        variant="subtle"
                        color="red"
                        size="xs"
                        onClick={() => setDeleteConfirm(resource.id)}
                        leftSection={<IconTrash size={14} />}
                      >
                        {t('resources.delete')}
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      ) : (
        <Center py="xl">
          <Text c="dimmed">{t('resources.noResources')}</Text>
        </Center>
      )}

      {/* Pagination */}
      {filteredResources.length > itemsPerPage && (
        <Center>
          <Pagination
            value={currentPage}
            onChange={setCurrentPage}
            total={Math.ceil(filteredResources.length / itemsPerPage)}
          />
        </Center>
      )}

      {/* Create/Edit Modal */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? t('resources.editResource') : t('resources.createResource')}
      >
        <Stack gap="md">
          <Select
            label={t('resources.course')}
            placeholder={t('common.select')}
            required
            value={formData.course_id}
            onChange={(value) => setFormData({ ...formData, course_id: value || '' })}
            data={courses.map((c) => ({ value: c.id, label: c.title }))}
          />
          <TextInput
            label={t('resources.title')}
            placeholder={t('resources.titlePlaceholder')}
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.currentTarget.value })}
          />
          <Textarea
            label={t('resources.description')}
            placeholder={t('resources.descriptionPlaceholder')}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.currentTarget.value })}
          />
          <Select
            label={t('resources.type')}
            required
            value={formData.material_type}
            onChange={(value) => setFormData({ ...formData, material_type: value || 'lecture_notes' })}
            data={[
              { value: 'lecture_notes', label: t('resources.lectureNotes') },
              { value: 'textbook', label: t('resources.textbook') },
              { value: 'slides', label: t('resources.slides') },
              { value: 'video', label: t('resources.video') },
              { value: 'reference', label: t('resources.reference') },
              { value: 'assignment', label: t('resources.assignment') },
            ]}
          />
          <TextInput
            label={t('resources.fileUrl')}
            placeholder={t('resources.fileUrlPlaceholder')}
            required
            value={formData.file_url}
            onChange={(e) => setFormData({ ...formData, file_url: e.currentTarget.value })}
          />
          <TextInput
            label={t('resources.fileType')}
            placeholder={t('resources.fileTypePlaceholder')}
            value={formData.file_type}
            onChange={(e) => setFormData({ ...formData, file_type: e.currentTarget.value })}
          />
          <Checkbox
            label={t('resources.isPublished')}
            checked={formData.is_published}
            onChange={(e) => setFormData({ ...formData, is_published: e.currentTarget.checked })}
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setModalOpen(false)}>
              {t('resources.close')}
            </Button>
            <Button onClick={handleSubmit}>{t('common.save')}</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal opened={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title={t('resources.confirmDelete')}>
        <Stack gap="md">
          <Text>{t('resources.confirmDeleteMessage')}</Text>
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setDeleteConfirm(null)}>
              {t('resources.close')}
            </Button>
            <Button color="red" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              {t('resources.delete')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
