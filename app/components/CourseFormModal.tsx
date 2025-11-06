'use client';

import React, { useState, useEffect } from 'react';
import { Modal, TextInput, Textarea, Button, Group, Stack } from '@mantine/core';
import { IconX } from '@tabler/icons-react';

interface CourseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: CourseFormData) => Promise<void>;
  initialData?: CourseFormData | null;
  isEditing?: boolean;
  isSubmitting?: boolean;
  t: (key: string) => string;
}

export interface CourseFormData {
  code: string;
  name: string;
  description: string;
}

export function CourseFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
  isSubmitting = false,
  t,
}: CourseFormModalProps) {
  const [formData, setFormData] = useState<CourseFormData>({
    code: '',
    name: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ code: '', name: '', description: '' });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = t('common.requiredField');
    }
    if (!formData.name.trim()) {
      newErrors.name = t('common.requiredField');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      // Error handling done by parent
    }
  };

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={`${isEditing ? t('common.edit') : t('common.create')} ${t('navigation.course')}`}
      size="lg"
      centered
      closeButtonProps={{ icon: <IconX size={18} /> }}
      closeOnClickOutside={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="lg">
          <TextInput
            label={t('dashboard.teacher.courseCode')}
            placeholder="e.g., CS101"
            value={formData.code}
            onChange={(e) => {
              setFormData({ ...formData, code: e.target.value });
              if (errors.code) setErrors({ ...errors, code: '' });
            }}
            error={errors.code}
            required
            disabled={isSubmitting}
          />

          <TextInput
            label={t('dashboard.teacher.courseName')}
            placeholder={t('dashboard.teacher.courseNamePlaceholder')}
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (errors.name) setErrors({ ...errors, name: '' });
            }}
            error={errors.name}
            required
            disabled={isSubmitting}
          />

          <Textarea
            label={t('common.description')}
            placeholder={t('dashboard.teacher.courseDescriptionPlaceholder')}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={4}
            disabled={isSubmitting}
          />

          <Group justify="flex-end" gap="sm">
            <Button
              variant="light"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              color="green"
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              {isSubmitting ? t('common.saving') : t('common.save')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
