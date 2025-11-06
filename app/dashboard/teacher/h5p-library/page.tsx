'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Title,
  Button,
  Group,
  Stack,
  Table,
  Modal,
  TextInput,
  Select,
  Textarea,
  Switch,
  Badge,
  ActionIcon,
  Tooltip,
  Card,
  SimpleGrid,
  Text,
  Loader,
  Center,
  Alert,
  Tabs,
  Code,
  Grid
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconEye,
  IconAlertCircle,
  IconCheck
} from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface H5PContent {
  id: string;
  title: string;
  description?: string;
  h5p_type: string;
  h5p_json: any;
  is_published: boolean;
  is_reusable: boolean;
  usage_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export default function H5PLibraryPage() {
  const { t, isLoaded } = useTranslation();

  // State management
  const [h5pContent, setH5PContent] = useState<H5PContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<H5PContent | null>(null);
  const [savingContent, setSavingContent] = useState(false);
  const [deletingContent, setDeletingContent] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<H5PContent | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    h5p_type: 'quiz',
    h5p_json: '{}',
    is_published: true,
    is_reusable: true
  });

  // Fetch H5P content
  useEffect(() => {
    const fetchH5PContent = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('/api/teacher/h5p-content', {
          headers: { 'x-teacher-id': 'teacher-123' }
        });

        if (!res.ok) throw new Error('Failed to fetch H5P content');
        const data = await res.json();
        setH5PContent(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded) {
      fetchH5PContent();
    }
  }, [isLoaded]);

  // Handle open modal for creating new content
  const handleNewContent = () => {
    setEditingContent(null);
    setFormData({
      title: '',
      description: '',
      h5p_type: 'quiz',
      h5p_json: '{}',
      is_published: true,
      is_reusable: true
    });
    setModalOpen(true);
  };

  // Handle edit content
  const handleEditContent = (content: H5PContent) => {
    setEditingContent(content);
    setFormData({
      title: content.title,
      description: content.description || '',
      h5p_type: content.h5p_type,
      h5p_json: JSON.stringify(content.h5p_json, null, 2),
      is_published: content.is_published,
      is_reusable: content.is_reusable
    });
    setModalOpen(true);
  };

  // Handle save content
  const handleSaveContent = async () => {
    try {
      setSavingContent(true);
      setError(null);

      if (!formData.title.trim()) {
        setError(t('h5p.contentTitlePlaceholder'));
        return;
      }

      // Validate JSON
      let h5pJson;
      try {
        h5pJson = JSON.parse(formData.h5p_json);
      } catch (e) {
        setError('Invalid H5P JSON format');
        return;
      }

      const method = editingContent ? 'PUT' : 'POST';
      const url = editingContent
        ? `/api/teacher/h5p-content/${editingContent.id}`
        : '/api/teacher/h5p-content';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-teacher-id': 'teacher-123'
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          h5pType: formData.h5p_type,
          h5pJson: h5pJson,
          isPublished: formData.is_published,
          isReusable: formData.is_reusable
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save H5P content');
      }

      // Refresh content
      const res = await fetch('/api/teacher/h5p-content', {
        headers: { 'x-teacher-id': 'teacher-123' }
      });

      if (res.ok) {
        const data = await res.json();
        setH5PContent(data.data || []);
      }

      setModalOpen(false);
      setEditingContent(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSavingContent(false);
    }
  };

  // Handle delete content
  const handleDeleteContent = async (contentId: string) => {
    if (!confirm(t('h5p.confirmDelete'))) return;

    try {
      setDeletingContent(contentId);
      const response = await fetch(`/api/teacher/h5p-content/${contentId}`, {
        method: 'DELETE',
        headers: { 'x-teacher-id': 'teacher-123' }
      });

      if (!response.ok) {
        throw new Error('Failed to delete H5P content');
      }

      setH5PContent(h5pContent.filter((c) => c.id !== contentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setDeletingContent(null);
    }
  };

  if (!isLoaded) {
    return (
      <Center minH="100vh">
        <Loader />
      </Center>
    );
  }

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <Center minH={400}>
          <Loader />
        </Center>
      </Container>
    );
  }

  const totalUsage = h5pContent.reduce((sum, c) => sum + c.usage_count, 0);
  const publishedCount = h5pContent.filter((c) => c.is_published).length;

  return (
    <Container size="lg" py="xl">
      {/* Header */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2}>{t('h5p.contentLibrary')}</Title>
          <Text size="sm" c="dimmed">
            {t('h5p.createContent')}
          </Text>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={handleNewContent}
          size="md"
        >
          {t('h5p.createContent')}
        </Button>
      </Group>

      {/* Error message */}
      {error && (
        <Alert
          icon={<IconAlertCircle />}
          title={t('common.error')}
          color="red"
          mb="md"
          withCloseButton
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Stats */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
        <Card withBorder padding="lg" radius="md">
          <Stack gap={8}>
            <Text size="sm" c="dimmed" fw={500}>
              {t('h5p.title')}
            </Text>
            <Text size="xl" fw="bold">
              {h5pContent.length}
            </Text>
          </Stack>
        </Card>
        <Card withBorder padding="lg" radius="md">
          <Stack gap={8}>
            <Text size="sm" c="dimmed" fw={500}>
              {t('h5p.isPublished')}
            </Text>
            <Text size="xl" fw="bold">
              {publishedCount}
            </Text>
          </Stack>
        </Card>
        <Card withBorder padding="lg" radius="md">
          <Stack gap={8}>
            <Text size="sm" c="dimmed" fw={500}>
              {t('h5p.usageCount')}
            </Text>
            <Text size="xl" fw="bold">
              {totalUsage}
            </Text>
          </Stack>
        </Card>
      </SimpleGrid>

      {/* H5P Content table */}
      <Paper withBorder radius="md" overflow="hidden">
        {h5pContent.length === 0 ? (
          <Center p="xl" minH={300}>
            <Stack align="center" gap="md">
              <Text c="dimmed" size="lg">
                {t('h5p.noContent')}
              </Text>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={handleNewContent}
              >
                {t('h5p.createContent')}
              </Button>
            </Stack>
          </Center>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('h5p.contentTitle')}</Table.Th>
                <Table.Th>{t('h5p.contentType')}</Table.Th>
                <Table.Th w={80} ta="center">
                  {t('h5p.usageCount')}
                </Table.Th>
                <Table.Th w={100} ta="center">
                  {t('common.status')}
                </Table.Th>
                <Table.Th w={150} ta="center">
                  {t('common.actions')}
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {h5pContent.map((content) => (
                <Table.Tr key={content.id}>
                  <Table.Td>
                    <Tooltip label={content.description} multiline>
                      <Text size="sm" truncate maw={300}>
                        {content.title}
                      </Text>
                    </Tooltip>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" size="sm">
                      {content.h5p_type}
                    </Badge>
                  </Table.Td>
                  <Table.Td ta="center">{content.usage_count}</Table.Td>
                  <Table.Td ta="center">
                    <Badge
                      size="sm"
                      variant="filled"
                      color={content.is_published ? 'blue' : 'gray'}
                    >
                      {content.is_published ? t('h5p.isPublished') : 'Draft'}
                    </Badge>
                  </Table.Td>
                  <Table.Td ta="center">
                    <Group gap={4} justify="center">
                      <Tooltip label={t('common.view')}>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="green"
                          onClick={() => {
                            setPreviewContent(content);
                            setPreviewModalOpen(true);
                          }}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label={t('common.edit')}>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="blue"
                          onClick={() => handleEditContent(content)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label={t('common.delete')}>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="red"
                          loading={deletingContent === content.id}
                          onClick={() => handleDeleteContent(content.id)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      {/* Create/Edit H5P Content Modal */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingContent
            ? t('h5p.editContent')
            : t('h5p.createContent')
        }
        size="lg"
      >
        <Stack gap="md">
          {/* Title */}
          <TextInput
            label={t('h5p.contentTitle')}
            placeholder={t('h5p.contentTitlePlaceholder')}
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.currentTarget.value })
            }
            required
          />

          {/* Description */}
          <Textarea
            label={t('h5p.description')}
            placeholder={t('h5p.descriptionPlaceholder')}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.currentTarget.value })
            }
            rows={3}
          />

          {/* H5P Type */}
          <Select
            label={t('h5p.contentType')}
            value={formData.h5p_type}
            onChange={(value) => {
              if (value) {
                setFormData({ ...formData, h5p_type: value });
              }
            }}
            data={[
              { value: 'quiz', label: t('h5p.contentTypes.quiz') },
              {
                value: 'interactive_video',
                label: t('h5p.contentTypes.interactive_video')
              },
              {
                value: 'drag_and_drop',
                label: t('h5p.contentTypes.drag_and_drop')
              },
              {
                value: 'memory_game',
                label: t('h5p.contentTypes.memory_game')
              },
              {
                value: 'timeline',
                label: t('h5p.contentTypes.timeline')
              }
            ]}
          />

          {/* H5P JSON */}
          <Textarea
            label={t('h5p.h5pJson')}
            placeholder={t('h5p.h5pJsonPlaceholder')}
            value={formData.h5p_json}
            onChange={(e) =>
              setFormData({ ...formData, h5p_json: e.currentTarget.value })
            }
            rows={6}
            fontFamily="monospace"
            styles={{ input: { fontFamily: 'monospace' } }}
          />

          {/* Switches */}
          <Switch
            label={t('h5p.isPublished')}
            checked={formData.is_published}
            onChange={(e) =>
              setFormData({
                ...formData,
                is_published: e.currentTarget.checked
              })
            }
          />

          <Switch
            label={t('h5p.isReusable')}
            checked={formData.is_reusable}
            onChange={(e) =>
              setFormData({
                ...formData,
                is_reusable: e.currentTarget.checked
              })
            }
          />

          {/* Action buttons */}
          <Group justify="flex-end" mt="lg">
            <Button
              variant="default"
              onClick={() => setModalOpen(false)}
              disabled={savingContent}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSaveContent}
              loading={savingContent}
              leftSection={<IconCheck size={16} />}
            >
              {t('common.save')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Preview H5P Content Modal */}
      <Modal
        opened={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title={previewContent?.title}
        size="xl"
      >
        {previewContent && (
          <Tabs defaultValue="info">
            <Tabs.List>
              <Tabs.Tab value="info">{t('common.status')}</Tabs.Tab>
              <Tabs.Tab value="json">JSON</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="info" pt="md">
              <Stack gap="md">
                <div>
                  <Text fw={500} mb={4}>
                    {t('h5p.description')}
                  </Text>
                  <Text size="sm">{previewContent.description}</Text>
                </div>

                <Grid>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Text fw={500} mb={4}>
                      {t('h5p.contentType')}
                    </Text>
                    <Badge>{previewContent.h5p_type}</Badge>
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Text fw={500} mb={4}>
                      {t('h5p.usageCount')}
                    </Text>
                    <Text size="sm">{previewContent.usage_count}</Text>
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Text fw={500} mb={4}>
                      {t('h5p.isPublished')}
                    </Text>
                    <Badge color={previewContent.is_published ? 'blue' : 'gray'}>
                      {previewContent.is_published ? 'Yes' : 'No'}
                    </Badge>
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Text fw={500} mb={4}>
                      {t('h5p.isReusable')}
                    </Text>
                    <Badge color={previewContent.is_reusable ? 'blue' : 'gray'}>
                      {previewContent.is_reusable ? 'Yes' : 'No'}
                    </Badge>
                  </Grid.Col>
                </Grid>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="json" pt="md">
              <Code block language="json">
                {JSON.stringify(previewContent.h5p_json, null, 2)}
              </Code>
            </Tabs.Panel>
          </Tabs>
        )}
      </Modal>
    </Container>
  );
}
