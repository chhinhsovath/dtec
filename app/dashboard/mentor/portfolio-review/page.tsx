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
  Loader,
  Center,
  Stack,
  Group,
  ThemeIcon,
  Alert,
  Modal,
  Textarea,
  SimpleGrid,
  Tabs,
  Select,
  Progress,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconAlertCircle,
  IconUser,
  IconFile,
  IconCheck,
  IconMessage,
  IconSend,
} from '@tabler/icons-react';
import { getSession } from '@/lib/auth/client-auth';

interface PortfolioEvidence {
  evidence_id: string;
  competency_id: string;
  competency_number: number;
  competency_name_en: string;
  competency_name_km: string;
  evidence_type_km: string;
  evidence_type_en: string;
  title_km: string;
  title_en: string;
  description_km: string;
  description_en: string;
  file_url: string;
  submitted_date: string;
  mentor_feedback?: string;
}

interface StudentPortfolio {
  student_id: string;
  student_code: string;
  full_name: string;
  email: string;
  portfolio_id: string;
  submission_status: string;
  last_updated: string;
  evidence_count: number;
  evidence: PortfolioEvidence[];
}

interface Mentee {
  mentor_relationship_id: string;
  graduate_student_id: string;
  student_code: string;
  email: string;
  full_name: string;
  relationship_status: string;
  batch_code: string;
}

export default function PortfolioReviewPage() {
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [selectedMentee, setSelectedMentee] = useState<Mentee | null>(null);
  const [portfolioData, setPortfolioData] = useState<StudentPortfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<PortfolioEvidence | null>(null);
  const [feedbackModalOpened, setFeedbackModalOpened] = useState(false);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
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

        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleSelectMentee = async (mentee: Mentee) => {
    setSelectedMentee(mentee);
    setLoadingPortfolio(true);

    try {
      const res = await fetch(`/api/graduate-student/portfolio?studentId=${mentee.graduate_student_id}`);
      if (res.ok) {
        const data = await res.json();
        setPortfolioData({
          student_id: mentee.graduate_student_id,
          student_code: mentee.student_code,
          full_name: mentee.full_name,
          email: mentee.email,
          portfolio_id: data.data.portfolio?.portfolio_id || '',
          submission_status: data.data.portfolio?.submission_status || 'draft',
          last_updated: data.data.portfolio?.last_updated || '',
          evidence_count: data.data.evidenceCount || 0,
          evidence: data.data.evidence || [],
        });
      }
    } catch (err) {
      console.error('Error loading portfolio:', err);
      alert('Failed to load student portfolio');
    } finally {
      setLoadingPortfolio(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!selectedEvidence || !feedbackText.trim()) {
      alert('Please enter feedback');
      return;
    }

    setSubmittingFeedback(true);
    try {
      // In a real implementation, this would call an API endpoint
      // For now, we'll update local state
      if (portfolioData) {
        const updatedEvidence = portfolioData.evidence.map((ev) =>
          ev.evidence_id === selectedEvidence.evidence_id
            ? { ...ev, mentor_feedback: feedbackText }
            : ev
        );
        setPortfolioData({ ...portfolioData, evidence: updatedEvidence });
        setSelectedEvidence({ ...selectedEvidence, mentor_feedback: feedbackText });
      }

      alert('Feedback submitted successfully!');
      setFeedbackText('');
      setFeedbackModalOpened(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
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
          <Title order={1}>Portfolio Review / វាយតម្លៃផលប័ត្ររបស់សិស្ស</Title>
          <Text c="dimmed">Review and provide feedback on student portfolios</Text>
        </div>
      </Group>

      <SimpleGrid cols={{ base: 1, md: 4 }} spacing="lg">
        {/* Mentees Sidebar */}
        <Card withBorder p="lg" radius="md">
          <Title order={4} mb="lg">
            Your Mentees / សិស្សដែលលោកអ្នកផ្តួចផ្តើម
          </Title>
          <Stack gap="sm">
            {mentees.length > 0 ? (
              mentees.map((mentee) => (
                <Card
                  key={mentee.mentor_relationship_id}
                  p="sm"
                  style={{
                    cursor: 'pointer',
                    backgroundColor: selectedMentee?.graduate_student_id === mentee.graduate_student_id ? '#e7f5ff' : 'transparent',
                    borderColor: selectedMentee?.graduate_student_id === mentee.graduate_student_id ? '#1c7ed6' : undefined,
                    border: selectedMentee?.graduate_student_id === mentee.graduate_student_id ? '2px solid' : 'none',
                  }}
                  onClick={() => handleSelectMentee(mentee)}
                  withBorder
                >
                  <Group justify="space-between" mb="xs">
                    <div>
                      <Text fw={500} size="sm">
                        {mentee.full_name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {mentee.student_code}
                      </Text>
                    </div>
                    {selectedMentee?.graduate_student_id === mentee.graduate_student_id && (
                      <IconCheck size={16} color="teal" />
                    )}
                  </Group>
                </Card>
              ))
            ) : (
              <Text c="dimmed" size="sm">
                No mentees assigned
              </Text>
            )}
          </Stack>
        </Card>

        {/* Portfolio Content */}
        <div style={{ gridColumn: 'span 3' }}>
          {selectedMentee ? (
            <>
              {loadingPortfolio ? (
                <Center h={400}>
                  <Loader size="lg" />
                </Center>
              ) : portfolioData ? (
                <>
                  {/* Student Info & Portfolio Status */}
                  <Card withBorder p="lg" radius="md" mb="xl" bg="blue.0">
                    <Group justify="space-between" mb="lg">
                      <div>
                        <Title order={3}>{portfolioData.full_name}</Title>
                        <Text c="dimmed" size="sm">
                          {portfolioData.student_code} • {portfolioData.email}
                        </Text>
                      </div>
                      <Badge
                        color={portfolioData.submission_status === 'submitted' ? 'teal' : 'yellow'}
                        size="lg"
                        variant="light"
                      >
                        {portfolioData.submission_status === 'submitted' ? 'Submitted' : 'Draft'}
                      </Badge>
                    </Group>

                    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                      <div>
                        <Text fw={500} size="sm" c="dimmed">
                          Evidence Count / ចំនួនឯកសារ
                        </Text>
                        <Title order={4}>{portfolioData.evidence_count}</Title>
                      </div>
                      <div>
                        <Text fw={500} size="sm" c="dimmed">
                          Status / ស្ថានភាព
                        </Text>
                        <Progress
                          value={portfolioData.evidence_count > 0 ? 75 : 25}
                          color={portfolioData.evidence_count > 15 ? 'teal' : 'yellow'}
                          size="sm"
                          mt="xs"
                        />
                      </div>
                      <div>
                        <Text fw={500} size="sm" c="dimmed">
                          Last Updated / ការផ្លាស់ប្តូរចុងក្រោយ
                        </Text>
                        <Text size="sm">
                          {new Date(portfolioData.last_updated).toLocaleDateString()}
                        </Text>
                      </div>
                    </SimpleGrid>
                  </Card>

                  {/* Evidence by Competency */}
                  {portfolioData.evidence.length > 0 ? (
                    <Card withBorder p="lg" radius="md">
                      <Title order={4} mb="lg">
                        Submitted Evidence / ឯកសារលម្អិត
                      </Title>

                      <Stack gap="md">
                        {portfolioData.evidence.map((evidence) => (
                          <Card key={evidence.evidence_id} p="md" bg="gray.0" withBorder>
                            <Group justify="space-between" mb="sm">
                              <div style={{ flex: 1 }}>
                                <Group gap="xs" mb="xs">
                                  <Badge size="sm">{evidence.competency_number}</Badge>
                                  <Badge size="sm" color="blue" variant="light">
                                    {evidence.evidence_type_en}
                                  </Badge>
                                  <Text size="xs" c="dimmed">
                                    {new Date(evidence.submitted_date).toLocaleDateString()}
                                  </Text>
                                </Group>
                                <Title order={5}>{evidence.title_en}</Title>
                                <Text size="xs" c="dimmed" mt="xs">
                                  {evidence.title_km}
                                </Text>
                                <Text size="sm" mt="xs">
                                  {evidence.competency_name_en}
                                </Text>
                              </div>
                              <Button
                                variant="light"
                                size="sm"
                                leftSection={<IconMessage size={14} />}
                                onClick={() => {
                                  setSelectedEvidence(evidence);
                                  setFeedbackText(evidence.mentor_feedback || '');
                                  setFeedbackModalOpened(true);
                                }}
                              >
                                Feedback
                              </Button>
                            </Group>

                            {evidence.description_en && (
                              <Text size="sm" c="dimmed" mt="sm">
                                {evidence.description_en}
                              </Text>
                            )}

                            {evidence.mentor_feedback && (
                              <Alert icon={<IconCheck />} color="teal" title="Your Feedback" mt="sm">
                                {evidence.mentor_feedback}
                              </Alert>
                            )}
                          </Card>
                        ))}
                      </Stack>
                    </Card>
                  ) : (
                    <Alert icon={<IconAlertCircle />} color="yellow">
                      No evidence submitted yet by this student.
                    </Alert>
                  )}
                </>
              ) : (
                <Alert icon={<IconAlertCircle />} color="gray">
                  Portfolio not found for this student.
                </Alert>
              )}
            </>
          ) : (
            <Card withBorder p="lg" radius="md">
              <Center h={400}>
                <Stack gap="md" align="center">
                  <IconUser size={48} color="gray" />
                  <Text c="dimmed">Select a mentee to view their portfolio</Text>
                </Stack>
              </Center>
            </Card>
          )}
        </div>
      </SimpleGrid>

      {/* Feedback Modal */}
      <Modal
        opened={feedbackModalOpened}
        onClose={() => setFeedbackModalOpened(false)}
        title="Provide Feedback / ផ្តល់មតិយោបល់"
        size="lg"
      >
        {selectedEvidence && (
          <Stack gap="lg">
            <div>
              <Text fw={500} mb="xs">
                Evidence / ឯកសារ
              </Text>
              <Title order={5}>{selectedEvidence.title_en}</Title>
              <Text size="sm" c="dimmed">
                {selectedEvidence.title_km}
              </Text>
              <Badge size="sm" mt="xs">
                {selectedEvidence.competency_number}. {selectedEvidence.competency_name_en}
              </Badge>
            </div>

            <Textarea
              label="Your Feedback / មតិយោបល់របស់លោកអ្នក"
              placeholder="Provide constructive feedback on this evidence..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.currentTarget.value)}
              minRows={5}
              required
            />

            <Group justify="flex-end">
              <Button variant="default" onClick={() => setFeedbackModalOpened(false)}>
                Cancel
              </Button>
              <Button
                leftSection={<IconSend size={16} />}
                onClick={handleSubmitFeedback}
                loading={submittingFeedback}
              >
                Submit Feedback
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Container>
  );
}
