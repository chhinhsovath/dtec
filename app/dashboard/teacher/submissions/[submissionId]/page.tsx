'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getSession, clearSession } from '@/lib/auth/client-auth';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  Container,
  Group,
  Button,
  TextInput,
  Textarea,
  Alert,
  Flex,
  Badge,
  Text,
  Stack,
  Center,
  ActionIcon,
  Title,
  Loader,
  Card,
  Grid,
  NumberInput,
  Tabs,
} from '@mantine/core';
import {
  IconLogout,
  IconArrowLeft,
  IconCheck,
} from '@tabler/icons-react';

interface Submission {
  id: string;
  assessment_id: string;
  assessment_title: string;
  total_points: number;
  student_id: string;
  first_name: string;
  last_name: string;
  student_number: string;
  status: string;
  score: number | null;
  max_score: number | null;
  started_at: string | null;
  submitted_at: string | null;
  graded_at: string | null;
  time_spent_minutes: number | null;
  created_at: string;
  updated_at: string;
  answers: SubmissionAnswer[];
}

interface SubmissionAnswer {
  id: string;
  submission_id: string;
  question_id: string;
  answer_text: string | null;
  selected_option_id: string | null;
  points_earned: number | null;
  feedback: string | null;
  question_text: string;
  question_type: string;
  points: number;
  option_text: string | null;
}

export default function GradeSubmissionPage() {
  const router = useRouter();
  const params = useParams();
  const submissionId = params.submissionId as string;
  const { t, language, changeLanguage, isLoaded } = useTranslation();

  const [session, setSession] = useState<any>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [overallFeedback, setOverallFeedback] = useState('');
  const [overallScore, setOverallScore] = useState<number | string>('');
  const [letterGrade, setLetterGrade] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const sess = getSession();
      if (!sess || sess.role !== 'teacher') {
        router.push('/auth/login');
        return;
      }
      setSession(sess);
      fetchSubmission(sess.id);
    };

    if (isLoaded) {
      checkAuth();
    }
  }, [router, isLoaded]);

  const fetchSubmission = async (teacherId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/teacher/submissions/${submissionId}`, {
        headers: { 'x-teacher-id': teacherId },
      });

      if (!response.ok) throw new Error('Failed to fetch submission');
      const data = await response.json();
      setSubmission(data.submission);

      // Initialize scores and feedback from existing data
      const initialScores: Record<string, number> = {};
      const initialFeedback: Record<string, string> = {};

      data.submission.answers?.forEach((answer: SubmissionAnswer) => {
        if (answer.points_earned !== null) {
          initialScores[answer.id] = answer.points_earned;
        }
        if (answer.feedback) {
          initialFeedback[answer.id] = answer.feedback;
        }
      });

      setScores(initialScores);
      setFeedback(initialFeedback);
      setOverallScore(data.submission.score || '');
      setLetterGrade('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGrades = async () => {
    if (!submission) return;

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(
        `/api/teacher/submissions/${submissionId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-teacher-id': session?.id || '',
          },
          body: JSON.stringify({
            scores,
            feedback,
            overallScore: overallScore ? parseInt(overallScore.toString()) : null,
            letterGrade: letterGrade || null,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to save grades');

      setError(null);
      // Show success message
      alert('Grades saved successfully!');
      router.push('/dashboard/teacher/submissions');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    router.push('/');
  };

  if (loading || !session) {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Loader />
      </Center>
    );
  }

  if (!isLoaded || !submission) {
    return null;
  }

  const totalPoints = submission.answers.reduce((sum, a) => sum + a.points, 0);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Container size="xl" py="md">
          <Group justify="space-between" align="center">
            <div>
              <Button
                variant="subtle"
                leftSection={<IconArrowLeft size={16} />}
                onClick={() => router.back()}
                mb="sm"
              >
                Back
              </Button>
              <Title order={1}>Grade Submission</Title>
            </div>
            <Group gap="md">
              <Group gap="xs">
                <Button
                  onClick={() => changeLanguage('en')}
                  variant={language === 'en' ? 'filled' : 'light'}
                  size="xs"
                >
                  EN
                </Button>
                <Button
                  onClick={() => changeLanguage('km')}
                  variant={language === 'km' ? 'filled' : 'light'}
                  size="xs"
                >
                  ខ្មែរ
                </Button>
              </Group>
              <Button onClick={handleLogout} color="red" leftSection={<IconLogout size={16} />}>
                {t('common.logout')}
              </Button>
            </Group>
          </Group>
        </Container>
      </div>

      {/* Main Content */}
      <Container size="xl" py="xl">
        {error && (
          <Alert color="red" mb="lg" title="Error">
            {error}
          </Alert>
        )}

        {/* Student Info */}
        <Card shadow="sm" padding="lg" radius="md" withBorder mb="xl">
          <Group justify="space-between">
            <div>
              <Text fw={500} size="lg">
                {submission.first_name} {submission.last_name}
              </Text>
              <Text size="sm" c="dimmed">
                Student ID: {submission.student_number}
              </Text>
              <Text size="sm" c="dimmed">
                Assessment: {submission.assessment_title}
              </Text>
            </div>
            <Stack gap="xs">
              <div>
                <Text size="sm" c="dimmed">
                  Status
                </Text>
                <Badge>{submission.status}</Badge>
              </div>
              {submission.submitted_at && (
                <div>
                  <Text size="sm" c="dimmed">
                    Submitted
                  </Text>
                  <Text size="sm">
                    {new Date(submission.submitted_at).toLocaleString()}
                  </Text>
                </div>
              )}
            </Stack>
          </Group>
        </Card>

        {/* Answer Grading */}
        <Card shadow="sm" padding="lg" radius="md" withBorder mb="xl">
          <Title order={3} mb="lg">
            Grade Answers
          </Title>

          <Stack gap="lg">
            {submission.answers.map((answer, index) => (
              <Card key={answer.id} p="md" withBorder>
                <Grid gutter="lg">
                  <Grid.Col span={{ base: 12, sm: 8 }}>
                    <Stack gap="md">
                      <div>
                        <Text fw={500} size="sm" mb="xs">
                          Question {index + 1} ({answer.question_type})
                        </Text>
                        <Text size="sm">{answer.question_text}</Text>
                      </div>

                      {answer.question_type === 'multiple_choice' && (
                        <div>
                          <Text size="sm" c="dimmed">
                            Student's Answer: {answer.option_text || 'No answer'}
                          </Text>
                        </div>
                      )}

                      {(answer.question_type === 'short_answer' ||
                        answer.question_type === 'essay') && (
                        <div>
                          <Text size="sm" c="dimmed" mb="xs">
                            Student's Answer:
                          </Text>
                          <Card p="xs" bg="gray.0">
                            <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                              {answer.answer_text || 'No answer provided'}
                            </Text>
                          </Card>
                        </div>
                      )}
                    </Stack>
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 4 }}>
                    <Stack gap="sm">
                      <NumberInput
                        label={`Points (Max: ${answer.points})`}
                        value={scores[answer.id] ?? ''}
                        onChange={(value) =>
                          setScores({
                            ...scores,
                            [answer.id]: value || 0,
                          })
                        }
                        min={0}
                        max={answer.points}
                        placeholder="0"
                      />

                      <Textarea
                        label="Feedback"
                        placeholder="Add feedback for this answer"
                        value={feedback[answer.id] || ''}
                        onChange={(e) =>
                          setFeedback({
                            ...feedback,
                            [answer.id]: e.target.value,
                          })
                        }
                        rows={3}
                      />
                    </Stack>
                  </Grid.Col>
                </Grid>
              </Card>
            ))}
          </Stack>
        </Card>

        {/* Overall Grade */}
        <Card shadow="sm" padding="lg" radius="md" withBorder mb="xl">
          <Title order={3} mb="lg">
            Overall Grade
          </Title>

          <Grid gutter="lg">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <NumberInput
                label={`Total Score (Max: ${totalPoints})`}
                value={overallScore}
                onChange={setOverallScore}
                min={0}
                max={totalPoints}
                placeholder="Auto-calculated"
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Letter Grade"
                placeholder="e.g., A, B+, C"
                value={letterGrade}
                onChange={(e) => setLetterGrade(e.target.value)}
              />
            </Grid.Col>
          </Grid>

          <Textarea
            label="General Feedback"
            placeholder="Add overall feedback for the student"
            value={overallFeedback}
            onChange={(e) => setOverallFeedback(e.target.value)}
            rows={4}
            mt="lg"
          />
        </Card>

        {/* Save Button */}
        <Group justify="flex-end" gap="sm">
          <Button
            variant="light"
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveGrades}
            loading={saving}
            leftSection={<IconCheck size={16} />}
          >
            Save Grades
          </Button>
        </Group>
      </Container>
    </div>
  );
}
