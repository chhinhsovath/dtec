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
  Select,
  Textarea,
  TextInput,
  Tabs,
  SimpleGrid,
  Progress,
  RingProgress,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconAlertCircle,
  IconUpload,
  IconFile,
  IconFolderOpen,
  IconCheck,
  IconClock,
  IconPlus,
  IconLink,
  IconDownload,
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

interface Portfolio {
  portfolio_id: string;
  student_id: string;
  created_date: string;
  submission_status: string;
  last_updated: string;
}

interface PortfolioData {
  portfolio: Portfolio | null;
  evidence: PortfolioEvidence[];
  evidenceCount: number;
}

interface Competency {
  competency_id: string;
  competency_number: number;
  name_km: string;
  name_en: string;
}

const EVIDENCE_TYPES = [
  { label: 'Lesson Plan / ផែនការមេរៀន', value: 'lesson_plan' },
  { label: 'Student Work Sample / គំរូការងារសិស្ស', value: 'work_sample' },
  { label: 'Assessment Tool / ឧបករណ៍វាយតម្លៃ', value: 'assessment_tool' },
  { label: 'Video Recording / វីដេអូ', value: 'video' },
  { label: 'Reflection / ការឆ្លុះបញ្ចាំង', value: 'reflection' },
  { label: 'Research / ការស្រាវស្រាវ', value: 'research' },
  { label: 'Observation Report / របាយការណ៍ការសង្កេត', value: 'observation' },
  { label: 'Other / ផ្សេងទៀត', value: 'other' },
];

const COMPETENCIES: Competency[] = [
  { competency_id: 'comp-1', competency_number: 1, name_km: 'ការយល់ដឹងខ្លួនឯង', name_en: 'Self-Awareness & Reflection' },
  { competency_id: 'comp-2', competency_number: 2, name_km: 'ចំណេះដឹងលម្អិត', name_en: 'Subject Matter Knowledge' },
  { competency_id: 'comp-3', competency_number: 3, name_km: 'ការរៀបចំឧបករណ៍សិក្សា', name_en: 'Curriculum Design & Alignment' },
  { competency_id: 'comp-4', competency_number: 4, name_km: 'ក្បួនដាលបង្រៀនដែលមាន', name_en: 'Effective Teaching Strategies' },
  { competency_id: 'comp-5', competency_number: 5, name_km: 'ការគ្រប់គ្រងថ្នាក់រៀន', name_en: 'Classroom Management' },
  { competency_id: 'comp-6', competency_number: 6, name_km: 'ការវាយតម្លៃសិស្ស', name_en: 'Student Assessment' },
  { competency_id: 'comp-7', competency_number: 7, name_km: 'ការឆ្លើយឆ្លងលម្អិត', name_en: 'Differentiation & Inclusion' },
  { competency_id: 'comp-8', competency_number: 8, name_km: 'ការនិយាយយល់ដឹង', name_en: 'Communication & Collaboration' },
  { competency_id: 'comp-9', competency_number: 9, name_km: 'ស្មរតាមល្បឿន', name_en: 'Professional Ethics & Conduct' },
  { competency_id: 'comp-10', competency_number: 10, name_km: 'ការប្រើប្រាស់បច្ចេកវិទ្យា', name_en: 'Technology & Innovation' },
];

export default function PortfolioPage() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCompetencyId, setSelectedCompetencyId] = useState<string>('');
  const [evidenceType, setEvidenceType] = useState<string>('');
  const [titleKm, setTitleKm] = useState<string>('');
  const [titleEn, setTitleEn] = useState<string>('');
  const [descriptionKm, setDescriptionKm] = useState<string>('');
  const [descriptionEn, setDescriptionEn] = useState<string>('');
  const [fileUrl, setFileUrl] = useState<string>('');
  const [modalOpened, setModalOpened] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<PortfolioEvidence | null>(null);
  const [evidenceModalOpened, setEvidenceModalOpened] = useState(false);
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

        const res = await fetch('/api/graduate-student/portfolio');
        if (!res.ok) {
          throw new Error('Failed to fetch portfolio data');
        }

        const result = await res.json();
        setData(result.data);
        setLoading(false);
      } catch (err) {
        console.error('Error loading portfolio:', err);
        setError(err instanceof Error ? err.message : 'Failed to load portfolio');
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleSubmitEvidence = async () => {
    if (!selectedCompetencyId || !evidenceType || !titleKm) {
      alert('Please fill in required fields (Competency, Type, Khmer Title)');
      return;
    }

    if (!data?.portfolio) {
      alert('Portfolio not initialized');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/graduate-student/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolioId: data.portfolio.portfolio_id,
          competencyId: selectedCompetencyId,
          evidenceTypeKm: EVIDENCE_TYPES.find(t => t.value === evidenceType)?.label.split(' / ')[0] || evidenceType,
          evidenceTypeEn: EVIDENCE_TYPES.find(t => t.value === evidenceType)?.label.split(' / ')[1] || evidenceType,
          titleKm,
          titleEn,
          descriptionKm,
          descriptionEn,
          fileUrl,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit evidence');
      }

      // Refresh portfolio data
      const dataRes = await fetch('/api/graduate-student/portfolio');
      const updatedData = await dataRes.json();
      setData(updatedData.data);

      // Reset form
      setSelectedCompetencyId('');
      setEvidenceType('');
      setTitleKm('');
      setTitleEn('');
      setDescriptionKm('');
      setDescriptionEn('');
      setFileUrl('');
      setModalOpened(false);

      alert('Evidence submitted successfully!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit evidence');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewEvidence = (evidence: PortfolioEvidence) => {
    setSelectedEvidence(evidence);
    setEvidenceModalOpened(true);
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

  // Calculate evidence count by competency
  const evidenceByCompetency: Record<string, number> = {};
  data?.evidence.forEach((ev) => {
    evidenceByCompetency[ev.competency_id] = (evidenceByCompetency[ev.competency_id] || 0) + 1;
  });

  const totalEvidenceCount = data?.evidence.length || 0;
  const competenciesCovered = Object.keys(evidenceByCompetency).length;
  const submissionStatus = data?.portfolio?.submission_status || 'draft';

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
          <Title order={1}>Teaching Portfolio / ផលប័ត្ររបស់គ្រូ</Title>
          <Text c="dimmed">Collect evidence of competency development throughout the program</Text>
        </div>
      </Group>

      {/* Portfolio Status Summary */}
      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg" mb="xl">
        {/* Overall Portfolio Status */}
        <Card withBorder p="lg" radius="md">
          <Group justify="space-between" mb="lg">
            <Stack gap={0}>
              <Text fw={500} c="dimmed" size="sm">
                Portfolio Status / ស្ថានភាព
              </Text>
              <Title order={2}>
                {submissionStatus === 'draft' ? 'Draft' : 'Submitted'}
              </Title>
            </Stack>
            <ThemeIcon variant="light" size={50} radius="md" color={submissionStatus === 'submitted' ? 'teal' : 'blue'}>
              <IconFolderOpen size={28} />
            </ThemeIcon>
          </Group>
          <Badge
            color={submissionStatus === 'submitted' ? 'teal' : 'yellow'}
            size="lg"
            variant="light"
          >
            {submissionStatus === 'draft' ? 'In Progress' : 'Ready for Review'}
          </Badge>
          <Text size="xs" c="dimmed" mt="lg">
            Last updated: {data?.portfolio?.last_updated ? new Date(data.portfolio.last_updated).toLocaleDateString() : 'Never'}
          </Text>
        </Card>

        {/* Evidence Count */}
        <Card withBorder p="lg" radius="md">
          <Group justify="space-between" mb="lg">
            <Stack gap={0}>
              <Text fw={500} c="dimmed" size="sm">
                Total Evidence / ភស្តុតាង
              </Text>
              <Title order={2}>{totalEvidenceCount}</Title>
            </Stack>
            <ThemeIcon variant="light" size={50} radius="md" color="blue">
              <IconFile size={28} />
            </ThemeIcon>
          </Group>
          <Progress value={Math.min(totalEvidenceCount * 5, 100)} size="md" radius="md" />
          <Text size="xs" c="dimmed" mt="xs">
            Aim for 20+ pieces of evidence
          </Text>
        </Card>

        {/* Competencies Covered */}
        <Card withBorder p="lg" radius="md">
          <Group justify="space-between" mb="lg">
            <Stack gap={0}>
              <Text fw={500} c="dimmed" size="sm">
                Competencies Covered / សមត្ថភាព
              </Text>
              <Title order={2}>{competenciesCovered}/10</Title>
            </Stack>
            <ThemeIcon variant="light" size={50} radius="md" color="violet">
              <IconCheck size={28} />
            </ThemeIcon>
          </Group>
          <RingProgress
            sections={[{ value: (competenciesCovered / 10) * 100, color: 'violet' }]}
            size={100}
            thickness={4}
            label={
              <Text ta="center" fw={700} size="sm">
                {competenciesCovered}/10
              </Text>
            }
          />
        </Card>
      </SimpleGrid>

      {/* Add Evidence Button */}
      <Button
        size="lg"
        leftSection={<IconPlus size={18} />}
        fullWidth
        mb="xl"
        onClick={() => setModalOpened(true)}
      >
        Add Evidence to Portfolio
      </Button>

      {/* Evidence by Competency Tabs */}
      <Card withBorder p="lg" radius="md">
        <Title order={3} mb="lg">
          Evidence by Competency / ភស្តុតាងតាមសមត្ថភាព
        </Title>

        <Tabs defaultValue="comp-1" variant="pills" orientation="vertical">
          <Tabs.List>
            {COMPETENCIES.map((comp) => (
              <Tabs.Tab
                key={comp.competency_id}
                value={comp.competency_id}
                leftSection={<Badge size="sm">{evidenceByCompetency[comp.competency_id] || 0}</Badge>}
              >
                <div>
                  <Text size="sm" fw={500}>
                    {comp.competency_number}. {comp.name_en}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {comp.name_km}
                  </Text>
                </div>
              </Tabs.Tab>
            ))}
          </Tabs.List>

          {COMPETENCIES.map((comp) => (
            <Tabs.Panel key={comp.competency_id} value={comp.competency_id} pl="lg">
              <div>
                <Title order={4} mb="lg">
                  {comp.name_en} / {comp.name_km}
                </Title>

                {data?.evidence.filter((ev) => ev.competency_id === comp.competency_id).length || 0 > 0 ? (
                  <Stack gap="md">
                    {data?.evidence
                      .filter((ev) => ev.competency_id === comp.competency_id)
                      .map((evidence) => (
                        <Card key={evidence.evidence_id} p="md" bg="gray.0" withBorder>
                          <Group justify="space-between" mb="sm">
                            <div>
                              <Group gap="xs" mb="xs">
                                <Badge size="sm" color="blue" variant="light">
                                  {evidence.evidence_type_en}
                                </Badge>
                                <Text size="xs" c="dimmed">
                                  {new Date(evidence.submitted_date).toLocaleDateString()}
                                </Text>
                              </Group>
                              <Title order={5}>{evidence.title_en}</Title>
                              <Text size="sm" c="dimmed">
                                {evidence.title_km}
                              </Text>
                            </div>
                            <Button
                              variant="light"
                              size="sm"
                              onClick={() => handleViewEvidence(evidence)}
                            >
                              View
                            </Button>
                          </Group>
                          {evidence.description_en && (
                            <Text size="sm" mt="sm">
                              {evidence.description_en}
                            </Text>
                          )}
                          {evidence.mentor_feedback && (
                            <Alert icon={<IconAlertCircle />} color="blue" title="Mentor Feedback" mt="sm">
                              {evidence.mentor_feedback}
                            </Alert>
                          )}
                        </Card>
                      ))}
                  </Stack>
                ) : (
                  <Alert icon={<IconAlertCircle />} color="gray">
                    No evidence submitted for this competency yet. Click "Add Evidence" to submit.
                  </Alert>
                )}
              </div>
            </Tabs.Panel>
          ))}
        </Tabs>
      </Card>

      {/* Add Evidence Modal */}
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title="Add Evidence to Portfolio / បន្ថែមភស្តុតាង"
        size="lg"
      >
        <Stack gap="md">
          <Select
            label="Competency / សមត្ថភាព"
            placeholder="Select competency"
            data={COMPETENCIES.map((c) => ({
              value: c.competency_id,
              label: `${c.competency_number}. ${c.name_en} (${c.name_km})`,
            }))}
            value={selectedCompetencyId}
            onChange={(val) => setSelectedCompetencyId(val || '')}
            searchable
            required
          />

          <Select
            label="Evidence Type / ប្រភេទភស្តុតាង"
            placeholder="Select type"
            data={EVIDENCE_TYPES}
            value={evidenceType}
            onChange={(val) => setEvidenceType(val || '')}
            required
          />

          <TextInput
            label="Title (Khmer) / ចងលើក (ខ្មែរ)"
            placeholder="Enter title in Khmer"
            value={titleKm}
            onChange={(e) => setTitleKm(e.currentTarget.value)}
          />

          <TextInput
            label="Title (English) / ចងលើក (English)"
            placeholder="Enter title in English"
            value={titleEn}
            onChange={(e) => setTitleEn(e.currentTarget.value)}
          />

          <Textarea
            label="Description (Khmer) / ការពិពណ៌នា (ខ្មែរ)"
            placeholder="Briefly describe this evidence..."
            value={descriptionKm}
            onChange={(e) => setDescriptionKm(e.currentTarget.value)}
            minRows={3}
          />

          <Textarea
            label="Description (English) / ការពិពណ៌នា (English)"
            placeholder="Brief English description..."
            value={descriptionEn}
            onChange={(e) => setDescriptionEn(e.currentTarget.value)}
            minRows={3}
          />

          <TextInput
            label="File URL / តំណភ្ជាប់ឯកសារ"
            placeholder="Paste link to document or file"
            leftSection={<IconLink size={16} />}
            value={fileUrl}
            onChange={(e) => setFileUrl(e.currentTarget.value)}
          />

          <Group justify="flex-end" mt="lg">
            <Button variant="default" onClick={() => setModalOpened(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitEvidence}
              loading={submitting}
              leftSection={<IconUpload size={16} />}
              disabled={!selectedCompetencyId || !evidenceType || !titleKm}
            >
              Submit Evidence
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Evidence Detail Modal */}
      {selectedEvidence && (
        <Modal
          opened={evidenceModalOpened}
          onClose={() => setEvidenceModalOpened(false)}
          title="Evidence Details / ព័ត៌មានលម្អិតឯកសារ"
          size="lg"
        >
          <Stack gap="lg">
            <div>
              <Group justify="space-between" mb="xs">
                <Title order={4}>{selectedEvidence.title_en}</Title>
                <Badge color="blue" variant="light">
                  {selectedEvidence.evidence_type_en}
                </Badge>
              </Group>
              <Text size="sm" c="dimmed" mb="sm">
                {selectedEvidence.title_km}
              </Text>
              <Text size="xs" c="dimmed">
                Submitted: {new Date(selectedEvidence.submitted_date).toLocaleDateString()}
              </Text>
            </div>

            <div>
              <Text fw={500} mb="xs">
                Competency / សមត្ថភាព
              </Text>
              <Badge size="lg">
                {selectedEvidence.competency_number}. {selectedEvidence.competency_name_en}
              </Badge>
            </div>

            {selectedEvidence.description_en && (
              <div>
                <Text fw={500} mb="xs">
                  English Description
                </Text>
                <Text size="sm">{selectedEvidence.description_en}</Text>
              </div>
            )}

            {selectedEvidence.description_km && (
              <div>
                <Text fw={500} mb="xs">
                  Khmer Description / ការពិពណ៌នា
                </Text>
                <Text size="sm">{selectedEvidence.description_km}</Text>
              </div>
            )}

            {selectedEvidence.file_url && (
              <Button
                component="a"
                href={selectedEvidence.file_url}
                target="_blank"
                rel="noopener noreferrer"
                variant="light"
                leftSection={<IconDownload size={16} />}
                fullWidth
              >
                Download/View File
              </Button>
            )}

            {selectedEvidence.mentor_feedback && (
              <Alert icon={<IconClock />} color="teal" title="Mentor Feedback">
                {selectedEvidence.mentor_feedback}
              </Alert>
            )}

            <Button fullWidth onClick={() => setEvidenceModalOpened(false)}>
              Close
            </Button>
          </Stack>
        </Modal>
      )}
    </Container>
  );
}
