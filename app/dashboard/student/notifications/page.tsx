'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth/client-auth';
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  Paper,
  Loader,
  Alert,
  Badge,
  Stack,
  Center,
  Checkbox,
  Grid,
} from '@mantine/core';
import { IconBell, IconMessage, IconTrophy, IconSchool, IconNote, IconSettings, IconTrash } from '@tabler/icons-react';

interface Notification {
  id: string;
  notification_type: string;
  title: string;
  message: string | null;
  related_type: string | null;
  related_id: string | null;
  is_read: boolean;
  read_at: string | null;
  action_url: string | null;
  created_at: string;
}

interface NotificationPreferences {
  id: string;
  user_id: string;
  forum_replies: boolean;
  certificates: boolean;
  path_milestones: boolean;
  quiz_grades: boolean;
  email_notifications: boolean;
  in_app_notifications: boolean;
}

const NOTIFICATION_ICONS: Record<string, any> = {
  forum_reply: IconMessage,
  certificate_issued: IconTrophy,
  path_completed: IconSchool,
  quiz_graded: IconNote,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  forum_reply: 'blue',
  certificate_issued: 'green',
  path_completed: 'violet',
  quiz_graded: 'yellow',
};

export default function NotificationsPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    const checkAuth = async () => {
      const sess = getSession();
      if (!sess || sess.role !== 'student') {
        router.push('/auth/login');
        return;
      }
      setSession(sess);
      await Promise.all([
        fetchNotifications(sess.id),
        fetchPreferences(sess.id),
      ]);
    };

    checkAuth();
  }, [router]);

  const fetchNotifications = async (studentId: string) => {
    try {
      setLoading(true);
      setError(null);

      const unreadOnly = filter === 'unread';
      const response = await fetch(
        `/api/notifications?userId=${studentId}&unread_only=${unreadOnly}`
      );
      if (!response.ok) throw new Error('Failed to fetch notifications');

      const data = await response.json();
      setNotifications(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchPreferences = async (studentId: string) => {
    try {
      const response = await fetch(`/api/notifications/preferences?userId=${studentId}`);
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch preferences:', err);
    }
  };

  const handleMarkAsRead = async (notificationId: string, isRead: boolean) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: !isRead }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, is_read: !isRead } : n
          )
        );
      }
    } catch (err) {
      console.error('Failed to update notification:', err);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handlePreferenceChange = async (
    key: keyof Omit<NotificationPreferences, 'id' | 'user_id'>,
    value: boolean
  ) => {
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.id,
          [key]: value,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data.data);
      }
    } catch (err) {
      console.error('Failed to update preferences:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!session) {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Loader size="xl" />
      </Center>
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', paddingTop: '24px' }}>
      <Container size="md" py="xl">
        <Title order={2} mb="xl" style={{ fontFamily: 'Hanuman' }}>
          ការជូនដំណឹង
        </Title>

        {error && (
        <Alert color="red" mb="md">
          {error}
        </Alert>
      )}

      <Group mb="lg" wrap="wrap">
        <Button
          variant={filter === 'all' ? 'filled' : 'default'}
          onClick={() => {
            setFilter('all');
            fetchNotifications(session.id);
          }}
        >
          All ({notifications.length})
        </Button>
        <Button
          variant={filter === 'unread' ? 'filled' : 'default'}
          onClick={() => {
            setFilter('unread');
            fetchNotifications(session.id);
          }}
        >
          Unread ({unreadCount})
        </Button>
        <Button
          variant="default"
          leftSection={<IconSettings size={16} />}
          onClick={() => setShowPreferences(!showPreferences)}
        >
          Preferences
        </Button>
      </Group>

      {showPreferences && preferences && (
        <Paper shadow="sm" p="lg" mb="lg" withBorder>
          <Title order={2} mb="lg">Notification Preferences</Title>
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Checkbox
                label="Forum Replies"
                checked={preferences.forum_replies}
                onChange={(e) => handlePreferenceChange('forum_replies', e.target.checked)}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Checkbox
                label="Certificates Issued"
                checked={preferences.certificates}
                onChange={(e) => handlePreferenceChange('certificates', e.target.checked)}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Checkbox
                label="Path Milestones"
                checked={preferences.path_milestones}
                onChange={(e) => handlePreferenceChange('path_milestones', e.target.checked)}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Checkbox
                label="Quiz Grades"
                checked={preferences.quiz_grades}
                onChange={(e) => handlePreferenceChange('quiz_grades', e.target.checked)}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Checkbox
                label="Email Notifications"
                checked={preferences.email_notifications}
                onChange={(e) => handlePreferenceChange('email_notifications', e.target.checked)}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Checkbox
                label="In-App Notifications"
                checked={preferences.in_app_notifications}
                onChange={(e) => handlePreferenceChange('in_app_notifications', e.target.checked)}
              />
            </Grid.Col>
          </Grid>
        </Paper>
      )}

      {loading ? (
        <Center py="xl">
          <Loader size="xl" />
        </Center>
      ) : notifications.length === 0 ? (
        <Paper shadow="md" p="xl" radius="md">
          <Center>
            <Stack align="center" gap="lg">
              <Text size="4rem">📭</Text>
              <Text size="lg" c="dimmed">
                {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
              </Text>
              <Button onClick={() => router.push('/dashboard/student')}>
                Back to Dashboard
              </Button>
            </Stack>
          </Center>
        </Paper>
      ) : (
        <Stack gap="md">
          {notifications.map((notification) => {
            const IconComponent = NOTIFICATION_ICONS[notification.notification_type] || IconBell;
            const color = NOTIFICATION_COLORS[notification.notification_type] || 'gray';

            return (
              <Paper
                key={notification.id}
                p="md"
                withBorder
                radius="md"
                bg={notification.is_read ? 'gray.0' : undefined}
              >
                <Group align="flex-start" gap="md" wrap="nowrap">
                  <IconComponent size={32} color={`var(--mantine-color-${color}-6)`} />

                  <Stack gap="xs" style={{ flex: 1 }}>
                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          fw={notification.is_read ? 500 : 700}
                          size="lg"
                          mb={4}
                        >
                          {notification.title}
                        </Text>
                        {notification.message && (
                          <Text size="sm" c="dimmed" mb="xs">
                            {notification.message}
                          </Text>
                        )}
                      </div>
                      <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap', marginLeft: '1rem' }}>
                        {formatDate(notification.created_at)}
                      </Text>
                    </Group>

                    <Group gap="xs">
                      {notification.action_url && (
                        <Button
                          size="xs"
                          onClick={() => router.push(notification.action_url!)}
                        >
                          View
                        </Button>
                      )}
                      <Button
                        size="xs"
                        variant="default"
                        onClick={() => handleMarkAsRead(notification.id, notification.is_read)}
                      >
                        {notification.is_read ? 'Mark Unread' : 'Mark Read'}
                      </Button>
                      <Button
                        size="xs"
                        color="red"
                        variant="light"
                        leftSection={<IconTrash size={14} />}
                        onClick={() => handleDeleteNotification(notification.id)}
                      >
                        Delete
                      </Button>
                    </Group>
                  </Stack>

                  {!notification.is_read && (
                    <Badge
                      color="blue"
                      variant="filled"
                      size="xs"
                      circle
                      style={{ width: 10, height: 10, padding: 0, minWidth: 0 }}
                    />
                  )}
                </Group>
              </Paper>
            );
          })}
        </Stack>
      )}
      </Container>
    </div>
  );
}
