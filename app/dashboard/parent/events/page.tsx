'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth/client-auth';
import { IconArrowLeft, IconLoader } from '@tabler/icons-react';
import EventsView from '@/app/components/parent-portal/EventsView';
import { Container, Group, Title, Text, Button, Loader, Center, Stack, Paper } from '@mantine/core';

export default function ParentEventsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = getSession();

        if (!session || !['parent', 'guardian'].includes(session.role)) {
          router.push('/auth/login');
          return;
        }

        setAuthorized(true);
        setLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/auth/login');
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <Center h="100vh" bg="gray.0">
        <Stack align="center" gap="md">
          <Loader size="lg" color="blue" />
          <Text c="dimmed">Loading events...</Text>
        </Stack>
      </Center>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <Stack gap={0} mih="100vh" bg="gray.0">
      {/* Header */}
      <Paper withBorder p="md">
        <Container size="xl">
          <Group gap="md">
            <Button
              variant="subtle"
              color="gray"
              onClick={() => router.back()}
              leftSection={<IconArrowLeft size={18} />}
            >
            </Button>
            <Stack gap={4}>
              <Title order={1}>School Events</Title>
              <Text size="sm" c="dimmed">View and RSVP to upcoming events</Text>
            </Stack>
          </Group>
        </Container>
      </Paper>

      {/* Content */}
      <Container size="xl" py="xl">
        <EventsView />
      </Container>
    </Stack>
  );
}
