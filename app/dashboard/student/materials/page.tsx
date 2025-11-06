"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Title,
  Text,
  Paper,
  Stack,
  Group,
  TextInput,
  Select,
  Loader,
  Alert,
  Badge,
  Button,
  SimpleGrid,
  Box,
  Divider,
} from '@mantine/core';
import {
  IconSearch,
  IconDownload,
  IconEye,
  IconBook,
  IconFileText,
  IconPresentation,
  IconVideo,
  IconFile,
  IconPencil,
  IconAlertCircle,
} from '@tabler/icons-react';

interface CourseMaterial {
  id: string;
  course_id: string;
  course_name: string;
  title: string;
  description?: string;
  material_type: string;
  file_url: string;
  file_type?: string;
  file_size_mb?: number;
  view_count: number;
  created_at: string;
  first_name: string;
  last_name: string;
}

interface Course {
  id: string;
  name: string;
  code: string;
}

const materialIcons: Record<string, any> = {
  lecture_notes: IconFileText,
  textbook: IconBook,
  slides: IconPresentation,
  video: IconVideo,
  reference: IconBook,
  assignment: IconPencil,
};

const materialTypes = [
  { value: "lecture_notes", label: "Lecture Notes" },
  { value: "textbook", label: "Textbook" },
  { value: "slides", label: "Slides" },
  { value: "video", label: "Video" },
  { value: "reference", label: "Reference" },
  { value: "assignment", label: "Assignment" },
];

export default function StudentMaterialsPage() {
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCourse, setFilterCourse] = useState<string | null>("");
  const [filterType, setFilterType] = useState<string | null>("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchEnrolledCourses();
    fetchMaterials();
  }, [filterCourse, filterType]);

  const fetchEnrolledCourses = async () => {
    try {
      const response = await fetch("/api/enrollments");
      if (!response.ok) throw new Error("Failed to fetch courses");
      const data = await response.json();
      const courses = data.data?.map((enrollment: any) => ({
        id: enrollment.course_id,
        name: enrollment.course_name,
        code: enrollment.course_code,
      })) || [];
      const uniqueCourses = Array.from(
        new Map(courses.map((c: Course) => [c.id, c])).values()
      );
      setEnrolledCourses(uniqueCourses);
    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  };

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      let url = "/api/course-materials?published=true";
      if (filterCourse) url += `&courseId=${filterCourse}`;
      if (filterType) url += `&materialType=${filterType}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch materials");
      const data = await response.json();
      setMaterials(data.data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load materials");
    } finally {
      setLoading(false);
    }
  };

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch =
      material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const groupedMaterials = filteredMaterials.reduce(
    (acc, material) => {
      const course = material.course_name;
      if (!acc[course]) {
        acc[course] = [];
      }
      acc[course].push(material);
      return acc;
    },
    {} as Record<string, CourseMaterial[]>
  );

  const getMaterialIcon = (type: string) => {
    return materialIcons[type] || IconFile;
  };

  return (
    <Box bg="gray.0" mih="100vh" p="xl">
      <Container size="xl">
        <Stack gap="xl">
          <div>
            <Title order={1}>Course Materials Library</Title>
            <Text c="dimmed" mt="xs">
              Access lecture notes, textbooks, slides, and other resources for your courses
            </Text>
          </div>

          {error && (
            <Alert icon={<IconAlertCircle size={20} />} color="red" variant="light">
              {error}
            </Alert>
          )}

          <Paper shadow="sm" p="xl" radius="md">
            <Title order={4} mb="lg">Search & Filter</Title>
            <Stack gap="md">
              <TextInput
                placeholder="Search by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftSection={<IconSearch size={16} />}
              />

              <Group grow>
                <Select
                  label="Course"
                  placeholder="All Courses"
                  value={filterCourse}
                  onChange={setFilterCourse}
                  data={[
                    { value: "", label: "All Courses" },
                    ...enrolledCourses.map((course) => ({
                      value: course.id,
                      label: `${course.name} (${course.code})`,
                    })),
                  ]}
                  clearable
                />

                <Select
                  label="Material Type"
                  placeholder="All Types"
                  value={filterType}
                  onChange={setFilterType}
                  data={[
                    { value: "", label: "All Types" },
                    ...materialTypes,
                  ]}
                  clearable
                />
              </Group>
            </Stack>
          </Paper>

          {loading ? (
            <Paper shadow="sm" p="xl" radius="md">
              <Stack align="center" py="xl">
                <Loader size="lg" />
                <Text c="dimmed">Loading materials...</Text>
              </Stack>
            </Paper>
          ) : filteredMaterials.length === 0 ? (
            <Paper shadow="sm" p="xl" radius="md">
              <Stack align="center" py="xl">
                <Text c="dimmed">No materials found. Check back soon!</Text>
              </Stack>
            </Paper>
          ) : (
            <Stack gap="xl">
              {Object.entries(groupedMaterials).map(([courseName, courseMaterials]) => (
                <Paper key={courseName} shadow="sm" p="xl" radius="md">
                  <Group mb="lg">
                    <IconBook size={28} />
                    <Title order={2}>{courseName}</Title>
                  </Group>
                  <Divider mb="lg" />

                  <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                    {courseMaterials.map((material) => {
                      const IconComponent = getMaterialIcon(material.material_type);
                      return (
                        <Paper
                          key={material.id}
                          withBorder
                          p="lg"
                          radius="md"
                          style={{
                            background: 'linear-gradient(135deg, #fafafa 0%, #ffffff 100%)',
                            transition: 'all 0.2s',
                          }}
                          sx={(theme) => ({
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: theme.shadows.lg,
                            },
                          })}
                        >
                          <Stack gap="md">
                            <Group justify="space-between">
                              <IconComponent size={32} stroke={1.5} />
                              <Badge color="blue" variant="light">
                                {materialTypes.find((t) => t.value === material.material_type)?.label}
                              </Badge>
                            </Group>

                            <div>
                              <Title order={5} lineClamp={2} mb="xs">
                                {material.title}
                              </Title>
                              {material.description && (
                                <Text size="sm" c="dimmed" lineClamp={2}>
                                  {material.description}
                                </Text>
                              )}
                            </div>

                            <Group gap="md">
                              {material.file_size_mb && (
                                <Text size="xs" c="dimmed">
                                  {material.file_size_mb} MB
                                </Text>
                              )}
                              <Text size="xs" c="dimmed">
                                {material.view_count} views
                              </Text>
                            </Group>

                            <Group grow>
                              <Button
                                component="a"
                                href={material.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                leftSection={<IconDownload size={16} />}
                                size="sm"
                              >
                                Download
                              </Button>
                              <Button
                                component="a"
                                href={material.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                leftSection={<IconEye size={16} />}
                                color="green"
                                size="sm"
                              >
                                View
                              </Button>
                            </Group>

                            <Divider />
                            <Text size="xs" c="dimmed">
                              Uploaded by {material.first_name} {material.last_name}
                            </Text>
                          </Stack>
                        </Paper>
                      );
                    })}
                  </SimpleGrid>
                </Paper>
              ))}
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
