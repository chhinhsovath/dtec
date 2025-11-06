'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSession, clearSession } from '@/lib/auth/client-auth';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  Container,
  Group,
  Button,
  TextInput,
  Alert,
  Flex,
  Badge,
  Text,
  Stack,
  Center,
  ActionIcon,
  Title,
  Loader,
  Table,
  Pagination,
  Select,
} from '@mantine/core';
import {
  IconSearch,
  IconEye,
} from '@tabler/icons-react';

interface Submission {
  id: string;
  assessment_id: string;
  assessment_title: string;
  student_id: string;
  first_name: string;
  last_name: string;
  status: 'pending' | 'submitted' | 'graded' | 'returned';
  score: number | null;
  max_score: number | null;
  started_at: string | null;
  submitted_at: string | null;
  graded_at: string | null;
  time_spent_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export default function SubmissionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, isLoaded } = useTranslation();

  const [session, setSession] = useState<any>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState<string | null>(
    searchParams.get('assessmentId') || null
  );
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const checkAuth = async () => {
      const sess = getSession();
      if (!sess || sess.role !== 'teacher') {
        router.push('/auth/login');
        return;
      }
      setSession(sess);
      fetchSubmissions(sess.id);
    };

    if (isLoaded) {
      checkAuth();
    }
  }, [router, isLoaded]);

  const fetchSubmissions = async (teacherId: string) => {
    try {
      setLoading(true);
      setError(null);

      let url = '/api/teacher/submissions';
      const params = new URLSearchParams();

      if (selectedAssessment) {
        params.append('assessmentId', selectedAssessment);
      }
      if (selectedStatus) {
        params.append('status', selectedStatus);
      }

      if (params.toString()) {
        url += '?' + params.toString();
      }

      const response = await fetch(url, {
        headers: { 'x-teacher-id': teacherId },
      });

      if (!response.ok) throw new Error('Failed to fetch submissions');
      const data = await response.json();
      setSubmissions(data.submissions || []);
      setCurrentPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter(s =>
    `${s.first_name} ${s.last_name}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase()) ||
    s.assessment_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedSubmissions = filteredSubmissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleViewSubmission = (submissionId: string) => {
    router.push(`/dashboard/teacher/submissions/${submissionId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'graded':
        return 'green';
      case 'submitted':
        return 'blue';
      case 'returned':
        return 'yellow';
      case 'pending':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const getScoreColor = (score: number | null, maxScore: number | null) => {
    if (score === null || maxScore === null) return 'gray';
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'green';
    if (percentage >= 70) return 'lime';
    if (percentage >= 60) return 'yellow';
    return 'red';
  };

  if (loading || !session) {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Loader />
      </Center>
    );
  }

  if (!isLoaded) {
    return null;
  }

  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', paddingTop: '24px' }}>
      <Container size="xl" py="xl">
        <Title order={2} mb="xl">
          Student Submissions
        </Title>
        {error && (
          <Alert color="red" mb="lg" title="Error">
            {error}
          </Alert>
        )}

        {/* Toolbar */}
        <Stack gap="md" mb="xl">
          <TextInput
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            leftSection={<IconSearch size={16} />}
            style={{ flex: 1, maxWidth: '400px' }}
          />

          <Group gap="md">
            <Select
              label="Filter by Status"
              placeholder="All Statuses"
              data={[
                { value: '', label: 'All Statuses' },
                { value: 'pending', label: 'Pending' },
                { value: 'submitted', label: 'Submitted' },
                { value: 'graded', label: 'Graded' },
                { value: 'returned', label: 'Returned' },
              ]}
              value={selectedStatus}
              onChange={setSelectedStatus}
              clearable
              style={{ maxWidth: '300px' }}
            />
          </Group>
        </Stack>

        {/* Submissions Table */}
        {submissions.length === 0 ? (
          <Stack align="center" justify="center" style={{ minHeight: '300px' }}>
            <Text size="lg">{t('common.noResults')}</Text>
          </Stack>
        ) : (
          <>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Student</Table.Th>
                    <Table.Th>Assessment</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Score</Table.Th>
                    <Table.Th>Time Spent</Table.Th>
                    <Table.Th>Submitted</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedSubmissions.map(submission => (
                    <Table.Tr key={submission.id}>
                      <Table.Td>
                        <Text fw={500}>
                          {submission.first_name} {submission.last_name}
                        </Text>
                      </Table.Td>
                      <Table.Td>{submission.assessment_title}</Table.Td>
                      <Table.Td>
                        <Badge color={getStatusColor(submission.status)}>
                          {submission.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {submission.score !== null && submission.max_score ? (
                          <Badge
                            color={getScoreColor(submission.score, submission.max_score)}
                          >
                            {submission.score} / {submission.max_score}
                          </Badge>
                        ) : (
                          <Text c="dimmed" size="sm">
                            Not graded
                          </Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        {submission.time_spent_minutes ? (
                          <Text size="sm">{submission.time_spent_minutes} min</Text>
                        ) : (
                          <Text c="dimmed" size="sm">
                            -
                          </Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {submission.submitted_at
                            ? new Date(submission.submitted_at).toLocaleDateString()
                            : 'Not submitted'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <ActionIcon
                          size="sm"
                          variant="light"
                          onClick={() => handleViewSubmission(submission.id)}
                          title="View & Grade"
                        >
                          <IconEye size={14} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>

            {totalPages > 1 && (
              <Flex justify="center" mt="xl">
                <Pagination
                  value={currentPage}
                  onChange={setCurrentPage}
                  total={totalPages}
                />
              </Flex>
            )}
          </>
        )}
      </Container>
    </div>
  );
}
