'use client';

import { useState, useEffect } from 'react';
import {
  IconArrowLeft,
  IconMessage,
  IconSend,
  IconLoader,
  IconAlertCircle,
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
  Badge,
  Box,
  Center,
  Loader,
  ActionIcon,
  Grid,
  ScrollArea,
  UnstyledButton,
  Indicator,
} from '@mantine/core';

interface Message {
  message_id: number;
  student_id: number;
  student_name: string;
  teacher_id: number;
  teacher_name: string;
  message_text: string;
  message_type: 'message' | 'concern' | 'praise' | 'question';
  topic: string;
  priority: string;
  is_read: boolean;
  created_at: string;
  reply_text: string | null;
  replied_at: string | null;
}

interface MessagesData {
  messages: Message[];
  count: number;
  unread_count: number;
}

const messageTypeColors = {
  message: 'blue',
  concern: 'red',
  praise: 'green',
  question: 'yellow',
};

const priorityColors = {
  low: 'gray',
  normal: 'blue',
  high: 'orange',
  urgent: 'red',
};

export default function MessagesView() {
  const [data, setData] = useState<MessagesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/parent-portal/messages');

        if (!response.ok) {
          throw new Error('Failed to load messages');
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

    fetchMessages();
  }, []);

  if (loading) {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Stack align="center" gap="md">
          <Loader size="xl" color="blue" />
          <Text c="dimmed">Loading messages...</Text>
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
              <Title order={1}>Messages</Title>
              <Text c="dimmed" mt={4}>{data.unread_count} unread</Text>
            </Box>
          </Group>
        </Container>
      </Paper>

      <Container size="xl" py="xl">
        <Grid>
          {/* Messages List */}
          <Grid.Col span={{ base: 12, lg: 4 }}>
            <Paper shadow="sm" withBorder>
              <Box p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }} bg="gray.0">
                <Title order={4}>Conversations</Title>
                <Text size="sm" c="dimmed" mt={4}>{data.count} total</Text>
              </Box>

              {data.messages.length === 0 ? (
                <Stack align="center" gap="md" p="xl">
                  <IconMessage size={48} color="var(--mantine-color-gray-5)" />
                  <Text c="dimmed" size="sm">No messages yet</Text>
                </Stack>
              ) : (
                <ScrollArea h={400}>
                  <Stack gap={0}>
                    {data.messages.map((msg) => (
                      <UnstyledButton
                        key={msg.message_id}
                        onClick={() => setSelectedMessage(msg)}
                        p="md"
                        style={{
                          borderBottom: '1px solid var(--mantine-color-gray-2)',
                          backgroundColor:
                            selectedMessage?.message_id === msg.message_id
                              ? 'var(--mantine-color-blue-0)'
                              : undefined,
                          borderLeft:
                            selectedMessage?.message_id === msg.message_id
                              ? '4px solid var(--mantine-color-blue-6)'
                              : '4px solid transparent',
                        }}
                      >
                        <Group justify="space-between" align="start" mb="xs">
                          <Text fw={600} size="sm">
                            {msg.teacher_name}
                          </Text>
                          {!msg.is_read && (
                            <Indicator color="blue" size={8} processing />
                          )}
                        </Group>
                        <Text size="xs" c="dimmed" mb="xs">{msg.student_name}</Text>
                        <Text size="xs" c="dimmed" lineClamp={1}>{msg.message_text}</Text>
                        <Text size="xs" c="dimmed" mt="xs">
                          {new Date(msg.created_at).toLocaleDateString()}
                        </Text>
                      </UnstyledButton>
                    ))}
                  </Stack>
                </ScrollArea>
              )}
            </Paper>
          </Grid.Col>

          {/* Message Detail */}
          <Grid.Col span={{ base: 12, lg: 8 }}>
            {selectedMessage ? (
              <Paper shadow="sm" withBorder>
                {/* Message Header */}
                <Box p="xl" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                  <Group justify="space-between" align="start" mb="md">
                    <Box>
                      <Title order={2}>{selectedMessage.teacher_name}</Title>
                      <Text c="dimmed" size="sm" mt={4}>
                        {selectedMessage.student_name} • {selectedMessage.topic}
                      </Text>
                    </Box>
                    <Badge
                      color={messageTypeColors[selectedMessage.message_type]}
                      tt="capitalize"
                    >
                      {selectedMessage.message_type}
                    </Badge>
                  </Group>

                  {/* Priority */}
                  <Badge
                    color={priorityColors[selectedMessage.priority as keyof typeof priorityColors]}
                    variant="light"
                    tt="capitalize"
                  >
                    Priority: {selectedMessage.priority}
                  </Badge>
                </Box>

                {/* Message Content */}
                <Stack p="xl" gap="md">
                  <Paper p="md" withBorder bg="blue.0">
                    <Text size="xs" c="dimmed" mb="xs">
                      {new Date(selectedMessage.created_at).toLocaleString()}
                    </Text>
                    <Text>{selectedMessage.message_text}</Text>
                  </Paper>

                  {/* Reply */}
                  {selectedMessage.reply_text && (
                    <Paper p="md" withBorder bg="green.0">
                      <Text size="xs" c="dimmed" mb="xs">
                        Reply from {selectedMessage.teacher_name} •{' '}
                        {new Date(selectedMessage.replied_at!).toLocaleString()}
                      </Text>
                      <Text>{selectedMessage.reply_text}</Text>
                    </Paper>
                  )}

                  {/* Actions */}
                  <Box pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
                    <Button
                      leftSection={<IconSend size={16} />}
                      fullWidth
                    >
                      Reply
                    </Button>
                  </Box>
                </Stack>
              </Paper>
            ) : (
              <Paper shadow="sm" p="xl">
                <Stack align="center" gap="md">
                  <IconMessage size={48} color="var(--mantine-color-gray-5)" />
                  <Text c="dimmed">Select a message to view details</Text>
                </Stack>
              </Paper>
            )}
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}
