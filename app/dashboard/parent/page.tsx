'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth/client-auth';
import { useTranslation } from '@/lib/i18n/useTranslation';
import ParentDashboard from '@/app/components/parent-portal/ParentDashboard';
import { Container, Title, Text, Loader, Center, Stack, Paper, Grid, Anchor, Divider } from '@mantine/core';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
}

export default function ParentPage() {
  const { t, language, changeLanguage, isLoaded } = useTranslation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Check session from localStorage
        const session = getSession();

        if (!session) {
          router.push('/auth/login');
          return;
        }

        // Check if user is parent or guardian
        if (!['parent', 'guardian'].includes(session.role)) {
          router.push(`/dashboard/${session.role}`);
          return;
        }

        setProfile(session);
        setLoading(false);
      } catch (error) {
        console.error('Error loading profile:', error);
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  if (loading || !isLoaded) {
    return (
      <Center h="100vh" bg="gray.0">
        <Stack align="center" gap="md">
          <Loader size="xl" color="blue" />
          <Text size="lg" c="dimmed">{t('common.loading')}</Text>
        </Stack>
      </Center>
    );
  }

  if (!profile) {
    return (
      <Center h="100vh" bg="gray.0">
        <Text size="lg" c="red">{t('common.error')}</Text>
      </Center>
    );
  }

  return (
    <Stack gap={0} mih="100vh" bg="gray.0" style={{ paddingTop: '24px' }}>
      {/* Main Content */}
      <Container size="xl" py="xl" style={{ flex: 1 }}>
        <Title order={2} mb="xl">{t('dashboard.parent.title') || 'Parent Portal'}</Title>
        <ParentDashboard />
      </Container>

      {/* Footer */}
      <Paper withBorder p="xl" mt="xl">
        <Container size="xl">
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Stack gap="sm">
                <Text fw={600}>{t('dashboard.parent.quickLinks') || 'Quick Links'}</Text>
                <Stack gap="xs">
                  <Anchor href="/dashboard/parent/messages" size="sm" c="dimmed">
                    {t('navigation.messages') || 'Messages'}
                  </Anchor>
                  <Anchor href="/dashboard/parent/notifications" size="sm" c="dimmed">
                    {t('navigation.notifications') || 'Notifications'}
                  </Anchor>
                  <Anchor href="/dashboard/parent/documents" size="sm" c="dimmed">
                    {t('navigation.documents') || 'Documents'}
                  </Anchor>
                  <Anchor href="/dashboard/parent/events" size="sm" c="dimmed">
                    {t('navigation.events') || 'Events'}
                  </Anchor>
                </Stack>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Stack gap="sm">
                <Text fw={600}>{t('navigation.students') || 'Students'}</Text>
                <Stack gap="xs">
                  <Anchor href="/dashboard/parent" size="sm" c="dimmed">
                    {t('dashboard.parent.viewGrades') || 'View Grades'}
                  </Anchor>
                  <Anchor href="/dashboard/parent" size="sm" c="dimmed">
                    {t('dashboard.parent.viewAttendance') || 'View Attendance'}
                  </Anchor>
                  <Anchor href="/dashboard/parent" size="sm" c="dimmed">
                    {t('dashboard.parent.viewProgress') || 'View Progress'}
                  </Anchor>
                </Stack>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Stack gap="sm">
                <Text fw={600}>{t('common.support') || 'Support'}</Text>
                <Stack gap="xs">
                  <Anchor href="/help" size="sm" c="dimmed">
                    {t('common.help') || 'Help Center'}
                  </Anchor>
                  <Anchor href="/faq" size="sm" c="dimmed">
                    {t('common.faq') || 'FAQ'}
                  </Anchor>
                  <Anchor href="/contact" size="sm" c="dimmed">
                    {t('common.contact') || 'Contact Us'}
                  </Anchor>
                </Stack>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Stack gap="sm">
                <Text fw={600}>{t('common.info') || 'Information'}</Text>
                <Stack gap="xs">
                  <Anchor href="/privacy" size="sm" c="dimmed">
                    {t('common.privacy') || 'Privacy Policy'}
                  </Anchor>
                  <Anchor href="/terms" size="sm" c="dimmed">
                    {t('common.terms') || 'Terms of Service'}
                  </Anchor>
                  <Anchor href="/about" size="sm" c="dimmed">
                    {t('common.about') || 'About Us'}
                  </Anchor>
                </Stack>
              </Stack>
            </Grid.Col>
          </Grid>
          <Divider my="xl" />
          <Text size="sm" ta="center" c="dimmed">
            &copy; 2024 {t('app.name') || 'TEC LMS'}. {t('common.allRightsReserved') || 'All rights reserved'}.
          </Text>
        </Container>
      </Paper>
    </Stack>
  );
}
