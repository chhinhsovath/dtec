'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, clearSession } from '@/lib/auth/client-auth';
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Paper,
  TextInput,
  Select,
  Stack,
  Loader,
  Center,
  Alert,
  Badge,
  Grid,
  Progress,
  Box,
  Divider,
  SimpleGrid,
} from '@mantine/core';
import {
  IconLogout,
  IconSearch,
  IconBook2,
  IconClock,
  IconTrophy,
} from '@tabler/icons-react';

interface LearningPath {
  id: string;
  name: string;
  description: string | null;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_hours: number;
  category: string | null;
  thumbnail_url: string | null;
  is_published: boolean;
  course_count?: number;
  avg_student_progress?: number;
  learning_objectives: string | null;
}

interface EnrolledPath {
  id: string;
  path_id: string;
  student_id: string;
  status: 'enrolled' | 'in_progress' | 'completed';
  enrollment_date: string;
  completion_date: string | null;
  progress_percentage: number;
  path_name?: string;
  path_difficulty?: string;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'green',
  intermediate: 'yellow',
  advanced: 'red',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export default function StudentLearningPathsPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [availablePaths, setAvailablePaths] = useState<LearningPath[]>([]);
  const [enrolledPaths, setEnrolledPaths] = useState<EnrolledPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [enrollingPathId, setEnrollingPathId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const sess = getSession();
      if (!sess || sess.role !== 'student') {
        router.push('/auth/login');
        return;
      }
      setSession(sess);
      fetchPaths();
      fetchEnrolledPaths(sess.id);
    };

    checkAuth();
  }, [router]);

  const fetchPaths = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('published', 'true');
      if (selectedDifficulty) params.append('difficulty', selectedDifficulty);
      if (selectedCategory) params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/learning-paths?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch learning paths');

      const data = await response.json();
      const paths = data.data || [];
      setAvailablePaths(paths);

      const uniqueCategories = Array.from(
        new Set(paths.map((p: LearningPath) => p.category).filter(Boolean))
      ) as string[];
      setCategories(uniqueCategories.sort());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrolledPaths = async (studentId: string) => {
    try {
      const response = await fetch(`/api/learning-paths?studentId=${studentId}`);
      if (!response.ok) throw new Error('Failed to fetch enrollments');
      const data = await response.json();
      setEnrolledPaths(data.data || []);
    } catch (err) {
      console.error('Error fetching enrolled paths:', err);
    }
  };

  const handleEnrollPath = async (pathId: string) => {
    try {
      setError(null);
      setEnrollingPathId(pathId);

      const response = await fetch('/api/learning-paths/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pathId,
          studentId: session.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to enroll');
      }

      fetchPaths();
      fetchEnrolledPaths(session.id);
      setEnrollingPathId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enroll in path');
      setEnrollingPathId(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPaths();
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
    });
  };

  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'green';
    if (progress >= 75) return 'blue';
    if (progress >= 50) return 'yellow';
    return 'orange';
  };

  if (!session) {
    return (
      <Center h="100vh">
        <Loader size="xl" />
      </Center>
    );
  }

  const isEnrolled = (pathId: string) =>
    enrolledPaths.some((ep) => ep.path_id === pathId);

  return (
    <Box bg="gradient-to-br(from-blue-50,to-indigo-100)" mih="100vh" p="xl">
      <Container size="xl">
        {/* Header */}
        <Group justify="space-between" mb="xl">
          <Stack gap="xs">
            <Title order={1} style={{ fontFamily: 'Hanuman' }}>
              ផ្លូវរៀន
            </Title>
            <Text c="dimmed">Discover structured learning pathways</Text>
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

        {/* My Learning Paths Section */}
        {enrolledPaths.length > 0 && (
          <Box mb="xl">
            <Title order={2} mb="lg">
              My Learning Paths ({enrolledPaths.length})
            </Title>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
              {enrolledPaths.map((enrollment) => (
                <Paper key={enrollment.id} shadow="lg" p="lg" h="100%">
                  <Stack justify="space-between" h="100%">
                    {/* Thumbnail */}
                    <Box
                      h={160}
                      bg="linear-gradient(135deg, var(--mantine-color-blue-4), var(--mantine-color-indigo-6))"
                      style={{ borderRadius: 'var(--mantine-radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      mb="md"
                    >
                      <Text size="64px">📚</Text>
                    </Box>

                    <Stack flex={1}>
                      <Group gap="xs">
                        <Badge color={DIFFICULTY_COLORS[enrollment.path_difficulty as keyof typeof DIFFICULTY_COLORS] || 'gray'} size="sm">
                          {DIFFICULTY_LABELS[enrollment.path_difficulty as keyof typeof DIFFICULTY_LABELS] || enrollment.path_difficulty}
                        </Badge>
                        <Badge color="blue" size="sm" variant="light">
                          {enrollment.status}
                        </Badge>
                      </Group>

                      <Title order={4} lineClamp={2}>
                        {enrollment.path_name}
                      </Title>

                      {/* Progress Bar */}
                      <Box>
                        <Group justify="space-between" mb="xs">
                          <Text size="xs" c="dimmed">
                            Progress
                          </Text>
                          <Text size="sm" fw={700}>
                            {enrollment.progress_percentage}%
                          </Text>
                        </Group>
                        <Progress
                          value={enrollment.progress_percentage}
                          color={getProgressColor(enrollment.progress_percentage)}
                          size="md"
                        />
                      </Box>

                      <Text size="xs" c="dimmed">
                        Enrolled: {formatDate(enrollment.enrollment_date)}
                      </Text>
                    </Stack>

                    <Button
                      fullWidth
                      onClick={() => router.push(`/dashboard/student/learning-paths/${enrollment.path_id}`)}
                    >
                      Continue Path
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </SimpleGrid>

            <Divider my="xl" />
          </Box>
        )}

        {/* Available Paths Section */}
        <Box>
          <Title order={2} mb="lg">
            Explore Learning Paths
          </Title>

          {/* Filters */}
          <Paper shadow="sm" p="lg" mb="xl">
            <form onSubmit={handleSearch}>
              <Grid>
                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                  <TextInput
                    label="Search"
                    placeholder="Search paths..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    leftSection={<IconSearch size={16} />}
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                  <Select
                    label="Difficulty"
                    placeholder="All Levels"
                    value={selectedDifficulty}
                    onChange={(value) => setSelectedDifficulty(value || '')}
                    data={[
                      { value: '', label: 'All Levels' },
                      { value: 'beginner', label: 'Beginner' },
                      { value: 'intermediate', label: 'Intermediate' },
                      { value: 'advanced', label: 'Advanced' },
                    ]}
                    clearable
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                  <Select
                    label="Category"
                    placeholder="All Categories"
                    value={selectedCategory}
                    onChange={(value) => setSelectedCategory(value || '')}
                    data={[
                      { value: '', label: 'All Categories' },
                      ...categories.map((cat) => ({ value: cat, label: cat })),
                    ]}
                    clearable
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                  <Stack justify="flex-end" h="100%">
                    <Button type="submit" fullWidth>
                      Filter
                    </Button>
                  </Stack>
                </Grid.Col>
              </Grid>
            </form>

            {(searchQuery || selectedDifficulty || selectedCategory) && (
              <Button
                variant="subtle"
                mt="sm"
                size="xs"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDifficulty('');
                  setSelectedCategory('');
                  fetchPaths();
                }}
              >
                Reset filters
              </Button>
            )}
          </Paper>

          {/* Paths Grid */}
          {loading ? (
            <Center py="xl">
              <Loader size="xl" />
            </Center>
          ) : availablePaths.length === 0 ? (
            <Paper shadow="lg" p="xl">
              <Text c="dimmed" ta="center" size="lg">
                {searchQuery || selectedDifficulty || selectedCategory
                  ? 'No learning paths found matching your filters.'
                  : 'No available learning paths at this time.'}
              </Text>
            </Paper>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
              {availablePaths.map((path) => (
                <Paper key={path.id} shadow="lg" withBorder h="100%">
                  <Stack h="100%" justify="space-between">
                    {/* Thumbnail */}
                    <Box
                      h={160}
                      bg="linear-gradient(135deg, var(--mantine-color-blue-4), var(--mantine-color-indigo-6))"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      {path.thumbnail_url ? (
                        <img
                          src={path.thumbnail_url}
                          alt={path.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <Text size="64px">📚</Text>
                      )}
                    </Box>

                    <Stack p="lg" flex={1}>
                      <Group gap="xs">
                        <Badge
                          color={DIFFICULTY_COLORS[path.difficulty_level]}
                          size="sm"
                        >
                          {DIFFICULTY_LABELS[path.difficulty_level]}
                        </Badge>
                        {path.category && (
                          <Badge color="indigo" size="sm" variant="light">
                            {path.category}
                          </Badge>
                        )}
                      </Group>

                      <Title order={4} lineClamp={2}>
                        {path.name}
                      </Title>

                      {path.description && (
                        <Text size="sm" c="dimmed" lineClamp={2}>
                          {path.description}
                        </Text>
                      )}

                      <Divider />

                      <SimpleGrid cols={2}>
                        <Box>
                          <Text size="xs" c="dimmed" tt="uppercase">
                            Courses
                          </Text>
                          <Text size="lg" fw={700}>
                            {path.course_count || 0}
                          </Text>
                        </Box>
                        <Box>
                          <Text size="xs" c="dimmed" tt="uppercase">
                            Duration
                          </Text>
                          <Text size="lg" fw={700}>
                            {path.estimated_hours} hrs
                          </Text>
                        </Box>
                      </SimpleGrid>

                      {path.learning_objectives && (
                        <Paper p="sm" bg="blue.0">
                          <Text size="xs" fw={600} c="dimmed" mb={4}>
                            Learning Objectives
                          </Text>
                          <Text size="xs" c="dimmed" lineClamp={2}>
                            {path.learning_objectives}
                          </Text>
                        </Paper>
                      )}
                    </Stack>

                    <Group p="lg" pt={0} grow>
                      {isEnrolled(path.id) ? (
                        <Button disabled variant="default">
                          Already Enrolled
                        </Button>
                      ) : (
                        <Button
                          color="green"
                          onClick={() => handleEnrollPath(path.id)}
                          loading={enrollingPathId === path.id}
                        >
                          Enroll Now
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/dashboard/student/learning-paths/${path.id}`)}
                      >
                        Details
                      </Button>
                    </Group>
                  </Stack>
                </Paper>
              ))}
            </SimpleGrid>
          )}
        </Box>
      </Container>
    </Box>
  );
}
