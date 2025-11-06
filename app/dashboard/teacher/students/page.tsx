'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth/client-auth';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { FormModal, FormField } from '@/app/components/FormModal';
import {
  Container,
  Group,
  Button,
  Table,
  Alert,
  Badge,
  Text,
  Stack,
  Center,
  Title,
  Loader,
  Select,
} from '@mantine/core';
import {
} from '@tabler/icons-react';

interface Student {
  id: string;
  email: string;
  full_name: string;
  student_number: string;
  course_id: string;
  course_code: string;
  course_title: string;
  enrollment_status: string;
  current_grade: number;
  letter_grade: string;
  attendance_count: number;
}

interface Course {
  id: string;
  code: string;
  title: string;
}

interface GradeForm {
  studentId: string;
  courseId: string;
  score: number;
  letterGrade: string;
}

export default function TeacherStudentsPage() {
  const router = useRouter();
  const { t, isLoaded } = useTranslation();
  const [session, setSession] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [editingGrade, setEditingGrade] = useState<GradeForm | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const sess = getSession();
      if (!sess || sess.role !== 'teacher') {
        router.push('/auth/login');
        return;
      }
      setSession(sess);
      fetchCourses(sess.id);
      fetchStudents(sess.id, 'all');
    };

    if (isLoaded) {
      checkAuth();
    }
  }, [router, isLoaded]);

  const fetchCourses = async (teacherId: string) => {
    try {
      const response = await fetch(`/api/teacher/courses`, {
        headers: {
          'x-teacher-id': teacherId,
        },
      });
      if (!response.ok) throw new Error(t('errors.serverError'));
      const data = await response.json();
      setCourses(data.courses || []);
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  };

  const fetchStudents = async (teacherId: string, courseId: string) => {
    try {
      setLoading(true);
      setError(null);

      let url = `/api/teacher/students`;
      if (courseId && courseId !== 'all') {
        url += `?courseId=${courseId}`;
      }

      const response = await fetch(url, {
        headers: {
          'x-teacher-id': teacherId,
        },
      });
      if (!response.ok) throw new Error(t('errors.serverError'));
      const data = await response.json();
      setStudents(data.students || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCourseFilter = async (courseId: string) => {
    setSelectedCourse(courseId);
    await fetchStudents(session?.id || '', courseId);
  };

  const handleGradeEdit = (student: Student) => {
    setEditingGrade({
      studentId: student.id,
      courseId: student.course_id,
      score: student.current_grade,
      letterGrade: student.letter_grade,
    });
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGrade) return;

    try {
      setSubmitting(true);
      setError(null);
      const response = await fetch('/api/teacher/students', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-teacher-id': session?.id || '',
        },
        body: JSON.stringify({
          studentId: editingGrade.studentId,
          courseId: editingGrade.courseId,
          score: editingGrade.score,
          letterGrade: editingGrade.letterGrade,
        }),
      });

      if (!response.ok) throw new Error(t('messages.errorTryAgain'));

      // Update local state
      setStudents(
        students.map((s) =>
          s.id === editingGrade.studentId && s.course_id === editingGrade.courseId
            ? {
                ...s,
                current_grade: editingGrade.score,
                letter_grade: editingGrade.letterGrade,
              }
            : s
        )
      );

      setEditingGrade(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  // Get unique students (deduplicate by student ID)
  const filteredStudents =
    selectedCourse === 'all'
      ? students
      : students.filter((s) => s.course_id === selectedCourse);

  const uniqueStudents = Array.from(
    new Map(filteredStudents.map((s) => [s.id, s])).values()
  );

  if (loading || !isLoaded || !session) {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Loader />
      </Center>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', paddingTop: '24px' }}>
      <Container size="xl" py="xl">
        <Title order={2} mb="xl">
          {t('navigation.students')}
        </Title>
        {/* Error Message */}
        {error && (
          <Alert color="red" mb="lg">
            {error}
          </Alert>
        )}

        {/* Course Filter */}
        <Stack gap="md" mb="xl">
          <Stack gap="xs">
            <Text size="sm" fw={600}>{t('common.filter')} {t('assignments.course')}</Text>
            <Select
              placeholder={t('common.all')}
              data={[
                { value: 'all', label: `${t('common.all')} ${t('navigation.courses')}` },
                ...courses.map((c) => ({
                  value: c.id,
                  label: `${c.code} - ${c.title}`
                }))
              ]}
              value={selectedCourse}
              onChange={(value) => handleCourseFilter(value || 'all')}
              searchable
              clearable={false}
              style={{ maxWidth: '400px' }}
            />
          </Stack>
        </Stack>

        {/* Students Table */}
        {loading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : uniqueStudents.length === 0 ? (
          <Stack align="center" justify="center" style={{ minHeight: '300px' }}>
            <Text size="lg">{t('common.noResults')}</Text>
            <Text c="dimmed">{t('navigation.students')}</Text>
          </Stack>
        ) : (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('auth.register.firstName')} {t('auth.register.lastName')}</Table.Th>
                  <Table.Th>{t('auth.register.email')}</Table.Th>
                  <Table.Th>{t('attendance.student')} ID</Table.Th>
                  <Table.Th>{t('navigation.courses')}</Table.Th>
                  <Table.Th>{t('grades.grade')}</Table.Th>
                  <Table.Th>{t('attendance.title')}</Table.Th>
                  <Table.Th>{t('common.actions')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {uniqueStudents.map((student) => {
                  const studentCourses = filteredStudents.filter(
                    (s) => s.id === student.id
                  );

                  return (
                    <Table.Tr key={`${student.id}`}>
                      <Table.Td>
                        <Text size="sm" fw={500}>{student.full_name}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{student.email}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{student.student_number}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Stack gap={4}>
                          {studentCourses.map((course) => (
                            <Text key={course.course_id} size="xs">{course.course_code} - {course.course_title}</Text>
                          ))}
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={
                            student.current_grade >= 70
                              ? 'green'
                              : student.current_grade >= 50
                              ? 'yellow'
                              : 'red'
                          }
                        >
                          {student.current_grade > 0
                            ? `${student.current_grade}% (${student.letter_grade})`
                            : t('grades.notYetGraded')}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{student.attendance_count} {t('time.day')}s</Text>
                      </Table.Td>
                      <Table.Td>
                        <Button
                          onClick={() => handleGradeEdit(student)}
                          size="xs"
                          variant="light"
                        >
                          {t('common.edit')} {t('grades.grade')}
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </div>
        )}

        {/* Grade Form Modal */}
        <FormModal
          isOpen={!!editingGrade}
          onClose={() => setEditingGrade(null)}
          onSubmit={async (formData) => {
            // Convert form data to GradeForm format
            const gradeData: GradeForm = {
              studentId: editingGrade?.studentId || '',
              courseId: editingGrade?.courseId || '',
              score: formData.score,
              letterGrade: formData.letterGrade,
            };
            // Use existing handler
            await handleGradeSubmit({
              preventDefault: () => {},
            } as React.FormEvent);
          }}
          title={`${t('common.edit')} ${t('grades.grade')}`}
          fields={[
            {
              name: 'score',
              label: `${t('grades.score')} (0-100)`,
              type: 'number',
              required: true,
              min: 0,
              max: 100,
            },
            {
              name: 'letterGrade',
              label: t('grades.letterGrade'),
              type: 'select',
              options: [
                { value: 'A', label: t('grades.gradeScale_A') },
                { value: 'B', label: t('grades.gradeScale_B') },
                { value: 'C', label: t('grades.gradeScale_C') },
                { value: 'D', label: t('grades.gradeScale_D') },
                { value: 'F', label: t('grades.gradeScale_F') },
              ],
            },
          ]}
          initialData={editingGrade ? {
            score: editingGrade.score,
            letterGrade: editingGrade.letterGrade,
          } : null}
          isSubmitting={submitting}
          submitButtonLabel={submitting ? t('common.saving') : `${t('common.save')} ${t('grades.grade')}`}
          cancelButtonLabel={t('common.cancel')}
          t={t}
        />
      </Container>
    </div>
  );
}
