"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Title,
  Text,
  Button,
  Select,
  TextInput,
  Textarea,
  Checkbox,
  Paper,
  Group,
  Stack,
  Grid,
  Card,
  Badge,
  Loader,
  Center,
  Alert,
  Anchor,
  NumberInput,
  Table,
  Modal,
} from "@mantine/core";
import {
  IconUpload,
  IconX,
  IconFilter,
  IconFileText,
  IconBook,
  IconPresentation,
  IconVideo,
  IconBookmark,
  IconPencil,
  IconEye,
  IconTrash,
  IconAlertCircle,
} from "@tabler/icons-react";

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
  is_published: boolean;
  order_position: number;
  view_count: number;
  created_at: string;
  first_name: string;
  last_name: string;
}

interface Course {
  id: string;
  name: string;
}

export default function TeacherMaterialsPage() {
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCourse, setFilterCourse] = useState("");
  const [filterType, setFilterType] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    courseId: "",
    title: "",
    description: "",
    materialType: "lecture_notes",
    fileUrl: "",
    fileSizeMb: "",
    fileType: "",
    orderPosition: "0",
    isPublished: true,
  });

  useEffect(() => {
    fetchCourses();
    fetchMaterials();
  }, [filterCourse, filterType]);

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/courses");
      if (!response.ok) throw new Error("Failed to fetch courses");
      const data = await response.json();
      setCourses(data.data || []);
    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  };

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      let url = "/api/course-materials";
      const params = new URLSearchParams();
      if (filterCourse) params.append("courseId", filterCourse);
      if (filterType) params.append("materialType", filterType);
      if (params.toString()) url += "?" + params.toString();

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

  const handleInputChange = (
    field: string,
    value: string | boolean | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.courseId || !formData.title || !formData.fileUrl) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        courseId: formData.courseId,
        fileSizeMb: formData.fileSizeMb ? parseFloat(formData.fileSizeMb) : null,
        orderPosition: parseInt(formData.orderPosition),
        uploadedBy: "current-user-id",
      };

      const url = editingId ? `/api/course-materials/${editingId}` : "/api/course-materials";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save material");

      setShowForm(false);
      setEditingId(null);
      setFormData({
        courseId: "",
        title: "",
        description: "",
        materialType: "lecture_notes",
        fileUrl: "",
        fileSizeMb: "",
        fileType: "",
        orderPosition: "0",
        isPublished: true,
      });
      fetchMaterials();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save material");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (material: CourseMaterial) => {
    setFormData({
      courseId: material.course_id,
      title: material.title,
      description: material.description || "",
      materialType: material.material_type,
      fileUrl: material.file_url,
      fileSizeMb: material.file_size_mb?.toString() || "",
      fileType: material.file_type || "",
      orderPosition: material.order_position.toString(),
      isPublished: material.is_published,
    });
    setEditingId(material.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;

    try {
      const response = await fetch(`/api/course-materials/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete material");
      fetchMaterials();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete material");
    }
  };

  const getMaterialIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      lecture_notes: <IconFileText size={32} />,
      textbook: <IconBook size={32} />,
      slides: <IconPresentation size={32} />,
      video: <IconVideo size={32} />,
      reference: <IconBookmark size={32} />,
      assignment: <IconPencil size={32} />,
    };
    return icons[type] || <IconFileText size={32} />;
  };

  const materialTypes = [
    { value: "lecture_notes", label: "Lecture Notes" },
    { value: "textbook", label: "Textbook" },
    { value: "slides", label: "Slides" },
    { value: "video", label: "Video" },
    { value: "reference", label: "Reference" },
    { value: "assignment", label: "Assignment" },
  ];

  const courseOptions = courses.map((course) => ({
    value: course.id,
    label: course.name,
  }));

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1} mb="xs">
            Course Materials
          </Title>
          <Text c="dimmed">Upload and manage course learning materials</Text>
        </div>

        {error && (
          <Alert icon={<IconAlertCircle />} color="red" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Group>
          <Button
            leftSection={showForm ? <IconX size={16} /> : <IconUpload size={16} />}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancel" : "Upload New Material"}
          </Button>
        </Group>

        <Modal
          opened={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingId(null);
          }}
          title={editingId ? "Edit Material" : "Upload New Material"}
          size="lg"
        >
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <Grid>
                <Grid.Col span={6}>
                  <Select
                    label="Course"
                    placeholder="Select Course"
                    data={[{ value: "", label: "Select Course" }, ...courseOptions]}
                    value={formData.courseId}
                    onChange={(value) => handleInputChange("courseId", value || "")}
                    required
                    withAsterisk
                  />
                </Grid.Col>

                <Grid.Col span={6}>
                  <Select
                    label="Material Type"
                    data={materialTypes}
                    value={formData.materialType}
                    onChange={(value) => handleInputChange("materialType", value || "")}
                    required
                    withAsterisk
                  />
                </Grid.Col>
              </Grid>

              <TextInput
                label="Title"
                placeholder="Material title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
                withAsterisk
              />

              <Textarea
                label="Description"
                placeholder="Material description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={3}
              />

              <Grid>
                <Grid.Col span={4}>
                  <TextInput
                    label="File URL"
                    placeholder="https://example.com/file.pdf"
                    value={formData.fileUrl}
                    onChange={(e) => handleInputChange("fileUrl", e.target.value)}
                    required
                    withAsterisk
                  />
                </Grid.Col>

                <Grid.Col span={4}>
                  <NumberInput
                    label="File Size (MB)"
                    placeholder="e.g., 5.2"
                    value={formData.fileSizeMb}
                    onChange={(value) => handleInputChange("fileSizeMb", value?.toString() || "")}
                    decimalScale={1}
                    min={0}
                  />
                </Grid.Col>

                <Grid.Col span={4}>
                  <TextInput
                    label="File Type"
                    placeholder="e.g., pdf, docx"
                    value={formData.fileType}
                    onChange={(e) => handleInputChange("fileType", e.target.value)}
                  />
                </Grid.Col>
              </Grid>

              <Grid>
                <Grid.Col span={6}>
                  <NumberInput
                    label="Order Position"
                    placeholder="0"
                    value={formData.orderPosition}
                    onChange={(value) => handleInputChange("orderPosition", value?.toString() || "0")}
                    min={0}
                  />
                </Grid.Col>

                <Grid.Col span={6}>
                  <Checkbox
                    label="Publish immediately"
                    checked={formData.isPublished}
                    onChange={(e) => handleInputChange("isPublished", e.target.checked)}
                    mt="xl"
                  />
                </Grid.Col>
              </Grid>

              <Group mt="md">
                <Button type="submit" loading={loading}>
                  {editingId ? "Update Material" : "Upload Material"}
                </Button>
                <Button
                  variant="default"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                >
                  Cancel
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>

        <Paper shadow="sm" p="md" withBorder>
          <Group mb="md">
            <IconFilter size={20} />
            <Text fw={700}>Filters</Text>
          </Group>
          <Grid>
            <Grid.Col span={6}>
              <Select
                label="Course"
                placeholder="All Courses"
                data={[{ value: "", label: "All Courses" }, ...courseOptions]}
                value={filterCourse}
                onChange={(value) => setFilterCourse(value || "")}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <Select
                label="Type"
                placeholder="All Types"
                data={[{ value: "", label: "All Types" }, ...materialTypes]}
                value={filterType}
                onChange={(value) => setFilterType(value || "")}
              />
            </Grid.Col>
          </Grid>
        </Paper>

        {loading ? (
          <Center py={60}>
            <Stack align="center" gap="md">
              <Loader size="lg" />
              <Text c="dimmed">Loading materials...</Text>
            </Stack>
          </Center>
        ) : materials.length === 0 ? (
          <Paper shadow="sm" p="xl" withBorder>
            <Center>
              <Stack align="center">
                <Text c="dimmed" size="lg">
                  No materials found. Upload your first material!
                </Text>
              </Stack>
            </Center>
          </Paper>
        ) : (
          <Grid>
            {materials.map((material) => (
              <Grid.Col key={material.id} span={{ base: 12, sm: 6, lg: 4 }}>
                <Card shadow="sm" padding="lg" withBorder>
                  <Stack gap="md">
                    <Group justify="space-between" align="flex-start">
                      <div>
                        {getMaterialIcon(material.material_type)}
                        <Text fw={700} size="lg" mt="xs">
                          {material.title}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {material.course_name}
                        </Text>
                      </div>
                      {!material.is_published && (
                        <Badge color="gray" variant="light">
                          Draft
                        </Badge>
                      )}
                    </Group>

                    {material.description && (
                      <Text size="sm" c="dimmed">
                        {material.description}
                      </Text>
                    )}

                    <Group gap="xs">
                      <Text size="xs" c="dimmed">
                        <IconEye size={14} style={{ display: "inline", verticalAlign: "middle" }} /> {material.view_count} views
                      </Text>
                      {material.file_size_mb && (
                        <Text size="xs" c="dimmed">
                          {material.file_size_mb} MB
                        </Text>
                      )}
                    </Group>

                    <Group grow>
                      <Button
                        component="a"
                        href={material.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="light"
                        leftSection={<IconEye size={16} />}
                      >
                        View
                      </Button>
                      <Button
                        variant="light"
                        color="yellow"
                        leftSection={<IconPencil size={16} />}
                        onClick={() => handleEdit(material)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="light"
                        color="red"
                        leftSection={<IconTrash size={16} />}
                        onClick={() => handleDelete(material.id)}
                      >
                        Delete
                      </Button>
                    </Group>
                  </Stack>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        )}
      </Stack>
    </Container>
  );
}
