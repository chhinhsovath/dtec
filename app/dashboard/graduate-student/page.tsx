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
        <Alert icon={<IconAlertCircle />} color="red" title="Error">
          {error}
        </Alert>
      </Container>
    );
  }

  if (!data) {
    return (
      <Container size="lg" py="xl">
        <Alert icon={<IconAlertCircle />} color="yellow" title="No Data">
          Unable to load dashboard data
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
          <Title order={1}>ឡើងលម្អិតលម្អិត - Graduate Student Dashboard</Title>
          <Text c="dimmed" size="lg" mt="sm">
            សូមស្វាគមន៍ទៅកម្មវិធីបង្រៀនគ្រូច្រៃលំង្វល់ - Welcome to Contract Teacher Training Program
          </Text>
        </div>

        {/* Cohort and Phase Info */}
        {data.cohort && data.currentPhase && (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            <Card withBorder p="lg" radius="md">
              <Group justify="space-between" mb="xs">
                <Text fw={500} size="sm" c="dimmed">
                  Cohort / ក្រុម
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
                  Current Phase / ដំណាក់កាល
                </Text>
                <IconTrendingUp size={16} color="blue" />
              </Group>
              <Text fw={700} size="lg">
                {data.currentPhase.name_en}
              </Text>
              <Text c="dimmed" size="sm">
                {data.currentPhase.name_km}
              </Text>
              <Text c="dimmed" size="xs" mt="xs">
                Phase {data.currentPhase.phase_number} ({data.currentPhase.duration_weeks} weeks)
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
                Competencies / សមត្ថភាព
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
            {competencyPercentage.toFixed(0)}% at Level 3+
          </Text>
        </Card>

        {/* Teaching Hours */}
        <Card withBorder p="lg" radius="md">
          <Group justify="space-between" mb="lg">
            <Stack gap={0}>
              <Text fw={500} size="sm" c="dimmed">
                Teaching Hours / ម៉ោងបង្រៀន
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
            {teachingHoursPercentage.toFixed(0)}% complete
          </Text>
        </Card>

        {/* Certification */}
        <Card withBorder p="lg" radius="md">
          <Group justify="space-between" mb="lg">
            <Stack gap={0}>
              <Text fw={500} size="sm" c="dimmed">
                Certification / ឯកសារ
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
            {certificationPercentage.toFixed(0)}% complete
          </Text>
        </Card>

        {/* Practicum Status */}
        <Card withBorder p="lg" radius="md">
          <Group justify="space-between" mb="lg">
            <Stack gap={0}>
              <Text fw={500} size="sm" c="dimmed">
                Practicum / អនុវត្ត
              </Text>
              <Title order={3}>
                {data.progressSummary.practicumStatus === 'active' ? 'Active' : 'Not Started'}
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
            {data.progressSummary.practicumStatus === 'active' ? 'In Progress' : 'Not Started'}
          </Badge>
        </Card>
      </SimpleGrid>

      {/* Competency Details */}
      <Tabs defaultValue="grid" mb="xl">
        <Tabs.List>
          <Tabs.Tab value="grid">Grid View</Tabs.Tab>
          <Tabs.Tab value="table">Table View</Tabs.Tab>
        </Tabs.List>

        {/* Grid View */}
        <Tabs.Panel value="grid" pt="xl">
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            {competencies.length > 0 ? (
              competencies.map((comp) => (
                <Card key={comp.competency_assessment_id} withBorder p="lg" radius="md">
                  <Group justify="space-between" mb="sm">
                    <Title order={4} size="h5">
                      {comp.name_en}
                    </Title>
                    <Badge
                      color={getLevelColor(comp.current_level)}
                      variant="filled"
                    >
                      Level {comp.current_level}
                    </Badge>
                  </Group>

                  <Text size="sm" c="dimmed" mb="xs">
                    {comp.name_km}
                  </Text>

                  <Stack gap="xs">
                    <div>
                      <Group justify="space-between" mb="xs">
                        <Text size="sm" fw={500}>
                          Score
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
                          Proficient - Ready for certification
                        </Text>
                      </Group>
                    )}

                    {comp.feedback_text && (
                      <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                        <Text size="xs" fw={500} mb="xs">
                          Feedback:
                        </Text>
                        <Text size="xs" c="dimmed">
                          {comp.feedback_text}
                        </Text>
                      </div>
                    )}

                    {comp.assessment_date && (
                      <Text size="xs" c="dimmed">
                        Last assessed: {new Date(comp.assessment_date).toLocaleDateString()}
                      </Text>
                    )}
                  </Stack>
                </Card>
              ))
            ) : (
              <Card withBorder p="lg" radius="md">
                <Text c="dimmed" ta="center">
                  No competency assessments yet
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
                  <Table.Th>Competency (English)</Table.Th>
                  <Table.Th>Competency (Khmer)</Table.Th>
                  <Table.Th>Level</Table.Th>
                  <Table.Th>Score</Table.Th>
                  <Table.Th>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {competencies.map((comp) => (
                  <Table.Tr key={comp.competency_assessment_id}>
                    <Table.Td>{comp.competency_number}</Table.Td>
                    <Table.Td fw={500}>{comp.name_en}</Table.Td>
                    <Table.Td>{comp.name_km}</Table.Td>
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
                            Proficient
                          </Text>
                        </Group>
                      ) : (
                        <Badge color="yellow" variant="light">
                          In Progress
                        </Badge>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          ) : (
            <Alert icon={<IconAlertCircle />} color="gray" title="No Data">
              No competency assessments available yet
            </Alert>
          )}
        </Tabs.Panel>
      </Tabs>

      {/* Legend */}
      <Card withBorder p="lg" radius="md" mb="xl">
        <Title order={4} mb="lg">
          Competency Levels / កម្រិតសមត្ថភាព
        </Title>
        <SimpleGrid cols={{ base: 1, sm: 5 }} spacing="lg">
          {COMPETENCY_LEVELS.map((level) => (
            <Group key={level.level} gap="sm">
              <ThemeIcon variant="light" size={32} radius="md" style={{ backgroundColor: level.color, opacity: 0.3 }}>
                <div style={{ width: 16, height: 16, backgroundColor: level.color, borderRadius: '4px' }} />
              </ThemeIcon>
              <Stack gap={0}>
                <Text fw={500} size="sm">
                  Level {level.level}
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
          <Alert icon={<IconCheck />} color="teal" title="Ready for Certification!" mb="lg">
            Congratulations! You have met all requirements for contract teacher certification. Please contact your coordinator to
            proceed with final certification.
          </Alert>
        )}
    </Container>
  );
}
