'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth/client-auth';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  Container,
  Title,
  Text,
  Button,
  Stack,
  Loader,
  Paper,
  TextInput,
  Group,
  Alert,
  Tabs,
  Avatar,
  SimpleGrid,
  Center,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconCheck,
  IconUser,
  IconFileText,
  IconMail,
} from '@tabler/icons-react';

interface TeacherProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: string;
  created_at: string;
  updated_at?: string;
}

interface FormData {
  firstName: string;
  lastName: string;
}

export default function TeacherProfilePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
  });

  // Check authentication and load profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const session = getSession();

        if (!session) {
          router.push('/auth/login');
          return;
        }

        if (session.role !== 'teacher') {
          router.push(`/dashboard/${session.role}`);
          return;
        }

        // Fetch teacher profile
        const response = await fetch(`/api/teacher/profile?userId=${session.id}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || result.error || t('teacherProfile.failedToLoad'));
        }

        setProfile(result.data);

        // Parse full_name into firstName and lastName
        const names = (result.data.full_name || '').split(' ');
        const firstName = names[0] || '';
        const lastName = names.slice(1).join(' ') || '';

        setFormData({
          firstName,
          lastName,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : t('teacherProfile.failedToLoad');
        setError(errorMessage);
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router, t]);

  // Handle form input changes
  const handleInputChange = (
    field: keyof FormData,
    value: string | number
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const session = getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      // Validate required fields
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        setError(t('validation.required'));
        return;
      }

      const response = await fetch('/api/teacher/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.id,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber,
          bio: formData.bio,
          qualifications: formData.qualifications,
          specialization: formData.specialization,
          yearsOfExperience: formData.yearsOfExperience,
          certificationNumber: formData.certificationNumber,
          officeHours: formData.officeHours,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || t('teacherProfile.failedToUpdate'));
      }

      setProfile(result.data);
      setSuccess(t('teacherProfile.profileUpdated'));

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('teacherProfile.failedToUpdate');
      setError(errorMessage);
      console.error('Error updating profile:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  if (!profile) {
    return (
      <Container size="lg" py="xl">
        <Alert icon={<IconAlertCircle />} color="red" title={t('common.error')}>
          {error || t('teacherProfile.failedToLoad')}
        </Alert>
        <Button onClick={() => router.push('/dashboard/teacher')} mt="lg">
          {t('teacherProfile.backToDashboard')}
        </Button>
      </Container>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', paddingTop: '24px', paddingBottom: '24px' }}>
      <Container size="lg">
        <Stack gap="xl">
          {/* Header */}
          <div>
            <Title order={2}>{t('teacherProfile.title')}</Title>
            <Text c="dimmed" mt="xs">
              {t('teacherProfile.subtitle')}
            </Text>
          </div>

          {/* Alert Messages */}
          {error && (
            <Alert icon={<IconAlertCircle />} color="red" onClose={() => setError(null)} closable>
              {error}
            </Alert>
          )}

          {success && (
            <Alert icon={<IconCheck />} color="green" onClose={() => setSuccess(null)} closable>
              {success}
            </Alert>
          )}

          {/* Profile Tabs */}
          <Tabs defaultValue="overview">
            <Tabs.List>
              <Tabs.Tab value="overview" leftSection={<IconUser size={14} />}>
                {t('teacherProfile.overview')}
              </Tabs.Tab>
              <Tabs.Tab value="edit" leftSection={<IconFileText size={14} />}>
                {t('teacherProfile.editProfile')}
              </Tabs.Tab>
              <Tabs.Tab value="professional" leftSection={<IconMail size={14} />}>
                {t('teacherProfile.professionalInfo')}
              </Tabs.Tab>
            </Tabs.List>

            {/* Overview Tab */}
            <Tabs.Panel value="overview" pt="xl">
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                {/* Profile Card */}
                <Paper shadow="sm" p="xl" radius="md">
                  <Stack gap="md">
                    <Group gap="md">
                      <Avatar
                        src={profile.avatar_url}
                        alt={profile.full_name}
                        size={120}
                        radius="md"
                      />
                      <Stack gap={0}>
                        <Title order={3}>
                          {profile.full_name}
                        </Title>
                        <Text size="sm" mt="xs">
                          {profile.email}
                        </Text>
                      </Stack>
                    </Group>
                    <Divider />
                    <Group justify="space-between">
                      <div>
                        <Text size="sm" c="dimmed">
                          {t('teacherProfile.memberSince')}
                        </Text>
                        <Text fw={500}>
                          {new Date(profile.created_at).toLocaleDateString()}
                        </Text>
                      </div>
                    </Group>
                  </Stack>
                </Paper>

              </SimpleGrid>

            </Tabs.Panel>

            {/* Edit Tab */}
            <Tabs.Panel value="edit" pt="xl">
              <Paper shadow="sm" p="xl" radius="md">
                <form onSubmit={handleSubmit}>
                  <Stack gap="lg">
                    <SimpleGrid cols={{ base: 1, md: 2 }}>
                      <TextInput
                        label={t('teacherProfile.firstName')}
                        placeholder={t('teacherProfile.firstNamePlaceholder')}
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.currentTarget.value)}
                        required
                        disabled={submitting}
                      />
                      <TextInput
                        label={t('teacherProfile.lastName')}
                        placeholder={t('teacherProfile.lastNamePlaceholder')}
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.currentTarget.value)}
                        required
                        disabled={submitting}
                      />
                    </SimpleGrid>

                    <TextInput
                      label={t('teacherProfile.email')}
                      placeholder={t('teacherProfile.email')}
                      value={profile.email}
                      disabled
                      description={t('teacherProfile.emailDisabled')}
                    />

                    <Group justify="flex-end" gap="sm">
                      <Button
                        variant="default"
                        onClick={() => router.push('/dashboard/teacher')}
                        disabled={submitting}
                      >
                        {t('common.cancel')}
                      </Button>
                      <Button
                        type="submit"
                        loading={submitting}
                        disabled={submitting}
                      >
                        {t('teacherProfile.saveChanges')}
                      </Button>
                    </Group>
                  </Stack>
                </form>
              </Paper>
            </Tabs.Panel>

            {/* Professional Info Tab */}
            <Tabs.Panel value="professional" pt="xl">
              <Paper shadow="sm" p="xl" radius="md">
                <Stack gap="lg">
                  <Alert icon={<IconAlertCircle />} color="blue" title={t('common.info')}>
                    {t('teacherProfile.professionalInfoComingSoon') || 'Additional professional information features coming soon'}
                  </Alert>
                </Stack>
              </Paper>
            </Tabs.Panel>
          </Tabs>

          {/* Back Button */}
          <Group justify="flex-start">
            <Button
              variant="light"
              onClick={() => router.push('/dashboard/teacher')}
            >
              {t('teacherProfile.backToDashboard')}
            </Button>
          </Group>
        </Stack>
      </Container>
    </div>
  );
}
