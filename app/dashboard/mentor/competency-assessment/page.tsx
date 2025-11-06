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
  Slider,
  Textarea,
  Stack,
  Group,
  Alert,
  Loader,
  Center,
  Modal,
  Table,
  SimpleGrid,
  ThemeIcon,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconCheck,
  IconSend,
  IconArrowLeft,
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

interface Competency {
  competency_id: string;
  competency_number: number;
  name_km: string;
  name_en: string;
  description_km: string;
  description_en: string;
}

interface CompetencyData {
  competency_assessment_id: string;
  competency_id: string;
  current_level: number;
  score: number;
  feedback_text: string;
  assessment_date: string;
}

const LEVEL_OPTIONS = [
  { value: '1', label: '1 - Beginning' },
  { value: '2', label: '2 - Developing' },
  { value: '3', label: '3 - Proficient (Required)' },
  { value: '4', label: '4 - Advanced' },
  { value: '5', label: '5 - Master' },
];

export default function CompetencyAssessmentPage() {
  const { language } = useTranslation();
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [selectedMentee, setSelectedMentee] = useState<Mentee | null>(null);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [assessments, setAssessments] = useState<Record<string, CompetencyData>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [currentLevel, setCurrentLevel] = useState<string>('3');
  const [score, setScore] = useState<number>(75);
  const [feedback, setFeedback] = useState<string>('');
  const [selectedCompetencyId, setSelectedCompetencyId] = useState<string>('');
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

        // Load mentees
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

  useEffect(() => {
    // In a real implementation, fetch competencies from API
    // For now, we'll use hardcoded data
    const hardcodedCompetencies: Competency[] = [
      {
        competency_id: 'comp-1',
        competency_number: 1,
        name_km: 'ការយល់ដឹងខ្លួនឯង',
        name_en: 'Self-Awareness & Reflection',
        description_km: 'ការយល់ដឹងលម្អិត...',
        description_en: 'Understanding oneself as a teacher...',
      },
      {
        competency_id: 'comp-2',
        competency_number: 2,
        name_km: 'ចំណេះដឹងលម្អិត',
        name_en: 'Subject Matter Knowledge',
        description_km: 'ចម្ងាយក្នុងលម្អិត...',
        description_en: 'Deep understanding of subject matter...',
      },
      {
        competency_id: 'comp-3',
        competency_number: 3,
        name_km: 'ការរៀបចំឧបករណ៍សិក្សា',
        name_en: 'Curriculum Design & Alignment',
        description_km: 'ចម្លងឧបករណ៍សិក្សា...',
        description_en: 'Designing aligned curriculum...',
      },
      {
        competency_id: 'comp-4',
        competency_number: 4,
        name_km: 'ក្បួនដាលបង្រៀនដែលមាន',
        name_en: 'Effective Teaching Strategies',
        description_km: 'អនុវត្តក្បួនដាល់...',
        description_en: 'Using effective teaching methods...',
      },
      {
        competency_id: 'comp-5',
        competency_number: 5,
        name_km: 'ការគ្រប់គ្រងថ្នាក់រៀន',
        name_en: 'Classroom Management',
        description_km: 'បង្កើតបរិយាកាស...',
        description_en: 'Creating positive classroom environment...',
      },
      {
        competency_id: 'comp-6',
        competency_number: 6,
        name_km: 'ការវាយតម្លៃសិស្ស',
        name_en: 'Student Assessment',
        description_km: 'ប្រើប្រាស់ការវាយតម្លៃ...',
        description_en: 'Using varied assessment strategies...',
      },
      {
        competency_id: 'comp-7',
        competency_number: 7,
        name_km: 'ការឆ្លើយឆ្លងលម្អិត',
        name_en: 'Differentiation & Inclusion',
        description_km: 'សម្របស្របនឹងការបង្រៀន...',
        description_en: 'Providing differentiated instruction...',
      },
      {
        competency_id: 'comp-8',
        competency_number: 8,
        name_km: 'ការនិយាយយល់ដឹង',
        name_en: 'Communication & Collaboration',
        description_km: 'ទំនាក់ទំនងប្រកបដោយ...',
        description_en: 'Communicating effectively...',
      },
      {
        competency_id: 'comp-9',
        competency_number: 9,
        name_km: 'ស្មរតាមល្បឿន',
        name_en: 'Professional Ethics & Conduct',
        description_km: 'សារលើកកម្ពស់...',
        description_en: 'Maintaining professional ethics...',
      },
      {
        competency_id: 'comp-10',
        competency_number: 10,
        name_km: 'ការប្រើប្រាស់បច្ចេកវិទ្យា',
        name_en: 'Technology & Innovation',
        description_km: 'ប្រើប្រាស់បច្ចេកវិទ្យា...',
        description_en: 'Using technology effectively...',
      },
    ];
    setCompetencies(hardcodedCompetencies);
  }, []);

  const handleSelectMentee = (mentee: Mentee) => {
    setSelectedMentee(mentee);
    setError(null);
    setSuccess(null);
  };

  const handleSubmitAssessment = async () => {
    if (!selectedMentee || !selectedCompetencyId) {
      setError('Please select a mentee and competency');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/graduate-student/competencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          graduateStudentId: selectedMentee.graduate_student_id,
          competencyId: selectedCompetencyId,
          currentLevel: parseInt(currentLevel),
          score: score,
          feedbackText: feedback,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit assessment');
      }

      setSuccess(`Assessment for ${selectedMentee.full_name} submitted successfully!`);
      setCurrentLevel('3');
      setScore(75);
      setFeedback('');
      setSelectedCompetencyId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit assessment');
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
            {language === 'km' ? 'វាយតម្លៃសមត្ថភាព' : 'Competency Assessment'}
          </Title>
          <Text c="dimmed">
            {language === 'km' ? 'វាយតម្លៃលក្ខណៈសមត្ថភាពរបស់ម៉ាក់សិស្ស' : "Assess your mentees' competency progress"}
          </Text>
        </div>
      </Group>

      {/* Alerts */}
      {error && (
        <Alert icon={<IconAlertCircle />} color="red" title="Error" mb="lg">
          {error}
        </Alert>
      )}
      {success && (
        <Alert icon={<IconCheck />} color="teal" title="Success" mb="lg">
          {success}
        </Alert>
      )}

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg" mb="xl">
        {/* Mentees List */}
        <Card withBorder p="lg" radius="md">
          <Title order={4} mb="lg">
            {language === 'km' ? 'ម៉ាក់សិស្សរបស់អ្នក' : 'Your Mentees'}
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
                {language === 'km' ? 'មិនមានម៉ាក់សិស្សដែលបានផ្តល់ឱ្យ' : 'No mentees assigned yet'}
              </Text>
            )}
          </Stack>
        </Card>

        {/* Assessment Form */}
        {selectedMentee && (
          <Card withBorder p="lg" radius="md">
            <Title order={4} mb="lg">
              {language === 'km' ? 'ឯកសារវាយតម្លៃ' : 'Assessment Form'}
            </Title>
            <Stack gap="md">
              <div>
                <Text fw={500} size="sm" mb="xs">
                  {language === 'km' ? 'ម៉ាក់សិស្ស' : 'Mentee'}
                </Text>
                <Text>{selectedMentee.full_name}</Text>
              </div>

              <Select
                label={language === 'km' ? 'សមត្ថភាព' : 'Competency'}
                placeholder={language === 'km' ? 'ជ្រើសរើសសមត្ថភាព' : 'Select competency'}
                data={competencies.map((c) => ({
                  value: c.competency_id,
                  label: `${c.competency_number}. ${language === 'km' ? c.name_km : c.name_en}`,
                }))}
                value={selectedCompetencyId}
                onChange={(val) => setSelectedCompetencyId(val || '')}
              />

              <Select
                label="Level"
                data={LEVEL_OPTIONS}
                value={currentLevel}
                onChange={(val) => setCurrentLevel(val || '3')}
              />

              <div>
                <Group justify="space-between" mb="xs">
                  <Text fw={500} size="sm">
                    Score: {score}/100
                  </Text>
                </Group>
                <Slider
                  value={score}
                  onChange={setScore}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>

              <Textarea
                label="Feedback (Khmer/English)"
                placeholder="Provide constructive feedback..."
                minRows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.currentTarget.value)}
              />

              <Button
                fullWidth
                leftSection={<IconSend size={16} />}
                onClick={handleSubmitAssessment}
                loading={submitting}
                disabled={!selectedCompetencyId}
              >
                {language === 'km' ? 'ដាក់ស្នើវាយតម្លៃ' : 'Submit Assessment'}
              </Button>
            </Stack>
          </Card>
        )}

        {/* Competency Reference */}
        <Card withBorder p="lg" radius="md">
          <Title order={4} mb="lg">
            {language === 'km' ? 'កម្រិតសមត្ថភាព' : 'Competency Levels'}
          </Title>
          <Stack gap="sm">
            <div>
              <Badge color="#FF6B6B">Level 1</Badge>
              <Text size="xs" mt="xs">
                {language === 'km' ? 'ចាប់ផ្តើម - ត្រូវការគាំ' : 'Beginning - needs support'}
              </Text>
            </div>
            <div>
              <Badge color="#FFA94D">Level 2</Badge>
              <Text size="xs" mt="xs">
                {language === 'km' ? 'កំពុងលូតលាស់ - បង្ហាញលក្ខណៈវិវឌ្ឍន៍' : 'Developing - showing growth'}
              </Text>
            </div>
            <div>
              <Badge color="#51CF66">Level 3</Badge>
              <Text size="xs" mt="xs">
                {language === 'km' ? 'ឈានដល់ស្តង់ដារ - ឈានដល់ស្តង់ដារ ✓' : 'Proficient - meets standard ✓'}
              </Text>
            </div>
            <div>
              <Badge color="#339AF0">Level 4</Badge>
              <Text size="xs" mt="xs">
                {language === 'km' ? 'កម្រិតខ្ពស់ - ឆ្ពោះលើស ស្តង់ដារ' : 'Advanced - exceeds standard'}
              </Text>
            </div>
            <div>
              <Badge color="#7950F2">Level 5</Badge>
              <Text size="xs" mt="xs">
                {language === 'km' ? 'ជាម្ចាស់ - តូចលម្អ' : 'Master - exemplary'}
              </Text>
            </div>
          </Stack>
        </Card>
      </SimpleGrid>

      {/* Competencies Reference Table */}
      <Card withBorder p="lg" radius="md">
        <Title order={4} mb="lg">
          {language === 'km' ? 'សម្ភារៈយោងសមត្ថភាពទាំងអស់' : 'All Competencies Reference'}
        </Title>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>#</Table.Th>
              <Table.Th>{language === 'km' ? 'ភាសាអង់គ្លេស' : 'English'}</Table.Th>
              <Table.Th>{language === 'km' ? 'ភាសាខ្មែរ' : 'Khmer'}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {competencies.map((comp) => (
              <Table.Tr
                key={comp.competency_id}
                style={{
                  cursor: 'pointer',
                  backgroundColor: selectedCompetencyId === comp.competency_id ? '#e7f5ff' : undefined,
                }}
                onClick={() => setSelectedCompetencyId(comp.competency_id)}
              >
                <Table.Td>{comp.competency_number}</Table.Td>
                <Table.Td>{comp.name_en}</Table.Td>
                <Table.Td>{comp.name_km}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>
    </Container>
  );
}
