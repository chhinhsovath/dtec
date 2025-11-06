'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth/client-auth';
import { IconSearch, IconUsers, IconFilter, IconDownload, IconUserPlus } from '@tabler/icons-react';
import { Container, Title, Group, Button, TextInput, Paper, Table, Avatar, Badge, Loader, Center, Stack, Text, Grid, Card, ActionIcon, Flex, Box } from '@mantine/core';

interface Student {
  id: string;
  user_id: string;
  student_number: string;
  enrollment_date: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    role: string;
  };
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadStudents = async () => {
      const session = getSession();

      if (!session) {
        router.push('/auth/login');
        return;
      }

      // Check user role
      if (session.role !== 'teacher' && session.role !== 'admin') {
        router.push('/dashboard');
        return;
      }

      setUserRole(session.role);

      // Load students from API
      try {
        const response = await fetch('/api/students');
        if (response.ok) {
          const data = await response.json();
          setStudents(data.students || []);
          setFilteredStudents(data.students || []);
        }
      } catch (error) {
        console.error('Error loading students:', error);
      }

      setLoading(false);
    };

    loadStudents();
  }, [router]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStudents(students);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = students.filter((student) => {
        const fullName = `${student.profiles.first_name} ${student.profiles.last_name}`.toLowerCase();
        const studentNumber = student.student_number.toLowerCase();
        return fullName.includes(query) || studentNumber.includes(query);
      });
      setFilteredStudents(filtered);
    }
  }, [searchQuery, students]);

  const exportToCSV = () => {
    const headers = ['Student Number', 'First Name', 'Last Name', 'Enrollment Date'];
    const rows = filteredStudents.map(student => [
      student.student_number,
      student.profiles.first_name || '',
      student.profiles.last_name || '',
      new Date(student.enrollment_date).toLocaleDateString(),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const thisMonthCount = students.filter(s => {
    const enrollDate = new Date(s.enrollment_date);
    const now = new Date();
    return enrollDate.getMonth() === now.getMonth() &&
           enrollDate.getFullYear() === now.getFullYear();
  }).length;

  if (loading) {
    return (
      <Center h="100vh">
        <Stack align="center">
          <Loader size="xl" />
          <Text size="xl">កំពុងផ្ទុក...</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Box bg="gray.0" mih="100vh">
      {/* Header */}
      <Paper shadow="sm" p="md" mb="lg">
        <Container size="xl">
          <Group justify="space-between">
            <Group>
              <IconUsers size={32} color="var(--mantine-color-blue-6)" />
              <Title order={1}>បញ្ជីសិស្ស</Title>
            </Group>
            <Button variant="subtle" onClick={() => router.back()}>
              ← ត្រលប់ទៅផ្ទាំងគ្រប់គ្រង
            </Button>
          </Group>
        </Container>
      </Paper>

      {/* Main Content */}
      <Container size="xl" py="lg">
        {/* Stats */}
        <Grid mb="xl">
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card shadow="md" padding="lg">
              <Group justify="space-between">
                <Box>
                  <Text size="sm" fw={500} c="dimmed">សិស្សសរុប</Text>
                  <Title order={2} mt="sm">{students.length}</Title>
                </Box>
                <IconUsers size={48} color="var(--mantine-color-blue-6)" opacity={0.3} />
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card shadow="md" padding="lg">
              <Group justify="space-between">
                <Box>
                  <Text size="sm" fw={500} c="dimmed">សិស្សសកម្ម</Text>
                  <Title order={2} mt="sm">{students.length}</Title>
                </Box>
                <IconUsers size={48} color="var(--mantine-color-green-6)" opacity={0.3} />
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card shadow="md" padding="lg">
              <Group justify="space-between">
                <Box>
                  <Text size="sm" fw={500} c="dimmed">ថ្មីខែនេះ</Text>
                  <Title order={2} mt="sm">{thisMonthCount}</Title>
                </Box>
                <IconUserPlus size={48} color="var(--mantine-color-violet-6)" opacity={0.3} />
              </Group>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Search and Filters */}
        <Paper shadow="md" p="md" mb="md">
          <Group grow>
            <TextInput
              placeholder="ស្វែងរកតាមឈ្មោះ រឺលេខសិស្ស..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftSection={<IconSearch size={20} />}
            />
            <Button variant="light" leftSection={<IconFilter size={16} />}>
              តម្រង
            </Button>
            <Button variant="light" onClick={exportToCSV} leftSection={<IconDownload size={16} />}>
              នាំចេញ CSV
            </Button>
          </Group>
        </Paper>

        {/* Students Table */}
        <Paper shadow="md">
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>លេខសិស្ស</Table.Th>
                <Table.Th>ឈ្មោះ</Table.Th>
                <Table.Th>កាលបរិច្ឆេទចុះឈ្មោះ</Table.Th>
                <Table.Th>ស្ថានភាព</Table.Th>
                <Table.Th ta="right">សកម្មភាព</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredStudents.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Center py="xl">
                      <Text c="dimmed">
                        {searchQuery ? 'រកមិនឃើើញសិស្សដែលត្រូវនឹងការស្វែងរករបស់អ្នកទេ។' : 'មិនទាន់មានសិស្សចុះឈ្មោះនៅឡើយទេ។'}
                      </Text>
                    </Center>
                  </Table.Td>
                </Table.Tr>
              ) : (
                filteredStudents.map((student) => (
                  <Table.Tr key={student.id}>
                    <Table.Td>
                      <Text ff="monospace" size="sm">
                        {student.student_number}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group>
                        <Avatar color="blue" radius="xl">
                          {student.profiles.first_name?.charAt(0)}
                          {student.profiles.last_name?.charAt(0)}
                        </Avatar>
                        <Text size="sm" fw={500}>
                          {student.profiles.first_name} {student.profiles.last_name}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {new Date(student.enrollment_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color="green" variant="light">
                        សកម្ម
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group justify="flex-end" gap="sm">
                        <Button variant="subtle" size="xs" color="blue">
                          មើល
                        </Button>
                        <Button variant="subtle" size="xs" color="gray">
                          កែសម្រួល
                        </Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Paper>

        {/* Pagination */}
        {filteredStudents.length > 0 && (
          <Group justify="space-between" mt="md">
            <Text size="sm" c="dimmed">
              កំពុងបង្ហាញ <Text span fw={500}>{filteredStudents.length}</Text> នៃ{' '}
              <Text span fw={500}>{students.length}</Text> សិស្ស
            </Text>
            <Group gap="xs">
              <Button variant="light" size="sm" disabled>
                មុន
              </Button>
              <Button variant="light" size="sm" disabled>
                បន្ទាប់
              </Button>
            </Group>
          </Group>
        )}
      </Container>
    </Box>
  );
}
