'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Title,
  Text,
  Card,
  Loader,
  Center,
  Stack,
  Group,
  Alert,
  Button,
  SimpleGrid,
  ThemeIcon,
  Badge,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconAlertCircle,
  IconUser,
  IconMail,
  IconId,
  IconSchool,
  IconBookmarks,
  IconClock,
  IconBriefcase,
  IconMessageCircle,
  IconCertificate,
} from '@tabler/icons-react';
import { getSession, AuthUser } from '@/lib/auth/client-auth';

export default function StudentProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
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

        if (session.role !== 'student') {
          router.push(`/dashboard/${session.role}`);
          return;
        }

        setUser(session);
        setLoading(false);
      } catch (err) {
        console.error('Error loading profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
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
    <Container size="lg" py="xl">
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
          <Title order={1}>Student Profile / ប្រវត្តិលម្អិត</Title>
          <Text c="dimmed">Your student account information</Text>
        </div>
      </Group>

      {/* Account Information Card */}
      <Card withBorder p="lg" radius="md" mb="xl">
        <Title order={3} mb="lg">
          Account Information / ព័ត៌មានគណនី
        </Title>

        <Stack gap="md">
          <Group grow>
            <div>
              <Group gap="xs" mb="xs">
                <IconUser size={16} color="blue" />
                <Text fw={500} size="sm" c="dimmed">
                  Full Name / ឈ្មោះពេញលេញ
                </Text>
              </Group>
              <Text size="lg" fw={500}>
                {user?.full_name || 'N/A'}
              </Text>
            </div>

            <div>
              <Group gap="xs" mb="xs">
                <IconMail size={16} color="blue" />
                <Text fw={500} size="sm" c="dimmed">
                  Email / អ៊ីមែល
                </Text>
              </Group>
              <Text size="lg" fw={500}>
                {user?.email || 'N/A'}
              </Text>
            </div>
          </Group>

          <Group grow>
            <div>
              <Group gap="xs" mb="xs">
                <IconSchool size={16} color="blue" />
                <Text fw={500} size="sm" c="dimmed">
                  Role / តួនាទី
                </Text>
              </Group>
              <Badge size="lg" color="cyan" variant="light">
                Graduate Student / ឡើងលម្អិត
              </Badge>
            </div>

            <div>
              <Group gap="xs" mb="xs">
                <IconId size={16} color="blue" />
                <Text fw={500} size="sm" c="dimmed">
                  User ID / លេខសម្គាល់
                </Text>
              </Group>
              <Text size="sm" style={{ fontFamily: 'monospace' }}>
                {user?.id || 'N/A'}
              </Text>
            </div>
          </Group>
        </Stack>
      </Card>

      {/* Pedagogy LMS Role Information */}
      <Card withBorder p="lg" radius="md" mb="xl">
        <Title order={3} mb="lg">
          Pedagogy LMS Graduate Student Program / កម្មវិធីបង្រៀនគ្រូច្រៃលំង្វល់
        </Title>

        <Alert color="blue" title="Your Role as a Graduate Student" mb="lg">
          <Text size="sm" mb="md">
            As a graduate student in the Pedagogy LMS (Contract Teacher Training Program), you are completing a comprehensive 6-month teacher certification program. Your responsibilities include:
          </Text>
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>
              <strong>Competency Assessment:</strong> Develop mastery across 10 core teaching competencies with mentor feedback
            </li>
            <li>
              <strong>Teaching Practice:</strong> Complete 120+ hours of supervised teaching in school placements
            </li>
            <li>
              <strong>Portfolio Development:</strong> Collect and submit evidence of learning for each competency
            </li>
            <li>
              <strong>Mentorship Sessions:</strong> Participate in regular feedback and coaching sessions with your mentor
            </li>
            <li>
              <strong>Certification:</strong> Complete all requirements to earn your teaching certification
            </li>
          </ul>
        </Alert>
      </Card>

      {/* Program Features */}
      <div>
        <Title order={3} mb="lg">
          Program Features / លក្ខណៈពិសេស
        </Title>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          <Card withBorder p="lg" radius="md">
            <Group justify="space-between" mb="md">
              <Title order={4} size="h5">
                Competencies
              </Title>
              <ThemeIcon variant="light" size={40} radius="md" color="blue">
                <IconBookmarks size={20} />
              </ThemeIcon>
            </Group>
            <Text size="sm" c="dimmed">
              Track your progress across 10 core teaching competencies (Self-Awareness, Subject Matter Knowledge, Curriculum Design, and more)
            </Text>
          </Card>

          <Card withBorder p="lg" radius="md">
            <Group justify="space-between" mb="md">
              <Title order={4} size="h5">
                Teaching Hours
              </Title>
              <ThemeIcon variant="light" size={40} radius="md" color="violet">
                <IconClock size={20} />
              </ThemeIcon>
            </Group>
            <Text size="sm" c="dimmed">
              Log and track your 120+ hours of supervised teaching practice in school placements
            </Text>
          </Card>

          <Card withBorder p="lg" radius="md">
            <Group justify="space-between" mb="md">
              <Title order={4} size="h5">
                Portfolio
              </Title>
              <ThemeIcon variant="light" size={40} radius="md" color="green">
                <IconBriefcase size={20} />
              </ThemeIcon>
            </Group>
            <Text size="sm" c="dimmed">
              Collect and submit evidence of learning and teaching practice for certification requirements
            </Text>
          </Card>

          <Card withBorder p="lg" radius="md">
            <Group justify="space-between" mb="md">
              <Title order={4} size="h5">
                Mentorship
              </Title>
              <ThemeIcon variant="light" size={40} radius="md" color="cyan">
                <IconMessageCircle size={20} />
              </ThemeIcon>
            </Group>
            <Text size="sm" c="dimmed">
              Receive personalized feedback and coaching from experienced mentors throughout the program
            </Text>
          </Card>

          <Card withBorder p="lg" radius="md">
            <Group justify="space-between" mb="md">
              <Title order={4} size="h5">
                School Practicum
              </Title>
              <ThemeIcon variant="light" size={40} radius="md" color="orange">
                <IconSchool size={20} />
              </ThemeIcon>
            </Group>
            <Text size="sm" c="dimmed">
              Participate in supervised teaching practice in partner schools with real student classrooms
            </Text>
          </Card>

          <Card withBorder p="lg" radius="md">
            <Group justify="space-between" mb="md">
              <Title order={4} size="h5">
                Certification
              </Title>
              <ThemeIcon variant="light" size={40} radius="md" color="teal">
                <IconCertificate size={20} />
              </ThemeIcon>
            </Group>
            <Text size="sm" c="dimmed">
              Upon successful completion of all requirements, earn your teaching certification
            </Text>
          </Card>
        </SimpleGrid>
      </div>

      {/* Program Requirements */}
      <Card withBorder p="lg" radius="md" mt="xl">
        <Title order={3} mb="lg">
          Certification Requirements / តម្រូវការលើឯកសារ
        </Title>

        <Text mb="md" c="dimmed">
          To earn your teaching certification, you must successfully complete the following:
        </Text>

        <Stack gap="md">
          <div>
            <Title order={5} size="h6">
              ✓ All 10 Competencies at Level 3+ (Proficient)
            </Title>
            <Text size="sm" c="dimmed">
              Demonstrate proficiency in all 10 core teaching competencies as assessed by your mentor
            </Text>
          </div>

          <div>
            <Title order={5} size="h6">
              ✓ 120+ Hours of Supervised Teaching
            </Title>
            <Text size="sm" c="dimmed">
              Complete minimum 120 hours of documented teaching practice in partner schools
            </Text>
          </div>

          <div>
            <Title order={5} size="h6">
              ✓ Portfolio Evidence Submission
            </Title>
            <Text size="sm" c="dimmed">
              Submit at least 2 pieces of evidence for each competency demonstrating your teaching practice
            </Text>
          </div>

          <div>
            <Title order={5} size="h6">
              ✓ Mentorship Sessions Completion
            </Title>
            <Text size="sm" c="dimmed">
              Participate in regular mentorship sessions and receive feedback from your assigned mentor
            </Text>
          </div>

          <div>
            <Title order={5} size="h6">
              ✓ Final Assessment & Coordinator Approval
            </Title>
            <Text size="sm" c="dimmed">
              Pass final assessment and receive approval from the program coordinator
            </Text>
          </div>
        </Stack>
      </Card>

      {/* Support Information */}
      <Alert icon={<IconAlertCircle />} color="cyan" title="Need Help?" mt="xl">
        If you have questions about the program, requirements, or need technical support, please contact your mentor or program coordinator. Your dashboard provides access to all resources, documentation, and communication tools you need to succeed.
      </Alert>
    </Container>
  );
}
