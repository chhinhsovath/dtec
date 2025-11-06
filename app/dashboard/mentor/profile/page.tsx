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
} from '@mantine/core';
import {
  IconArrowLeft,
  IconAlertCircle,
} from '@tabler/icons-react';
import { getSession, AuthUser } from '@/lib/auth/client-auth';
import { Button } from '@mantine/core';

export default function MentorProfilePage() {
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

        if (session.role !== 'teacher' && session.role !== 'admin') {
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
          <Title order={1}>Mentor Profile / ប្រវត្តិលម្អិត</Title>
          <Text c="dimmed">Your mentor account information</Text>
        </div>
      </Group>

      {/* Profile Card */}
      <Card withBorder p="lg" radius="md">
        <Title order={3} mb="lg">
          Account Information / ព័ត៌មានគណនី
        </Title>

        <Stack gap="md">
          <div>
            <Text fw={500} size="sm" c="dimmed">
              Name / ឈ្មោះ
            </Text>
            <Text size="lg">{user?.full_name || 'N/A'}</Text>
          </div>

          <div>
            <Text fw={500} size="sm" c="dimmed">
              Email / អ៊ីមែល
            </Text>
            <Text size="lg">{user?.email || 'N/A'}</Text>
          </div>

          <div>
            <Text fw={500} size="sm" c="dimmed">
              Role / តួនាទី
            </Text>
            <Text size="lg">Mentor / គ្រូលម្អិត</Text>
          </div>

          <div>
            <Text fw={500} size="sm" c="dimmed">
              User ID / លេខសម្គាល់
            </Text>
            <Text size="lg" style={{ fontFamily: 'monospace' }}>
              {user?.id || 'N/A'}
            </Text>
          </div>
        </Stack>
      </Card>

      {/* Pedagogy LMS Information */}
      <Card withBorder p="lg" radius="md" mt="xl">
        <Title order={3} mb="lg">
          Pedagogy LMS Role / តួនាទីក្នុងប្រព័ន្ធ
        </Title>

        <Alert color="blue" title="Mentor Role">
          As a mentor in the Pedagogy LMS, you are responsible for:
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>Assessing graduate students' competency levels (1-5 scale)</li>
            <li>Reviewing and providing feedback on student portfolios</li>
            <li>Scheduling and conducting mentorship sessions</li>
            <li>Tracking student progress toward certification</li>
            <li>Supporting students in achieving 10+ competency requirements</li>
          </ul>
        </Alert>
      </Card>
    </Container>
  );
}
