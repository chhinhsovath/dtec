'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Title,
  Text,
  Card,
  Badge,
  Progress,
  Loader,
  Center,
  Stack,
  Group,
  ThemeIcon,
  SimpleGrid,
  Alert,
  Button,
  Modal,
  Tabs,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconAlertCircle,
  IconCheck,
  IconMessageCircle,
  IconFileText,
} from '@tabler/icons-react';
import { getSession } from '@/lib/auth/client-auth';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface Competency {
  competency_assessment_id: string;
  competency_id: string;
  competency_number: number;
  name_km: string;
  name_en: string;
  description_km: string;
  description_en: string;
  current_level: number;
  score: number;
  feedback_text: string;
  assessment_date: string;
}

const LEVEL_DESCRIPTIONS: Record<number, { name: string; description: string; color: string }> = {
  1: {
    name: 'Beginning',
    description: 'Demonstrates foundational understanding and needs support to develop this competency',
    color: '#FF6B6B',
  },
  2: {
    name: 'Developing',
    description: 'Shows progress toward proficiency and is making improvements in this competency',
    color: '#FFA94D',
  },
  3: {
    name: 'Proficient',
    description: 'Meets the standard consistently and demonstrates competency in this area',
    color: '#51CF66',
  },
  4: {
    name: 'Advanced',
    description: 'Exceeds the standard and demonstrates excellence in this competency',
    color: '#339AF0',
  },
  5: {
    name: 'Master',
    description: 'Exemplary performance and can mentor others in this competency',
    color: '#7950F2',
  },
};

export default function CompetenciesPage() {
  const { language } = useTranslation();
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [selectedCompetency, setSelectedCompetency] = useState<Competency | null>(null);
  const [modalOpened, setModalOpened] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadCompetencies = async () => {
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

        const res = await fetch('/api/graduate-student/competencies');
        if (!res.ok) {
          throw new Error('Failed to fetch competencies');
        }

        const data = await res.json();
        setCompetencies(data.data || []);
        setLoading(false);
      } catch (err) {
        console.error('Error loading competencies:', err);
        setError(err instanceof Error ? err.message : 'Failed to load competencies');
        setLoading(false);
      }
    };

    loadCompetencies();
  }, [router]);

  const handleViewDetails = (competency: Competency) => {
    setSelectedCompetency(competency);
    setModalOpened(true);
  };

  const proficientCount = competencies.filter((c) => c.current_level >= 3).length;
  const proficiencyPercentage = competencies.length > 0 ? (proficientCount / competencies.length) * 100 : 0;

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

  return (
    <Container size="xl" py="xl">
      {/* Header */}
      <Group mb="xl">
        <Button
          variant="default"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => router.back()}
        >
          {language === 'km' ? 'ត្រលប់ក្រោយ' : 'Back'}
        </Button>
        <div style={{ flex: 1 }}>
          <Title order={1}>{language === 'km' ? 'ក្របខ័ណ្ឌសមត្ថភាព' : 'Competency Framework'}</Title>
          <Text c="dimmed">{language === 'km' ? 'ត្រួតពិនិត្យការវិវឌ្ឍន៍របស់អ្នកលើសមត្ថភាពទាំង ១០' : 'Monitor your progress across all 10 competencies'}</Text>
        </div>
      </Group>

      {/* Overview Card */}
      <Card withBorder p="lg" radius="md" mb="xl" bg="blue.0">
        <Group justify="space-between">
          <Stack gap={0}>
            <Text fw={500} c="dimmed">
              {language === 'km' ? 'ការវិវឌ្ឍន៍សមត្ថភាពទូទៅ' : 'Overall Competency Progress'}
            </Text>
            <Title order={2} mt="xs">
              {proficientCount}/{competencies.length} {language === 'km' ? 'មានសមត្ថភាព' : 'Proficient'}
            </Title>
            <Text size="sm" c="dimmed" mt="xs">
              {language === 'km' ? 'តម្រូវការអប្បបរមាសម្រាប់វិញ្ញាបនបត្រ៖ ទាំងអស់ ១០ ស្ថិតក្នុងកម្រិតទី ៣ ឬខ្ពស់ជាងនេះ' : 'Minimum requirement for certification: All 10 at Level 3+'}
            </Text>
          </Stack>
          <div style={{ width: 120, height: 120 }}>
            <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%' }}>
              <circle
                cx="60"
                cy="60"
                r="55"
                fill="none"
                stroke="#e0e0e0"
                strokeWidth="8"
              />
              <circle
                cx="60"
                cy="60"
                r="55"
                fill="none"
                stroke="#51CF66"
                strokeWidth="8"
                strokeDasharray={`${(proficiencyPercentage / 100) * 345} 345`}
                strokeLinecap="round"
                style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px' }}
              />
              <text
                x="60"
                y="65"
                textAnchor="middle"
                fontSize="20"
                fontWeight="bold"
                fill="#333"
              >
                {proficiencyPercentage.toFixed(0)}%
              </text>
            </svg>
          </div>
        </Group>
      </Card>

      {/* Competency Grid */}
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
        {competencies.length > 0 ? (
          competencies.map((competency) => (
            <Card
              key={competency.competency_assessment_id}
              withBorder
              p="lg"
              radius="md"
              style={{ cursor: 'pointer' }}
              onClick={() => handleViewDetails(competency)}
              className="hover"
            >
              <Group justify="space-between" mb="sm">
                <div>
                  <Badge size="lg" variant="light">
                    {competency.competency_number}
                  </Badge>
                </div>
                <Group gap="xs">
                  <Badge
                    color={LEVEL_DESCRIPTIONS[competency.current_level]?.color}
                    variant="filled"
                  >
                    {language === 'km' ? 'កម្រិត' : 'Level'} {competency.current_level}
                  </Badge>
                  {competency.current_level >= 3 && (
                    <ThemeIcon size="sm" color="teal" variant="light">
                      <IconCheck size={14} />
                    </ThemeIcon>
                  )}
                </Group>
              </Group>

              <Title order={4} mb="xs">
                {language === 'km' ? competency.name_km : competency.name_en}
              </Title>

              <Stack gap="sm">
                <div>
                  <Group justify="space-between" mb="xs">
                    <Text size="sm" fw={500}>
                      {language === 'km' ? 'ពិន្ទុ' : 'Score'}
                    </Text>
                    <Text size="sm" fw={700}>
                      {competency.score}/100
                    </Text>
                  </Group>
                  <Progress
                    value={competency.score}
                    color={LEVEL_DESCRIPTIONS[competency.current_level]?.color}
                    size="md"
                  />
                </div>

                {competency.feedback_text && (
                  <Group gap="xs">
                    <IconMessageCircle size={16} color="#999" />
                    <Text size="xs" c="dimmed">
                      {language === 'km' ? 'មានមតិកែលម្អ' : 'Feedback available'}
                    </Text>
                  </Group>
                )}

                {competency.assessment_date && (
                  <Text size="xs" c="dimmed">
                    {language === 'km' ? 'វាយតម្លៃចុងក្រោយ' : 'Last assessed'}: {new Date(competency.assessment_date).toLocaleDateString()}
                  </Text>
                )}

                <Button variant="light" size="xs" fullWidth onClick={() => handleViewDetails(competency)}>
                  {language === 'km' ? 'មើលព័ត៌មានលម្អិត' : 'View Details'}
                </Button>
              </Stack>
            </Card>
          ))
        ) : (
          <Alert icon={<IconAlertCircle />} color="gray" title={language === 'km' ? 'គ្មានការវាយតម្លៃ' : 'No Assessments'}>
            {language === 'km' ? 'អ្នកមិនទាន់ទទួលបានការវាយតម្លៃសមត្ថភាពណាមួយនៅឡើយទេ។ សូមពិនិត្យមើលជាថ្មីនៅពេលក្រោយ!' : 'You haven\'t received any competency assessments yet. Check back soon!'}
          </Alert>
        )}
      </SimpleGrid>

      {/* Competency Details Modal */}
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={language === 'km' ? selectedCompetency?.name_km : selectedCompetency?.name_en}
        size="lg"
      >
        {selectedCompetency && (
          <Stack gap="lg">
            <div>
              <Text fw={500} c="dimmed" size="sm">
                {language === 'km' ? 'ឈ្មោះជាភាសាខ្មែរ' : 'Khmer Name'}
              </Text>
              <Text size="lg" fw={700}>
                {selectedCompetency.name_km}
              </Text>
            </div>

            {selectedCompetency.description_en && (
              <div>
                <Text fw={500} c="dimmed" size="sm" mb="xs">
                  {language === 'km' ? 'ការពិពណ៌នា (អង់គ្លេស)' : 'Description (English)'}
                </Text>
                <Text size="sm">{selectedCompetency.description_en}</Text>
              </div>
            )}

            {selectedCompetency.description_km && (
              <div>
                <Text fw={500} c="dimmed" size="sm" mb="xs">
                  {language === 'km' ? 'ការពិពណ៌នា (ខ្មែរ)' : 'Description (Khmer)'}
                </Text>
                <Text size="sm">{selectedCompetency.description_km}</Text>
              </div>
            )}

            <div>
              <Group justify="space-between" mb="xs">
                <Text fw={500}>{language === 'km' ? 'កម្រិតបច្ចុប្បន្ន' : 'Current Level'}</Text>
                <Badge
                  color={LEVEL_DESCRIPTIONS[selectedCompetency.current_level]?.color}
                  variant="filled"
                >
                  {selectedCompetency.current_level} -{' '}
                  {LEVEL_DESCRIPTIONS[selectedCompetency.current_level]?.name}
                </Badge>
              </Group>
              <Text size="sm" c="dimmed">
                {LEVEL_DESCRIPTIONS[selectedCompetency.current_level]?.description}
              </Text>
            </div>

            <div>
              <Group justify="space-between" mb="xs">
                <Text fw={500}>{language === 'km' ? 'ពិន្ទុ' : 'Score'}</Text>
                <Text fw={700}>{selectedCompetency.score}/100</Text>
              </Group>
              <Progress
                value={selectedCompetency.score}
                color={LEVEL_DESCRIPTIONS[selectedCompetency.current_level]?.color}
                size="lg"
              />
            </div>

            {selectedCompetency.current_level >= 3 && (
              <Alert icon={<IconCheck />} color="teal" title={language === 'km' ? 'មានសមត្ថភាព' : 'Proficient'}>
                {language === 'km'
                  ? 'អ្នកបានសម្រេចសមត្ថភាពក្នុងសមត្ថភាពនេះ។ វារាប់បញ្ចូលក្នុងតម្រូវការវិញ្ញាបនបត្ររបស់អ្នក។'
                  : 'You have achieved proficiency in this competency. This counts toward your certification requirement.'}
              </Alert>
            )}

            {selectedCompetency.feedback_text && (
              <Card withBorder p="lg" radius="md" bg="gray.0">
                <Group mb="sm">
                  <IconMessageCircle size={20} />
                  <Text fw={500}>{language === 'km' ? 'មតិកែលម្អពីអ្នកណែនាំ' : 'Mentor Feedback'}</Text>
                </Group>
                <Text size="sm">{selectedCompetency.feedback_text}</Text>
                {selectedCompetency.assessment_date && (
                  <Text size="xs" c="dimmed" mt="xs">
                    {language === 'km' ? 'ផ្តល់ជូននៅថ្ងៃ' : 'Provided on'} {new Date(selectedCompetency.assessment_date).toLocaleDateString()}
                  </Text>
                )}
              </Card>
            )}

            {!selectedCompetency.feedback_text && (
              <Alert icon={<IconAlertCircle />} color="yellow" title={language === 'km' ? 'មិនទាន់មានមតិកែលម្អ' : 'No Feedback Yet'}>
                {language === 'km'
                  ? 'អ្នកណែនាំរបស់អ្នកមិនទាន់ផ្តល់មតិកែលម្អលើសមត្ថភាពនេះនៅឡើយទេ។ សូមពិនិត្យមើលជាថ្មីនៅពេលក្រោយ!'
                  : 'Your mentor hasn\'t provided feedback on this competency yet. Check back soon!'}
              </Alert>
            )}

            <Button fullWidth onClick={() => setModalOpened(false)}>
              {language === 'km' ? 'បិទ' : 'Close'}
            </Button>
          </Stack>
        )}
      </Modal>

      <style>{`
        .hover:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
          transition: all 0.2s ease;
        }
      `}</style>
    </Container>
  );
}
