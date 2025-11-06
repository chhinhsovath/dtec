'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Title,
  Text,
  Card,
  Badge,
  Progress,
  Loader,
  Center,
  Stack,
  Group,
  ThemeIcon,
  SimpleGrid,
  Alert,
  Button,
  Tabs,
  Table,
  Modal,
  Textarea,
  NumberInput,
  Input,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconAlertCircle,
  IconSchool,
  IconClock,
  IconBookmark,
  IconMapPin,
  IconPhone,
  IconUser,
  IconPlus,
  IconCheck,
} from '@tabler/icons-react';
import { getSession } from '@/lib/auth/client-auth';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface PracticumPlacement {
  placement_id: string;
  partner_school_id: string;
  start_date: string;
  end_date: string;
  placement_status: string;
  teaching_hours_target: number;
  teaching_hours_actual: number;
  placement_supervisor_id: string;
  school_name_km: string;
  school_name_en: string;
  location: string;
  contact_person: string;
  contact_phone: string;
}

interface TeachingObservation {
  observation_id: string;
  observation_date: string;
  lesson_title: string;
  grade_level: string;
  strengths_km: string;
  strengths_en: string;
  areas_for_improvement_km: string;
  areas_for_improvement_en: string;
  recommendations_km: string;
  recommendations_en: string;
  overall_score: number;
}

interface PracticumData {
  placement: PracticumPlacement | null;
  teachingHours: { total_hours: number; log_entries: number };
  totalObservations: number;
  observations: TeachingObservation[];
}

export default function PracticumPage() {
  const { language } = useTranslation();
  const [data, setData] = useState<PracticumData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logModalOpened, setLogModalOpened] = useState(false);
  const [observationModalOpened, setObservationModalOpened] = useState(false);
  const [selectedObservation, setSelectedObservation] = useState<TeachingObservation | null>(null);

  const [logHours, setLogHours] = useState<number>(0);
  const [logDate, setLogDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [logNotes, setLogNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
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

        const res = await fetch('/api/graduate-student/practicum');
        if (!res.ok) {
          throw new Error('Failed to fetch practicum data');
        }

        const result = await res.json();
        setData(result.data);
        setLoading(false);
      } catch (err) {
        console.error('Error loading practicum data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load practicum data');
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleLogHours = async () => {
    if (!data?.placement || logHours <= 0) {
      alert(language === 'km' ? 'សូមបញ្ចូលម៉ោងត្រឹមត្រូវ' : 'Please enter valid hours');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/graduate-student/practicum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'log_hours',
          placementId: data.placement.placement_id,
          hoursLogged: logHours,
          activityDate: logDate,
          notes: logNotes,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to log hours');
      }

      // Refresh data
      const dataRes = await fetch('/api/graduate-student/practicum');
      const updatedData = await dataRes.json();
      setData(updatedData.data);

      setLogHours(0);
      setLogDate(new Date().toISOString().split('T')[0]);
      setLogNotes('');
      setLogModalOpened(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to log hours');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewObservation = (obs: TeachingObservation) => {
    setSelectedObservation(obs);
    setObservationModalOpened(true);
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

  const placement = data?.placement;
  const teachingHours = data?.teachingHours || { total_hours: 0, log_entries: 0 };
  const observations = data?.observations || [];
  const hoursPercentage = placement
    ? (teachingHours.total_hours / placement.teaching_hours_target) * 100
    : 0;

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
          <Title order={1}>{language === 'km' ? 'ការងារគន្លឹះ' : 'Practicum'}</Title>
          <Text c="dimmed">{language === 'km' ? 'បទពិសោធន៍បង្រៀនក្នុងថ្នាក់រៀនពិតនៅសាលាដៃគូ' : 'Real classroom teaching experience in partner schools'}</Text>
        </div>
      </Group>

      {/* Placement Status */}
      {placement ? (
        <>
          {/* School Information Card */}
          <Card withBorder p="lg" radius="md" mb="xl" bg="blue.0">
            <Group justify="space-between" mb="lg">
              <div>
                <Title order={2}>{language === 'km' ? placement.school_name_km : placement.school_name_en}</Title>
                <Text c="dimmed">{language === 'km' ? placement.school_name_en : placement.school_name_km}</Text>
              </div>
              <Badge
                color={placement.placement_status === 'active' ? 'teal' : 'yellow'}
                size="lg"
                variant="light"
              >
                {placement.placement_status === 'active'
                  ? (language === 'km' ? 'កំពុងដំណើរការ' : 'In Progress')
                  : (language === 'km' ? 'មិនទាន់ចាប់ផ្តើម' : 'Not Started')}
              </Badge>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
              <Group gap="sm">
                <ThemeIcon variant="light" size={40} radius="md" color="blue">
                  <IconMapPin size={20} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed" fw={500}>
                    {language === 'km' ? 'ទីតាំង' : 'Location'}
                  </Text>
                  <Text fw={500}>{placement.location}</Text>
                </div>
              </Group>

              <Group gap="sm">
                <ThemeIcon variant="light" size={40} radius="md" color="blue">
                  <IconUser size={20} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed" fw={500}>
                    {language === 'km' ? 'អ្នកគ្រប់គ្រង' : 'Supervisor'}
                  </Text>
                  <Text fw={500}>{placement.contact_person}</Text>
                </div>
              </Group>

              <Group gap="sm">
                <ThemeIcon variant="light" size={40} radius="md" color="blue">
                  <IconPhone size={20} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed" fw={500}>
                    {language === 'km' ? 'ទូរស័ព្ទ' : 'Contact'}
                  </Text>
                  <Text fw={500}>{placement.contact_phone}</Text>
                </div>
              </Group>

              <Group gap="sm">
                <ThemeIcon variant="light" size={40} radius="md" color="blue">
                  <IconClock size={20} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed" fw={500}>
                    {language === 'km' ? 'រយៈពេល' : 'Duration'}
                  </Text>
                  <Text fw={500} size="sm">
                    {new Date(placement.start_date).toLocaleDateString()} - {new Date(placement.end_date).toLocaleDateString()}
                  </Text>
                </div>
              </Group>
            </SimpleGrid>
          </Card>

          {/* Teaching Hours Progress */}
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" mb="xl">
            <Card withBorder p="lg" radius="md">
              <Group justify="space-between" mb="lg">
                <Stack gap={0}>
                  <Text fw={500} c="dimmed">
                    {language === 'km' ? 'ម៉ោងបង្រៀន' : 'Teaching Hours'}
                  </Text>
                  <Title order={2}>
                    {teachingHours.total_hours}/{placement.teaching_hours_target}
                  </Title>
                </Stack>
                <ThemeIcon variant="light" size={50} radius="md" color="violet">
                  <IconClock size={28} color="violet" />
                </ThemeIcon>
              </Group>

              <Progress
                value={hoursPercentage}
                color={hoursPercentage >= 80 ? 'teal' : hoursPercentage >= 50 ? 'yellow' : 'orange'}
                size="lg"
                radius="md"
                mb="sm"
              />
              <Text c="dimmed" size="sm">
                {hoursPercentage.toFixed(0)}% {language === 'km' ? 'បានបញ្ចប់' : 'complete'} ({teachingHours.log_entries} {language === 'km' ? 'កំណត់ត្រា' : 'logs'})
              </Text>

              {hoursPercentage >= 100 && (
                <Alert icon={<IconCheck />} color="teal" title={language === 'km' ? 'បានឈានដល់គោលដៅ!' : 'Target Reached!'} mt="lg">
                  {language === 'km'
                    ? 'អ្នកបានបញ្ចប់តម្រូវការម៉ោងបង្រៀនអប្បបរមារបស់អ្នក!'
                    : 'You have completed your minimum teaching hours requirement!'}
                </Alert>
              )}

              <Button
                fullWidth
                mt="lg"
                leftSection={<IconPlus size={16} />}
                onClick={() => setLogModalOpened(true)}
              >
                {language === 'km' ? 'កត់ត្រាម៉ោងបង្រៀន' : 'Log Teaching Hours'}
              </Button>
            </Card>

            <Card withBorder p="lg" radius="md">
              <Group justify="space-between" mb="lg">
                <Stack gap={0}>
                  <Text fw={500} c="dimmed">
                    {language === 'km' ? 'ការសង្កេត' : 'Observations'}
                  </Text>
                  <Title order={2}>{data?.totalObservations || 0}</Title>
                </Stack>
                <ThemeIcon variant="light" size={50} radius="md" color="teal">
                  <IconBookmark size={28} color="teal" />
                </ThemeIcon>
              </Group>

              <Text size="sm" c="dimmed" mb="lg">
                {language === 'km' ? 'គ្រូជំនួយបានធ្វើការសង្កេតផ្លូវការ' : 'Mentor has conducted formal observations'}
              </Text>

              <Stack gap="xs">
                {observations.length > 0 ? (
                  <>
                    <Text size="sm" fw={500}>
                      {language === 'km' ? 'ការសង្កេតចុងក្រោយបំផុត៖' : 'Latest Observations:'}
                    </Text>
                    {observations.slice(0, 3).map((obs) => (
                      <Group key={obs.observation_id} gap="xs">
                        <IconCheck size={16} color="teal" />
                        <Text size="sm">{new Date(obs.observation_date).toLocaleDateString()}</Text>
                      </Group>
                    ))}
                    <Button variant="light" fullWidth mt="lg" onClick={() => setObservationModalOpened(true)}>
                      {language === 'km' ? 'មើលការសង្កេតទាំងអស់' : 'View All Observations'}
                    </Button>
                  </>
                ) : (
                  <Text size="sm" c="dimmed">
                    {language === 'km' ? 'មិនទាន់មានការសង្កេតណាមួយត្រូវបានកត់ត្រានៅឡើយទេ' : 'No observations recorded yet'}
                  </Text>
                )}
              </Stack>
            </Card>
          </SimpleGrid>

          {/* Observations Table */}
          <Card withBorder p="lg" radius="md">
            <Title order={3} mb="lg">
              {language === 'km' ? 'ការសង្កេតការបង្រៀនដោយលម្អិត' : 'All Teaching Observations'}
            </Title>

            {observations.length > 0 ? (
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{language === 'km' ? 'ថ្ងៃ' : 'Date'}</Table.Th>
                    <Table.Th>{language === 'km' ? 'មេរៀន' : 'Lesson Title'}</Table.Th>
                    <Table.Th>{language === 'km' ? 'ថ្នាក់' : 'Grade'}</Table.Th>
                    <Table.Th>{language === 'km' ? 'ពិន្ទុ' : 'Score'}</Table.Th>
                    <Table.Th>{language === 'km' ? 'សកម្មភាព' : 'Action'}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {observations.map((obs) => (
                    <Table.Tr key={obs.observation_id}>
                      <Table.Td>{new Date(obs.observation_date).toLocaleDateString()}</Table.Td>
                      <Table.Td fw={500}>{obs.lesson_title}</Table.Td>
                      <Table.Td>{obs.grade_level}</Table.Td>
                      <Table.Td>
                        <Badge
                          color={obs.overall_score >= 80 ? 'teal' : obs.overall_score >= 70 ? 'yellow' : 'orange'}
                          variant="light"
                        >
                          {obs.overall_score}/100
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Button
                          variant="light"
                          size="xs"
                          onClick={() => handleViewObservation(obs)}
                        >
                          {language === 'km' ? 'មើល' : 'View'}
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            ) : (
              <Alert icon={<IconAlertCircle />} color="gray">
                {language === 'km'
                  ? 'មិនទាន់មានការសង្កេតត្រូវបានកត់ត្រានៅឡើយទេ។ គ្រូជំនួយរបស់អ្នកនឹងផ្តល់មតិកែលម្អអំពីការបង្រៀនរបស់អ្នក។'
                  : 'No observations recorded yet. Your mentor will provide feedback on your teaching.'}
              </Alert>
            )}
          </Card>
        </>
      ) : (
        <Alert icon={<IconAlertCircle />} color="yellow" title={language === 'km' ? 'គ្មានទីតាំងអនុវត្តន៍' : 'No Practicum Placement'}>
          {language === 'km'
            ? 'អ្នកមិនទាន់ត្រូវបានចាត់តាំងទៅសាលាដៃគូសម្រាប់ការអនុវត្តន៍របស់អ្នកនៅឡើយទេ។ សូមទាក់ទងអ្នកសម្របសម្រួលរបស់អ្នក។'
            : 'You have not yet been assigned to a partner school for your practicum. Please contact your coordinator.'}
        </Alert>
      )}

      {/* Log Hours Modal */}
      <Modal
        opened={logModalOpened}
        onClose={() => setLogModalOpened(false)}
        title={language === 'km' ? 'កត់ត្រាម៉ោងបង្រៀន' : 'Log Teaching Hours'}
        size="md"
      >
        <Stack gap="md">
          <div>
            <Text fw={500} size="sm" mb="xs">
              {language === 'km' ? 'ថ្ងៃ' : 'Date'}
            </Text>
            <Input
              type="date"
              value={logDate}
              onChange={(e) => setLogDate(e.currentTarget.value)}
            />
          </div>

          <div>
            <Text fw={500} size="sm" mb="xs">
              {language === 'km' ? 'ម៉ោងបង្រៀន' : 'Hours Taught'}
            </Text>
            <NumberInput
              value={logHours}
              onChange={(val) => setLogHours(typeof val === 'number' ? val : (val ? parseFloat(val) : 0))}
              min={0}
              step={0.5}
              placeholder={language === 'km' ? 'បញ្ចូលម៉ោង' : 'Enter hours'}
            />
          </div>

          <div>
            <Text fw={500} size="sm" mb="xs">
              {language === 'km' ? 'ចំណាំ (ស្រេចចិត្ត)' : 'Notes (Optional)'}
            </Text>
            <Textarea
              value={logNotes}
              onChange={(e) => setLogNotes(e.currentTarget.value)}
              placeholder={language === 'km' ? 'មេរៀនអ្វីដែលអ្នកបានបង្រៀន? តើសិស្សចូលរួមយ៉ាងដូចម្តេច?' : 'What lesson did you teach? How was student engagement?'}
              minRows={3}
            />
          </div>

          <Button
            fullWidth
            onClick={handleLogHours}
            loading={submitting}
            disabled={logHours <= 0}
          >
            {language === 'km' ? 'កត់ត្រាម៉ោង' : 'Log Hours'}
          </Button>
        </Stack>
      </Modal>

      {/* Observation Detail Modal */}
      <Modal
        opened={observationModalOpened && !!selectedObservation}
        onClose={() => setObservationModalOpened(false)}
        title={language === 'km' ? 'ព័ត៌មានលម្អិតការសង្កេតការបង្រៀន' : 'Teaching Observation Details'}
        size="lg"
      >
        {selectedObservation && (
          <Stack gap="lg">
            <div>
              <Group justify="space-between" mb="xs">
                <Title order={4}>{selectedObservation.lesson_title}</Title>
                <Badge
                  color={selectedObservation.overall_score >= 80 ? 'teal' : 'yellow'}
                  size="lg"
                  variant="filled"
                >
                  {selectedObservation.overall_score}/100
                </Badge>
              </Group>
              <Group gap="sm">
                <Badge variant="light">{language === 'km' ? 'ថ្នាក់' : 'Grade'} {selectedObservation.grade_level}</Badge>
                <Text size="sm" c="dimmed">
                  {new Date(selectedObservation.observation_date).toLocaleDateString()}
                </Text>
              </Group>
            </div>

            <div>
              <Text fw={500} mb="xs">
                {language === 'km' ? 'ចំណុចខ្លាំង' : 'Strengths'}
              </Text>
              <Card p="sm" bg="green.0">
                <Text size="sm">{language === 'km' ? selectedObservation.strengths_km : selectedObservation.strengths_en}</Text>
              </Card>
            </div>

            <div>
              <Text fw={500} mb="xs">
                {language === 'km' ? 'ផ្នែកដែលត្រូវកែលម្អ' : 'Areas for Improvement'}
              </Text>
              <Card p="sm" bg="orange.0">
                <Text size="sm">{language === 'km' ? selectedObservation.areas_for_improvement_km : selectedObservation.areas_for_improvement_en}</Text>
              </Card>
            </div>

            <div>
              <Text fw={500} mb="xs">
                {language === 'km' ? 'អនុសាសន៍' : 'Recommendations'}
              </Text>
              <Card p="sm" bg="blue.0">
                <Text size="sm">{language === 'km' ? selectedObservation.recommendations_km : selectedObservation.recommendations_en}</Text>
              </Card>
            </div>

            <Button fullWidth onClick={() => setObservationModalOpened(false)}>
              {language === 'km' ? 'បិទ' : 'Close'}
            </Button>
          </Stack>
        )}
      </Modal>
    </Container>
  );
}
