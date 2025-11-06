'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getSession, clearSession } from '@/lib/auth/client-auth';
import {
  Container,
  Title,
  Text,
  Button,
  Paper,
  Group,
  Stack,
  Badge,
  Loader,
  Center,
  Grid,
  Box,
  Textarea,
  Alert,
  Modal,
  Select,
  Divider
} from '@mantine/core';
import {
  IconPin,
  IconPinned,
  IconLock,
  IconLockOpen,
  IconTrash,
  IconEye,
  IconAlertCircle,
  IconLogout
} from '@tabler/icons-react';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  is_locked: boolean;
  view_count: number;
  reply_count: number;
  upvotes: number;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  course_name: string;
  category_name: string;
}

interface Course {
  id: string;
  name: string;
}

export default function TeacherForumModerationPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const [session, setSession] = useState<any>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pinned' | 'locked'>('all');
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'pin' | 'unpin' | 'lock' | 'unlock' | 'delete' | null>(null);
  const [actionReason, setActionReason] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const sess = getSession();
      if (!sess || sess.role !== 'teacher') {
        router.push('/auth/login');
        return;
      }
      setSession(sess);
      await fetchCourseAndPosts(sess.id);
    };

    checkAuth();
  }, [router, courseId]);

  const fetchCourseAndPosts = async (teacherId: string) => {
    try {
      setLoading(true);
      setError(null);

      const courseRes = await fetch(`/api/courses/${courseId}`);
      if (courseRes.ok) {
        const courseData = await courseRes.json();
        setCourse(courseData.data);
      }

      const postsRes = await fetch(
        `/api/admin/forum/posts?courseId=${courseId}&moderatorId=${teacherId}&status=${statusFilter}`
      );
      if (!postsRes.ok) throw new Error('Failed to fetch posts');

      const postsData = await postsRes.json();
      setPosts(postsData.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleModerationAction = async () => {
    if (!selectedPost || !actionType) return;

    try {
      const response = await fetch(`/api/admin/forum/posts/${selectedPost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moderatorId: session.id,
          action: actionType,
          reason: actionReason,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to perform action');
      }

      await fetchCourseAndPosts(session.id);
      setShowActionModal(false);
      setActionType(null);
      setActionReason('');
      setSelectedPost(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleLogout = () => {
    clearSession();
    router.push('/');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openActionModal = (post: ForumPost, type: typeof actionType) => {
    setSelectedPost(post);
    setActionType(type);
    setShowActionModal(true);
  };

  if (!session) {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Loader size="xl" />
      </Center>
    );
  }

  return (
    <Box style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #eff6ff 0%, #ddd6fe 100%)' }} p="xl">
      <Container size="xl">
        {/* Header */}
        <Group justify="space-between" mb="xl">
          <div>
            <Title order={1} style={{ fontFamily: 'Hanuman' }}>
              ផ្នែកគ្រប់គ្រង វេទិកា
            </Title>
            <Text c="dimmed" mt="xs">
              {course?.name ? `Manage discussions for ${course.name}` : 'Forum Management'}
            </Text>
          </div>
          <Button
            leftSection={<IconLogout size={16} />}
            color="red"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Group>

        {/* Error Message */}
        {error && (
          <Alert icon={<IconAlertCircle size={18} />} title="Error" color="red" mb="md">
            {error}
          </Alert>
        )}

        {/* Status Filter */}
        <Group gap="xs" mb="xl">
          <Button
            onClick={() => {
              setStatusFilter('all');
              fetchCourseAndPosts(session.id);
            }}
            variant={statusFilter === 'all' ? 'filled' : 'light'}
          >
            All Posts ({posts.length})
          </Button>
          <Button
            onClick={() => {
              setStatusFilter('pinned');
              fetchCourseAndPosts(session.id);
            }}
            variant={statusFilter === 'pinned' ? 'filled' : 'light'}
            color="yellow"
          >
            Pinned ({posts.filter((p) => p.is_pinned).length})
          </Button>
          <Button
            onClick={() => {
              setStatusFilter('locked');
              fetchCourseAndPosts(session.id);
            }}
            variant={statusFilter === 'locked' ? 'filled' : 'light'}
            color="red"
          >
            Locked ({posts.filter((p) => p.is_locked).length})
          </Button>
        </Group>

        {/* Posts List */}
        {loading ? (
          <Center py={80}>
            <Loader size="xl" />
          </Center>
        ) : posts.length === 0 ? (
          <Paper shadow="lg" radius="lg" p={80} withBorder>
            <Stack align="center" gap="md">
              <Text size="60px">📭</Text>
              <Text size="lg" c="dimmed">No forum posts to moderate</Text>
            </Stack>
          </Paper>
        ) : (
          <Stack gap="md">
            {posts.map((post) => (
              <Paper key={post.id} shadow="md" radius="lg" p="xl" withBorder>
                {/* Post Header */}
                <Group justify="space-between" align="flex-start" mb="md">
                  <Box style={{ flex: 1 }}>
                    <Title order={3} mb="sm">{post.title}</Title>
                    <Group gap="xs">
                      {post.is_pinned && (
                        <Badge color="yellow" leftSection={<IconPinned size={12} />}>
                          Pinned
                        </Badge>
                      )}
                      {post.is_locked && (
                        <Badge color="red" leftSection={<IconLock size={12} />}>
                          Locked
                        </Badge>
                      )}
                    </Group>
                  </Box>
                </Group>

                {/* Post Content Preview */}
                <Text c="dimmed" mb="md" lineClamp={3}>{post.content}</Text>

                {/* Post Meta */}
                <Grid gutter="md" mb="lg">
                  <Grid.Col span={3}>
                    <Text size="xs" fw={600} c="dimmed">Author</Text>
                    <Text size="sm">{post.first_name} {post.last_name}</Text>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Text size="xs" fw={600} c="dimmed">Views</Text>
                    <Text size="sm">{post.view_count} views</Text>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Text size="xs" fw={600} c="dimmed">Replies</Text>
                    <Text size="sm">{post.reply_count} replies</Text>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Text size="xs" fw={600} c="dimmed">Posted</Text>
                    <Text size="sm">{formatDate(post.created_at)}</Text>
                  </Grid.Col>
                </Grid>

                {/* Moderation Actions */}
                <Group gap="xs">
                  {!post.is_pinned ? (
                    <Button
                      size="sm"
                      variant="light"
                      color="yellow"
                      leftSection={<IconPin size={16} />}
                      onClick={() => openActionModal(post, 'pin')}
                    >
                      Pin
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="light"
                      color="yellow"
                      leftSection={<IconPinned size={16} />}
                      onClick={() => openActionModal(post, 'unpin')}
                    >
                      Unpin
                    </Button>
                  )}

                  {!post.is_locked ? (
                    <Button
                      size="sm"
                      variant="light"
                      color="red"
                      leftSection={<IconLock size={16} />}
                      onClick={() => openActionModal(post, 'lock')}
                    >
                      Lock
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="light"
                      color="red"
                      leftSection={<IconLockOpen size={16} />}
                      onClick={() => openActionModal(post, 'unlock')}
                    >
                      Unlock
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="light"
                    color="red"
                    leftSection={<IconTrash size={16} />}
                    onClick={() => openActionModal(post, 'delete')}
                  >
                    Delete
                  </Button>

                  <Button
                    size="sm"
                    variant="light"
                    leftSection={<IconEye size={16} />}
                    onClick={() => router.push(`/dashboard/student/courses/${courseId}/forum`)}
                  >
                    View
                  </Button>
                </Group>
              </Paper>
            ))}
          </Stack>
        )}

        {/* Action Confirmation Modal */}
        <Modal
          opened={showActionModal && !!selectedPost && !!actionType}
          onClose={() => setShowActionModal(false)}
          title={<Text fw={700} size="xl">Confirm Action</Text>}
          size="md"
        >
          <Stack gap="md">
            <Text fw={600}>
              {actionType === 'delete'
                ? 'Are you sure you want to delete this post? This action cannot be undone.'
                : `Are you sure you want to ${actionType} this post?`}
            </Text>

            {selectedPost && (
              <Paper p="md" bg="gray.0" radius="md">
                <Text size="xs" fw={600} c="dimmed" mb="xs">Post Title</Text>
                <Text lineClamp={2}>{selectedPost.title}</Text>
              </Paper>
            )}

            <Stack gap="xs">
              <Text size="sm" fw={600}>Reason (optional)</Text>
              <Textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Why are you taking this action?"
                rows={3}
              />
            </Stack>

            <Group justify="flex-end" gap="xs">
              <Button
                variant="subtle"
                color="gray"
                onClick={() => setShowActionModal(false)}
              >
                Cancel
              </Button>
              <Button
                color={actionType === 'delete' ? 'red' : 'blue'}
                onClick={handleModerationAction}
              >
                Confirm
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Container>
    </Box>
  );
}
