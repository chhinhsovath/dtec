'use client';

import { useState, useEffect } from 'react';
import {
  IconArrowLeft,
  IconBell,
  IconAlertCircle,
  IconCircleCheck,
  IconLoader,
  IconFilter,
  IconTrash,
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
  Checkbox,
} from '@mantine/core';

interface Notification {
  notification_id: number;
  student_id: number;
  student_name: string;
  notification_type: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  action_url?: string;
}

interface NotificationsData {
  notifications: Notification[];
  count: number;
  unread_count: number;
}

const severityConfig = {
  info: {
    color: 'blue',
  },
  warning: {
    color: 'yellow',
  },
  critical: {
    color: 'red',
  },
};

const notificationTypeMap: { [key: string]: string } = {
  low_grade: 'Low Grade',
  attendance_alert: 'Attendance Alert',
  missing_assignment: 'Missing Assignment',
  behavior_incident: 'Behavior Incident',
  announcement: 'Announcement',
};

export default function NotificationsView() {
  const [data, setData] = useState<NotificationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([]);

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const query = filter === 'unread' ? '?isRead=false' : '';
      const response = await fetch(`/api/parent-portal/notifications${query}`);

      if (!response.ok) {
        throw new Error('Failed to load notifications');
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

  const handleMarkAsRead = async (notificationIds: number[]) => {
    try {
      const response = await fetch('/api/parent-portal/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationIds,
          markAsRead: true,
        }),
      });

      if (response.ok) {
        setSelectedNotifications([]);
        await fetchNotifications();
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleDelete = async (notificationIds: number[]) => {
    try {
      const response = await fetch('/api/parent-portal/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds }),
      });

      if (response.ok) {
        setSelectedNotifications([]);
        await fetchNotifications();
      }
    } catch (err) {
      console.error('Error deleting notifications:', err);
    }
  };

  if (loading) {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Stack align="center" gap="md">
          <Loader size="xl" color="blue" />
          <Text c="dimmed">Loading notifications...</Text>
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

  const notifications = data.notifications;
  const hasSelected = selectedNotifications.length > 0;

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
              <Title order={1}>Notifications</Title>
              <Text c="dimmed" mt={4}>{data.unread_count} unread</Text>
            </Box>
          </Group>
        </Container>
      </Paper>

      <Container size="md" py="xl">
        {/* Toolbar */}
        <Paper shadow="sm" p="md" mb="xl">
          <Group justify="space-between" wrap="wrap">
            <Group gap="xs">
              <IconFilter size={20} />
              <Button
                variant={filter === 'all' ? 'filled' : 'default'}
                onClick={() => setFilter('all')}
              >
                All ({data.count})
              </Button>
              <Button
                variant={filter === 'unread' ? 'filled' : 'default'}
                onClick={() => setFilter('unread')}
              >
                Unread ({data.unread_count})
              </Button>
            </Group>

            {hasSelected && (
              <Group gap="xs">
                <Text size="sm" fw={500}>
                  {selectedNotifications.length} selected
                </Text>
                <Button
                  onClick={() => handleMarkAsRead(selectedNotifications)}
                  size="sm"
                >
                  Mark as Read
                </Button>
                <Button
                  onClick={() => handleDelete(selectedNotifications)}
                  color="red"
                  size="sm"
                  leftSection={<IconTrash size={16} />}
                >
                  Delete
                </Button>
              </Group>
            )}
          </Group>
        </Paper>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <Paper shadow="sm" p="xl">
            <Stack align="center" gap="md">
              <IconBell size={48} color="var(--mantine-color-gray-5)" />
              <Text c="dimmed" size="lg">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
              </Text>
            </Stack>
          </Paper>
        ) : (
          <Stack gap="sm">
            {notifications.map((notification) => {
              const severity = notification.severity as keyof typeof severityConfig;
              const config = severityConfig[severity];
              const isSelected = selectedNotifications.includes(notification.notification_id);

              return (
                <Paper
                  key={notification.notification_id}
                  p="md"
                  shadow="sm"
                  withBorder
                  style={{
                    borderLeftWidth: !notification.is_read ? 4 : 1,
                    borderLeftColor: !notification.is_read
                      ? 'var(--mantine-color-blue-6)'
                      : undefined,
                    outline: isSelected ? '2px solid var(--mantine-color-blue-5)' : undefined,
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedNotifications(
                        selectedNotifications.filter((id) => id !== notification.notification_id)
                      );
                    } else {
                      setSelectedNotifications([...selectedNotifications, notification.notification_id]);
                    }
                  }}
                >
                  <Group align="start" gap="md" wrap="nowrap">
                    {/* Checkbox */}
                    <Checkbox
                      checked={isSelected}
                      onChange={() => {
                        if (isSelected) {
                          setSelectedNotifications(
                            selectedNotifications.filter((id) => id !== notification.notification_id)
                          );
                        } else {
                          setSelectedNotifications([
                            ...selectedNotifications,
                            notification.notification_id,
                          ]);
                        }
                      }}
                      mt={4}
                    />

                    {/* Icon */}
                    <Box>
                      <ActionIcon
                        variant="light"
                        color={config.color}
                        size="xl"
                        radius="md"
                      >
                        {severity === 'critical' ? (
                          <IconAlertCircle size={24} />
                        ) : (
                          <IconBell size={24} />
                        )}
                      </ActionIcon>
                    </Box>

                    {/* Content */}
                    <Stack gap="xs" style={{ flex: 1 }}>
                      <Group justify="space-between" align="start">
                        <Box style={{ flex: 1 }}>
                          <Group gap="xs" mb="xs">
                            <Title order={5}>{notification.title}</Title>
                            {!notification.is_read && (
                              <Badge size="xs" color="blue" variant="filled" circle />
                            )}
                          </Group>
                          <Text size="sm" c="dimmed" mb="xs">
                            {notification.description}
                          </Text>
                          <Group gap="md">
                            <Text size="xs" c="dimmed">
                              {notificationTypeMap[notification.notification_type] ||
                                notification.notification_type}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {notification.student_name}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {new Date(notification.created_at).toLocaleDateString()}
                            </Text>
                          </Group>
                        </Box>

                        {/* Action Link */}
                        {notification.action_url && (
                          <Button
                            component="a"
                            href={notification.action_url}
                            onClick={(e) => e.stopPropagation()}
                            color={config.color}
                            size="xs"
                          >
                            View
                          </Button>
                        )}
                      </Group>

                      {notification.is_read && (
                        <Group gap="xs">
                          <IconCircleCheck size={16} color={`var(--mantine-color-${config.color}-6)`} />
                          <Text size="xs" c="dimmed">Read</Text>
                        </Group>
                      )}
                    </Stack>
                  </Group>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Container>
    </Box>
  );
}
