'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth/client-auth';
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Group,
  Stack,
  TextInput,
  Grid,
  Badge,
  Loader,
  Center,
  Box,
  Divider
} from '@mantine/core';
import {
  IconUser,
  IconMail,
  IconCalendar,
  IconBook,
  IconAward,
  IconEdit,
  IconDeviceFloppy,
  IconX,
  IconArrowLeft,
  IconShieldLock,
  IconBell,
  IconWorld
} from '@tabler/icons-react';

interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: 'student' | 'teacher' | 'admin';
  created_at: string;
}

interface StudentData {
  student_number: string;
  enrollment_date: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      const session = getSession();

      if (!session) {
        router.push('/auth/login');
        return;
      }

      setEmail(session.email);

      try {
        const response = await fetch(`/api/profile?userId=${session.id}`);

        if (response.ok) {
          const data = await response.json();

          if (data.profile) {
            setProfile(data.profile);
            setFirstName(data.profile.first_name || '');
            setLastName(data.profile.last_name || '');
          }

          if (data.studentData) {
            setStudentData(data.studentData);
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }

      setLoading(false);
    };

    loadProfile();
  }, [router]);

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: profile.user_id,
          firstName,
          lastName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();

      if (data.profile) {
        setProfile(data.profile);
      }

      setEditing(false);
    } catch (error: any) {
      alert('កំហុសក្នុងការធ្វើបច្ចុប្បន្នភាពប្រវត្តិរូប: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFirstName(profile?.first_name || '');
    setLastName(profile?.last_name || '');
    setEditing(false);
  };

  if (loading) {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Stack align="center" gap="md">
          <Loader size="xl" />
          <Text size="xl">កំពុងផ្ទុក...</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Box style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%)' }}>
      {/* Header */}
      <Paper shadow="xs" p="md" mb="xl">
        <Container size="lg">
          <Group justify="space-between">
            <Title order={2}>ប្រវត្តិរូបរបស់ខ្ញុំ</Title>
            <Button
              leftSection={<IconArrowLeft size={16} />}
              variant="subtle"
              onClick={() => router.back()}
            >
              ត្រលប់ទៅផ្ទាំងគ្រប់គ្រង
            </Button>
          </Group>
        </Container>
      </Paper>

      {/* Main Content */}
      <Container size="lg" py="xl">
        {/* Profile Card */}
        <Paper shadow="md" radius="lg" withBorder>
          {/* Header Section */}
          <Box
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              padding: '48px 32px',
              borderRadius: '12px 12px 0 0'
            }}
          >
            <Group gap="xl">
              <Paper
                radius="xl"
                p="lg"
                style={{ backgroundColor: 'white' }}
              >
                <IconUser size={64} color="#3b82f6" />
              </Paper>
              <div>
                <Title order={2} c="white">
                  {profile?.first_name} {profile?.last_name}
                </Title>
                <Badge
                  size="lg"
                  variant="light"
                  color="blue"
                  tt="capitalize"
                  mt="xs"
                >
                  {profile?.role}
                </Badge>
              </div>
            </Group>
          </Box>

          {/* Profile Information */}
          <Box p="xl">
            <Group justify="space-between" mb="xl">
              <Title order={3}>ព័ត៌មានប្រវត្តិរូប</Title>
              {!editing ? (
                <Button
                  leftSection={<IconEdit size={16} />}
                  onClick={() => setEditing(true)}
                  size="sm"
                >
                  កែសម្រួលប្រវត្តិរូប
                </Button>
              ) : (
                <Group gap="xs">
                  <Button
                    leftSection={<IconDeviceFloppy size={16} />}
                    onClick={handleSave}
                    size="sm"
                    loading={saving}
                  >
                    {saving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
                  </Button>
                  <Button
                    leftSection={<IconX size={16} />}
                    onClick={handleCancel}
                    size="sm"
                    variant="subtle"
                    color="gray"
                  >
                    បោះប័ង
                  </Button>
                </Group>
              )}
            </Group>

            <Grid gutter="lg">
              {/* First Name */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Stack gap="xs">
                  <Text fw={500} size="sm">នាមត្រកូល</Text>
                  {editing ? (
                    <TextInput
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      size="md"
                    />
                  ) : (
                    <Text size="lg">{profile?.first_name || 'មិនទាន់កំណត់'}</Text>
                  )}
                </Stack>
              </Grid.Col>

              {/* Last Name */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Stack gap="xs">
                  <Text fw={500} size="sm">នាមខ្លួន</Text>
                  {editing ? (
                    <TextInput
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      size="md"
                    />
                  ) : (
                    <Text size="lg">{profile?.last_name || 'មិនទាន់កំណត់'}</Text>
                  )}
                </Stack>
              </Grid.Col>

              {/* Email */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Stack gap="xs">
                  <Group gap="xs">
                    <IconMail size={16} />
                    <Text fw={500} size="sm">អាសយដ្ឋានអ៊ីមែល</Text>
                  </Group>
                  <Text size="lg">{email}</Text>
                  <Text size="xs" c="dimmed">មិនអាចផ្លាស់ប្តូរអ៊ីមែលបានទេ</Text>
                </Stack>
              </Grid.Col>

              {/* Role */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Stack gap="xs">
                  <Group gap="xs">
                    <IconAward size={16} />
                    <Text fw={500} size="sm">តួនាទី</Text>
                  </Group>
                  <Text size="lg" tt="capitalize">{profile?.role}</Text>
                </Stack>
              </Grid.Col>

              {/* Student-specific fields */}
              {profile?.role === 'student' && studentData && (
                <>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="xs">
                      <Group gap="xs">
                        <IconBook size={16} />
                        <Text fw={500} size="sm">លេខសិស្ស</Text>
                      </Group>
                      <Text size="lg" ff="monospace">{studentData.student_number}</Text>
                    </Stack>
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="xs">
                      <Group gap="xs">
                        <IconCalendar size={16} />
                        <Text fw={500} size="sm">កាលបរិច្ឆេទចុះឈ្មោះ</Text>
                      </Group>
                      <Text size="lg">
                        {new Date(studentData.enrollment_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </Text>
                    </Stack>
                  </Grid.Col>
                </>
              )}

              {/* Account Created */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Stack gap="xs">
                  <Group gap="xs">
                    <IconCalendar size={16} />
                    <Text fw={500} size="sm">សមាជិកតាំងពី</Text>
                  </Group>
                  <Text size="lg">
                    {profile?.created_at && new Date(profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </Stack>
              </Grid.Col>
            </Grid>
          </Box>
        </Paper>

        {/* Additional Sections */}
        <Grid gutter="lg" mt="xl">
          {/* Account Security */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper shadow="md" radius="lg" p="xl" withBorder>
              <Title order={4} mb="lg">សុវត្ថិភាពគណនី</Title>
              <Stack gap="sm">
                <Button
                  variant="light"
                  leftSection={<IconShieldLock size={18} />}
                  fullWidth
                  justify="flex-start"
                >
                  ផ្លាស់ប្តូរពាក្យសម្ងាត់
                </Button>
                <Button
                  variant="light"
                  leftSection={<IconShieldLock size={18} />}
                  fullWidth
                  justify="flex-start"
                >
                  ការផ្ទៀងផ្ទាត់ពីរជំហាន
                </Button>
                <Button
                  variant="light"
                  leftSection={<IconCalendar size={18} />}
                  fullWidth
                  justify="flex-start"
                >
                  ប្រវត្តិការចូល
                </Button>
              </Stack>
            </Paper>
          </Grid.Col>

          {/* Preferences */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper shadow="md" radius="lg" p="xl" withBorder>
              <Title order={4} mb="lg">ការកំណត់</Title>
              <Stack gap="sm">
                <Button
                  variant="light"
                  leftSection={<IconBell size={18} />}
                  fullWidth
                  justify="flex-start"
                >
                  ការកំណត់ការជូនដំណឹង
                </Button>
                <Button
                  variant="light"
                  leftSection={<IconShieldLock size={18} />}
                  fullWidth
                  justify="flex-start"
                >
                  ការកំណត់ឯកជនភាព
                </Button>
                <Button
                  variant="light"
                  leftSection={<IconWorld size={18} />}
                  fullWidth
                  justify="flex-start"
                >
                  ភាសា និងតំបន់
                </Button>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}
