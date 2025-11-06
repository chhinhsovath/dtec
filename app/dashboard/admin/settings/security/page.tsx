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
  Select,
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

export default function SecuritySettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    two_factor_auth_enabled: false,
    backup_frequency: 'daily',
    log_retention_days: 90,
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
      const response = await fetch('/api/admin/settings/security', {
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
              <Title order={1}>Security Settings</Title>
              <Text c="dimmed">Configure security and backup options</Text>
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
              <Title order={3} mb="lg">Security Options</Title>
              <Switch
                label="Enable Two-Factor Authentication"
                checked={formData.two_factor_auth_enabled}
                onChange={(e) => handleChange('two_factor_auth_enabled', e.currentTarget.checked)}
              />
            </Paper>

            <Paper shadow="sm" p="xl" radius="md">
              <Title order={3} mb="lg">Backup & Maintenance</Title>
              <Stack gap="md">
                <Select
                  label="Backup Frequency"
                  value={formData.backup_frequency}
                  onChange={(value) => handleChange('backup_frequency', value)}
                  data={[
                    { value: 'hourly', label: 'Hourly' },
                    { value: 'daily', label: 'Daily' },
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' },
                  ]}
                />

                <NumberInput
                  label="Log Retention (Days)"
                  value={formData.log_retention_days}
                  onChange={(value) => handleChange('log_retention_days', value)}
                  min={7}
                  max={365}
                />
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
