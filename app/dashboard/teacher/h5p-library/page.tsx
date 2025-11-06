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
  SimpleGrid,
  Badge,
  ThemeIcon,
  Modal,
  TextInput,
  Table,
  ActionIcon,
  Tooltip,
  Input,
  Select,
  Tabs,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconEye,
  IconFileImport,
  IconVideo,
  IconListCheck,
  IconGitBranch,
  IconPresentation,
  IconClick,
  IconCards,
  IconTimeline,
  IconImage,
  IconEditCircle,
  IconTemplate,
} from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface H5PContent {
  h5p_id: string;
  title: string;
  content_type: H5PType;
  description: string;
  created_at: string;
  updated_at: string;
  used_in_courses: number;
}

type H5PType =
  | 'interactive_video'
  | 'quiz_mc'
  | 'branching_scenario'
  | 'presentation'
  | 'drag_drop'
  | 'flashcards'
  | 'timeline'
  | 'image_hotspots'
  | 'fill_blanks'
  | 'course_presentation';

const H5P_TYPES: { type: H5PType; name: string; description: string; icon: any; color: string; km: string }[] = [
  {
    type: 'interactive_video',
    name: 'Interactive Video',
    description: 'Embed quizzes in videos',
    icon: IconVideo,
    color: 'blue',
    km: 'វីដេអូអន្តរកម្ម',
  },
  {
    type: 'quiz_mc',
    name: 'Quiz (Multiple Choice)',
    description: 'Knowledge assessment',
    icon: IconListCheck,
    color: 'green',
    km: 'ប្រឡង',
  },
  {
    type: 'branching_scenario',
    name: 'Branching Scenario',
    description: 'Decision-making practice',
    icon: IconGitBranch,
    color: 'purple',
    km: '情景',
  },
  {
    type: 'presentation',
    name: 'Presentation (Slides)',
    description: 'Lecture/overview content',
    icon: IconPresentation,
    color: 'orange',
    km: 'បង្ហាញពិធីការ',
  },
  {
    type: 'drag_drop',
    name: 'Drag & Drop',
    description: 'Interactive learning',
    icon: IconClick,
    color: 'cyan',
    km: 'អូស & ទម្លាក់',
  },
  {
    type: 'flashcards',
    name: 'Flashcards',
    description: 'Memorization',
    icon: IconCards,
    color: 'pink',
    km: 'កាតស្វាង',
  },
  {
    type: 'timeline',
    name: 'Timeline',
    description: 'Sequence learning',
    icon: IconTimeline,
    color: 'indigo',
    km: 'ឆ្នាំ',
  },
  {
    type: 'image_hotspots',
    name: 'Image Hotspots',
    description: 'Interactive exploration',
    icon: IconImage,
    color: 'teal',
    km: 'ចំណុចក្ដៅរូបភាព',
  },
  {
    type: 'fill_blanks',
    name: 'Fill in the Blanks',
    description: 'Practice & assessment',
    icon: IconEditCircle,
    color: 'yellow',
    km: 'បំពេញលម្អិត',
  },
  {
    type: 'course_presentation',
    name: 'Course Presentation',
    description: 'Structured lessons',
    icon: IconTemplate,
    color: 'grape',
    km: 'វគ្គបង្ហាញ',
  },
];

export default function H5PLibraryPage() {
  const { language } = useTranslation();
  const router = useRouter();

  const [h5pContent, setH5pContent] = useState<H5PContent[]>([]);
  const [filteredContent, setFilteredContent] = useState<H5PContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedH5PType, setSelectedH5PType] = useState<H5PType | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [activeTab, setActiveTab] = useState<string | null>('library');

  // Mock H5P content data
  const mockH5PContent: H5PContent[] = [
    {
      h5p_id: 'h5p-001',
      title: 'Teaching Basics Video Quiz',
      content_type: 'interactive_video',
      description: 'Interactive video with embedded quizzes about teaching fundamentals',
      created_at: '2025-10-20',
      updated_at: '2025-10-22',
      used_in_courses: 2,
    },
    {
      h5p_id: 'h5p-002',
      title: 'Classroom Management Quiz',
      content_type: 'quiz_mc',
      description: 'Multiple choice assessment on classroom management strategies',
      created_at: '2025-10-15',
      updated_at: '2025-10-18',
      used_in_courses: 3,
    },
    {
      h5p_id: 'h5p-003',
      title: 'Student Behavior Scenario',
      content_type: 'branching_scenario',
      description: 'Decision-making scenario about handling student misbehavior',
      created_at: '2025-10-10',
      updated_at: '2025-10-12',
      used_in_courses: 1,
    },
    {
      h5p_id: 'h5p-004',
      title: 'Lesson Planning Presentation',
      content_type: 'presentation',
      description: 'Slide presentation on effective lesson planning',
      created_at: '2025-10-05',
      updated_at: '2025-10-08',
      used_in_courses: 2,
    },
    {
      h5p_id: 'h5p-005',
      title: 'Match Teaching Methods',
      content_type: 'drag_drop',
      description: 'Drag and drop activity matching methods to student needs',
      created_at: '2025-09-30',
      updated_at: '2025-10-01',
      used_in_courses: 1,
    },
  ];

  // Load H5P content
  useEffect(() => {
    const loadH5P = async () => {
      try {
        setLoading(true);
        // In production, replace with API call:
        // const res = await fetch('/api/teacher/h5p-library');
        // const data = await res.json();

        setH5pContent(mockH5PContent);
        setFilteredContent(mockH5PContent);
        setLoading(false);
      } catch (err) {
        console.error('Error loading H5P content:', err);
        setError(err instanceof Error ? err.message : 'Failed to load H5P content');
        setLoading(false);
      }
    };

    loadH5P();
  }, []);

  // Filter content
  useEffect(() => {
    let filtered = h5pContent;

    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (typeFilter) {
      filtered = filtered.filter((item) => item.content_type === typeFilter);
    }

    setFilteredContent(filtered);
  }, [searchQuery, typeFilter, h5pContent]);

  // Create new H5P content
  const handleCreateH5P = useCallback(async () => {
    if (!selectedH5PType || !newTitle.trim()) {
      alert(language === 'km' ? 'សូមបញ្ចូលចំណងជើង' : 'Please enter a title');
      return;
    }

    try {
      // In production, replace with API call:
      // const res = await fetch('/api/h5p/create', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ title: newTitle, content_type: selectedH5PType }),
      // });

      const newH5P: H5PContent = {
        h5p_id: `h5p-${Date.now()}`,
        title: newTitle,
        content_type: selectedH5PType,
        description: '',
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
        used_in_courses: 0,
      };

      setH5pContent([newH5P, ...h5pContent]);
      setIsCreateModalOpen(false);
      setSelectedH5PType(null);
      setNewTitle('');

      // Navigate to editor
      router.push(`/dashboard/teacher/h5p-library/${newH5P.h5p_id}/edit`);
    } catch (err) {
      console.error('Error creating H5P:', err);
      alert(err instanceof Error ? err.message : 'Failed to create H5P');
    }
  }, [selectedH5PType, newTitle, language, h5pContent, router]);

  // Delete H5P content
  const handleDeleteH5P = useCallback(
    async (h5pId: string) => {
      if (!confirm(language === 'km' ? 'តើអ្នកប្រាកដថាលុប?' : 'Are you sure?')) {
        return;
      }

      try {
        // In production, replace with API call:
        // const res = await fetch(`/api/h5p/${h5pId}`, { method: 'DELETE' });

        setH5pContent(h5pContent.filter((item) => item.h5p_id !== h5pId));
      } catch (err) {
        console.error('Error deleting H5P:', err);
        alert(err instanceof Error ? err.message : 'Failed to delete');
      }
    },
    [h5pContent, language]
  );

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

  return (
    <Container size="xl" py="xl">
      {/* Header */}
      <Group mb="xl" justify="space-between">
        <div>
          <Title order={1}>{language === 'km' ? 'ក្ខណ្ឌ H5P' : 'H5P Content Library'}</Title>
          <Text c="dimmed">
            {language === 'km'
              ? 'បង្កើត និងគ្រប់គ្រងលម្អិតអន្តរកម្ម H5P'
              : 'Create and manage interactive H5P content'}
          </Text>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          color="blue"
          size="lg"
          onClick={() => setIsCreateModalOpen(true)}
        >
          {language === 'km' ? 'បង្កើត H5P' : 'Create H5P'}
        </Button>
      </Group>

      {/* Tabs */}
      <Tabs value={activeTab} onTabChange={setActiveTab} mb="xl">
        <Tabs.List>
          <Tabs.Tab value="library">{language === 'km' ? 'ក្ខណ្ឌ' : 'My Content'} ({h5pContent.length})</Tabs.Tab>
          <Tabs.Tab value="templates">{language === 'km' ? 'ឧទាហរណ៍' : 'Templates'}</Tabs.Tab>
        </Tabs.List>

        {/* Library Tab */}
        <Tabs.Panel value="library" pt="xl">
          {/* Search and Filter */}
          <Group mb="xl" grow align="flex-end">
            <Input
              placeholder={language === 'km' ? 'ស្វាងរក' : 'Search content...'}
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
            />
            <Select
              placeholder={language === 'km' ? 'ប្រភេទ' : 'Filter by type'}
              data={H5P_TYPES.map((t) => ({
                value: t.type,
                label: language === 'km' ? t.km : t.name,
              }))}
              value={typeFilter}
              onChange={setTypeFilter}
              clearable
            />
          </Group>

          {/* Stats Cards */}
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mb="xl">
            <Card withBorder p="lg" radius="md">
              <Group justify="space-between" mb="lg">
                <Stack gap={0}>
                  <Text fw={500} size="sm" c="dimmed">
                    {language === 'km' ? 'ក្ខណ្ឌសរុប' : 'Total Content'}
                  </Text>
                  <Title order={2}>{h5pContent.length}</Title>
                </Stack>
                <ThemeIcon variant="light" size={50} radius="md" color="blue">
                  <IconTemplate size={28} />
                </ThemeIcon>
              </Group>
            </Card>

            <Card withBorder p="lg" radius="md">
              <Group justify="space-between" mb="lg">
                <Stack gap={0}>
                  <Text fw={500} size="sm" c="dimmed">
                    {language === 'km' ? 'ប្រើក្នុងវគ្គរៀន' : 'Used in Courses'}
                  </Text>
                  <Title order={2}>{h5pContent.reduce((sum, item) => sum + item.used_in_courses, 0)}</Title>
                </Stack>
                <ThemeIcon variant="light" size={50} radius="md" color="green">
                  <IconFileImport size={28} />
                </ThemeIcon>
              </Group>
            </Card>

            <Card withBorder p="lg" radius="md">
              <Group justify="space-between" mb="lg">
                <Stack gap={0}>
                  <Text fw={500} size="sm" c="dimmed">
                    {language === 'km' ? 'ប្រភេទសរុប' : 'Content Types'}
                  </Text>
                  <Title order={2}>{H5P_TYPES.length}</Title>
                </Stack>
                <ThemeIcon variant="light" size={50} radius="md" color="purple">
                  <IconListCheck size={28} />
                </ThemeIcon>
              </Group>
            </Card>
          </SimpleGrid>

          {/* Content List */}
          <Card withBorder radius="md" p="lg">
            {filteredContent.length === 0 ? (
              <Center p="xl">
                <Stack align="center" gap="sm">
                  <Text c="dimmed">{language === 'km' ? 'មិនមាននេះទេ' : 'No content yet'}</Text>
                  <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
                    {language === 'km' ? 'បង្កើតទីមួយ' : 'Create your first H5P'}
                  </Button>
                </Stack>
              </Center>
            ) : (
              <Table striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{language === 'km' ? 'ចំណងជើង' : 'Title'}</Table.Th>
                    <Table.Th>{language === 'km' ? 'ប្រភេទ' : 'Type'}</Table.Th>
                    <Table.Th>{language === 'km' ? 'បង្កើត' : 'Created'}</Table.Th>
                    <Table.Th>{language === 'km' ? 'ប្រើក្នុង' : 'Used in'}</Table.Th>
                    <Table.Th>{language === 'km' ? 'សកម្មភាព' : 'Actions'}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredContent.map((item) => {
                    const h5pType = H5P_TYPES.find((t) => t.type === item.content_type);
                    return (
                      <Table.Tr key={item.h5p_id}>
                        <Table.Td>
                          <Stack gap={0}>
                            <Text fw={500} size="sm">
                              {item.title}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {item.description}
                            </Text>
                          </Stack>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={h5pType?.color || 'gray'}>
                            {language === 'km' ? h5pType?.km : h5pType?.name}
                          </Badge>
                        </Table.Td>
                        <Table.Td>{item.created_at}</Table.Td>
                        <Table.Td>
                          <Badge>{item.used_in_courses} courses</Badge>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Tooltip label={language === 'km' ? 'មើល' : 'View'}>
                              <ActionIcon
                                size="sm"
                                variant="light"
                                color="blue"
                                onClick={() => router.push(`/dashboard/teacher/h5p-library/${item.h5p_id}`)}
                              >
                                <IconEye size={16} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label={language === 'km' ? 'កែប្រែ' : 'Edit'}>
                              <ActionIcon
                                size="sm"
                                variant="light"
                                color="blue"
                                onClick={() => router.push(`/dashboard/teacher/h5p-library/${item.h5p_id}/edit`)}
                              >
                                <IconEdit size={16} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label={language === 'km' ? 'លុប' : 'Delete'}>
                              <ActionIcon
                                size="sm"
                                variant="light"
                                color="red"
                                onClick={() => handleDeleteH5P(item.h5p_id)}
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            )}
          </Card>
        </Tabs.Panel>

        {/* Templates Tab */}
        <Tabs.Panel value="templates" pt="xl">
          <SimpleGrid cols={{ base: 1, sm: 2, md: 5 }} spacing="lg">
            {H5P_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <Card key={type.type} withBorder radius="md" p="lg" className="hover:shadow-md transition-shadow">
                  <Card.Section withBorder inheritPadding py="md">
                    <Group justify="space-between">
                      <ThemeIcon variant="light" size="lg" radius="md" color={type.color}>
                        <Icon size={24} />
                      </ThemeIcon>
                    </Group>
                  </Card.Section>

                  <Stack gap="sm">
                    <div>
                      <Title order={4}>{language === 'km' ? type.km : type.name}</Title>
                      <Text size="sm" c="dimmed" mt="xs">
                        {type.description}
                      </Text>
                    </div>
                    <Button
                      size="sm"
                      variant="light"
                      onClick={() => {
                        setSelectedH5PType(type.type);
                        setIsCreateModalOpen(true);
                      }}
                    >
                      {language === 'km' ? 'បង្កើត' : 'Create'}
                    </Button>
                  </Stack>
                </Card>
              );
            })}
          </SimpleGrid>
        </Tabs.Panel>
      </Tabs>

      {/* Create Modal */}
      <Modal
        opened={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedH5PType(null);
          setNewTitle('');
        }}
        title={language === 'km' ? 'បង្កើត H5P ថ្មី' : 'Create New H5P Content'}
        size="lg"
      >
        <Stack gap="md">
          <Select
            label={language === 'km' ? 'ជ្រើសរើលប្រភេទ' : 'Select Type'}
            placeholder={language === 'km' ? 'ជ្រើសរើលប្រភេទលម្អិត H5P' : 'Choose content type'}
            data={H5P_TYPES.map((t) => ({
              value: t.type,
              label: language === 'km' ? t.km : t.name,
            }))}
            value={selectedH5PType}
            onChange={(value) => setSelectedH5PType((value as H5PType) || null)}
            searchable
          />

          {selectedH5PType && (
            <Card withBorder p="md" radius="md" bg="blue.0">
              {(() => {
                const type = H5P_TYPES.find((t) => t.type === selectedH5PType);
                const Icon = type?.icon || IconTemplate;
                return (
                  <Group>
                    <ThemeIcon variant="light" size="lg" color={type?.color || 'gray'}>
                      <Icon size={24} />
                    </ThemeIcon>
                    <Stack gap={0}>
                      <Text fw={500}>{language === 'km' ? type?.km : type?.name}</Text>
                      <Text size="sm" c="dimmed">
                        {type?.description}
                      </Text>
                    </Stack>
                  </Group>
                );
              })()}
            </Card>
          )}

          <TextInput
            label={language === 'km' ? 'ចំណងជើង' : 'Content Title'}
            placeholder={language === 'km' ? 'ឧទាហរណ៍៍: មេរៀនរបស់ខ្ញុំ' : 'e.g., My Interactive Video'}
            value={newTitle}
            onChange={(e) => setNewTitle(e.currentTarget.value)}
          />

          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => {
                setIsCreateModalOpen(false);
                setSelectedH5PType(null);
                setNewTitle('');
              }}
            >
              {language === 'km' ? 'បោះបង់' : 'Cancel'}
            </Button>
            <Button onClick={handleCreateH5P} disabled={!selectedH5PType || !newTitle.trim()}>
              {language === 'km' ? 'បង្កើត' : 'Create'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
