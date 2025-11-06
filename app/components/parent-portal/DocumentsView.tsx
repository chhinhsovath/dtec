'use client';

import { useState, useEffect } from 'react';
import {
  IconArrowLeft,
  IconFileText,
  IconDownload,
  IconCircleCheck,
  IconAlertCircle,
  IconLoader,
  IconCalendar,
} from '@tabler/icons-react';
import Link from 'next/link';
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Button,
  Grid,
  Badge,
  Box,
  Divider,
  Center,
  Loader,
  Alert,
  ActionIcon,
} from '@mantine/core';

interface Document {
  document_id: number;
  student_id: number;
  student_name: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size_mb: number;
  description: string;
  issued_date: string;
  is_signed: boolean;
  signed_at: string | null;
  signed_by_name?: string;
  requires_action: boolean;
  action_deadline: string | null;
  created_at: string;
}

interface DocumentsData {
  documents: Document[];
  count: number;
  documents_requiring_action: number;
}

const documentTypeMap: { [key: string]: { icon: string; color: string } } = {
  report_card: { icon: '📊', color: 'blue' },
  certificate: { icon: '🎖️', color: 'green' },
  transcript: { icon: '📝', color: 'violet' },
  progress_report: { icon: '📈', color: 'orange' },
  permission_form: { icon: '✍️', color: 'red' },
};

export default function DocumentsView() {
  const [data, setData] = useState<DocumentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signingDoc, setSigningDoc] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'action'>('all');

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const query = filter === 'action' ? '?requiresAction=true' : '';
        const response = await fetch(`/api/parent-portal/documents${query}`);

        if (!response.ok) {
          throw new Error('Failed to load documents');
        }

        const result = await response.json();
        setData(result.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [filter]);

  const handleSign = async (documentId: number) => {
    try {
      setSigningDoc(documentId);
      const response = await fetch('/api/parent-portal/documents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      });

      if (response.ok) {
        // Refresh documents
        const query = filter === 'action' ? '?requiresAction=true' : '';
        const result = await fetch(`/api/parent-portal/documents${query}`);
        const refreshedData = await result.json();
        setData(refreshedData.data);
      }
    } catch (err) {
      console.error('Error signing document:', err);
    } finally {
      setSigningDoc(null);
    }
  };

  if (loading) {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Stack align="center" gap="md">
          <Loader size="xl" color="blue" />
          <Text c="dimmed">Loading documents...</Text>
        </Stack>
      </Center>
    );
  }

  if (error) {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Paper p="xl" shadow="sm" withBorder style={{ maxWidth: 450 }}>
          <Stack align="center" gap="md">
            <IconAlertCircle size={48} color="var(--mantine-color-red-6)" />
            <Title order={2} c="red">Error</Title>
            <Text c="red">{error}</Text>
            <Button component="a" href="/parent-portal" color="red">
              Back to Dashboard
            </Button>
          </Stack>
        </Paper>
      </Center>
    );
  }

  if (!data) return null;

  const documents = data.documents;

  return (
    <Box bg="gray.0" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <Paper shadow="xs" p="xl" mb="lg">
        <Container size="xl">
          <Group gap="md" mb="md">
            <ActionIcon
              component="a"
              href="/parent-portal"
              variant="subtle"
              size="lg"
            >
              <IconArrowLeft size={24} />
            </ActionIcon>
            <Box>
              <Title order={1}>Documents</Title>
              <Text c="dimmed" mt={4}>
                {data.documents_requiring_action} require action
              </Text>
            </Box>
          </Group>
        </Container>
      </Paper>

      <Container size="xl" py="xl">
        {/* Filter Tabs */}
        <Group gap="xs" mb="xl">
          <Button
            variant={filter === 'all' ? 'filled' : 'default'}
            onClick={() => setFilter('all')}
          >
            All Documents ({data.count})
          </Button>
          <Button
            variant={filter === 'action' ? 'filled' : 'default'}
            onClick={() => setFilter('action')}
          >
            Require Action ({data.documents_requiring_action})
          </Button>
        </Group>

        {/* Documents Grid */}
        {documents.length === 0 ? (
          <Paper shadow="sm" p="xl">
            <Stack align="center" gap="md">
              <IconFileText size={48} color="var(--mantine-color-gray-5)" />
              <Text c="dimmed" size="lg">
                {filter === 'action' ? 'No documents require action' : 'No documents available'}
              </Text>
            </Stack>
          </Paper>
        ) : (
          <Grid>
            {documents.map((doc) => {
              const docConfig = documentTypeMap[doc.document_type] || {
                icon: '📄',
                color: 'gray',
              };
              const isDeadlineApproaching =
                doc.action_deadline &&
                new Date(doc.action_deadline).getTime() - new Date().getTime() < 3 * 24 * 60 * 60 * 1000;

              return (
                <Grid.Col key={doc.document_id} span={{ base: 12, md: 6, lg: 4 }}>
                  <Paper shadow="sm" withBorder style={{ height: '100%' }}>
                    {/* Document Header */}
                    <Box
                      bg="gradient-to-r from-dark.8 to-dark.9"
                      p="xl"
                      style={{
                        background: 'linear-gradient(to right, var(--mantine-color-dark-8), var(--mantine-color-dark-9))',
                      }}
                    >
                      <Group justify="space-between" align="start" mb="md">
                        <Text size="40px">{docConfig.icon}</Text>
                        {doc.is_signed && (
                          <IconCircleCheck size={24} color="var(--mantine-color-green-4)" />
                        )}
                      </Group>
                      <Title order={4} c="white" style={{ wordBreak: 'break-word' }}>
                        {doc.file_name}
                      </Title>
                      <Text c="gray.3" size="sm" mt="xs" tt="capitalize">
                        {doc.document_type.replace('_', ' ')}
                      </Text>
                    </Box>

                    {/* Document Details */}
                    <Stack p="xl" gap="md">
                      {/* Student */}
                      <Text fw={600} size="sm">
                        {doc.student_name}
                      </Text>

                      {/* Dates */}
                      {doc.issued_date && (
                        <Group gap="xs">
                          <IconCalendar size={16} />
                          <Text size="xs" c="dimmed">
                            Issued: {new Date(doc.issued_date).toLocaleDateString()}
                          </Text>
                        </Group>
                      )}

                      {/* Status */}
                      {doc.is_signed ? (
                        <Alert
                          icon={<IconCircleCheck size={16} />}
                          color="green"
                          variant="light"
                        >
                          <Text size="xs" fw={600}>Signed</Text>
                          <Text size="xs">
                            {doc.signed_by_name} on{' '}
                            {new Date(doc.signed_at!).toLocaleDateString()}
                          </Text>
                        </Alert>
                      ) : doc.requires_action ? (
                        <Alert
                          icon={<IconAlertCircle size={16} />}
                          color={isDeadlineApproaching ? 'red' : 'yellow'}
                          variant="light"
                        >
                          <Text size="xs" fw={600}>Action Required</Text>
                          {doc.action_deadline && (
                            <Text size="xs">
                              Deadline:{' '}
                              {new Date(doc.action_deadline).toLocaleDateString()}
                            </Text>
                          )}
                        </Alert>
                      ) : null}

                      {/* File Info */}
                      <Box>
                        <Divider />
                        <Text size="xs" c="dimmed" mt="xs">
                          {doc.file_size_mb} MB
                        </Text>
                      </Box>

                      {/* Actions */}
                      <Stack gap="xs">
                        <Button
                          component="a"
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          leftSection={<IconDownload size={16} />}
                          fullWidth
                        >
                          Download
                        </Button>

                        {!doc.is_signed && doc.requires_action && (
                          <Button
                            onClick={() => handleSign(doc.document_id)}
                            disabled={signingDoc === doc.document_id}
                            color="green"
                            fullWidth
                            loading={signingDoc === doc.document_id}
                          >
                            Sign Document
                          </Button>
                        )}
                      </Stack>
                    </Stack>
                  </Paper>
                </Grid.Col>
              );
            })}
          </Grid>
        )}
      </Container>
    </Box>
  );
}
