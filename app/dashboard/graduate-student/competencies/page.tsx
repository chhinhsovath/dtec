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
          <Title order={1}>Competency Framework</Title>
          <Text c="dimmed">រចនាសម្ព័ន្ធសមត្ថភាព - Monitor your progress across all 10 competencies</Text>
        </div>
      </Group>

      {/* Overview Card */}
      <Card withBorder p="lg" radius="md" mb="xl" bg="blue.0">
        <Group justify="space-between">
          <Stack gap={0}>
            <Text fw={500} c="dimmed">
              Overall Competency Progress
            </Text>
            <Title order={2} mt="xs">
              {proficientCount}/{competencies.length} Proficient
            </Title>
            <Text size="sm" c="dimmed" mt="xs">
              Minimum requirement for certification: All 10 at Level 3+
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
                    Level {competency.current_level}
                  </Badge>
                  {competency.current_level >= 3 && (
                    <ThemeIcon size="sm" color="teal" variant="light">
                      <IconCheck size={14} />
                    </ThemeIcon>
                  )}
                </Group>
              </Group>

              <Title order={4} mb="xs">
                {competency.name_en}
              </Title>
              <Text size="sm" c="dimmed" mb="md">
                {competency.name_km}
              </Text>

              <Stack gap="sm">
                <div>
                  <Group justify="space-between" mb="xs">
                    <Text size="sm" fw={500}>
                      Score
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
                      Feedback available
                    </Text>
                  </Group>
                )}

                {competency.assessment_date && (
                  <Text size="xs" c="dimmed">
                    Last assessed: {new Date(competency.assessment_date).toLocaleDateString()}
                  </Text>
                )}

                <Button variant="light" size="xs" fullWidth onClick={() => handleViewDetails(competency)}>
                  View Details
                </Button>
              </Stack>
            </Card>
          ))
        ) : (
          <Alert icon={<IconAlertCircle />} color="gray" title="No Assessments">
            You haven't received any competency assessments yet. Check back soon!
          </Alert>
        )}
      </SimpleGrid>

      {/* Competency Details Modal */}
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={selectedCompetency?.name_en}
        size="lg"
      >
        {selectedCompetency && (
          <Stack gap="lg">
            <div>
              <Text fw={500} c="dimmed" size="sm">
                Khmer Name
              </Text>
              <Text size="lg" fw={700}>
                {selectedCompetency.name_km}
              </Text>
            </div>

            {selectedCompetency.description_en && (
              <div>
                <Text fw={500} c="dimmed" size="sm" mb="xs">
                  Description (English)
                </Text>
                <Text size="sm">{selectedCompetency.description_en}</Text>
              </div>
            )}

            {selectedCompetency.description_km && (
              <div>
                <Text fw={500} c="dimmed" size="sm" mb="xs">
                  Description (Khmer)
                </Text>
                <Text size="sm">{selectedCompetency.description_km}</Text>
              </div>
            )}

            <div>
              <Group justify="space-between" mb="xs">
                <Text fw={500}>Current Level</Text>
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
                <Text fw={500}>Score</Text>
                <Text fw={700}>{selectedCompetency.score}/100</Text>
              </Group>
              <Progress
                value={selectedCompetency.score}
                color={LEVEL_DESCRIPTIONS[selectedCompetency.current_level]?.color}
                size="lg"
              />
            </div>

            {selectedCompetency.current_level >= 3 && (
              <Alert icon={<IconCheck />} color="teal" title="Proficient">
                You have achieved proficiency in this competency. This counts toward your certification requirement.
              </Alert>
            )}

            {selectedCompetency.feedback_text && (
              <Card withBorder p="lg" radius="md" bg="gray.0">
                <Group mb="sm">
                  <IconMessageCircle size={20} />
                  <Text fw={500}>Mentor Feedback</Text>
                </Group>
                <Text size="sm">{selectedCompetency.feedback_text}</Text>
                {selectedCompetency.assessment_date && (
                  <Text size="xs" c="dimmed" mt="xs">
                    Provided on {new Date(selectedCompetency.assessment_date).toLocaleDateString()}
                  </Text>
                )}
              </Card>
            )}

            {!selectedCompetency.feedback_text && (
              <Alert icon={<IconAlertCircle />} color="yellow" title="No Feedback Yet">
                Your mentor hasn't provided feedback on this competency yet. Check back soon!
              </Alert>
            )}

            <Button fullWidth onClick={() => setModalOpened(false)}>
              Close
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
