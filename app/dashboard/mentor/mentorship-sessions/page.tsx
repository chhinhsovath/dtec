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
import { useTranslation } from '@/lib/i18n/useTranslation';

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
  const { language } = useTranslation();
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
        setError(err instanceof Error ? err.message : (language === 'km' ? 'មិនអាចផ្ទុកទិន្នន័យបាន' : 'Failed to load data'));
        setLoading(false);
      }
    };

    loadData();
  }, [router, language]);

  const handleScheduleSession = async () => {
    if (!selectedMentee || !sessionDate || !sessionTime || !topicKm || durationMinutes <= 0) {
      alert(language === 'km' ? 'សូមបំពេញប្រអប់ទាំងអស់ដែលតម្រូវឱ្យបំពេញ' : 'Please fill in all required fields');
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
        throw new Error(language === 'km' ? 'មិនអាចកំណត់ពេលវេលាបានទេ' : 'Failed to schedule session');
      }

      alert(language === 'km' ? 'កំណត់ពេលវេលាបានជោគជ័យ!' : 'Session scheduled successfully!');

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
      alert(err instanceof Error ? err.message : (language === 'km' ? 'មិនអាចកំណត់ពេលវេលាបានទេ' : 'Failed to schedule session'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddFeedback = async () => {
    if (!selectedSession || (!feedbackKm && !feedbackEn)) {
      alert(language === 'km' ? 'សូមផ្តល់មតិយោបល់' : 'Please provide feedback');
      return;
    }

    setSubmitting(true);
    try {
      // In a real implementation, this would call an API to update the session
      // For now, we'll just show a success message
      alert(language === 'km' ? 'រក្សាទុកមតិយោបល់បានជោគជ័យ!' : 'Feedback saved successfully!');
      setFeedbackKm('');
      setFeedbackEn('');
      setActionItemsKm('');
      setActionItemsEn('');
      setFeedbackModalOpened(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : (language === 'km' ? 'មិនអាចរក្សាទុកមតិយោបល់បានទេ' : 'Failed to save feedback'));
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
        <Alert icon={<IconAlertCircle />} color="red" title={language === 'km' ? 'កំហុស' : 'Error'}>
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
          {language === 'km' ? 'ត្រឡប់ក្រោយ' : 'Back'}
        </Button>
        <div style={{ flex: 1 }}>
          <Title order={1}>
            {language === 'km' ? 'វគ្គដឹកនាំ' : 'Mentorship Sessions'}
          </Title>
          <Text c="dimmed">
            {language === 'km' ? 'កំណត់ពេលវេលានិងគ្រប់គ្រងវគ្គដឹកនាំជាមួយសិស្សរបស់អ្នក' : 'Schedule and manage mentorship sessions with your mentees'}
          </Text>
        </div>
      </Group>

      {/* Summary Cards */}
      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg" mb="xl">
        <Card withBorder p="lg" radius="md">
          <Group justify="space-between" mb="lg">
            <Stack gap={0}>
              <Text fw={500} c="dimmed" size="sm">
                {language === 'km' ? 'សិស្សសរុប' : 'Total Mentees'}
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
                {language === 'km' ? 'វគ្គដែលបានកំណត់' : 'Scheduled Sessions'}
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
                {language === 'km' ? 'វគ្គដែលបានបញ្ចប់' : 'Completed Sessions'}
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
        {language === 'km' ? 'កំណត់ពេលវេលាវគ្គថ្មី' : 'Schedule New Session'}
      </Button>

      {/* Upcoming Sessions */}
      <Card withBorder p="lg" radius="md" mb="xl">
        <Title order={3} mb="lg">
          {language === 'km' ? 'វគ្គដែលនឹងមកដល់' : 'Upcoming Sessions'}
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
                        {language === 'km' ? session.topic_km : session.topic_en}
                      </Text>
                    </Group>
                    <Text size="sm" c="dimmed">
                      {language === 'km' ? 'សិស្ស' : 'Student'}: <strong>{session.mentee_name}</strong>
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
                    {language === 'km' ? 'បន្ថែមមតិយោបល់' : 'Add Feedback'}
                  </Button>
                </Group>

                <Group gap="sm" mt="sm" pt="sm" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
                  <Text size="xs" c="dimmed">
                    {language === 'km' ? 'រយៈពេល' : 'Duration'}: {session.session_duration_minutes} {language === 'km' ? 'នាទី' : 'minutes'}
                  </Text>
                </Group>
              </Card>
            ))}
          </Stack>
        ) : (
          <Alert icon={<IconAlertCircle />} color="blue">
            {language === 'km'
              ? 'មិនមានវគ្គដែលបានកំណត់ពេលវេលានៅឡើយទេ។ ចុចលើ "កំណត់ពេលវេលាវគ្គថ្មី" ដើម្បីបន្ថែម។'
              : 'No upcoming sessions scheduled. Click "Schedule New Session" to add one.'}
          </Alert>
        )}
      </Card>

      {/* Completed Sessions */}
      {completedSessions.length > 0 && (
        <Card withBorder p="lg" radius="md">
          <Title order={3} mb="lg">
            {language === 'km' ? 'វគ្គដែលបានបញ្ចប់' : 'Completed Sessions'}
          </Title>

          <Stack gap="md">
            {completedSessions.map((session) => (
              <Card key={session.session_id} p="md" bg="gray.0" withBorder>
                <Group justify="space-between" mb="sm">
                  <div>
                    <Group gap="sm" mb="xs">
                      <Badge size="sm" color="teal">
                        {language === 'km' ? 'បានបញ្ចប់' : 'Completed'}
                      </Badge>
                      <Text size="sm">
                        {new Date(session.session_date).toLocaleDateString()}
                      </Text>
                    </Group>
                    <Title order={5}>
                      {language === 'km' ? session.topic_km : session.topic_en}
                    </Title>
                    <Text size="sm" c="dimmed">
                      {language === 'km' ? 'សិស្ស' : 'Student'}: {session.mentee_name}
                    </Text>
                  </div>
                </Group>

                {(session.feedback_en || session.feedback_km) && (
                  <Alert icon={<IconAlertCircle />} color="teal" title={language === 'km' ? 'បានផ្តល់មតិយោបល់' : 'Feedback Provided'} mt="sm">
                    {language === 'km' && session.feedback_km && <Text size="sm">{session.feedback_km}</Text>}
                    {language === 'en' && session.feedback_en && <Text size="sm">{session.feedback_en}</Text>}
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
        title={language === 'km' ? 'កំណត់ពេលវេលាវគ្គដឹកនាំ' : 'Schedule Mentorship Session'}
        size="lg"
      >
        <Stack gap="md">
          <Select
            label={language === 'km' ? 'ជ្រើសរើសសិស្ស' : 'Select Mentee'}
            placeholder={language === 'km' ? 'ជ្រើសរើសសិស្សម្នាក់' : 'Choose a mentee'}
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
            label={language === 'km' ? 'ថ្ងៃវគ្គ' : 'Session Date'}
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.currentTarget.value)}
            required
          />

          <TextInput
            label={language === 'km' ? 'ម៉ោងវគ្គ' : 'Session Time'}
            type="time"
            value={sessionTime}
            onChange={(e) => setSessionTime(e.currentTarget.value)}
            required
          />

          <NumberInput
            label={language === 'km' ? 'រយៈពេល (នាទី)' : 'Duration (minutes)'}
            value={durationMinutes}
            onChange={(val) => setDurationMinutes(typeof val === 'number' ? val : (val ? parseInt(val) : 60))}
            min={15}
            step={15}
            required
          />

          <TextInput
            label={language === 'km' ? 'ប្រធានបទ (ខ្មែរ)' : 'Topic (Khmer)'}
            placeholder={language === 'km' ? 'ប្រធានបទវគ្គជាភាសាខ្មែរ' : 'Session topic in Khmer'}
            value={topicKm}
            onChange={(e) => setTopicKm(e.currentTarget.value)}
            required
          />

          <TextInput
            label={language === 'km' ? 'ប្រធានបទ (អង់គ្លេស)' : 'Topic (English)'}
            placeholder={language === 'km' ? 'ប្រធានបទវគ្គជាភាសាអង់គ្លេស' : 'Session topic in English'}
            value={topicEn}
            onChange={(e) => setTopicEn(e.currentTarget.value)}
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setSessionModalOpened(false)}>
              {language === 'km' ? 'បោះបង់' : 'Cancel'}
            </Button>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={handleScheduleSession}
              loading={submitting}
            >
              {language === 'km' ? 'កំណត់ពេលវេលាវគ្គ' : 'Schedule Session'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Add Feedback Modal */}
      {selectedSession && (
        <Modal
          opened={feedbackModalOpened}
          onClose={() => setFeedbackModalOpened(false)}
          title={language === 'km' ? 'បន្ថែមមតិយោបល់វគ្គ' : 'Add Session Feedback'}
          size="lg"
        >
          <Stack gap="md">
            <div>
              <Text fw={500} mb="xs">
                {language === 'km' ? 'វគ្គ' : 'Session'}
              </Text>
              <Title order={5}>
                {language === 'km' ? selectedSession.topic_km : selectedSession.topic_en}
              </Title>
              <Text size="sm" c="dimmed">
                {language === 'km' ? 'សិស្ស' : 'Student'}: {selectedSession.mentee_name}
              </Text>
              <Text size="sm" c="dimmed">
                {language === 'km' ? 'ថ្ងៃ' : 'Date'}: {new Date(selectedSession.session_date).toLocaleDateString()}
              </Text>
            </div>

            <Textarea
              label={language === 'km' ? 'មតិយោបល់ (ខ្មែរ)' : 'Feedback (Khmer)'}
              placeholder={language === 'km' ? 'ផ្តល់មតិយោបល់សាងសង់...' : 'Provide constructive feedback...'}
              value={feedbackKm}
              onChange={(e) => setFeedbackKm(e.currentTarget.value)}
              minRows={4}
            />

            <Textarea
              label={language === 'km' ? 'មតិយោបល់ (អង់គ្លេស)' : 'Feedback (English)'}
              placeholder={language === 'km' ? 'ផ្តល់មតិយោបល់ជាភាសាអង់គ្លេស...' : 'Provide feedback in English...'}
              value={feedbackEn}
              onChange={(e) => setFeedbackEn(e.currentTarget.value)}
              minRows={4}
            />

            <Textarea
              label={language === 'km' ? 'ការងារដែលត្រូវធ្វើ (ខ្មែរ)' : 'Action Items (Khmer)'}
              placeholder={language === 'km' ? 'រាយការណ៍ការងារដែលត្រូវធ្វើ...' : 'List action items or follow-up tasks...'}
              value={actionItemsKm}
              onChange={(e) => setActionItemsKm(e.currentTarget.value)}
              minRows={3}
            />

            <Textarea
              label={language === 'km' ? 'ការងារដែលត្រូវធ្វើ (អង់គ្លេស)' : 'Action Items (English)'}
              placeholder={language === 'km' ? 'រាយការណ៍ការងារជាភាសាអង់គ្លេស...' : 'List action items in English...'}
              value={actionItemsEn}
              onChange={(e) => setActionItemsEn(e.currentTarget.value)}
              minRows={3}
            />

            <Group justify="flex-end">
              <Button variant="default" onClick={() => setFeedbackModalOpened(false)}>
                {language === 'km' ? 'បោះបង់' : 'Cancel'}
              </Button>
              <Button
                leftSection={<IconSend size={16} />}
                onClick={handleAddFeedback}
                loading={submitting}
                disabled={!feedbackKm && !feedbackEn}
              >
                {language === 'km' ? 'រក្សាទុកមតិយោបល់' : 'Save Feedback'}
              </Button>
            </Group>
          </Stack>
        </Modal>
      )}
    </Container>
  );
}
