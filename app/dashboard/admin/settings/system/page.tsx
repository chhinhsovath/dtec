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
  TextInput,
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

interface SystemSettings {
  system_name: string;
  maintenance_mode: boolean;
  debug_mode: boolean;
  max_upload_size_mb: number;
  features: {
    attendance_tracking: boolean;
    discussion_forums: boolean;
    live_classes: boolean;
    parent_portal: boolean;
    learning_paths: boolean;
    certifications: boolean;
  };
  performance: {
    cache_enabled: boolean;
    session_timeout_minutes: number;
  };
}

export default function SystemSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<SystemSettings>({
    system_name: 'DGTech LMS',
    maintenance_mode: false,
    debug_mode: false,
    max_upload_size_mb: 100,
    features: {
      attendance_tracking: true,
      discussion_forums: true,
      live_classes: true,
      parent_portal: true,
      learning_paths: true,
      certifications: true,
    },
    performance: {
      cache_enabled: true,
      session_timeout_minutes: 120,
    },
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const session = getSession();

        if (!session || session.role !== 'admin') {
          router.push('/auth/login');
          return;
        }

        const response = await fetch('/api/admin/settings/system');
        if (response.ok) {
          const data = await response.json();
          setFormData(data.settings || formData);
        }

        setAuthorized(true);
      } catch (err) {
        console.error('Failed to load settings:', err);
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [router]);

  const handleChange = (name: string, value: any) => {
    const keys = name.split('.');
    setFormData((prev) => {
      const newData = { ...prev };
      let current = newData as any;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/admin/settings/system', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

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
          <Text c="dimmed">Loading system settings...</Text>
        </Stack>
      </Container>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <Box bg="gray.0" mih="100vh">
      {/* Header */}
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
              <Title order={1}>System Settings</Title>
              <Text c="dimmed">Configure system-wide features and behavior</Text>
            </Stack>
          </Group>
        </Container>
      </Paper>

      {/* Main Content */}
      <Container size="lg" pb="xl">
        {success && (
          <Alert
            icon={<IconCheck size={20} />}
            title="Settings saved successfully"
            color="green"
            variant="light"
            mb="lg"
            withCloseButton
            onClose={() => setSuccess(false)}
          >
            Your system settings have been updated.
          </Alert>
        )}

        {error && (
          <Alert
            icon={<IconAlertCircle size={20} />}
            title="Error saving settings"
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
              <Title order={3} mb="lg">General Settings</Title>
              <Stack gap="md">
                <TextInput
                  label="System Name"
                  value={formData.system_name}
                  onChange={(e) => handleChange('system_name', e.target.value)}
                />

                <NumberInput
                  label="Max Upload Size (MB)"
                  value={formData.max_upload_size_mb}
                  onChange={(value) => handleChange('max_upload_size_mb', value)}
                  min={1}
                  max={500}
                />

                <Stack gap="sm">
                  <Switch
                    label="Maintenance Mode"
                    description="Enable to temporarily disable access for non-admin users"
                    checked={formData.maintenance_mode}
                    onChange={(e) => handleChange('maintenance_mode', e.currentTarget.checked)}
                  />

                  <Switch
                    label="Debug Mode"
                    description="Enable detailed error logging (use only for debugging)"
                    checked={formData.debug_mode}
                    onChange={(e) => handleChange('debug_mode', e.currentTarget.checked)}
                  />
                </Stack>
              </Stack>
            </Paper>

            <Paper shadow="sm" p="xl" radius="md">
              <Title order={3} mb="lg">Feature Toggles</Title>
              <Stack gap="sm">
                {Object.entries(formData.features).map(([key, value]) => (
                  <Switch
                    key={key}
                    label={key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    checked={value}
                    onChange={(e) => handleChange(`features.${key}`, e.currentTarget.checked)}
                  />
                ))}
              </Stack>
            </Paper>

            <Paper shadow="sm" p="xl" radius="md">
              <Title order={3} mb="lg">Performance Settings</Title>
              <Stack gap="md">
                <Switch
                  label="Enable Caching"
                  description="Improves performance but may delay updates"
                  checked={formData.performance.cache_enabled}
                  onChange={(e) => handleChange('performance.cache_enabled', e.currentTarget.checked)}
                />

                <NumberInput
                  label="Session Timeout (Minutes)"
                  description="How long before idle users are logged out"
                  value={formData.performance.session_timeout_minutes}
                  onChange={(value) => handleChange('performance.session_timeout_minutes', value)}
                  min={5}
                  max={1440}
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
