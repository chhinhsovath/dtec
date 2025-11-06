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
  SimpleGrid,
  Button,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconAlertCircle,
  IconUsers,
  IconClipboardCheck,
  IconBriefcase,
  IconMessageCircle,
} from '@tabler/icons-react';
import { getSession } from '@/lib/auth/client-auth';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface MentorStats {
  totalMentees: number;
  activeSessions: number;
  pendingAssessments: number;
  portfoliosReviewing: number;
}

export default function MentorDashboardPage() {
  const { language } = useTranslation();
  const [stats, setStats] = useState<MentorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        const session = getSession();

        if (!session) {
          router.push('/auth/login');
          return;
        }

        // For mentor, check if role is "teacher" (since mentors are teachers in the system)
        // In a complete system, this would check for "mentor" role
        if (session.role !== 'teacher' && session.role !== 'admin') {
          router.push(`/dashboard/${session.role}`);
          return;
        }

        // Use mock data for mentor dashboard
        setStats({
          totalMentees: 8,
          activeSessions: 3,
          pendingAssessments: 5,
          portfoliosReviewing: 4,
        });

        setLoading(false);
      } catch (err) {
        console.error('Error loading dashboard:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
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
          <Title order={1}>
            {language === 'km' ? 'ផ្ទាំងគ្រប់គ្រងគ្រូលម្អិត' : 'Mentor Dashboard'}
          </Title>
          <Text c="dimmed">
            {language === 'km' ? 'គ្រប់គ្រងម៉ាក់សិស្សរបស់អ្នក និងតាមដានលក្ខណៈវិវឌ្ឍន៍របស់ពួកគេ' : 'Manage your mentees and track their progress'}
          </Text>
        </div>
      </Group>

      {/* Summary Cards */}
      {stats && (
        <SimpleGrid cols={{ base: 1, md: 2, lg: 4 }} spacing="lg" mb="xl">
          <Card withBorder p="lg" radius="md">
            <Group justify="space-between" mb="lg">
              <Stack gap={0}>
                <Text fw={500} c="dimmed" size="sm">
                  {language === 'km' ? 'សិស្សម៉ាក់សរុប' : 'Total Mentees'}
                </Text>
                <Title order={2}>{stats.totalMentees}</Title>
              </Stack>
              <ThemeIcon variant="light" size={50} radius="md" color="blue">
                <IconUsers size={28} />
              </ThemeIcon>
            </Group>
            <Text size="xs" c="dimmed">
              {language === 'km' ? 'សិស្សបរិញ្ញាបត្រដែលបានផ្តល់ឱ្យ' : 'Assigned graduate students'}
            </Text>
          </Card>

          <Card withBorder p="lg" radius="md">
            <Group justify="space-between" mb="lg">
              <Stack gap={0}>
                <Text fw={500} c="dimmed" size="sm">
                  {language === 'km' ? 'វគ្គសកម្មសកម្ម' : 'Active Sessions'}
                </Text>
                <Title order={2}>{stats.activeSessions}</Title>
              </Stack>
              <ThemeIcon variant="light" size={50} radius="md" color="cyan">
                <IconMessageCircle size={28} />
              </ThemeIcon>
            </Group>
            <Text size="xs" c="dimmed">
              {language === 'km' ? 'វគ្គលម្អិតដែលវិលចូលមក' : 'Upcoming mentorship sessions'}
            </Text>
          </Card>

          <Card withBorder p="lg" radius="md">
            <Group justify="space-between" mb="lg">
              <Stack gap={0}>
                <Text fw={500} c="dimmed" size="sm">
                  {language === 'km' ? 'ការវាយតម្លៃដែលរង្វង់' : 'Pending Assessments'}
                </Text>
                <Title order={2}>{stats.pendingAssessments}</Title>
              </Stack>
              <ThemeIcon variant="light" size={50} radius="md" color="yellow">
                <IconClipboardCheck size={28} />
              </ThemeIcon>
            </Group>
            <Text size="xs" c="dimmed">
              {language === 'km' ? 'វាយតម្លៃសមត្ថភាពដែលត្រូវបំពេញ' : 'Competency assessments to complete'}
            </Text>
          </Card>

          <Card withBorder p="lg" radius="md">
            <Group justify="space-between" mb="lg">
              <Stack gap={0}>
                <Text fw={500} c="dimmed" size="sm">
                  {language === 'km' ? 'ផលប័ត្របង្ហាញ' : 'Portfolios Reviewing'}
                </Text>
                <Title order={2}>{stats.portfoliosReviewing}</Title>
              </Stack>
              <ThemeIcon variant="light" size={50} radius="md" color="teal">
                <IconBriefcase size={28} />
              </ThemeIcon>
            </Group>
            <Text size="xs" c="dimmed">
              {language === 'km' ? 'ផលប័ត្របង្ហាញសិស្សដែលរង្វង់ពេលយោបល់' : 'Student portfolios awaiting feedback'}
            </Text>
          </Card>
        </SimpleGrid>
      )}

      {/* Quick Actions */}
      <Card withBorder p="lg" radius="md" mb="xl">
        <Title order={3} mb="lg">
          {language === 'km' ? 'សកម្មភាពលឿន' : 'Quick Actions'}
        </Title>
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
          <Card
            p="md"
            bg="gray.0"
            style={{ cursor: 'pointer' }}
            onClick={() => router.push('/dashboard/mentor/competency-assessment')}
          >
            <Group mb="sm">
              <IconClipboardCheck size={24} color="#0ea5e9" />
              <Title order={5}>
                {language === 'km' ? 'វាយតម្លៃសមត្ថភាព' : 'Assess Competencies'}
              </Title>
            </Group>
            <Text size="sm" c="dimmed">
              {language === 'km' ? 'វាយតម្លៃកម្រិតសមត្ថភាពម៉ាក់សិស្ស' : 'Evaluate mentee competency levels'}
            </Text>
          </Card>

          <Card
            p="md"
            bg="gray.0"
            style={{ cursor: 'pointer' }}
            onClick={() => router.push('/dashboard/mentor/portfolio-review')}
          >
            <Group mb="sm">
              <IconBriefcase size={24} color="#15aabf" />
              <Title order={5}>
                {language === 'km' ? 'ពិនិត្យផលប័ត្រ' : 'Review Portfolios'}
              </Title>
            </Group>
            <Text size="sm" c="dimmed">
              {language === 'km' ? 'ផ្តល់យោបល់លម្អិតលម្អិតលម្អិត' : 'Provide feedback on evidence'}
            </Text>
          </Card>

          <Card
            p="md"
            bg="gray.0"
            style={{ cursor: 'pointer' }}
            onClick={() => router.push('/dashboard/mentor/mentorship-sessions')}
          >
            <Group mb="sm">
              <IconMessageCircle size={24} color="#37b24d" />
              <Title order={5}>
                {language === 'km' ? 'ផ្នែកវារៈបង្ហាញវគ្គ' : 'Schedule Sessions'}
              </Title>
            </Group>
            <Text size="sm" c="dimmed">
              {language === 'km' ? 'គ្រោងលម្អិតវគ្គលម្អិតជាមួយម៉ាក់សិស្ស' : 'Plan mentorship sessions with mentees'}
            </Text>
          </Card>
        </SimpleGrid>
      </Card>

      {/* Features */}
      <Card withBorder p="lg" radius="md">
        <Title order={3} mb="lg">
          {language === 'km' ? 'លក្ខណៈពិសេស Pedagogy LMS' : 'Pedagogy LMS Features'}
        </Title>
        <Stack gap="md">
          <div>
            <Group justify="space-between" mb="xs">
              <Text fw={500}>
                {language === 'km' ? 'ប្រព័ន្ធវាយតម្លៃសមត្ថភាព' : 'Competency Assessment System'}
              </Text>
              <Badge color="teal">{language === 'km' ? 'សកម្ម' : 'Active'}</Badge>
            </Group>
            <Text size="sm" c="dimmed">
              {language === 'km' ? 'តាមដាននិងវាយតម្លៃសមត្ថភាពបង្រៀនស្នូលចំនួន 10 ដែលមានកម្រិតប្រវ័ណ្ណ 1-5' : 'Track and assess 10 core teaching competencies with proficiency levels 1-5'}
            </Text>
          </div>

          <div>
            <Group justify="space-between" mb="xs">
              <Text fw={500}>
                {language === 'km' ? 'ការគ្រប់គ្រងផលប័ត្រ' : 'Portfolio Management'}
              </Text>
              <Badge color="teal">{language === 'km' ? 'សកម្ម' : 'Active'}</Badge>
            </Group>
            <Text size="sm" c="dimmed">
              {language === 'km' ? 'ពិនិត្យលើការប្រមូលផ្តុំឯកសារចក្ខុវិស័យសិស្ស ហើយផ្តល់យោបល់លម្អិតលម្អិត' : 'Review student evidence collections and provide detailed feedback'}
            </Text>
          </div>

          <div>
            <Group justify="space-between" mb="xs">
              <Text fw={500}>
                {language === 'km' ? 'ការតាមដានវគ្គលម្អិត' : 'Mentorship Session Tracking'}
              </Text>
              <Badge color="teal">{language === 'km' ? 'សកម្ម' : 'Active'}</Badge>
            </Group>
            <Text size="sm" c="dimmed">
              {language === 'km' ? 'កំណត់ពេលវេលាវគ្គ ឯកសារយោបល់ ហើយតាមដានលក្ខណៈវិវឌ្ឍន៍ឆ្ពោះទៅ 10+ វគ្គ' : 'Schedule sessions, document feedback, and track progress toward 10+ sessions'}
            </Text>
          </div>

          <div>
            <Group justify="space-between" mb="xs">
              <Text fw={500}>
                {language === 'km' ? 'ការគាំទ្របើភាសាពីរ' : 'Bilingual Support'}
              </Text>
              <Badge color="teal">{language === 'km' ? 'សកម្ម' : 'Active'}</Badge>
            </Group>
            <Text size="sm" c="dimmed">
              {language === 'km' ? 'ការគាំទ្របូរណៈពេញលេញខ្មែរ និងអង់គ្លេសលើផ្នែកឆ្នាំទូទៅនៃវេទិកា' : 'Full Khmer and English support throughout the platform'}
            </Text>
          </div>
        </Stack>
      </Card>
    </Container>
  );
}
