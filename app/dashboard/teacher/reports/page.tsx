'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth/client-auth';
import {
  Container,
  Title,
  Text,
  Button,
  Center,
  Stack,
  Loader,
} from '@mantine/core';
import { IconTools } from '@tabler/icons-react';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
}

export default function ReportsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadProfile = async () => {
      const session = getSession();

      if (!session) {
        router.push('/auth/login');
        return;
      }

      if (session.role !== 'teacher') {
        router.push(`/dashboard/${session.role}`);
        return;
      }

      setProfile(session);
      setLoading(false);
    };

    loadProfile();
  }, [router]);

  if (loading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', paddingTop: '24px' }}>
      <Container size="lg">
        <Stack gap="xl" align="center" justify="center" style={{ minHeight: '80vh' }}>
          <IconTools size={96} color="#999" stroke={1.5} />
          <Stack gap="md" align="center">
            <Title order={2}>Reports - Under Construction</Title>
            <Text c="dimmed" size="lg" ta="center">
              This page is currently under development. We're working on bringing you comprehensive reports and analytics soon.
            </Text>
          </Stack>
          <Button onClick={() => router.push('/dashboard/teacher')} size="lg">
            Back to Dashboard
          </Button>
        </Stack>
      </Container>
    </div>
  );
}
