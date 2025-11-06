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
import { useTranslation } from '@/lib/i18n/useTranslation';

interface TeachingHourLog {
  log_id: string;
  hours_logged: number;
  activity_date: string;
  notes: string;
  created_at: string;
}

export default function TeachingHoursPage() {
  const { language } = useTranslation();
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
        <Alert icon={<IconAlertCircle />} color="red" title={language === 'km' ? 'កំហុស' : 'Error'}>
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
          {language === 'km' ? 'ត្រឡប់ក្រោយ' : 'Back'}
        </Button>
        <div style={{ flex: 1 }}>
          <Title order={1}>{language === 'km' ? 'ម៉ោងបង្រៀន' : 'Teaching Hours'}</Title>
          <Text c="dimmed">{language === 'km' ? 'តាមដានម៉ោងបង្រៀនរបស់អ្នកពេញមួយកម្មវិធី' : 'Track your teaching practice hours throughout the practicum'}</Text>
        </div>
      </Group>

      {/* Overall Summary */}
      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg" mb="xl">
        {/* Total Hours Card */}
        <Card withBorder p="lg" radius="md">
          <Group justify="space-between" mb="lg">
            <Stack gap={0}>
              <Text fw={500} c="dimmed" size="sm">
                {language === 'km' ? 'ម៉ោងសរុបបានកត់ត្រា' : 'Total Hours Logged'}
              </Text>
              <Title order={2}>{totalHours} {language === 'km' ? 'ម៉ោង' : 'hours'}</Title>
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
            {language === 'km' ? 'គោលដៅ៖' : 'Target:'} {TARGET_HOURS} {language === 'km' ? 'ម៉ោង' : 'hours'}
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
                    {language === 'km' ? 'បានបញ្ចប់' : 'Complete'}
                  </Text>
                </Stack>
              }
              size={120}
              thickness={8}
            />
          </Group>
          {percentage >= 100 && (
            <Alert icon={<IconCheck />} color="teal" title={language === 'km' ? 'បានឈានដល់គោលដៅ!' : 'Target Reached!'}>
              {language === 'km'
                ? 'អ្នកបានបំពេញតម្រូវការម៉ោងបង្រៀនអប្បបរមា!'
                : 'You have met the minimum teaching hours requirement!'}
            </Alert>
          )}
        </Card>

        {/* Statistics */}
        <Card withBorder p="lg" radius="md">
          <Stack gap="md">
            <div>
              <Text fw={500} size="sm" c="dimmed" mb="xs">
                {language === 'km' ? 'កំណត់ត្រាសរុប' : 'Total Entries'}
              </Text>
              <Title order={3}>{totals?.log_entries || 0}</Title>
            </div>
            <div>
              <Text fw={500} size="sm" c="dimmed" mb="xs">
                {language === 'km' ? 'មធ្យមក្នុងមួយកំណត់ត្រា' : 'Average per Entry'}
              </Text>
              <Title order={3}>
                {totals && totals.log_entries > 0
                  ? (totals.total_hours / totals.log_entries).toFixed(1)
                  : 0}
                {language === 'km' ? 'ម' : 'h'}
              </Title>
            </div>
            <div>
              <Text fw={500} size="sm" c="dimmed" mb="xs">
                {language === 'km' ? 'ម៉ោងដែលនៅសល់' : 'Hours Remaining'}
              </Text>
              <Title order={3} c={totalHours >= TARGET_HOURS ? 'teal' : 'orange'}>
                {Math.max(0, TARGET_HOURS - totalHours)} {language === 'km' ? 'ម៉ោង' : 'hours'}
              </Title>
            </div>
          </Stack>
        </Card>
      </SimpleGrid>

      {/* Teaching Hours Log Table */}
      <Card withBorder p="lg" radius="md" mb="xl">
        <Title order={3} mb="lg">
          {language === 'km' ? 'កំណត់ត្រាម៉ោង' : 'Hour Log Entries'}
        </Title>

        {logs.length > 0 ? (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{language === 'km' ? 'ថ្ងៃ' : 'Date'}</Table.Th>
                <Table.Th>{language === 'km' ? 'ម៉ោង' : 'Hours'}</Table.Th>
                <Table.Th>{language === 'km' ? 'ចំណាំ' : 'Notes'}</Table.Th>
                <Table.Th>{language === 'km' ? 'កត់ត្រានៅ' : 'Logged'}</Table.Th>
                <Table.Th>{language === 'km' ? 'សកម្មភាព' : 'Action'}</Table.Th>
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
                      {log.hours_logged}{language === 'km' ? 'ម' : 'h'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{log.notes ? log.notes.substring(0, 50) + '...' : '-'}</Table.Td>
                  <Table.Td>{new Date(log.created_at).toLocaleDateString()}</Table.Td>
                  <Table.Td>
                    <Button variant="light" size="xs" onClick={() => handleViewLog(log)}>
                      {language === 'km' ? 'មើល' : 'View'}
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          <Alert icon={<IconAlertCircle />} color="gray" title={language === 'km' ? 'មិនទាន់មានកំណត់ត្រា' : 'No Logs Yet'}>
            {language === 'km'
              ? 'អ្នកមិនទាន់បានកត់ត្រាម៉ោងបង្រៀននៅឡើយទេ។ចាប់ផ្តើមកត់ត្រាម៉ោងបង្រៀនរបស់អ្នកដើម្បីតាមដានវឌ្ឍនភាព។'
              : "You haven't logged any teaching hours yet. Start logging your teaching practice hours to track your progress."}
          </Alert>
        )}
      </Card>

      {/* Guidelines Card */}
      <Card withBorder p="lg" radius="md" bg="gray.0">
        <Title order={4} mb="md">
          {language === 'km' ? 'ការណែនាំសម្រាប់ការកត់ត្រាម៉ោង' : 'Guidelines for Logging Hours'}
        </Title>
        <Stack gap="sm">
          <Group gap="sm">
            <IconCheck size={20} color="teal" />
            <Text size="sm">
              {language === 'km'
                ? 'កត់ត្រាម៉ោងនៅថ្ងៃដែលអ្នកបង្រៀនឬថ្ងៃបន្ទាប់ខណៈពេលវានៅស្រស់ក្នុងការចងចាំរបស់អ្នក'
                : "Log hours on the day you teach or the next day while it's fresh in your memory"}
            </Text>
          </Group>
          <Group gap="sm">
            <IconCheck size={20} color="teal" />
            <Text size="sm">
              {language === 'km'
                ? 'រួមបញ្ចូលតែពេលវេលាបង្រៀនពិតប្រាកដ (ពេលវេលារៀបចំមិនរាប់បញ្ចូលទេ)'
                : 'Include only actual teaching time (preparation time does not count)'}
            </Text>
          </Group>
          <Group gap="sm">
            <IconCheck size={20} color="teal" />
            <Text size="sm">
              {language === 'km'
                ? 'ផ្តល់ចំណាំខ្លីៗអំពីមេរៀនដែលអ្នកបានបង្រៀននិងការចូលរួមរបស់សិស្ស'
                : 'Provide brief notes about what lessons you taught and student engagement'}
            </Text>
          </Group>
          <Group gap="sm">
            <IconCheck size={20} color="teal" />
            <Text size="sm">
              {language === 'km'
                ? `គោលដៅអប្បបរមា៖ ${TARGET_HOURS} ម៉ោងពេញមួយកម្មវិធី`
                : `Minimum target: ${TARGET_HOURS} hours over the practicum period`}
            </Text>
          </Group>
          <Group gap="sm">
            <IconCheck size={20} color="teal" />
            <Text size="sm">
              {language === 'km'
                ? 'គ្រូជំនួយរបស់អ្នកអាចពិនិត្យមើលកំណត់ត្រារបស់អ្នកនិងផ្តល់មតិកែលម្អ'
                : 'Your mentor can review your logs and provide feedback'}
            </Text>
          </Group>
        </Stack>
      </Card>

      {/* Log Detail Modal */}
      {selectedLog && (
        <Modal
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          title={language === 'km' ? 'ព័ត៌មានលម្អិតកំណត់ត្រាម៉ោង' : 'Teaching Hours Log Detail'}
          size="md"
        >
          <Stack gap="lg">
            <div>
              <Text fw={500} c="dimmed" size="sm">
                {language === 'km' ? 'ថ្ងៃ' : 'Date'}
              </Text>
              <Text fw={700}>{new Date(selectedLog.activity_date).toLocaleDateString()}</Text>
            </div>

            <div>
              <Text fw={500} c="dimmed" size="sm">
                {language === 'km' ? 'ម៉ោងបង្រៀន' : 'Hours Taught'}
              </Text>
              <Badge size="lg" color="blue" variant="light">
                {selectedLog.hours_logged} {language === 'km' ? 'ម៉ោង' : 'hours'}
              </Badge>
            </div>

            {selectedLog.notes && (
              <div>
                <Text fw={500} c="dimmed" size="sm">
                  {language === 'km' ? 'ចំណាំ' : 'Notes'}
                </Text>
                <Card p="sm" bg="gray.0">
                  <Text size="sm">{selectedLog.notes}</Text>
                </Card>
              </div>
            )}

            <div>
              <Text fw={500} c="dimmed" size="sm">
                {language === 'km' ? 'កត់ត្រានៅ' : 'Logged On'}
              </Text>
              <Text size="sm">{new Date(selectedLog.created_at).toLocaleString()}</Text>
            </div>

            <Button fullWidth onClick={() => setModalOpened(false)}>
              {language === 'km' ? 'បិទ' : 'Close'}
            </Button>
          </Stack>
        </Modal>
      )}
    </Container>
  );
}
