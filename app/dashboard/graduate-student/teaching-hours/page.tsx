'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Title,
  Text,
  Card,
  Badge,
  Loader,
  Center,
  Stack,
  Group,
  ThemeIcon,
  Alert,
  Button,
  Table,
  Modal,
  SimpleGrid,
  RingProgress,
  Progress,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconAlertCircle,
  IconClock,
  IconCalendar,
  IconFileText,
  IconCheck,
} from '@tabler/icons-react';
import { getSession } from '@/lib/auth/client-auth';

interface TeachingHourLog {
  log_id: string;
  hours_logged: number;
  activity_date: string;
  notes: string;
  created_at: string;
}

export default function TeachingHoursPage() {
  const [logs, setLogs] = useState<TeachingHourLog[]>([]);
  const [totals, setTotals] = useState<{ total_hours: number; log_entries: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<TeachingHourLog | null>(null);
  const [modalOpened, setModalOpened] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        const session = getSession();

        if (!session) {
          router.push('/auth/login');
          return;
        }

        if (session.role !== 'student') {
          router.push(`/dashboard/${session.role}`);
          return;
        }

        // Fetch practicum data which includes logs
        const res = await fetch('/api/graduate-student/practicum');
        if (!res.ok) {
          throw new Error('Failed to fetch teaching hours');
        }

        const result = await res.json();
        const practicumData = result.data;

        setTotals(practicumData.teachingHours);
        // In a real scenario, we'd fetch logs separately
        // For now, we'll create mock data based on the API structure
        setLogs([]);
        setLoading(false);
      } catch (err) {
        console.error('Error loading teaching hours:', err);
        setError(err instanceof Error ? err.message : 'Failed to load teaching hours');
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleViewLog = (log: TeachingHourLog) => {
    setSelectedLog(log);
    setModalOpened(true);
  };

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

  const TARGET_HOURS = 120;
  const totalHours = totals?.total_hours || 0;
  const percentage = (totalHours / TARGET_HOURS) * 100;

  return (
    <Container size="xl" py="xl">
      {/* Header */}
      <Group mb="xl">
        <Button
          variant="default"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => router.back()}
        >
          Back
        </Button>
        <div style={{ flex: 1 }}>
          <Title order={1}>Teaching Hours Log / ម៉ោងបង្រៀន</Title>
          <Text c="dimmed">Track your teaching practice hours throughout the practicum</Text>
        </div>
      </Group>

      {/* Overall Summary */}
      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg" mb="xl">
        {/* Total Hours Card */}
        <Card withBorder p="lg" radius="md">
          <Group justify="space-between" mb="lg">
            <Stack gap={0}>
              <Text fw={500} c="dimmed" size="sm">
                Total Hours Logged
              </Text>
              <Title order={2}>{totalHours} hours</Title>
            </Stack>
            <ThemeIcon variant="light" size={50} radius="md" color="blue">
              <IconClock size={28} color="blue" />
            </ThemeIcon>
          </Group>
          <Progress
            value={Math.min(percentage, 100)}
            color={percentage >= 100 ? 'teal' : percentage >= 80 ? 'yellow' : 'orange'}
            size="md"
            radius="md"
          />
          <Text size="sm" c="dimmed" mt="xs">
            Target: {TARGET_HOURS} hours
          </Text>
        </Card>

        {/* Progress Ring */}
        <Card withBorder p="lg" radius="md">
          <Group justify="center" mb="lg">
            <RingProgress
              sections={[{ value: Math.min(percentage, 100), color: percentage >= 100 ? 'teal' : 'blue' }]}
              label={
                <Stack gap={0}>
                  <Text fw={700} ta="center">{Math.min(percentage, 100).toFixed(0)}%</Text>
                  <Text size="xs" c="dimmed" ta="center">
                    Complete
                  </Text>
                </Stack>
              }
              size={120}
              thickness={8}
            />
          </Group>
          {percentage >= 100 && (
            <Alert icon={<IconCheck />} color="teal" title="Target Reached!">
              You have met the minimum teaching hours requirement!
            </Alert>
          )}
        </Card>

        {/* Statistics */}
        <Card withBorder p="lg" radius="md">
          <Stack gap="md">
            <div>
              <Text fw={500} size="sm" c="dimmed" mb="xs">
                Total Entries
              </Text>
              <Title order={3}>{totals?.log_entries || 0}</Title>
            </div>
            <div>
              <Text fw={500} size="sm" c="dimmed" mb="xs">
                Average per Entry
              </Text>
              <Title order={3}>
                {totals && totals.log_entries > 0
                  ? (totals.total_hours / totals.log_entries).toFixed(1)
                  : 0}
                h
              </Title>
            </div>
            <div>
              <Text fw={500} size="sm" c="dimmed" mb="xs">
                Hours Remaining
              </Text>
              <Title order={3} c={totalHours >= TARGET_HOURS ? 'teal' : 'orange'}>
                {Math.max(0, TARGET_HOURS - totalHours)} hours
              </Title>
            </div>
          </Stack>
        </Card>
      </SimpleGrid>

      {/* Teaching Hours Log Table */}
      <Card withBorder p="lg" radius="md" mb="xl">
        <Title order={3} mb="lg">
          Hour Log Entries / កំណត់ត្រាម៉ោង
        </Title>

        {logs.length > 0 ? (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date / ថ្ងៃ</Table.Th>
                <Table.Th>Hours / ម៉ោង</Table.Th>
                <Table.Th>Notes / ចំណាំ</Table.Th>
                <Table.Th>Logged / កម្មវិធី</Table.Th>
                <Table.Th>Action / សកម្មភាព</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {logs.map((log) => (
                <Table.Tr key={log.log_id}>
                  <Table.Td>
                    <Group gap="xs">
                      <IconCalendar size={16} />
                      {new Date(log.activity_date).toLocaleDateString()}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge size="lg" color="blue" variant="light">
                      {log.hours_logged}h
                    </Badge>
                  </Table.Td>
                  <Table.Td>{log.notes ? log.notes.substring(0, 50) + '...' : '-'}</Table.Td>
                  <Table.Td>{new Date(log.created_at).toLocaleDateString()}</Table.Td>
                  <Table.Td>
                    <Button variant="light" size="xs" onClick={() => handleViewLog(log)}>
                      View
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          <Alert icon={<IconAlertCircle />} color="gray" title="No Logs Yet">
            You haven't logged any teaching hours yet. Start logging your teaching practice hours to track your progress.
          </Alert>
        )}
      </Card>

      {/* Guidelines Card */}
      <Card withBorder p="lg" radius="md" bg="gray.0">
        <Title order={4} mb="md">
          Guidelines for Logging Hours / ការណែនាំលម្អិត
        </Title>
        <Stack gap="sm">
          <Group gap="sm">
            <IconCheck size={20} color="teal" />
            <Text size="sm">Log hours on the day you teach or the next day while it's fresh in your memory</Text>
          </Group>
          <Group gap="sm">
            <IconCheck size={20} color="teal" />
            <Text size="sm">Include only actual teaching time (preparation time does not count)</Text>
          </Group>
          <Group gap="sm">
            <IconCheck size={20} color="teal" />
            <Text size="sm">Provide brief notes about what lessons you taught and student engagement</Text>
          </Group>
          <Group gap="sm">
            <IconCheck size={20} color="teal" />
            <Text size="sm">Minimum target: {TARGET_HOURS} hours over the practicum period</Text>
          </Group>
          <Group gap="sm">
            <IconCheck size={20} color="teal" />
            <Text size="sm">Your mentor can review your logs and provide feedback</Text>
          </Group>
        </Stack>
      </Card>

      {/* Log Detail Modal */}
      {selectedLog && (
        <Modal opened={modalOpened} onClose={() => setModalOpened(false)} title="Teaching Hours Log Detail" size="md">
          <Stack gap="lg">
            <div>
              <Text fw={500} c="dimmed" size="sm">
                Date / ថ្ងៃ
              </Text>
              <Text fw={700}>{new Date(selectedLog.activity_date).toLocaleDateString()}</Text>
            </div>

            <div>
              <Text fw={500} c="dimmed" size="sm">
                Hours Taught / ម៉ោងបង្រៀន
              </Text>
              <Badge size="lg" color="blue" variant="light">
                {selectedLog.hours_logged} hours
              </Badge>
            </div>

            {selectedLog.notes && (
              <div>
                <Text fw={500} c="dimmed" size="sm">
                  Notes / ចំណាំ
                </Text>
                <Card p="sm" bg="gray.0">
                  <Text size="sm">{selectedLog.notes}</Text>
                </Card>
              </div>
            )}

            <div>
              <Text fw={500} c="dimmed" size="sm">
                Logged On / កម្មវិធីលម្អិត
              </Text>
              <Text size="sm">{new Date(selectedLog.created_at).toLocaleString()}</Text>
            </div>

            <Button fullWidth onClick={() => setModalOpened(false)}>
              Close
            </Button>
          </Stack>
        </Modal>
      )}
    </Container>
  );
}

