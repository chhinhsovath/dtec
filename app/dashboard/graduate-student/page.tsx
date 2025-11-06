'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Title,
  Text,
  Grid,
  Card,
  Badge,
  Progress,
  Loader,
  Center,
  Stack,
  Group,
  ThemeIcon,
  RingProgress,
  SimpleGrid,
  Tabs,
  Table,
  Alert,
} from '@mantine/core';
import {
  IconBookmarks,
  IconClock,
  IconFileCheck,
  IconSchool,
  IconAlertCircle,
  IconCheck,
  IconTrendingUp,
} from '@tabler/icons-react';
import { getSession } from '@/lib/auth/client-auth';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface CompetencyLevel {
  level: number;
  label: string;
  color: string;
}

interface Competency {
  competency_assessment_id: string;
  competency_id: string;
  competency_number: number;
  name_km: string;
  name_en: string;
  current_level: number;
  score: number;
  feedback_text: string;
  assessment_date?: string;
}

interface DashboardData {
  stats: {
    competencies: { total: number; proficient: number };
    teachingHours: { total_hours: number; avg_hours_per_log: number };
    certification: { completed: number; total: number };
    practicum: { placement_status: string; teaching_hours_actual: number; teaching_hours_target: number } | null;
  };
  cohort: {
    batch_code: string;
    batch_year: number;
    batch_name_km: string;
    start_date: string;
    end_date: string;
  } | null;
  currentPhase: {
    phase_number: number;
    name_km: string;
    name_en: string;
    duration_weeks: number;
  } | null;
  competencies: Competency[];
  progressSummary: {
    competenciesAtLevel3Plus: number;
    totalCompetencies: number;
    teachingHoursLogged: number;
    teachingHoursTarget: number;
    certificationsCompleted: number;
    totalCertificationRequirements: number;
    practicumStatus: string;
  };
}

const COMPETENCY_LEVELS: CompetencyLevel[] = [
  { level: 1, label: 'Beginning', color: '#FF6B6B' },
  { level: 2, label: 'Developing', color: '#FFA94D' },
  { level: 3, label: 'Proficient', color: '#51CF66' },
  { level: 4, label: 'Advanced', color: '#339AF0' },
  { level: 5, label: 'Master', color: '#7950F2' },
];

export default function GraduateStudentDashboard() {
  const { language } = useTranslation();
  const [data, setData] = useState<DashboardData | null>(null);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadDashboardData = async () => {
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

        // Fetch dashboard data
        const dashboardRes = await fetch('/api/graduate-student/dashboard');
        if (!dashboardRes.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const dashboardData = await dashboardRes.json();
        setData(dashboardData.data);

        // Fetch competencies
        const competenciesRes = await fetch('/api/graduate-student/competencies');
        if (competenciesRes.ok) {
          const competenciesData = await competenciesRes.json();
          setCompetencies(competenciesData.data || []);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading dashboard:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [router]);

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

  if (!data) {
    return (
      <Container size="lg" py="xl">
        <Alert icon={<IconAlertCircle />} color="yellow" title={language === 'km' ? 'គ្មានទិន្នន័យ' : 'No Data'}>
          {language === 'km' ? 'មិនអាចផ្ទុកទិន្នន័យផ្ទាំងគ្រប់គ្រងបានទេ' : 'Unable to load dashboard data'}
        </Alert>
      </Container>
    );
  }

  const competencyPercentage = (data.progressSummary.competenciesAtLevel3Plus / data.progressSummary.totalCompetencies) * 100;
  const teachingHoursPercentage = (data.progressSummary.teachingHoursLogged / data.progressSummary.teachingHoursTarget) * 100;
  const certificationPercentage = (data.progressSummary.certificationsCompleted / data.progressSummary.totalCertificationRequirements) * 100;

  const getLevelColor = (level: number) => {
    return COMPETENCY_LEVELS.find((l) => l.level === level)?.color || '#999';
  };

  const getLevelLabel = (level: number) => {
    return COMPETENCY_LEVELS.find((l) => l.level === level)?.label || 'Unknown';
  };

  return (
    <Container size="xl" py="xl">
      {/* Header */}
      <Stack gap="lg" mb="xl">
        <div>
          <Title order={1}>{language === 'km' ? 'ផ្ទាំងគ្រប់គ្រងសិស្សស្រាវជ្រាវ' : 'Graduate Student Dashboard'}</Title>
          <Text c="dimmed" size="lg" mt="sm">
            {language === 'km' ? 'សូមស្វាគមន៍ទៅកម្មវិធីបណ្តុះបណ្តាលគ្រូបង្រៀនកិច្ចសន្យា' : 'Welcome to Contract Teacher Training Program'}
          </Text>
        </div>

        {/* Cohort and Phase Info */}
        {data.cohort && data.currentPhase && (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            <Card withBorder p="lg" radius="md">
              <Group justify="space-between" mb="xs">
                <Text fw={500} size="sm" c="dimmed">
                  {language === 'km' ? 'ក្រុម' : 'Cohort'}
                </Text>
                <IconSchool size={16} color="blue" />
              </Group>
              <Text fw={700} size="lg">
                {data.cohort.batch_code}
              </Text>
              <Text c="dimmed" size="sm">
                {data.cohort.batch_name_km}
              </Text>
              <Text c="dimmed" size="xs" mt="xs">
                {new Date(data.cohort.start_date).toLocaleDateString()} - {new Date(data.cohort.end_date).toLocaleDateString()}
              </Text>
            </Card>

            <Card withBorder p="lg" radius="md">
              <Group justify="space-between" mb="xs">
                <Text fw={500} size="sm" c="dimmed">
                  {language === 'km' ? 'ដំណាក់កាលបច្ចុប្បន្ន' : 'Current Phase'}
                </Text>
                <IconTrendingUp size={16} color="blue" />
              </Group>
              <Text fw={700} size="lg">
                {language === 'km' ? data.currentPhase.name_km : data.currentPhase.name_en}
              </Text>
              <Text c="dimmed" size="xs" mt="xs">
                {language === 'km' ? 'ដំណាក់កាល' : 'Phase'} {data.currentPhase.phase_number} ({data.currentPhase.duration_weeks} {language === 'km' ? 'សប្តាហ៍' : 'weeks'})
              </Text>
            </Card>
          </SimpleGrid>
        )}
      </Stack>

      {/* Progress Overview */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg" mb="xl">
        {/* Competencies */}
        <Card withBorder p="lg" radius="md">
          <Group justify="space-between" mb="lg">
            <Stack gap={0}>
              <Text fw={500} size="sm" c="dimmed">
                {language === 'km' ? 'សមត្ថភាព' : 'Competencies'}
              </Text>
              <Title order={3}>
                {data.progressSummary.competenciesAtLevel3Plus}/{data.progressSummary.totalCompetencies}
              </Title>
            </Stack>
            <ThemeIcon variant="light" size={50} radius="md" color="blue">
              <IconBookmarks size={28} color="blue" />
            </ThemeIcon>
          </Group>
          <Progress
            value={competencyPercentage}
            color={competencyPercentage >= 70 ? 'teal' : 'yellow'}
            size="md"
            radius="md"
          />
          <Text c="dimmed" size="xs" mt="xs">
            {competencyPercentage.toFixed(0)}% {language === 'km' ? 'ស្ថិតក្នុងកម្រិតទី ៣ ឬខ្ពស់ជាងនេះ' : 'at Level 3+'}
          </Text>
        </Card>

        {/* Teaching Hours */}
        <Card withBorder p="lg" radius="md">
          <Group justify="space-between" mb="lg">
            <Stack gap={0}>
              <Text fw={500} size="sm" c="dimmed">
                {language === 'km' ? 'ម៉ោងបង្រៀន' : 'Teaching Hours'}
              </Text>
              <Title order={3}>
                {data.progressSummary.teachingHoursLogged}/{data.progressSummary.teachingHoursTarget}
              </Title>
            </Stack>
            <ThemeIcon variant="light" size={50} radius="md" color="violet">
              <IconClock size={28} color="violet" />
            </ThemeIcon>
          </Group>
          <Progress
            value={teachingHoursPercentage}
            color={teachingHoursPercentage >= 80 ? 'teal' : 'yellow'}
            size="md"
            radius="md"
          />
          <Text c="dimmed" size="xs" mt="xs">
            {teachingHoursPercentage.toFixed(0)}% {language === 'km' ? 'បានបញ្ចប់' : 'complete'}
          </Text>
        </Card>

        {/* Certification */}
        <Card withBorder p="lg" radius="md">
          <Group justify="space-between" mb="lg">
            <Stack gap={0}>
              <Text fw={500} size="sm" c="dimmed">
                {language === 'km' ? 'វិញ្ញាបនបត្រ' : 'Certification'}
              </Text>
              <Title order={3}>
                {data.progressSummary.certificationsCompleted}/{data.progressSummary.totalCertificationRequirements}
              </Title>
            </Stack>
            <ThemeIcon variant="light" size={50} radius="md" color="green">
              <IconFileCheck size={28} color="green" />
            </ThemeIcon>
          </Group>
          <Progress
            value={certificationPercentage}
            color={certificationPercentage === 100 ? 'teal' : 'yellow'}
            size="md"
            radius="md"
          />
          <Text c="dimmed" size="xs" mt="xs">
            {certificationPercentage.toFixed(0)}% {language === 'km' ? 'បានបញ្ចប់' : 'complete'}
          </Text>
        </Card>

        {/* Practicum Status */}
        <Card withBorder p="lg" radius="md">
          <Group justify="space-between" mb="lg">
            <Stack gap={0}>
              <Text fw={500} size="sm" c="dimmed">
                {language === 'km' ? 'ការអនុវត្តន៍' : 'Practicum'}
              </Text>
              <Title order={3}>
                {data.progressSummary.practicumStatus === 'active'
                  ? (language === 'km' ? 'កំពុងដំណើរការ' : 'Active')
                  : (language === 'km' ? 'មិនទាន់ចាប់ផ្តើម' : 'Not Started')}
              </Title>
            </Stack>
            <ThemeIcon
              variant="light"
              size={50}
              radius="md"
              color={data.progressSummary.practicumStatus === 'active' ? 'teal' : 'gray'}
            >
              <IconSchool size={28} color={data.progressSummary.practicumStatus === 'active' ? 'teal' : 'gray'} />
            </ThemeIcon>
          </Group>
          <Badge
            color={data.progressSummary.practicumStatus === 'active' ? 'teal' : 'gray'}
            variant="light"
            fullWidth
          >
            {data.progressSummary.practicumStatus === 'active'
              ? (language === 'km' ? 'កំពុងដំណើរការ' : 'In Progress')
              : (language === 'km' ? 'មិនទាន់ចាប់ផ្តើម' : 'Not Started')}
          </Badge>
        </Card>
      </SimpleGrid>

      {/* Competency Details */}
      <Tabs defaultValue="grid" mb="xl">
        <Tabs.List>
          <Tabs.Tab value="grid">{language === 'km' ? 'មើលជាក្រឡា' : 'Grid View'}</Tabs.Tab>
          <Tabs.Tab value="table">{language === 'km' ? 'មើលជាតារាង' : 'Table View'}</Tabs.Tab>
        </Tabs.List>

        {/* Grid View */}
        <Tabs.Panel value="grid" pt="xl">
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            {competencies.length > 0 ? (
              competencies.map((comp) => (
                <Card key={comp.competency_assessment_id} withBorder p="lg" radius="md">
                  <Group justify="space-between" mb="sm">
                    <Title order={4} size="h5">
                      {language === 'km' ? comp.name_km : comp.name_en}
                    </Title>
                    <Badge
                      color={getLevelColor(comp.current_level)}
                      variant="filled"
                    >
                      {language === 'km' ? 'កម្រិត' : 'Level'} {comp.current_level}
                    </Badge>
                  </Group>

                  <Stack gap="xs">
                    <div>
                      <Group justify="space-between" mb="xs">
                        <Text size="sm" fw={500}>
                          {language === 'km' ? 'ពិន្ទុ' : 'Score'}
                        </Text>
                        <Text size="sm" fw={700}>
                          {comp.score}/100
                        </Text>
                      </Group>
                      <Progress value={comp.score} color={getLevelColor(comp.current_level)} size="sm" />
                    </div>

                    {comp.current_level >= 3 && (
                      <Group gap="xs">
                        <IconCheck size={16} color="teal" />
                        <Text size="xs" c="teal" fw={500}>
                          {language === 'km' ? 'មានសមត្ថភាព - ត្រៀមរួចសម្រាប់វិញ្ញាបនបត្រ' : 'Proficient - Ready for certification'}
                        </Text>
                      </Group>
                    )}

                    {comp.feedback_text && (
                      <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                        <Text size="xs" fw={500} mb="xs">
                          {language === 'km' ? 'មតិកែលម្អ' : 'Feedback'}:
                        </Text>
                        <Text size="xs" c="dimmed">
                          {comp.feedback_text}
                        </Text>
                      </div>
                    )}

                    {comp.assessment_date && (
                      <Text size="xs" c="dimmed">
                        {language === 'km' ? 'វាយតម្លៃចុងក្រោយ' : 'Last assessed'}: {new Date(comp.assessment_date).toLocaleDateString()}
                      </Text>
                    )}
                  </Stack>
                </Card>
              ))
            ) : (
              <Card withBorder p="lg" radius="md">
                <Text c="dimmed" ta="center">
                  {language === 'km' ? 'មិនទាន់មានការវាយតម្លៃសមត្ថភាពនៅឡើយទេ' : 'No competency assessments yet'}
                </Text>
              </Card>
            )}
          </SimpleGrid>
        </Tabs.Panel>

        {/* Table View */}
        <Tabs.Panel value="table" pt="xl">
          {competencies.length > 0 ? (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>#</Table.Th>
                  <Table.Th>{language === 'km' ? 'សមត្ថភាព (ខ្មែរ)' : 'Competency (English)'}</Table.Th>
                  <Table.Th>{language === 'km' ? 'កម្រិត' : 'Level'}</Table.Th>
                  <Table.Th>{language === 'km' ? 'ពិន្ទុ' : 'Score'}</Table.Th>
                  <Table.Th>{language === 'km' ? 'ស្ថានភាព' : 'Status'}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {competencies.map((comp) => (
                  <Table.Tr key={comp.competency_assessment_id}>
                    <Table.Td>{comp.competency_number}</Table.Td>
                    <Table.Td fw={500}>{language === 'km' ? comp.name_km : comp.name_en}</Table.Td>
                    <Table.Td>
                      <Badge color={getLevelColor(comp.current_level)} variant="filled">
                        {getLevelLabel(comp.current_level)}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Progress value={comp.score} color={getLevelColor(comp.current_level)} size="sm" style={{ flex: 1 }} />
                        <Text size="sm" fw={700} w={60}>
                          {comp.score}%
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      {comp.current_level >= 3 ? (
                        <Group gap="xs">
                          <IconCheck size={16} color="teal" />
                          <Text size="xs" c="teal">
                            {language === 'km' ? 'មានសមត្ថភាព' : 'Proficient'}
                          </Text>
                        </Group>
                      ) : (
                        <Badge color="yellow" variant="light">
                          {language === 'km' ? 'កំពុងដំណើរការ' : 'In Progress'}
                        </Badge>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          ) : (
            <Alert icon={<IconAlertCircle />} color="gray" title={language === 'km' ? 'គ្មានទិន្នន័យ' : 'No Data'}>
              {language === 'km' ? 'មិនទាន់មានការវាយតម្លៃសមត្ថភាពនៅឡើយទេ' : 'No competency assessments available yet'}
            </Alert>
          )}
        </Tabs.Panel>
      </Tabs>

      {/* Legend */}
      <Card withBorder p="lg" radius="md" mb="xl">
        <Title order={4} mb="lg">
          {language === 'km' ? 'កម្រិតសមត្ថភាព' : 'Competency Levels'}
        </Title>
        <SimpleGrid cols={{ base: 1, sm: 5 }} spacing="lg">
          {COMPETENCY_LEVELS.map((level) => (
            <Group key={level.level} gap="sm">
              <ThemeIcon variant="light" size={32} radius="md" style={{ backgroundColor: level.color, opacity: 0.3 }}>
                <div style={{ width: 16, height: 16, backgroundColor: level.color, borderRadius: '4px' }} />
              </ThemeIcon>
              <Stack gap={0}>
                <Text fw={500} size="sm">
                  {language === 'km' ? 'កម្រិត' : 'Level'} {level.level}
                </Text>
                <Text size="xs" c="dimmed">
                  {level.label}
                </Text>
              </Stack>
            </Group>
          ))}
        </SimpleGrid>
      </Card>

      {/* Info Box */}
      {data.progressSummary.competenciesAtLevel3Plus === data.progressSummary.totalCompetencies &&
        data.progressSummary.teachingHoursLogged >= data.progressSummary.teachingHoursTarget &&
        data.progressSummary.certificationsCompleted === data.progressSummary.totalCertificationRequirements && (
          <Alert icon={<IconCheck />} color="teal" title={language === 'km' ? 'រួចរាល់សម្រាប់វិញ្ញាបនបត្រ!' : 'Ready for Certification!'} mb="lg">
            {language === 'km'
              ? 'អបអរសាទរ! អ្នកបានបំពេញតម្រូវការទាំងអស់សម្រាប់វិញ្ញាបនបត្រគ្រូបង្រៀនកិច្ចសន្យា។ សូមទាក់ទងអ្នកសម្របសម្រួលរបស់អ្នកដើម្បីបន្តការផ្តល់វិញ្ញាបនបត្រចុងក្រោយ។'
              : 'Congratulations! You have met all requirements for contract teacher certification. Please contact your coordinator to proceed with final certification.'}
          </Alert>
        )}
    </Container>
  );
}
