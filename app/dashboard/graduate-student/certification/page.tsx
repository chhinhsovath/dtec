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
  Progress,
  SimpleGrid,
  Stepper,
  RingProgress,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconAlertCircle,
  IconCheck,
  IconClock,
  IconTargetArrow,
  IconAward,
  IconBookmark,
  IconUsers,
  IconFileText,
} from '@tabler/icons-react';
import { getSession } from '@/lib/auth/client-auth';
import { getCurrentLanguage } from '@/lib/i18n/i18n';

interface CertificationRequirement {
  requirement_id: string;
  requirement_name: string;
  requirement_name_km: string;
  target_value: number;
  current_value: number;
  is_completed: boolean;
  description: string;
  description_km: string;
}

interface CertificationData {
  requirements: CertificationRequirement[];
  readiness: {
    isReadyForCertification: boolean;
    completedRequirements: number;
    totalRequirements: number;
    percentage: number;
  };
}

export default function CertificationPage() {
  const [data, setData] = useState<CertificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'en' | 'km'>('km');
  const router = useRouter();

  useEffect(() => {
    setLanguage(getCurrentLanguage());
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

        const res = await fetch('/api/graduate-student/certification');
        if (!res.ok) {
          throw new Error('Failed to fetch certification data');
        }

        const result = await res.json();
        setData(result.data);
        setLoading(false);
      } catch (err) {
        console.error('Error loading certification data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load certification data');
        setLoading(false);
      }
    };

    loadData();
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

  const readiness = data?.readiness;
  const requirements = data?.requirements || [];
  const completedCount = requirements.filter((r) => r.is_completed).length;

  return (
    <Container size="xl" py="xl">
      {/* Header */}
      <Group mb="xl">
        <Button
          variant="default"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => router.back()}
        >
          {language === 'km' ? 'ថយក្រោយ' : 'Back'}
        </Button>
        <div style={{ flex: 1 }}>
          <Title order={1}>{language === 'km' ? 'សញ្ញាបត្រ' : 'Certification'}</Title>
          <Text c="dimmed">{language === 'km' ? 'តាមដានវឌ្ឍនភាពឆ្ពោះទៅរកសញ្ញាបត្រគ្រូបង្រៀន' : 'Track your progress toward contract teacher certification'}</Text>
        </div>
      </Group>

      {/* Readiness Status - Large Card */}
      {readiness && (
        <Card withBorder p="xl" radius="md" mb="xl" bg={readiness.isReadyForCertification ? 'teal.0' : 'blue.0'}>
          <Group justify="space-between" align="flex-start">
            <div>
              <Title order={2} mb="sm">
                {readiness.isReadyForCertification ? (language === 'km' ? '✓ រួចរាល់សម្រាប់សញ្ញាបត្រ' : '✓ Ready for Certification') : (language === 'km' ? 'កំពុងដំណើរការ' : 'In Progress')}
              </Title>
              <Text c="dimmed" mb="lg">
                {readiness.isReadyForCertification
                  ? (language === 'km' ? 'អ្នកបានបំពេញតម្រូវការសញ្ញាបត្រទាំងអស់ហើយ។ ឥឡូវអ្នកអាចដាក់ពាក្យសុំសញ្ញាបត្រគ្រូបង្រៀនបានហើយ!' : 'You have completed all certification requirements. You can now apply for your contract teacher certificate!')
                  : `${readiness.completedRequirements} ${language === 'km' ? 'ក្នុងចំណោម' : 'of'} ${readiness.totalRequirements} ${language === 'km' ? 'តម្រូវការបានបំពេញ' : 'requirements completed'}`}
              </Text>

              <Group gap="lg">
                <div>
                  <Text fw={500} size="sm" c="dimmed">
                    {language === 'km' ? 'វឌ្ឍនភាព' : 'Progress'}
                  </Text>
                  <Title order={3}>{readiness.percentage.toFixed(0)}%</Title>
                </div>
                <div>
                  <Text fw={500} size="sm" c="dimmed">
                    {language === 'km' ? 'តម្រូវការបានបំពេញ' : 'Requirements Completed'}
                  </Text>
                  <Title order={3}>
                    {readiness.completedRequirements}/{readiness.totalRequirements}
                  </Title>
                </div>
              </Group>
            </div>

            <RingProgress
              sections={[{ value: readiness.percentage, color: readiness.isReadyForCertification ? 'teal' : 'blue' }]}
              size={140}
              thickness={6}
              label={
                <Stack gap={0} align="center">
                  <Text fw={700} size="lg">
                    {readiness.percentage.toFixed(0)}%
                  </Text>
                  <Text size="xs" c="dimmed">
                    Complete
                  </Text>
                </Stack>
              }
            />
          </Group>

          {readiness.isReadyForCertification && (
            <Alert icon={<IconCheck />} color="teal" title={language === 'km' ? 'រួចរាល់!' : 'Ready!'} mt="lg">
              {language === 'km' ? 'បានបំពេញតម្រូវការទាំងអស់! សូមទាក់ទងអ្នកសម្របសម្រួលដើម្បីចេញសញ្ញាបត្ររបស់អ្នក។' : 'All requirements completed! Contact your coordinator to issue your certificate.'}
            </Alert>
          )}
        </Card>
      )}

      {/* Requirements Checklist */}
      <Card withBorder p="lg" radius="md">
        <Title order={3} mb="lg">
          {language === 'km' ? 'តម្រូវការសញ្ញាបត្រ' : 'Certification Requirements'}
        </Title>

        <Stack gap="md">
          {requirements.map((req) => (
            <div key={req.requirement_id}>
              <Group justify="space-between" mb="xs">
                <div style={{ flex: 1 }}>
                  <Group gap="xs" mb="xs">
                    {req.is_completed ? (
                      <ThemeIcon size="sm" color="teal" variant="filled" radius="xl">
                        <IconCheck size={14} />
                      </ThemeIcon>
                    ) : (
                      <ThemeIcon size="sm" color="gray" variant="light" radius="xl">
                        <IconClock size={14} />
                      </ThemeIcon>
                    )}
                    <div>
                      <Text fw={500}>{req.requirement_name}</Text>
                      <Text size="xs" c="dimmed">
                        {req.requirement_name_km}
                      </Text>
                    </div>
                  </Group>
                  <Text size="sm" c="dimmed" ml="28">
                    {req.description}
                  </Text>
                </div>

                <Badge
                  size="lg"
                  variant={req.is_completed ? 'filled' : 'light'}
                  color={req.is_completed ? 'teal' : 'gray'}
                >
                  {req.current_value}/{req.target_value}
                </Badge>
              </Group>

              <Progress
                value={(req.current_value / req.target_value) * 100}
                color={req.is_completed ? 'teal' : 'yellow'}
                size="sm"
                radius="md"
                ml="28"
                mb="md"
              />
            </div>
          ))}
        </Stack>
      </Card>

      {/* Timeline of Completion */}
      {readiness && (
        <Card withBorder p="lg" radius="md" mt="xl">
          <Title order={3} mb="lg">
            Certification Path / ផ្លូវឆ្ពោលកៅណា
          </Title>

          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
            {/* Phase 1 - Competencies */}
            <Card p="md" bg="gray.0" withBorder>
              <Group justify="space-between" mb="sm">
                <Title order={5}>Competency Mastery</Title>
                {completedCount > 0 && <IconCheck size={20} color="teal" />}
              </Group>
              <Text size="sm" c="dimmed" mb="sm">
                Achieve Level 3+ in all 10 core competencies
              </Text>
              <Badge variant="light" color={completedCount > 0 ? 'teal' : 'gray'}>
                {completedCount} competencies
              </Badge>
            </Card>

            {/* Phase 2 - Teaching Practice */}
            <Card p="md" bg="gray.0" withBorder>
              <Group justify="space-between" mb="sm">
                <Title order={5}>Teaching Practice</Title>
                {requirements.some((r) => r.requirement_name === 'Teaching Hours' && r.is_completed) && (
                  <IconCheck size={20} color="teal" />
                )}
              </Group>
              <Text size="sm" c="dimmed" mb="sm">
                Complete 120+ hours in partner school
              </Text>
              <Text size="xs">
                {requirements.find((r) => r.requirement_name === 'Teaching Hours')?.current_value || 0}/120 hours
              </Text>
            </Card>

            {/* Phase 3 - Portfolio & Assessment */}
            <Card p="md" bg="gray.0" withBorder>
              <Group justify="space-between" mb="sm">
                <Title order={5}>Portfolio & Mentorship</Title>
                {requirements.some((r) => r.requirement_name === 'Portfolio Evidence' && r.is_completed) && (
                  <IconCheck size={20} color="teal" />
                )}
              </Group>
              <Text size="sm" c="dimmed" mb="sm">
                Evidence for all competencies + 10 mentor sessions
              </Text>
              <Badge variant="light" color="blue">
                Complete all
              </Badge>
            </Card>
          </SimpleGrid>
        </Card>
      )}

      {/* Next Steps */}
      {readiness && !readiness.isReadyForCertification && (
        <Card withBorder p="lg" radius="md" mt="xl" bg="yellow.0">
          <Title order={4} mb="md">
            Next Steps / ដំណាក់កាលបន្ទាប់
          </Title>
          <Stack gap="md">
            {requirements
              .filter((r) => !r.is_completed)
              .slice(0, 3)
              .map((req, idx) => (
                <Group key={req.requirement_id} gap="sm">
                  <Badge size="sm" variant="light" color="yellow">
                    {idx + 1}
                  </Badge>
                  <div style={{ flex: 1 }}>
                    <Text fw={500} size="sm">
                      {req.requirement_name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {req.description}
                    </Text>
                  </div>
                  <Text size="sm" fw={500}>
                    {req.target_value - req.current_value} remaining
                  </Text>
                </Group>
              ))}
          </Stack>
        </Card>
      )}

      {/* Info Card */}
      <Alert icon={<IconAlertCircle />} color="blue" mt="xl">
        <Stack gap="xs">
          <Text fw={500}>About Certification</Text>
          <Text size="sm">
            The contract teacher certificate is awarded upon completion of all program requirements:
          </Text>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>
              <Text size="sm">All 10 competencies at proficiency level 3 or higher</Text>
            </li>
            <li>
              <Text size="sm">120+ hours of actual classroom teaching</Text>
            </li>
            <li>
              <Text size="sm">Portfolio with evidence for each competency</Text>
            </li>
            <li>
              <Text size="sm">At least 10 mentorship sessions completed</Text>
            </li>
            <li>
              <Text size="sm">Final approval from program coordinator</Text>
            </li>
          </ul>
        </Stack>
      </Alert>
    </Container>
  );
}
