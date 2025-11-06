'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth/client-auth';
import { IconBook, IconSearch, IconPlus, IconEdit, IconTrash, IconX } from '@tabler/icons-react';
import {
  Container,
  Title,
  Group,
  Button,
  Stack,
  Paper,
  Text,
  Grid,
  Center,
  Loader,
  TextInput,
  Select,
  Table,
  Badge,
  Modal,
  ActionIcon,
  Textarea,
  NumberInput,
} from '@mantine/core';

interface Course {
  id: string;
  title: string;
  description: string | null;
  credits: number;
  teacher_id: string | null;
  teacher_name: string | null;
  status: string;
  enrollment_count: number;
  created_at: string;
}

interface Teacher {
  user_id: string;
  full_name: string;
}

interface CourseFormData {
  title: string;
  description: string;
  credits: number;
  teacherId: string;
  status: 'active' | 'archived';
}

export default function CoursesManagementPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    credits: 3,
    teacherId: '',
    status: 'active',
  });
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    loadCourses();
    loadTeachers();
  }, [router]);

  useEffect(() => {
    filterCourses();
  }, [searchQuery, statusFilter, courses]);

  const loadCourses = async () => {
    try {
      const response = await fetch('/api/admin/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTeachers = async () => {
    try {
      const response = await fetch('/api/admin/users?role=teacher');
      if (response.ok) {
        const data = await response.json();
        setTeachers(data.users);
      }
    } catch (error) {
      console.error('Error loading teachers:', error);
    }
  };

  const filterCourses = () => {
    let filtered = courses;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(course => course.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(query) ||
        course.description?.toLowerCase().includes(query)
      );
    }

    setFilteredCourses(filtered);
  };

  const handleCreate = () => {
    setEditingCourse(null);
    setFormData({
      title: '',
      description: '',
      credits: 3,
      teacherId: '',
      status: 'active',
    });
    setShowModal(true);
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description || '',
      credits: course.credits,
      teacherId: course.teacher_id || '',
      status: course.status as 'active' | 'archived',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingCourse
        ? `/api/admin/courses/${editingCourse.id}`
        : '/api/admin/courses';

      const method = editingCourse ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowModal(false);
        loadCourses();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save course');
      }
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Failed to save course');
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm('តើអ្នកប្រាកដថាចង់លុបវគ្គសិក្សានេះទេ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadCourses();
      } else {
        alert('Failed to delete course');
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Failed to delete course');
    }
  };

  if (loading) {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text size="xl">កំពុងផ្ទុក...</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack gap={0} style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <Paper shadow="xs" p="md" radius={0}>
        <Container size="xl">
          <Group justify="space-between" align="center">
            <Group gap="sm">
              <IconBook size={32} color="var(--mantine-color-blue-6)" stroke={1.5} />
              <Title order={1} size="h2">គ្រប់គ្រងវគ្គសិក្សា</Title>
            </Group>
            <Button variant="subtle" onClick={() => router.push('/dashboard/admin')}>
              ← ត្រលប់ទៅផ្ទាំងគ្រប់គ្រង
            </Button>
          </Group>
        </Container>
      </Paper>

      {/* Main Content */}
      <Container size="xl" py="xl">
        {/* Stats */}
        <Grid mb="xl">
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <StatCard title="វគ្គសិក្សាសរុប" value={courses.length} color="blue" />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <StatCard title="វគ្គសកម្ម" value={courses.filter(c => c.status === 'active').length} color="green" />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <StatCard title="ការចុះឈ្មោះសរុប" value={courses.reduce((sum, c) => sum + c.enrollment_count, 0)} color="violet" />
          </Grid.Col>
        </Grid>

        {/* Search and Filters */}
        <Paper shadow="md" p="lg" radius="md" mb="lg">
          <Group align="flex-end" wrap="wrap">
            <TextInput
              flex={1}
              placeholder="ស្វែងរកវគ្គសិក្សា..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftSection={<IconSearch size={20} />}
              styles={{ root: { minWidth: 300 } }}
            />
            <Select
              placeholder="ស្ថានភាពទាំងអស់"
              value={statusFilter}
              onChange={(value) => setStatusFilter(value || 'all')}
              data={[
                { value: 'all', label: 'ស្ថានភាពទាំងអស់' },
                { value: 'active', label: 'សកម្ម' },
                { value: 'archived', label: 'បានរក្សាទុក' },
              ]}
            />
            <Button leftSection={<IconPlus size={16} />} onClick={handleCreate}>
              បន្ថែមវគ្គសិក្សា
            </Button>
          </Group>
        </Paper>

        {/* Courses Table */}
        <Paper shadow="md" radius="md">
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ចំណងជើង</Table.Th>
                <Table.Th>គ្រូបង្រៀន</Table.Th>
                <Table.Th>ក្រេឌីត</Table.Th>
                <Table.Th>ការចុះឈ្មោះ</Table.Th>
                <Table.Th>ស្ថានភាព</Table.Th>
                <Table.Th ta="right">សកម្មភាព</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredCourses.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Center py="xl">
                      <Text c="gray.6">មិនមានវគ្គសិក្សាទេ</Text>
                    </Center>
                  </Table.Td>
                </Table.Tr>
              ) : (
                filteredCourses.map((course) => (
                  <Table.Tr key={course.id}>
                    <Table.Td>
                      <div>
                        <Text fw={500}>{course.title}</Text>
                        <Text size="sm" c="gray.6">{course.description}</Text>
                      </div>
                    </Table.Td>
                    <Table.Td>
                      <Text c="gray.7">{course.teacher_name || 'មិនទាន់កំណត់'}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text c="gray.7">{course.credits}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text c="gray.7">{course.enrollment_count}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={course.status === 'active' ? 'green' : 'gray'}
                        variant="light"
                      >
                        {course.status === 'active' ? 'សកម្ម' : 'បានរក្សាទុក'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group justify="flex-end" gap="xs">
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          onClick={() => handleEdit(course)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => handleDelete(course.id)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Paper>
      </Container>

      {/* Modal */}
      <Modal
        opened={showModal}
        onClose={() => setShowModal(false)}
        title={editingCourse ? 'កែសម្រួលវគ្គសិក្សា' : 'បន្ថែមវគ្គសិក្សា'}
        centered
        size="md"
      >
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="ចំណងជើង"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <Textarea
              label="ការពិពណ៌នា"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
            <NumberInput
              label="ក្រេឌីត"
              required
              min={1}
              max={10}
              value={formData.credits}
              onChange={(value) => setFormData({ ...formData, credits: Number(value) || 3 })}
            />
            <Select
              label="គ្រូបង្រៀន"
              placeholder="មិនទាន់កំណត់"
              value={formData.teacherId}
              onChange={(value) => setFormData({ ...formData, teacherId: value || '' })}
              data={[
                { value: '', label: 'មិនទាន់កំណត់' },
                ...teachers.map((teacher) => ({
                  value: teacher.user_id,
                  label: teacher.full_name,
                }))
              ]}
            />
            <Select
              label="ស្ថានភាព"
              value={formData.status}
              onChange={(value) => setFormData({ ...formData, status: value as any })}
              data={[
                { value: 'active', label: 'សកម្ម' },
                { value: 'archived', label: 'បានរក្សាទុក' },
              ]}
            />
            <Group justify="flex-end" gap="sm" mt="md">
              <Button variant="default" onClick={() => setShowModal(false)}>
                បោះបង់
              </Button>
              <Button type="submit">
                {editingCourse ? 'រក្សាទុក' : 'បង្កើត'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}

function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  return (
    <Paper bg={`${color}.0`} p="lg" radius="md">
      <Text size="sm" fw={500} c="gray.7" opacity={0.8}>{title}</Text>
      <Text size="2rem" fw={700} c={`${color}.6`} mt="xs">{value}</Text>
    </Paper>
  );
}
