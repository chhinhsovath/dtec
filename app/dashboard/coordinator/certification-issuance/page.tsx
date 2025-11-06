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
  TextInput,
  Loader,
  Center,
  Stack,
  Group,
  ThemeIcon,
  Alert,
  Modal,
  SimpleGrid,
  Table,
  Tabs,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconAlertCircle,
  IconCheck,
  IconDownload,
  IconAward,
  IconUsers,
  IconFileCheck,
  IconSend,
} from '@tabler/icons-react';
import { getSession } from '@/lib/auth/client-auth';

interface Student {
  student_id: string;
  student_code: string;
  full_name: string;
  email: string;
  batch_code: string;
  completion_percentage: number;
  requirements_completed: number;
  total_requirements: number;
  is_ready: boolean;
}

interface CertificationData {
  readyStudents: Student[];
  pendingStudents: Student[];
  issuedCertificates: Student[];
}

export default function CertificationIssuancePage() {
  const [data, setData] = useState<CertificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [modalOpened, setModalOpened] = useState(false);
  const [certificationNumber, setCertificationNumber] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        const session = getSession();

        if (!session) {
          router.push('/auth/login');
          return;
        }

        // For now, we'll use 'teacher' role as coordinator role may not be fully implemented
        // In a complete system, this would check for 'coordinator' role
        if (session.role !== 'teacher' && session.role !== 'admin') {
          router.push(`/dashboard/${session.role}`);
          return;
        }

        // Fetch certification data
        const res = await fetch('/api/graduate-student/certification');
        if (!res.ok) {
          throw new Error('Failed to fetch certification data');
        }

        const result = await res.json();

        // Mock data structure for coordinator view
        // In a real implementation, this would come from the API
        setData({
          readyStudents: [
            {
              student_id: 'stu-001',
              student_code: 'GS-2025-001',
              full_name: 'Sophea Khmer',
              email: 'sophea@pedagogy.edu',
              batch_code: 'BATCH-2025-01',
              completion_percentage: 100,
              requirements_completed: 5,
              total_requirements: 5,
              is_ready: true,
            },
            {
              student_id: 'stu-002',
              student_code: 'GS-2025-002',
              full_name: 'Mony Chan',
              email: 'mony@pedagogy.edu',
              batch_code: 'BATCH-2025-01',
              completion_percentage: 100,
              requirements_completed: 5,
              total_requirements: 5,
              is_ready: true,
            },
          ],
          pendingStudents: [
            {
              student_id: 'stu-003',
              student_code: 'GS-2025-003',
              full_name: 'Visal Doung',
              email: 'visal@pedagogy.edu',
              batch_code: 'BATCH-2025-01',
              completion_percentage: 85,
              requirements_completed: 4,
              total_requirements: 5,
              is_ready: false,
            },
            {
              student_id: 'stu-004',
              student_code: 'GS-2025-004',
              full_name: 'Ratha Som',
              email: 'ratha@pedagogy.edu',
              batch_code: 'BATCH-2025-01',
              completion_percentage: 70,
              requirements_completed: 3,
              total_requirements: 5,
              is_ready: false,
            },
          ],
          issuedCertificates: [],
        });

        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load certification data');
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleIssueCertificate = async () => {
    if (!selectedStudent || !certificationNumber) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/graduate-student/certification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          graduateStudentId: selectedStudent.student_id,
          programId: 'pedagogy-prog-001',
          certificationNumber,
          expiryDate: expiryDate || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to issue certificate');
      }

      alert(`Certificate issued successfully to ${selectedStudent.full_name}!`);

      // Reset form
      setCertificationNumber('');
      setExpiryDate('');
      setModalOpened(false);
      setSelectedStudent(null);

      // Reload data
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to issue certificate');
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
          <Title order={1}>Certificate Issuance / ការចេញឯកសារ</Title>
          <Text c="dimmed">Issue contract teacher certificates to eligible students</Text>
        </div>
      </Group>

      {/* Summary Cards */}
      {data && (
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg" mb="xl">
          <Card withBorder p="lg" radius="md">
            <Group justify="space-between" mb="lg">
              <Stack gap={0}>
                <Text fw={500} c="dimmed" size="sm">
                  Ready for Certification / ត្រៀមរៀង
                </Text>
                <Title order={2}>{data.readyStudents.length}</Title>
              </Stack>
              <ThemeIcon variant="light" size={50} radius="md" color="teal">
                <IconCheck size={28} />
              </ThemeIcon>
            </Group>
            <Text size="xs" c="dimmed">
              Students eligible for certification
            </Text>
          </Card>

          <Card withBorder p="lg" radius="md">
            <Group justify="space-between" mb="lg">
              <Stack gap={0}>
                <Text fw={500} c="dimmed" size="sm">
                  In Progress / កំពុងដំណើរការ
                </Text>
                <Title order={2}>{data.pendingStudents.length}</Title>
              </Stack>
              <ThemeIcon variant="light" size={50} radius="md" color="yellow">
                <IconUsers size={28} />
              </ThemeIcon>
            </Group>
            <Text size="xs" c="dimmed">
              Students completing requirements
            </Text>
          </Card>

          <Card withBorder p="lg" radius="md">
            <Group justify="space-between" mb="lg">
              <Stack gap={0}>
                <Text fw={500} c="dimmed" size="sm">
                  Certificates Issued / ចេញរួច
                </Text>
                <Title order={2}>{data.issuedCertificates.length}</Title>
              </Stack>
              <ThemeIcon variant="light" size={50} radius="md" color="blue">
                <IconAward size={28} />
              </ThemeIcon>
            </Group>
            <Text size="xs" c="dimmed">
              Total certificates issued
            </Text>
          </Card>
        </SimpleGrid>
      )}

      {/* Tabs for different views */}
      <Tabs defaultValue="ready" variant="pills" mb="xl">
        <Tabs.List>
          <Tabs.Tab value="ready" leftSection={<Badge>{data?.readyStudents.length || 0}</Badge>}>
            Ready for Certification
          </Tabs.Tab>
          <Tabs.Tab value="pending" leftSection={<Badge>{data?.pendingStudents.length || 0}</Badge>}>
            In Progress
          </Tabs.Tab>
          <Tabs.Tab value="issued" leftSection={<Badge>{data?.issuedCertificates.length || 0}</Badge>}>
            Issued
          </Tabs.Tab>
        </Tabs.List>

        {/* Ready Students Tab */}
        <Tabs.Panel value="ready">
          {data && data.readyStudents.length > 0 ? (
            <Card withBorder p="lg" radius="md">
              <Title order={3} mb="lg">
                Students Ready for Certification / សិស្សលេង
              </Title>

              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Student Name / ឈ្មោះ</Table.Th>
                    <Table.Th>Code / លេខ</Table.Th>
                    <Table.Th>Batch / ក្រុម</Table.Th>
                    <Table.Th>Status / ស្ថានភាព</Table.Th>
                    <Table.Th>Action / សកម្មភាព</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {data.readyStudents.map((student) => (
                    <Table.Tr key={student.student_id}>
                      <Table.Td>
                        <div>
                          <Text fw={500} size="sm">
                            {student.full_name}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {student.email}
                          </Text>
                        </div>
                      </Table.Td>
                      <Table.Td>{student.student_code}</Table.Td>
                      <Table.Td>{student.batch_code}</Table.Td>
                      <Table.Td>
                        <Badge color="teal" variant="light">
                          100% Complete
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Button
                          size="sm"
                          variant="light"
                          leftSection={<IconAward size={14} />}
                          onClick={() => {
                            setSelectedStudent(student);
                            setModalOpened(true);
                          }}
                        >
                          Issue Certificate
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Card>
          ) : (
            <Alert icon={<IconAlertCircle />} color="blue">
              No students are currently ready for certification.
            </Alert>
          )}
        </Tabs.Panel>

        {/* Pending Students Tab */}
        <Tabs.Panel value="pending">
          {data && data.pendingStudents.length > 0 ? (
            <Stack gap="md">
              {data.pendingStudents.map((student) => (
                <Card key={student.student_id} p="lg" withBorder bg="gray.0">
                  <Group justify="space-between" mb="sm">
                    <div>
                      <Title order={5}>{student.full_name}</Title>
                      <Text size="sm" c="dimmed">
                        {student.student_code} • {student.batch_code}
                      </Text>
                    </div>
                    <Badge color="yellow" variant="light">
                      {student.completion_percentage}% Complete
                    </Badge>
                  </Group>

                  <Text size="sm" mb="sm">
                    {student.requirements_completed} of {student.total_requirements} requirements completed
                  </Text>

                  <Group gap="xs" mt="lg">
                    <Text size="xs" fw={500}>
                      Progress:
                    </Text>
                    {Array.from({ length: student.total_requirements }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '4px',
                          backgroundColor: i < student.requirements_completed ? '#51CF66' : '#E9ECEF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {i < student.requirements_completed && <IconCheck size={14} color="white" />}
                      </div>
                    ))}
                  </Group>
                </Card>
              ))}
            </Stack>
          ) : (
            <Alert icon={<IconAlertCircle />} color="blue">
              No students are currently in progress.
            </Alert>
          )}
        </Tabs.Panel>

        {/* Issued Certificates Tab */}
        <Tabs.Panel value="issued">
          {data && data.issuedCertificates.length > 0 ? (
            <Stack gap="md">
              {data.issuedCertificates.map((student) => (
                <Card key={student.student_id} p="lg" withBorder bg="green.0">
                  <Group justify="space-between">
                    <div>
                      <Title order={5}>{student.full_name}</Title>
                      <Text size="sm" c="dimmed">
                        {student.student_code}
                      </Text>
                    </div>
                    <Badge color="teal" variant="filled">
                      Issued
                    </Badge>
                  </Group>
                </Card>
              ))}
            </Stack>
          ) : (
            <Alert icon={<IconAlertCircle />} color="gray">
              No certificates have been issued yet.
            </Alert>
          )}
        </Tabs.Panel>
      </Tabs>

      {/* Issue Certificate Modal */}
      {selectedStudent && (
        <Modal
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          title="Issue Certificate / ចេញឯកសារសក្ខម"
          size="lg"
        >
          <Stack gap="lg">
            <div>
              <Text fw={500} mb="xs">
                Student Information / ព័ត៌មាននរណា
              </Text>
              <Card p="md" bg="blue.0">
                <Text fw={500}>{selectedStudent.full_name}</Text>
                <Text size="sm" c="dimmed">
                  {selectedStudent.student_code} • {selectedStudent.batch_code}
                </Text>
                <Text size="sm" c="dimmed" mt="xs">
                  {selectedStudent.email}
                </Text>
              </Card>
            </div>

            <Alert icon={<IconCheck />} color="teal" title="Certification Status">
              All {selectedStudent.total_requirements} requirements completed and verified.
            </Alert>

            <TextInput
              label="Certificate Number / លេខឯកសារ"
              placeholder="e.g., CT-2025-001"
              value={certificationNumber}
              onChange={(e) => setCertificationNumber(e.currentTarget.value)}
              required
            />

            <TextInput
              label="Expiry Date / ថ្ងៃផុតកំណត់"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.currentTarget.value)}
              description="Leave empty for 5-year default validity"
            />

            <Alert icon={<IconAlertCircle />} color="yellow">
              This action will officially issue the contract teacher certificate to the student.
            </Alert>

            <Group justify="flex-end">
              <Button variant="default" onClick={() => setModalOpened(false)}>
                Cancel
              </Button>
              <Button
                leftSection={<IconSend size={16} />}
                onClick={handleIssueCertificate}
                loading={submitting}
                color="teal"
              >
                Issue Certificate
              </Button>
            </Group>
          </Stack>
        </Modal>
      )}
    </Container>
  );
}
