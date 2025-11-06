'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth/client-auth';
import {
  Container,
  Title,
  Text,
  Paper,
  Stack,
  Group,
  Button,
  NumberInput,
  Switch,
  Loader,
  Alert,
  ActionIcon,
  Box,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconCheck,
  IconAlertCircle,
} from '@tabler/icons-react';

interface UserPolicies {
  password_min_length: number;
  password_require_uppercase: boolean;
  password_require_numbers: boolean;
  password_require_special_chars: boolean;
  session_timeout_minutes: number;
  login_attempt_limit: number;
  require_email_verification: boolean;
  allow_self_registration: boolean;
}

export default function UserPoliciesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserPolicies>({
    password_min_length: 8,
    password_require_uppercase: true,
    password_require_numbers: true,
    password_require_special_chars: false,
    session_timeout_minutes: 120,
    login_attempt_limit: 5,
    require_email_verification: true,
    allow_self_registration: true,
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const session = getSession();
        if (!session || session.role !== 'admin') {
          router.push('/auth/login');
          return;
        }
        setAuthorized(true);
      } catch (err) {
        console.error('Auth check failed:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [router]);

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/admin/settings/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save settings');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <Stack align="center" justify="center" mih="70vh">
          <Loader size="lg" />
        </Stack>
      </Container>
    );
  }

  if (!authorized) return null;

  return (
    <Box bg="gray.0" mih="100vh">
      <Paper shadow="xs" mb="xl" p="xl">
        <Container size="lg">
          <Group gap="md">
            <ActionIcon
              size="lg"
              variant="subtle"
              onClick={() => router.push('/dashboard/admin/settings')}
            >
              <IconArrowLeft size={20} />
            </ActionIcon>
            <Stack gap="xs" style={{ flex: 1 }}>
              <Title order={1}>User Policies</Title>
              <Text c="dimmed">Configure password and login policies</Text>
            </Stack>
          </Group>
        </Container>
      </Paper>

      <Container size="lg" pb="xl">
        {success && (
          <Alert
            icon={<IconCheck size={20} />}
            color="green"
            variant="light"
            mb="lg"
            withCloseButton
            onClose={() => setSuccess(false)}
          >
            Settings saved successfully
          </Alert>
        )}

        {error && (
          <Alert
            icon={<IconAlertCircle size={20} />}
            color="red"
            variant="light"
            mb="lg"
            withCloseButton
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack gap="xl">
            <Paper shadow="sm" p="xl" radius="md">
              <Title order={3} mb="lg">Password Requirements</Title>
              <Stack gap="md">
                <NumberInput
                  label="Minimum Password Length"
                  value={formData.password_min_length}
                  onChange={(value) => handleChange('password_min_length', value)}
                  min={4}
                  max={32}
                />

                <Stack gap="sm">
                  <Switch
                    label="Require uppercase letters"
                    checked={formData.password_require_uppercase}
                    onChange={(e) => handleChange('password_require_uppercase', e.currentTarget.checked)}
                  />

                  <Switch
                    label="Require numbers"
                    checked={formData.password_require_numbers}
                    onChange={(e) => handleChange('password_require_numbers', e.currentTarget.checked)}
                  />

                  <Switch
                    label="Require special characters"
                    checked={formData.password_require_special_chars}
                    onChange={(e) => handleChange('password_require_special_chars', e.currentTarget.checked)}
                  />
                </Stack>
              </Stack>
            </Paper>

            <Paper shadow="sm" p="xl" radius="md">
              <Title order={3} mb="lg">Login Policies</Title>
              <Stack gap="md">
                <NumberInput
                  label="Session Timeout (Minutes)"
                  value={formData.session_timeout_minutes}
                  onChange={(value) => handleChange('session_timeout_minutes', value)}
                  min={5}
                  max={1440}
                />

                <NumberInput
                  label="Failed Login Attempt Limit"
                  value={formData.login_attempt_limit}
                  onChange={(value) => handleChange('login_attempt_limit', value)}
                  min={3}
                  max={20}
                />

                <Stack gap="sm">
                  <Switch
                    label="Require email verification"
                    checked={formData.require_email_verification}
                    onChange={(e) => handleChange('require_email_verification', e.currentTarget.checked)}
                  />

                  <Switch
                    label="Allow self-registration"
                    checked={formData.allow_self_registration}
                    onChange={(e) => handleChange('allow_self_registration', e.currentTarget.checked)}
                  />
                </Stack>
              </Stack>
            </Paper>

            <Group justify="flex-end" gap="md">
              <Button
                variant="default"
                onClick={() => router.push('/dashboard/admin/settings')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={saving}
                leftSection={!saving && <IconCheck size={16} />}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Container>
    </Box>
  );
}
