'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth/client-auth';
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Paper,
  Stack,
  Loader,
  Center,
  Alert,
  Badge,
  Grid,
  Box,
  Modal,
  TextInput,
  CopyButton,
  ActionIcon,
  Tooltip,
  SimpleGrid,
} from '@mantine/core';
import {
  IconCertificate,
  IconDownload,
  IconCheck,
  IconCopy,
  IconX,
  IconTrophy,
  IconBook2,
} from '@tabler/icons-react';

interface Certificate {
  id: string;
  student_id: string;
  course_id: string | null;
  path_id: string | null;
  certificate_type: 'course' | 'path' | 'specialization';
  certificate_number: string;
  title: string;
  description: string | null;
  issued_date: string;
  expiry_date: string | null;
  is_valid: boolean;
  verification_code: string;
  certificate_url: string | null;
  course_name?: string;
  path_name?: string;
  first_name?: string;
  last_name?: string;
}

const CERTIFICATE_COLORS: Record<string, string> = {
  course: 'blue',
  path: 'violet',
  specialization: 'yellow',
};

const CERTIFICATE_ICONS = {
  course: IconBook2,
  path: IconTrophy,
  specialization: IconCertificate,
};

const CERTIFICATE_LABELS: Record<string, string> = {
  course: 'Course Certificate',
  path: 'Path Certificate',
  specialization: 'Specialization',
};

export default function StudentCertificatesPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(
    null
  );
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const sess = getSession();
      if (!sess || sess.role !== 'student') {
        router.push('/auth/login');
        return;
      }
      setSession(sess);
      fetchCertificates(sess.id);
    };

    checkAuth();
  }, [router]);

  const fetchCertificates = async (studentId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/certificates?studentId=${studentId}`);
      if (!response.ok) throw new Error('Failed to fetch certificates');

      const data = await response.json();
      setCertificates(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = (certificate: Certificate) => {
    if (certificate.certificate_url) {
      window.open(certificate.certificate_url, '_blank');
    } else {
      alert('Certificate PDF not available yet');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  if (!session) {
    return (
      <Center h="100vh">
        <Loader size="xl" />
      </Center>
    );
  }

  return (
    <Box bg="gradient-to-br(from-blue-50,to-indigo-100)" mih="100vh" p="xl" pt="48px">
      <Container size="xl">
        <Title order={2} mb="xl" style={{ fontFamily: 'Hanuman' }}>
          ឯកសារលិខិតសក្ខម
        </Title>

        {/* Error Message */}
        {error && (
          <Alert color="red" mb="md" withCloseButton onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Stats Section */}
        {!loading && certificates.length > 0 && (
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mb="xl">
            <Paper shadow="sm" p="lg">
              <Text size="sm" c="dimmed">
                Total Certificates
              </Text>
              <Text size="48px" fw={700}>
                {certificates.length}
              </Text>
            </Paper>
            <Paper shadow="sm" p="lg">
              <Text size="sm" c="dimmed">
                Course Certificates
              </Text>
              <Text size="48px" fw={700} c="blue">
                {certificates.filter((c) => c.certificate_type === 'course').length}
              </Text>
            </Paper>
            <Paper shadow="sm" p="lg">
              <Text size="sm" c="dimmed">
                Learning Paths
              </Text>
              <Text size="48px" fw={700} c="violet">
                {certificates.filter((c) => c.certificate_type === 'path').length}
              </Text>
            </Paper>
          </SimpleGrid>
        )}

        {/* Certificates Section */}
        {loading ? (
          <Center py="xl">
            <Loader size="xl" />
          </Center>
        ) : certificates.length === 0 ? (
          <Paper shadow="lg" p="xl">
            <Stack align="center">
              <Text size="96px">📜</Text>
              <Text size="lg" c="dimmed">
                No certificates yet. Start learning to earn your first certificate!
              </Text>
              <Button
                onClick={() => router.push('/dashboard/student/courses')}
              >
                Explore Courses
              </Button>
            </Stack>
          </Paper>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            {certificates.map((cert) => {
              const IconComponent = CERTIFICATE_ICONS[cert.certificate_type];
              return (
                <Paper key={cert.id} shadow="lg" withBorder>
                  <Stack h="100%">
                    {/* Certificate Header */}
                    <Box
                      h={128}
                      bg={`linear-gradient(135deg, var(--mantine-color-${CERTIFICATE_COLORS[cert.certificate_type]}-4), var(--mantine-color-${CERTIFICATE_COLORS[cert.certificate_type]}-6))`}
                      pos="relative"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Box pos="absolute" top={16} right={16}>
                        <IconComponent size={48} color="white" opacity={0.3} />
                      </Box>
                      <Text c="white" size="sm" fw={600} ta="center">
                        {CERTIFICATE_LABELS[cert.certificate_type]}
                      </Text>
                    </Box>

                    {/* Certificate Content */}
                    <Stack p="lg" flex={1}>
                      <Title order={4} lineClamp={2}>
                        {cert.title}
                      </Title>

                      {(cert.course_name || cert.path_name) && (
                        <Text size="sm" c="dimmed">
                          {cert.course_name || cert.path_name}
                        </Text>
                      )}

                      <Paper p="sm" bg="gray.0">
                        <Text size="xs" c="dimmed" tt="uppercase">
                          Certificate Number
                        </Text>
                        <Text size="xs" ff="monospace" fw={700} style={{ wordBreak: 'break-all' }}>
                          {cert.certificate_number}
                        </Text>
                      </Paper>

                      <Box>
                        <Text size="xs" c="dimmed" tt="uppercase">
                          Issued Date
                        </Text>
                        <Text size="sm" fw={600}>
                          {formatDate(cert.issued_date)}
                        </Text>
                      </Box>

                      {cert.expiry_date && (
                        <Box>
                          <Text size="xs" c="dimmed" tt="uppercase">
                            Valid Until
                          </Text>
                          <Text
                            size="sm"
                            fw={600}
                            c={isExpired(cert.expiry_date) ? 'red' : 'green'}
                          >
                            {formatDate(cert.expiry_date)}
                            {isExpired(cert.expiry_date) && ' (Expired)'}
                          </Text>
                        </Box>
                      )}

                      {cert.is_valid && (
                        <Paper p="xs" bg="green.0" withBorder style={{ borderColor: 'var(--mantine-color-green-3)' }}>
                          <Group gap="xs" justify="center">
                            <IconCheck size={14} color="var(--mantine-color-green-7)" />
                            <Text size="xs" c="green.7" fw={600}>
                              Verified Certificate
                            </Text>
                          </Group>
                        </Paper>
                      )}
                    </Stack>

                    {/* Action Buttons */}
                    <Group p="lg" pt={0} grow>
                      <Button
                        variant="light"
                        size="sm"
                        onClick={() => {
                          setSelectedCertificate(cert);
                          setShowDetails(true);
                        }}
                      >
                        Details
                      </Button>
                      <Button
                        variant="light"
                        color="green"
                        size="sm"
                        leftSection={<IconDownload size={16} />}
                        onClick={() => handleDownloadCertificate(cert)}
                      >
                        Download
                      </Button>
                    </Group>
                  </Stack>
                </Paper>
              );
            })}
          </SimpleGrid>
        )}

        {/* Details Modal */}
        <Modal
          opened={showDetails}
          onClose={() => setShowDetails(false)}
          title="Certificate Details"
          size="xl"
          styles={{
            title: { fontWeight: 700, fontSize: '1.5rem' },
          }}
        >
          {selectedCertificate && (
            <Stack>
              <Badge
                size="lg"
                color={CERTIFICATE_COLORS[selectedCertificate.certificate_type]}
              >
                {CERTIFICATE_LABELS[selectedCertificate.certificate_type]}
              </Badge>

              <Title order={2}>{selectedCertificate.title}</Title>

              {selectedCertificate.description && (
                <Text size="lg" c="dimmed">
                  {selectedCertificate.description}
                </Text>
              )}

              <SimpleGrid cols={2} spacing="lg">
                <Paper p="md" bg="gray.0">
                  <Text size="xs" c="dimmed" tt="uppercase" mb="xs">
                    Certificate Number
                  </Text>
                  <Text size="sm" ff="monospace" fw={700} style={{ wordBreak: 'break-all' }}>
                    {selectedCertificate.certificate_number}
                  </Text>
                </Paper>

                <Paper p="md" bg="gray.0">
                  <Text size="xs" c="dimmed" tt="uppercase" mb="xs">
                    Issued Date
                  </Text>
                  <Text size="lg" fw={700}>
                    {formatDate(selectedCertificate.issued_date)}
                  </Text>
                </Paper>

                {(selectedCertificate.course_name ||
                  selectedCertificate.path_name) && (
                  <Paper p="md" bg="gray.0" style={{ gridColumn: '1 / -1' }}>
                    <Text size="xs" c="dimmed" tt="uppercase" mb="xs">
                      {selectedCertificate.course_name
                        ? 'Course'
                        : 'Learning Path'}
                    </Text>
                    <Text size="lg" fw={700}>
                      {selectedCertificate.course_name ||
                        selectedCertificate.path_name}
                    </Text>
                  </Paper>
                )}

                {selectedCertificate.expiry_date && (
                  <Paper p="md" bg="gray.0">
                    <Text size="xs" c="dimmed" tt="uppercase" mb="xs">
                      Valid Until
                    </Text>
                    <Text
                      size="lg"
                      fw={700}
                      c={
                        isExpired(selectedCertificate.expiry_date)
                          ? 'red'
                          : 'green'
                      }
                    >
                      {formatDate(selectedCertificate.expiry_date)}
                    </Text>
                  </Paper>
                )}
              </SimpleGrid>

              {/* Verification Section */}
              <Paper p="lg" bg="blue.0" withBorder style={{ borderColor: 'var(--mantine-color-blue-3)' }}>
                <Title order={4} mb="md">
                  LinkedIn Verification
                </Title>
                <Text size="sm" c="dimmed" mb="md">
                  Use this verification code to validate this certificate on LinkedIn:
                </Text>
                <Group>
                  <TextInput
                    flex={1}
                    value={selectedCertificate.verification_code}
                    readOnly
                    ff="monospace"
                    size="md"
                  />
                  <CopyButton value={selectedCertificate.verification_code}>
                    {({ copied, copy }) => (
                      <Tooltip label={copied ? 'Copied' : 'Copy'}>
                        <Button
                          color={copied ? 'green' : 'blue'}
                          onClick={copy}
                          leftSection={
                            copied ? <IconCheck size={16} /> : <IconCopy size={16} />
                          }
                        >
                          {copied ? 'Copied' : 'Copy'}
                        </Button>
                      </Tooltip>
                    )}
                  </CopyButton>
                </Group>
              </Paper>

              {selectedCertificate.is_valid && (
                <Alert color="green" icon={<IconCheck size={16} />}>
                  <Text fw={600}>This certificate is valid and verified</Text>
                </Alert>
              )}

              <Group grow>
                <Button
                  color="green"
                  leftSection={<IconDownload size={16} />}
                  onClick={() => handleDownloadCertificate(selectedCertificate)}
                >
                  Download PDF
                </Button>
                <Button
                  variant="default"
                  onClick={() => setShowDetails(false)}
                >
                  Close
                </Button>
              </Group>
            </Stack>
          )}
        </Modal>
      </Container>
    </Box>
  );
}
