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
  IconPlus,
  IconTrash,
} from '@tabler/icons-react';

interface GradeEntry {
  grade_letter: string;
  min_percentage: number;
  max_percentage: number;
  description: string;
}

export default function GradeScalesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grades, setGrades] = useState<GradeEntry[]>([
    { grade_letter: 'A', min_percentage: 90, max_percentage: 100, description: 'Excellent' },
    { grade_letter: 'B', min_percentage: 80, max_percentage: 89, description: 'Good' },
    { grade_letter: 'C', min_percentage: 70, max_percentage: 79, description: 'Satisfactory' },
    { grade_letter: 'D', min_percentage: 60, max_percentage: 69, description: 'Passing' },
    { grade_letter: 'F', min_percentage: 0, max_percentage: 59, description: 'Failing' },
  ]);

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

  const handleGradeChange = (index: number, field: string, value: any) => {
    const newGrades = [...grades];
    newGrades[index] = { ...newGrades[index], [field]: value };
    setGrades(newGrades);
    setSuccess(false);
  };

  const handleAddGrade = () => {
    setGrades([...grades, { grade_letter: '', min_percentage: 0, max_percentage: 0, description: '' }]);
  };

  const handleRemoveGrade = (index: number) => {
    setGrades(grades.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/admin/settings/grades', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grades }),
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
              <Title order={1}>Grade Scales</Title>
              <Text c="dimmed">Configure grading systems and letter grades</Text>
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
              <Group justify="space-between" mb="lg">
                <Title order={3}>Grade Entries</Title>
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={handleAddGrade}
                  type="button"
                >
                  Add Grade
                </Button>
              </Group>

              <Stack gap="md">
                {grades.map((grade, index) => (
                  <Paper key={index} withBorder p="md" radius="md">
                    <Grid gutter="md">
                      <Grid.Col span={{ base: 12, xs: 6, sm: 2 }}>
                        <TextInput
                          label="Letter"
                          placeholder="A"
                          value={grade.grade_letter}
                          onChange={(e) => handleGradeChange(index, 'grade_letter', e.target.value)}
                          size="sm"
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 6, xs: 6, sm: 2 }}>
                        <NumberInput
                          label="Min %"
                          value={grade.min_percentage}
                          onChange={(value) => handleGradeChange(index, 'min_percentage', value)}
                          min={0}
                          max={100}
                          size="sm"
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 6, xs: 6, sm: 2 }}>
                        <NumberInput
                          label="Max %"
                          value={grade.max_percentage}
                          onChange={(value) => handleGradeChange(index, 'max_percentage', value)}
                          min={0}
                          max={100}
                          size="sm"
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, xs: 12, sm: 4 }}>
                        <TextInput
                          label="Description"
                          placeholder="Excellent"
                          value={grade.description}
                          onChange={(e) => handleGradeChange(index, 'description', e.target.value)}
                          size="sm"
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, xs: 12, sm: 2 }} style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <Button
                          color="red"
                          variant="light"
                          fullWidth
                          onClick={() => handleRemoveGrade(index)}
                          leftSection={<IconTrash size={16} />}
                          size="sm"
                          type="button"
                        >
                          Remove
                        </Button>
                      </Grid.Col>
                    </Grid>
                  </Paper>
                ))}
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
