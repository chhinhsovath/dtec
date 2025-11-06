'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Title,
  Text,
  Card,
  Badge,
  Loader,
  Center,
  Stack,
  Group,
  ThemeIcon,
  Alert,
  Button,
  Modal,
  Tabs,
  SimpleGrid,
  Timeline,
  Progress,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconAlertCircle,
  IconCalendar,
  IconClock,
  IconMessageCircle,
  IconCheck,
  IconListCheck,
  IconUserCheck,
} from '@tabler/icons-react';
import { getSession } from '@/lib/auth/client-auth';

interface MentorshipSession {
  session_id: string;
  mentor_id: string;
  mentor_name: string;
  mentor_email: string;
  session_date: string;
  session_duration_minutes: number;
  topic_km: string;
  topic_en: string;
  feedback_km: string;
  feedback_en: string;
  action_items_km: string;
  action_items_en: string;
  created_at: string;
}

export default function MentorshipPage() {
  const [sessions, setSessions] = useState<MentorshipSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<MentorshipSession | null>(null);
  const [sessionModalOpened, setSessionModalOpened] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        const session = getSession();

        if (!session) {
          router.push('/auth/login');
          return;
        }

        if (session.role !== 'student') {
          router.push(`/dashboard/${session.role}`);
          return;
        }

        const res = await fetch('/api/graduate-student/mentorship');
        if (!res.ok) {
          throw new Error('Failed to fetch mentorship sessions');
        }

        const result = await res.json();
        setSessions(result.data || []);
        setLoading(false);
      } catch (err) {
        console.error('Error loading mentorship sessions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load mentorship sessions');
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleViewSession = (session: MentorshipSession) => {
    setSelectedSession(session);
    setSessionModalOpened(true);
  };

  if (loading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  if (error) {
    return (
      <Container size="lg" py="xl">
        <Alert icon={<IconAlertCircle />} color="red" title="Error">
          {error}
        </Alert>
      </Container>
    );
  }

  // Separate upcoming and past sessions
  const now = new Date();
  const upcomingSessions = sessions.filter((s) => new Date(s.session_date) >= now).sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime());
  const pastSessions = sessions.filter((s) => new Date(s.session_date) < now).sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());

  const sessionsWithFeedback = sessions.filter((s) => s.feedback_km || s.feedback_en);
  const actionItems = sessions.filter((s) => s.action_items_km || s.action_items_en);

  return (
    <Container size="xl" py="xl">
      {/* Header */}
      <Group mb="xl">
        <Button
          variant="default"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => router.back()}
        >
          Back
        </Button>
        <div style={{ flex: 1 }}>
          <Title order={1}>Mentorship Sessions / ការងាររបស់គ្រូផ្តួចផ្តើម</Title>
          <Text c="dimmed">Track your mentoring sessions, feedback, and action items</Text>
        </div>
      </Group>

      {/* Summary Cards */}
      <SimpleGrid cols={{ base: 1, md: 4 }} spacing="lg" mb="xl">
        {/* Total Sessions */}
        <Card withBorder p="lg" radius="md">
          <Group justify="space-between" mb="lg">
            <Stack gap={0}>
              <Text fw={500} c="dimmed" size="sm">
                Total Sessions / សិក្ខាសាលសរុប
              </Text>
              <Title order={2}>{sessions.length}</Title>
            </Stack>
            <ThemeIcon variant="light" size={50} radius="md" color="blue">
              <IconCalendar size={28} />
            </ThemeIcon>
          </Group>
          <Progress value={Math.min((sessions.length / 10) * 100, 100)} size="md" radius="md" />
          <Text size="xs" c="dimmed" mt="xs">
            Target: 10 sessions
          </Text>
        </Card>

        {/* Upcoming Sessions */}
        <Card withBorder p="lg" radius="md">
          <Group justify="space-between" mb="lg">
            <Stack gap={0}>
              <Text fw={500} c="dimmed" size="sm">
                Upcoming / ឆាប់មក
              </Text>
              <Title order={2}>{upcomingSessions.length}</Title>
            </Stack>
            <ThemeIcon variant="light" size={50} radius="md" color="yellow">
              <IconClock size={28} />
            </ThemeIcon>
          </Group>
          <Text size="sm" c="dimmed" mt="xs">
            {upcomingSessions.length > 0
            ? `Next: ${new Date(upcomingSessions[0].session_date).toLocaleDateString()}`
            : 'No upcoming sessions'}
          </Text>
        </Card>

        {/* Sessions with Feedback */}
        <Card withBorder p="lg" radius="md">
          <Group justify="space-between" mb="lg">
            <Stack gap={0}>
              <Text fw={500} c="dimmed" size="sm">
                Feedback Received / មតិយោបល់
              </Text>
              <Title order={2}>{sessionsWithFeedback.length}</Title>
            </Stack>
            <ThemeIcon variant="light" size={50} radius="md" color="teal">
              <IconMessageCircle size={28} />
            </ThemeIcon>
          </Group>
          <Progress value={sessionsWithFeedback.length > 0 ? 75 : 25} color="teal" size="md" radius="md" />
        </Card>

        {/* Action Items */}
        <Card withBorder p="lg" radius="md">
          <Group justify="space-between" mb="lg">
            <Stack gap={0}>
              <Text fw={500} c="dimmed" size="sm">
                Action Items / ការងារដែលត្រូវធ្វើ
              </Text>
              <Title order={2}>{actionItems.length}</Title>
            </Stack>
            <ThemeIcon variant="light" size={50} radius="md" color="violet">
              <IconListCheck size={28} />
            </ThemeIcon>
          </Group>
          <Text size="xs" c="dimmed" mt="xs">
            Follow-up tasks from sessions
          </Text>
        </Card>
      </SimpleGrid>

      {/* Sessions Tabs */}
      <Tabs defaultValue="upcoming" variant="pills" mb="xl">
        <Tabs.List>
          <Tabs.Tab value="upcoming" leftSection={<Badge>{upcomingSessions.length}</Badge>}>
            Upcoming
          </Tabs.Tab>
          <Tabs.Tab value="completed" leftSection={<Badge>{pastSessions.length}</Badge>}>
            Completed
          </Tabs.Tab>
        </Tabs.List>

        {/* Upcoming Sessions Tab */}
        <Tabs.Panel value="upcoming">
          {upcomingSessions.length > 0 ? (
            <Stack gap="md">
              {upcomingSessions.map((session) => (
                <Card key={session.session_id} p="lg" withBorder bg="blue.0">
                  <Group justify="space-between" mb="sm">
                    <div>
                      <Group gap="xs" mb="xs">
                        <Badge color="yellow" variant="light">
                          Scheduled
                        </Badge>
                        <Text size="sm" fw={500}>
                          {new Date(session.session_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </Text>
                      </Group>
                      <Title order={4}>{session.topic_en}</Title>
                      <Text size="sm" c="dimmed">
                        {session.topic_km}
                      </Text>
                    </div>
                    <Button
                      variant="light"
                      onClick={() => handleViewSession(session)}
                    >
                      View Details
                    </Button>
                  </Group>

                  <Group gap="md" mt="md" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
                    <Group gap="xs">
                      <IconUserCheck size={16} />
                      <Text size="sm">
                        <strong>Mentor:</strong> {session.mentor_name}
                      </Text>
                    </Group>
                    <Group gap="xs">
                      <IconClock size={16} />
                      <Text size="sm">
                        <strong>Duration:</strong> {session.session_duration_minutes} minutes
                      </Text>
                    </Group>
                  </Group>
                </Card>
              ))}
            </Stack>
          ) : (
            <Alert icon={<IconAlertCircle />} color="blue">
              No upcoming mentorship sessions scheduled. Check back soon!
            </Alert>
          )}
        </Tabs.Panel>

        {/* Completed Sessions Tab */}
        <Tabs.Panel value="completed">
          {pastSessions.length > 0 ? (
            <Timeline active={-1} bulletSize={24} lineWidth={2}>
              {pastSessions.map((session) => (
                <Timeline.Item key={session.session_id} bullet={<IconCheck size={12} />} title={session.topic_en}>
                  <Card p="md" mt="sm" mb="lg" withBorder bg="gray.0">
                    <Group justify="space-between" mb="sm">
                      <div>
                        <Text size="sm" c="dimmed">
                          {new Date(session.session_date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </Text>
                        <Title order={5}>{session.topic_km}</Title>
                      </div>
                      <Button
                        size="sm"
                        variant="light"
                        onClick={() => handleViewSession(session)}
                      >
                        View Full Details
                      </Button>
                    </Group>

                    {(session.feedback_km || session.feedback_en) && (
                      <Alert icon={<IconMessageCircle size={16} />} color="teal" title="Mentor Feedback" mt="sm">
                        <Stack gap="xs">
                          {session.feedback_en && <Text size="sm">{session.feedback_en}</Text>}
                          {session.feedback_km && (
                            <Text size="sm" c="dimmed">
                              {session.feedback_km}
                            </Text>
                          )}
                        </Stack>
                      </Alert>
                    )}

                    {(session.action_items_km || session.action_items_en) && (
                      <Alert icon={<IconListCheck size={16} />} color="violet" title="Action Items" mt="sm">
                        <Stack gap="xs">
                          {session.action_items_en && <Text size="sm">{session.action_items_en}</Text>}
                          {session.action_items_km && (
                            <Text size="sm" c="dimmed">
                              {session.action_items_km}
                            </Text>
                          )}
                        </Stack>
                      </Alert>
                    )}
                  </Card>
                </Timeline.Item>
              ))}
            </Timeline>
          ) : (
            <Alert icon={<IconAlertCircle />} color="gray">
              No completed sessions yet. Your first session will appear here.
            </Alert>
          )}
        </Tabs.Panel>
      </Tabs>

      {/* Session Detail Modal */}
      {selectedSession && (
        <Modal
          opened={sessionModalOpened}
          onClose={() => setSessionModalOpened(false)}
          title="Session Details / ព័ត៌មានលម្អិតសិក្ខាសាល"
          size="lg"
        >
          <Stack gap="lg">
            <div>
              <Text fw={500} c="dimmed" size="sm" mb="xs">
                Session Topic / ប្រធានបទ
              </Text>
              <Title order={4}>{selectedSession.topic_en}</Title>
              <Text size="sm" c="dimmed">
                {selectedSession.topic_km}
              </Text>
            </div>

            <Group grow>
              <div>
                <Text fw={500} c="dimmed" size="sm" mb="xs">
                  Mentor / គ្រូផ្តួចផ្តើម
                </Text>
                <Text size="sm">{selectedSession.mentor_name}</Text>
                <Text size="xs" c="dimmed">
                  {selectedSession.mentor_email}
                </Text>
              </div>
              <div>
                <Text fw={500} c="dimmed" size="sm" mb="xs">
                  Date & Time / ថ្ងៃ និងម៉ោង
                </Text>
                <Text size="sm">
                  {new Date(selectedSession.session_date).toLocaleString()}
                </Text>
              </div>
              <div>
                <Text fw={500} c="dimmed" size="sm" mb="xs">
                  Duration / រយៈពេល
                </Text>
                <Text size="sm">{selectedSession.session_duration_minutes} minutes</Text>
              </div>
            </Group>

            {(selectedSession.feedback_en || selectedSession.feedback_km) && (
              <div>
                <Text fw={500} mb="xs">
                  Feedback / មតិយោបល់
                </Text>
                <Card p="md" bg="teal.0">
                  {selectedSession.feedback_en && (
                    <>
                      <Text size="sm" fw={500} mb="xs">
                        English
                      </Text>
                      <Text size="sm">{selectedSession.feedback_en}</Text>
                    </>
                  )}
                  {selectedSession.feedback_km && (
                    <>
                      <Text size="sm" fw={500} mt="sm" mb="xs">
                        Khmer / ខ្មែរ
                      </Text>
                      <Text size="sm">{selectedSession.feedback_km}</Text>
                    </>
                  )}
                </Card>
              </div>
            )}

            {(selectedSession.action_items_en || selectedSession.action_items_km) && (
              <div>
                <Text fw={500} mb="xs">
                  Action Items / ការងារដែលត្រូវធ្វើ
                </Text>
                <Card p="md" bg="violet.0">
                  {selectedSession.action_items_en && (
                    <>
                      <Text size="sm" fw={500} mb="xs">
                        English
                      </Text>
                      <Text size="sm">{selectedSession.action_items_en}</Text>
                    </>
                  )}
                  {selectedSession.action_items_km && (
                    <>
                      <Text size="sm" fw={500} mt="sm" mb="xs">
                        Khmer / ខ្មែរ
                      </Text>
                      <Text size="sm">{selectedSession.action_items_km}</Text>
                    </>
                  )}
                </Card>
              </div>
            )}

            <Button fullWidth onClick={() => setSessionModalOpened(false)}>
              Close
            </Button>
          </Stack>
        </Modal>
      )}
    </Container>
  );
}
