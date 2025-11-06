'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth/client-auth';
import { IconUsers, IconSearch, IconPlus, IconEdit, IconTrash, IconX } from '@tabler/icons-react';
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
} from '@mantine/core';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: 'student' | 'teacher' | 'admin';
  created_at: string;
}

interface UserFormData {
  email: string;
  password: string;
  fullName: string;
  role: 'student' | 'teacher' | 'admin';
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    fullName: '',
    role: 'student',
  });
  const [counts, setCounts] = useState({ total: 0, student: 0, teacher: 0, admin: 0 });
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    loadUsers();
  }, [router]);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, roleFilter, users]);

  const loadUsers = async () => {
    try {
      console.log('[CLIENT] Fetching users from /api/admin/users');
      const response = await fetch('/api/admin/users');
      console.log('[CLIENT] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[CLIENT] Received data:', data);
        console.log('[CLIENT] Users count:', data.users?.length);
        console.log('[CLIENT] Counts:', data.counts);
        setUsers(data.users || []);
        setCounts(data.counts || { total: 0, student: 0, teacher: 0, admin: 0 });
      } else {
        const errorData = await response.json();
        console.error('[CLIENT] Error response:', errorData);
      }
    } catch (error) {
      console.error('[CLIENT] Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(query) ||
        user.full_name?.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      password: '',
      fullName: '',
      role: 'student',
    });
    setShowModal(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      fullName: user.full_name || '',
      role: user.role,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingUser
        ? `/api/admin/users/${editingUser.id}`
        : '/api/admin/users';

      const method = editingUser ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowModal(false);
        loadUsers();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save user');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Failed to save user');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('តើអ្នកប្រាកដថាចង់លុបអ្នកប្រើប្រាស់នេះទេ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadUsers();
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
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
              <IconUsers size={32} color="var(--mantine-color-blue-6)" stroke={1.5} />
              <Title order={1} size="h2">គ្រប់គ្រងអ្នកប្រើប្រាស់</Title>
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
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <StatCard title="អ្នកប្រើប្រាស់សរុប" value={counts.total} color="blue" />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <StatCard title="សិស្ស" value={counts.student} color="green" />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <StatCard title="គ្រូបង្រៀន" value={counts.teacher} color="violet" />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <StatCard title="អ្នកគ្រប់គ្រង" value={counts.admin} color="orange" />
          </Grid.Col>
        </Grid>

        {/* Search and Filters */}
        <Paper shadow="md" p="lg" radius="md" mb="lg">
          <Group align="flex-end" wrap="wrap">
            <TextInput
              flex={1}
              placeholder="ស្វែងរកតាមឈ្មោះ រឺអ៊ីមែល..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftSection={<IconSearch size={20} />}
              styles={{ root: { minWidth: 300 } }}
            />
            <Select
              placeholder="តួនាទីទាំងអស់"
              value={roleFilter}
              onChange={(value) => setRoleFilter(value || 'all')}
              data={[
                { value: 'all', label: 'តួនាទីទាំងអស់' },
                { value: 'student', label: 'សិស្ស' },
                { value: 'teacher', label: 'គ្រូបង្រៀន' },
                { value: 'admin', label: 'អ្នកគ្រប់គ្រង' },
              ]}
            />
            <Button leftSection={<IconPlus size={16} />} onClick={handleCreate}>
              បន្ថែមអ្នកប្រើប្រាស់
            </Button>
          </Group>
        </Paper>

        {/* Users Table */}
        <Paper shadow="md" radius="md">
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ឈ្មោះ</Table.Th>
                <Table.Th>អ៊ីមែល</Table.Th>
                <Table.Th>តួនាទី</Table.Th>
                <Table.Th>កាលបរិច្ឆេទបង្កើត</Table.Th>
                <Table.Th ta="right">សកម្មភាព</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredUsers.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Center py="xl">
                      <Text c="gray.6">មិនមានអ្នកប្រើប្រាស់ទេ</Text>
                    </Center>
                  </Table.Td>
                </Table.Tr>
              ) : (
                filteredUsers.map((user) => (
                  <Table.Tr key={user.id}>
                    <Table.Td>
                      <Text fw={500}>{user.full_name || 'N/A'}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text c="gray.7">{user.email}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={
                          user.role === 'admin' ? 'orange' :
                          user.role === 'teacher' ? 'violet' :
                          'green'
                        }
                        variant="light"
                      >
                        {user.role}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text c="gray.7">{new Date(user.created_at).toLocaleDateString()}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group justify="flex-end" gap="xs">
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          onClick={() => handleEdit(user)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => handleDelete(user.id)}
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
        title={editingUser ? 'កែសម្រួលអ្នកប្រើប្រាស់' : 'បន្ថែមអ្នកប្រើប្រាស់'}
        centered
      >
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="អ៊ីមែល"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            {!editingUser && (
              <TextInput
                label="ពាក្យសម្ងាត់"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            )}
            <TextInput
              label="ឈ្មោះពេញ"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
            <Select
              label="តួនាទី"
              value={formData.role}
              onChange={(value) => setFormData({ ...formData, role: value as any })}
              data={[
                { value: 'student', label: 'សិស្ស' },
                { value: 'teacher', label: 'គ្រូបង្រៀន' },
                { value: 'admin', label: 'អ្នកគ្រប់គ្រង' },
              ]}
            />
            <Group justify="flex-end" gap="sm" mt="md">
              <Button variant="default" onClick={() => setShowModal(false)}>
                បោះបង់
              </Button>
              <Button type="submit">
                {editingUser ? 'រក្សាទុក' : 'បង្កើត'}
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
