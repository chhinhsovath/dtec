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
  Textarea,
  Select,
  Loader,
  Alert,
  ActionIcon,
  Box,
  Grid,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconCheck,
  IconAlertCircle,
} from '@tabler/icons-react';

interface InstitutionSettings {
  name: string;
  code: string;
  description: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  website_url: string;
  academic_year: string;
  timezone: string;
  language_preference: 'en' | 'km' | 'both';
}

export default function InstitutionSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<InstitutionSettings>({
    name: '',
    code: '',
    description: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    website_url: '',
    academic_year: new Date().getFullYear().toString(),
    timezone: 'UTC',
    language_preference: 'both',
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const session = getSession();

        if (!session || session.role !== 'admin') {
          router.push('/auth/login');
          return;
        }

        // Fetch current institution settings
        const response = await fetch('/api/admin/settings/institution');
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

  const handleChange = (name: string, value: string) => {
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
      const response = await fetch('/api/admin/settings/institution', {
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
          <Text c="dimmed">Loading institution settings...</Text>
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
              <Title order={1}>Institution Settings</Title>
              <Text c="dimmed">Manage your institution's profile and details</Text>
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
            Your institution settings have been updated.
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
              <Title order={3} mb="lg">Basic Information</Title>
              <Grid gutter="lg">
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="Institution Name"
                    placeholder="e.g., TEC Learning Academy"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                    withAsterisk
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="Institution Code"
                    placeholder="e.g., TEC001"
                    value={formData.code}
                    onChange={(e) => handleChange('code', e.target.value)}
                    required
                    withAsterisk
                  />
                </Grid.Col>
                <Grid.Col span={12}>
                  <Textarea
                    label="Description"
                    placeholder="Brief description of your institution..."
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={4}
                    autosize
                    minRows={4}
                    maxRows={8}
                  />
                </Grid.Col>
              </Grid>
            </Paper>

            <Paper shadow="sm" p="xl" radius="md">
              <Title order={3} mb="lg">Contact Information</Title>
              <Grid gutter="lg">
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="Contact Email"
                    type="email"
                    placeholder="contact@institution.com"
                    value={formData.contact_email}
                    onChange={(e) => handleChange('contact_email', e.target.value)}
                    required
                    withAsterisk
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="Contact Phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={formData.contact_phone}
                    onChange={(e) => handleChange('contact_phone', e.target.value)}
                    required
                    withAsterisk
                  />
                </Grid.Col>
                <Grid.Col span={12}>
                  <Textarea
                    label="Address"
                    placeholder="123 Main St, City, State 12345"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    rows={3}
                    autosize
                    minRows={3}
                    maxRows={6}
                  />
                </Grid.Col>
                <Grid.Col span={12}>
                  <TextInput
                    label="Website URL"
                    type="url"
                    placeholder="https://example.com"
                    value={formData.website_url}
                    onChange={(e) => handleChange('website_url', e.target.value)}
                  />
                </Grid.Col>
              </Grid>
            </Paper>

            <Paper shadow="sm" p="xl" radius="md">
              <Title order={3} mb="lg">System Settings</Title>
              <Grid gutter="lg">
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="Academic Year"
                    placeholder="2024"
                    value={formData.academic_year}
                    onChange={(e) => handleChange('academic_year', e.target.value)}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Select
                    label="Timezone"
                    value={formData.timezone}
                    onChange={(value) => handleChange('timezone', value || 'UTC')}
                    data={[
                      { value: 'UTC', label: 'UTC' },
                      { value: 'America/New_York', label: 'America/New_York' },
                      { value: 'America/Los_Angeles', label: 'America/Los_Angeles' },
                      { value: 'Europe/London', label: 'Europe/London' },
                      { value: 'Asia/Bangkok', label: 'Asia/Bangkok' },
                      { value: 'Asia/Tokyo', label: 'Asia/Tokyo' },
                    ]}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Select
                    label="Language Preference"
                    value={formData.language_preference}
                    onChange={(value) => handleChange('language_preference', value || 'both')}
                    data={[
                      { value: 'en', label: 'English Only' },
                      { value: 'km', label: 'Khmer Only' },
                      { value: 'both', label: 'Both (English & Khmer)' },
                    ]}
                  />
                </Grid.Col>
              </Grid>
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
