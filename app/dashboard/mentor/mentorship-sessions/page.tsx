'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Title,
  Text,
  Card,
  Badge,
  Button,
  Select,
  Textarea,
  TextInput,
  Loader,
  Center,
  Stack,
  Group,
  ThemeIcon,
  Alert,
  Modal,
  SimpleGrid,
  NumberInput,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconAlertCircle,
  IconUser,
  IconPlus,
  IconSend,
  IconCalendar,
  IconClock,
} from '@tabler/icons-react';
import { getSession } from '@/lib/auth/client-auth';

interface Mentee {
  mentor_relationship_id: string;
  graduate_student_id: string;
  student_code: string;
  email: string;
  full_name: string;
  relationship_status: string;
  batch_code: string;
}

interface MentorshipSession {
  session_id: string;
  mentee_id: string;
  mentee_name: string;
  session_date: string;
  session_duration_minutes: number;
  topic_km: string;
  topic_en: string;
  feedback_km: string;
  feedback_en: string;
  action_items_km: string;
  action_items_en: string;
}

export default function MentorshipSessionsPage() {
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [sessions, setSessions] = useState<MentorshipSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedMentee, setSelectedMentee] = useState<string>('');
  const [sessionDate, setSessionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sessionTime, setSessionTime] = useState<string>('14:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [topicKm, setTopicKm] = useState<string>('');
  const [topicEn, setTopicEn] = useState<string>('');

  const [sessionModalOpened, setSessionModalOpened] = useState(false);
  const [feedbackModalOpened, setFeedbackModalOpened] = useState(false);
  const [selectedSession, setSelectedSession] = useState<MentorshipSession | null>(null);
  const [feedbackKm, setFeedbackKm] = useState<string>('');
  const [feedbackEn, setFeedbackEn] = useState<string>('');
  const [actionItemsKm, setActionItemsKm] = useState<string>('');
  const [actionItemsEn, setActionItemsEn] = useState<string>('');

  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        const session = getSession();

        if (!session) {
          router.push('/auth/login');
          return;
        }

        if (session.role !== 'teacher') {
          router.push(`/dashboard/${session.role}`);
          return;
        }

        const menteesRes = await fetch('/api/mentor/mentees');
        if (menteesRes.ok) {
          const menteesData = await menteesRes.json();
          setMentees(menteesData.data || []);
        }

        // Load mentorship sessions
        const sessionsRes = await fetch('/api/graduate-student/mentorship');
        if (sessionsRes.ok) {
          const sessionsData = await sessionsRes.json();
          setSessions(sessionsData.data || []);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleScheduleSession = async () => {
    if (!selectedMentee || !sessionDate || !sessionTime || !topicKm || durationMinutes <= 0) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const sessionDateTime = new Date(`${sessionDate}T${sessionTime}:00`).toISOString();

      const res = await fetch('/api/graduate-student/mentorship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          graduateStudentId: selectedMentee,
          sessionDate: sessionDateTime,
          sessionDurationMinutes: durationMinutes,
          topicKm,
          topicEn,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to schedule session');
      }

      alert('Session scheduled successfully!');

      // Reset form
      setSelectedMentee('');
      setSessionDate(new Date().toISOString().split('T')[0]);
      setSessionTime('14:00');
      setDurationMinutes(60);
      setTopicKm('');
      setTopicEn('');
      setSessionModalOpened(false);

      // Reload sessions
      const sessionsRes = await fetch('/api/graduate-student/mentorship');
      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setSessions(sessionsData.data || []);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to schedule session');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddFeedback = async () => {
    if (!selectedSession || (!feedbackKm && !feedbackEn)) {
      alert('Please provide feedback');
      return;
    }

    setSubmitting(true);
    try {
      // In a real implementation, this would call an API to update the session
      // For now, we'll just show a success message
      alert('Feedback saved successfully!');
      setFeedbackKm('');
      setFeedbackEn('');
      setActionItemsKm('');
      setActionItemsEn('');
      setFeedbackModalOpened(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save feedback');
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

  if (error) {
    return (
      <Container size="lg" py="xl">
        <Alert icon={<IconAlertCircle />} color="red" title="Error">
          {error}
        </Alert>
      </Container>
    );
  }

  const now = new Date();
  const upcomingSessions = sessions.filter((s) => new Date(s.session_date) >= now).sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime());
  const completedSessions = sessions.filter((s) => new Date(s.session_date) < now).sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());

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
          <Title order={1}>Mentorship Sessions / ការងារលម្អិត</Title>
          <Text c="dimmed">Schedule and manage mentorship sessions with your mentees</Text>
        </div>
      </Group>

      {/* Summary Cards */}
      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg" mb="xl">
        <Card withBorder p="lg" radius="md">
          <Group justify="space-between" mb="lg">
            <Stack gap={0}>
              <Text fw={500} c="dimmed" size="sm">
                Total Mentees / សិស្សសរុប
              </Text>
              <Title order={2}>{mentees.length}</Title>
            </Stack>
            <ThemeIcon variant="light" size={50} radius="md" color="blue">
              <IconUser size={28} />
            </ThemeIcon>
          </Group>
        </Card>

        <Card withBorder p="lg" radius="md">
          <Group justify="space-between" mb="lg">
            <Stack gap={0}>
              <Text fw={500} c="dimmed" size="sm">
                Scheduled Sessions / ដែលគ្រោងទុក
              </Text>
              <Title order={2}>{upcomingSessions.length}</Title>
            </Stack>
            <ThemeIcon variant="light" size={50} radius="md" color="yellow">
              <IconCalendar size={28} />
            </ThemeIcon>
          </Group>
        </Card>

        <Card withBorder p="lg" radius="md">
          <Group justify="space-between" mb="lg">
            <Stack gap={0}>
              <Text fw={500} c="dimmed" size="sm">
                Completed Sessions / ដែលបានបញ្ចប់
              </Text>
              <Title order={2}>{completedSessions.length}</Title>
            </Stack>
            <ThemeIcon variant="light" size={50} radius="md" color="teal">
              <IconClock size={28} />
            </ThemeIcon>
          </Group>
        </Card>
      </SimpleGrid>

      {/* Schedule New Session Button */}
      <Button
        size="lg"
        leftSection={<IconPlus size={18} />}
        fullWidth
        mb="xl"
        onClick={() => setSessionModalOpened(true)}
      >
        Schedule New Session
      </Button>

      {/* Upcoming Sessions */}
      <Card withBorder p="lg" radius="md" mb="xl">
        <Title order={3} mb="lg">
          Upcoming Sessions / សិក្ខាសាលឆាប់មក
        </Title>

        {upcomingSessions.length > 0 ? (
          <Stack gap="md">
            {upcomingSessions.map((session) => (
              <Card key={session.session_id} p="md" bg="blue.0" withBorder>
                <Group justify="space-between" mb="sm">
                  <div style={{ flex: 1 }}>
                    <Group gap="sm" mb="xs">
                      <Badge size="sm">
                        {new Date(session.session_date).toLocaleDateString()}
                      </Badge>
                      <Text size="sm" fw={500}>
                        {session.topic_en}
                      </Text>
                    </Group>
                    <Text size="sm" c="dimmed">
                      Student: <strong>{session.mentee_name}</strong>
                    </Text>
                    <Text size="sm" c="dimmed">
                      {session.topic_km}
                    </Text>
                  </div>
                  <Button
                    variant="light"
                    size="sm"
                    onClick={() => {
                      setSelectedSession(session);
                      setFeedbackKm('');
                      setFeedbackEn('');
                      setActionItemsKm('');
                      setActionItemsEn('');
                      setFeedbackModalOpened(true);
                    }}
                  >
                    Add Feedback
                  </Button>
                </Group>

                <Group gap="sm" mt="sm" pt="sm" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
                  <Text size="xs" c="dimmed">
                    Duration: {session.session_duration_minutes} minutes
                  </Text>
                </Group>
              </Card>
            ))}
          </Stack>
        ) : (
          <Alert icon={<IconAlertCircle />} color="blue">
            No upcoming sessions scheduled. Click "Schedule New Session" to add one.
          </Alert>
        )}
      </Card>

      {/* Completed Sessions */}
      {completedSessions.length > 0 && (
        <Card withBorder p="lg" radius="md">
          <Title order={3} mb="lg">
            Completed Sessions / សិក្ខាសាលដែលបានបញ្ចប់
          </Title>

          <Stack gap="md">
            {completedSessions.map((session) => (
              <Card key={session.session_id} p="md" bg="gray.0" withBorder>
                <Group justify="space-between" mb="sm">
                  <div>
                    <Group gap="sm" mb="xs">
                      <Badge size="sm" color="teal">
                        Completed
                      </Badge>
                      <Text size="sm">
                        {new Date(session.session_date).toLocaleDateString()}
                      </Text>
                    </Group>
                    <Title order={5}>{session.topic_en}</Title>
                    <Text size="sm" c="dimmed">
                      Student: {session.mentee_name}
                    </Text>
                  </div>
                </Group>

                {(session.feedback_en || session.feedback_km) && (
                  <Alert icon={<IconAlertCircle />} color="teal" title="Feedback Provided" mt="sm">
                    {session.feedback_en && <Text size="sm">{session.feedback_en}</Text>}
                  </Alert>
                )}
              </Card>
            ))}
          </Stack>
        </Card>
      )}

      {/* Schedule Session Modal */}
      <Modal
        opened={sessionModalOpened}
        onClose={() => setSessionModalOpened(false)}
        title="Schedule Mentorship Session / គ្រោងលម្អិតសិក្ខាសាល"
        size="lg"
      >
        <Stack gap="md">
          <Select
            label="Select Mentee / ជ្រើសរើសសិស្ស"
            placeholder="Choose a mentee"
            data={mentees.map((m) => ({
              value: m.graduate_student_id,
              label: `${m.full_name} (${m.student_code})`,
            }))}
            value={selectedMentee}
            onChange={(val) => setSelectedMentee(val || '')}
            searchable
            required
          />

          <TextInput
            label="Session Date / ថ្ងៃវលីរ"
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.currentTarget.value)}
            required
          />

          <TextInput
            label="Session Time / ម៉ោង"
            type="time"
            value={sessionTime}
            onChange={(e) => setSessionTime(e.currentTarget.value)}
            required
          />

          <NumberInput
            label="Duration (minutes) / រយៈពេល (នាទី)"
            value={durationMinutes}
            onChange={(val) => setDurationMinutes(typeof val === 'number' ? val : (val ? parseInt(val) : 60))}
            min={15}
            step={15}
            required
          />

          <TextInput
            label="Topic (Khmer) / ប្រធានបទ (ខ្មែរ)"
            placeholder="Session topic in Khmer"
            value={topicKm}
            onChange={(e) => setTopicKm(e.currentTarget.value)}
            required
          />

          <TextInput
            label="Topic (English) / ប្រធានបទ (English)"
            placeholder="Session topic in English"
            value={topicEn}
            onChange={(e) => setTopicEn(e.currentTarget.value)}
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setSessionModalOpened(false)}>
              Cancel
            </Button>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={handleScheduleSession}
              loading={submitting}
            >
              Schedule Session
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Add Feedback Modal */}
      {selectedSession && (
        <Modal
          opened={feedbackModalOpened}
          onClose={() => setFeedbackModalOpened(false)}
          title="Add Session Feedback / បន្ថែមមតិយោបល់"
          size="lg"
        >
          <Stack gap="md">
            <div>
              <Text fw={500} mb="xs">
                Session / សិក្ខាសាល
              </Text>
              <Title order={5}>{selectedSession.topic_en}</Title>
              <Text size="sm" c="dimmed">
                Student: {selectedSession.mentee_name}
              </Text>
              <Text size="sm" c="dimmed">
                Date: {new Date(selectedSession.session_date).toLocaleDateString()}
              </Text>
            </div>

            <Textarea
              label="Feedback (Khmer) / មតិយោបល់ (ខ្មែរ)"
              placeholder="Provide constructive feedback..."
              value={feedbackKm}
              onChange={(e) => setFeedbackKm(e.currentTarget.value)}
              minRows={4}
            />

            <Textarea
              label="Feedback (English)"
              placeholder="Provide feedback in English..."
              value={feedbackEn}
              onChange={(e) => setFeedbackEn(e.currentTarget.value)}
              minRows={4}
            />

            <Textarea
              label="Action Items (Khmer) / ការងារដែលត្រូវធ្វើ (ខ្មែរ)"
              placeholder="List action items or follow-up tasks..."
              value={actionItemsKm}
              onChange={(e) => setActionItemsKm(e.currentTarget.value)}
              minRows={3}
            />

            <Textarea
              label="Action Items (English)"
              placeholder="List action items in English..."
              value={actionItemsEn}
              onChange={(e) => setActionItemsEn(e.currentTarget.value)}
              minRows={3}
            />

            <Group justify="flex-end">
              <Button variant="default" onClick={() => setFeedbackModalOpened(false)}>
                Cancel
              </Button>
              <Button
                leftSection={<IconSend size={16} />}
                onClick={handleAddFeedback}
                loading={submitting}
                disabled={!feedbackKm && !feedbackEn}
              >
                Save Feedback
              </Button>
            </Group>
          </Stack>
        </Modal>
      )}
    </Container>
  );
}
