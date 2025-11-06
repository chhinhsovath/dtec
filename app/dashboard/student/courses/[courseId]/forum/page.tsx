'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getSession, clearSession } from '@/lib/auth/client-auth';
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Paper,
  TextInput,
  Textarea,
  Stack,
  Loader,
  Center,
  Alert,
  Badge,
  Modal,
  Divider,
  Box,
  ActionIcon,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconSearch,
  IconPlus,
  IconX,
  IconEye,
  IconMessage,
  IconThumbUp,
  IconPin,
  IconLock,
  IconMessagePlus,
  IconLogout,
} from '@tabler/icons-react';

interface ForumPost {
  id: string;
  category_id: string;
  user_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  is_locked: boolean;
  view_count: number;
  reply_count: number;
  upvotes: number;
  created_at: string;
  updated_at: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  category_name?: string;
}

interface ForumReply {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  upvotes: number;
  is_marked_solution: boolean;
  created_at: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export default function StudentCourseForum() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;

  const [session, setSession] = useState<any>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [selectedPostReplies, setSelectedPostReplies] = useState<ForumReply[]>([]);
  const [showPostDetail, setShowPostDetail] = useState(false);
  const [newReplyContent, setNewReplyContent] = useState('');
  const [courseName, setCourseName] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const sess = getSession();
      if (!sess || sess.role !== 'student') {
        router.push('/auth/login');
        return;
      }
      setSession(sess);
      fetchCourseName();
      fetchForumPosts();
    };

    checkAuth();
  }, [router, courseId]);

  const fetchCourseName = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`);
      if (response.ok) {
        const data = await response.json();
        setCourseName(data.data?.name || 'Course Forum');
      }
    } catch (err) {
      console.error('Error fetching course name:', err);
    }
  };

  const fetchForumPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('courseId', courseId);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/forum-posts?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch forum posts');

      const data = await response.json();
      setPosts(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchPostReplies = async (postId: string) => {
    try {
      const response = await fetch(`/api/forum-replies?postId=${postId}`);
      if (!response.ok) throw new Error('Failed to fetch replies');

      const data = await response.json();
      setSelectedPostReplies(data.data || []);
    } catch (err) {
      console.error('Error fetching replies:', err);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      alert('Please fill in both title and content');
      return;
    }

    try {
      setError(null);

      const response = await fetch('/api/forum-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: 'general',
          userId: session.id,
          title: newPostTitle,
          content: newPostContent,
          isPinned: false,
          isLocked: false,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create post');
      }

      setNewPostTitle('');
      setNewPostContent('');
      setShowNewPostForm(false);
      fetchForumPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
    }
  };

  const handleReplyToPost = async () => {
    if (!newReplyContent.trim() || !selectedPost) {
      alert('Please write a reply');
      return;
    }

    try {
      setError(null);

      const response = await fetch('/api/forum-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: selectedPost.id,
          userId: session.id,
          content: newReplyContent,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to post reply');
      }

      setNewReplyContent('');
      fetchPostReplies(selectedPost.id);
      fetchForumPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post reply');
    }
  };

  const handleViewPost = (post: ForumPost) => {
    setSelectedPost(post);
    fetchPostReplies(post.id);
    setShowPostDetail(true);
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

  if (!session) {
    return (
      <Center h="100vh">
        <Loader size="xl" />
      </Center>
    );
  }

  return (
    <Box bg="gradient-to-br(from-blue-50,to-indigo-100)" mih="100vh" p="xl">
      <Container size="xl">
        {/* Header */}
        <Group justify="space-between" mb="xl">
          <Stack gap="xs">
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => router.push(`/dashboard/student/courses/${courseId}`)}
            >
              Back to Course
            </Button>
            <Title order={1}>{courseName} - Discussion Forum</Title>
            <Text c="dimmed">
              Ask questions, share knowledge, and collaborate with peers
            </Text>
          </Stack>
          <Button
            color="red"
            leftSection={<IconLogout size={16} />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Group>

        {/* Error Message */}
        {error && (
          <Alert color="red" mb="md" withCloseButton onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Search and New Post */}
        <Paper shadow="sm" p="lg" mb="xl">
          <Group>
            <TextInput
              flex={1}
              placeholder="Search discussions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftSection={<IconSearch size={16} />}
            />
            <Button onClick={() => fetchForumPosts()}>Search</Button>
            <Button
              color={showNewPostForm ? 'gray' : 'green'}
              leftSection={showNewPostForm ? <IconX size={16} /> : <IconPlus size={16} />}
              onClick={() => setShowNewPostForm(!showNewPostForm)}
            >
              {showNewPostForm ? 'Cancel' : 'New Discussion'}
            </Button>
          </Group>
        </Paper>

        {/* New Post Form */}
        {showNewPostForm && (
          <Paper shadow="lg" p="xl" mb="xl">
            <Title order={2} mb="lg">
              Start a New Discussion
            </Title>
            <Stack>
              <TextInput
                label="Title"
                placeholder="What's your question or topic?"
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
                required
              />
              <Textarea
                label="Description"
                placeholder="Provide details, context, and any relevant information..."
                rows={5}
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                required
              />
              <Group>
                <Button color="green" onClick={handleCreatePost}>
                  Post Discussion
                </Button>
                <Button variant="default" onClick={() => setShowNewPostForm(false)}>
                  Cancel
                </Button>
              </Group>
            </Stack>
          </Paper>
        )}

        {/* Forum Posts List */}
        {loading ? (
          <Center py="xl">
            <Loader size="xl" />
          </Center>
        ) : posts.length === 0 ? (
          <Paper shadow="lg" p="xl">
            <Stack align="center">
              <Text size="64px">💬</Text>
              <Text size="lg" c="dimmed">
                No discussions yet. Be the first to start one!
              </Text>
              <Button color="blue" onClick={() => setShowNewPostForm(true)}>
                Start First Discussion
              </Button>
            </Stack>
          </Paper>
        ) : (
          <Stack>
            {posts.map((post) => (
              <Paper
                key={post.id}
                shadow="sm"
                p="lg"
                style={{ cursor: 'pointer' }}
                onClick={() => handleViewPost(post)}
              >
                <Stack gap="md">
                  <Group gap="xs">
                    {post.is_pinned && (
                      <Badge color="red" leftSection={<IconPin size={12} />}>
                        Pinned
                      </Badge>
                    )}
                    {post.is_locked && (
                      <Badge color="gray" leftSection={<IconLock size={12} />}>
                        Locked
                      </Badge>
                    )}
                  </Group>
                  <Title order={3}>{post.title}</Title>
                  <Text c="dimmed" lineClamp={2}>
                    {post.content}
                  </Text>
                  <Divider />
                  <Group gap="sm" c="dimmed" fz="sm">
                    <Text>
                      By {post.first_name} {post.last_name}
                    </Text>
                    <Text>•</Text>
                    <Text>{formatDate(post.created_at)}</Text>
                    <Text>•</Text>
                    <Group gap={4}>
                      <IconEye size={16} />
                      <Text>{post.view_count}</Text>
                    </Group>
                    <Text>•</Text>
                    <Group gap={4}>
                      <IconMessage size={16} />
                      <Text>{post.reply_count}</Text>
                    </Group>
                    <Text>•</Text>
                    <Group gap={4}>
                      <IconThumbUp size={16} />
                      <Text>{post.upvotes}</Text>
                    </Group>
                  </Group>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}

        {/* Post Detail Modal */}
        <Modal
          opened={showPostDetail}
          onClose={() => setShowPostDetail(false)}
          title="Discussion Thread"
          size="xl"
          styles={{
            title: { fontWeight: 700, fontSize: '1.5rem' },
          }}
        >
          {selectedPost && (
            <Stack>
              {/* Original Post */}
              <Box pb="xl" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                <Group gap="xs" mb="sm">
                  <Text fw={700} c="dimmed" size="sm">
                    {selectedPost.first_name} {selectedPost.last_name}
                  </Text>
                  <Text c="dimmed" size="xs">
                    {formatDate(selectedPost.created_at)}
                  </Text>
                </Group>
                <Title order={3} mb="md">
                  {selectedPost.title}
                </Title>
                <Text style={{ whiteSpace: 'pre-wrap' }} mb="md">
                  {selectedPost.content}
                </Text>
                <Group gap="md" c="dimmed" fz="sm">
                  <Group gap={4}>
                    <IconEye size={16} />
                    <Text>{selectedPost.view_count} views</Text>
                  </Group>
                  <Group gap={4}>
                    <IconThumbUp size={16} />
                    <Text>{selectedPost.upvotes} upvotes</Text>
                  </Group>
                </Group>
              </Box>

              {/* Replies Section */}
              <Box>
                <Title order={4} mb="md">
                  Replies ({selectedPostReplies.length})
                </Title>

                {selectedPostReplies.length === 0 ? (
                  <Text c="dimmed" ta="center" py="md">
                    No replies yet. Be the first to respond!
                  </Text>
                ) : (
                  <Stack>
                    {selectedPostReplies.map((reply) => (
                      <Paper key={reply.id} p="md" bg="gray.0" withBorder>
                        <Group gap="xs" mb="xs">
                          <Text fw={700} c="dimmed" size="sm">
                            {reply.first_name} {reply.last_name}
                          </Text>
                          <Text c="dimmed" size="xs">
                            {formatDate(reply.created_at)}
                          </Text>
                          {reply.is_marked_solution && (
                            <Badge color="green" size="sm">
                              ✓ Solution
                            </Badge>
                          )}
                        </Group>
                        <Text style={{ whiteSpace: 'pre-wrap' }} mb="xs">
                          {reply.content}
                        </Text>
                        <Group gap={4}>
                          <IconThumbUp size={14} />
                          <Text size="sm" c="dimmed">
                            {reply.upvotes} upvotes
                          </Text>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Box>

              {/* New Reply Form */}
              {!selectedPost.is_locked ? (
                <Paper p="md" bg="blue.0" withBorder>
                  <Stack>
                    <Text fw={600} size="sm">
                      Your Reply
                    </Text>
                    <Textarea
                      placeholder="Share your thoughts or solution..."
                      rows={4}
                      value={newReplyContent}
                      onChange={(e) => setNewReplyContent(e.target.value)}
                    />
                    <Button
                      fullWidth
                      leftSection={<IconMessagePlus size={16} />}
                      onClick={handleReplyToPost}
                    >
                      Post Reply
                    </Button>
                  </Stack>
                </Paper>
              ) : (
                <Alert color="yellow">
                  <Group gap="xs">
                    <IconLock size={16} />
                    <Text fw={600}>This discussion is locked. No new replies allowed.</Text>
                  </Group>
                </Alert>
              )}

              <Button variant="default" onClick={() => setShowPostDetail(false)} fullWidth>
                Close
              </Button>
            </Stack>
          )}
        </Modal>
      </Container>
    </Box>
  );
}
