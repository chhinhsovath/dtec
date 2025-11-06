'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  TextInput,
  Textarea,
  Select,
  Button,
  Group,
  Stack,
} from '@mantine/core';
import { IconX } from '@tabler/icons-react';

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'date' | 'datetime-local';
  placeholder?: string;
  required?: boolean;
  rows?: number;
  options?: Array<{ value: string; label: string }>;
  pattern?: string;
  min?: number | string;
  max?: number | string;
}

export interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: Record<string, any>) => Promise<void>;
  title: string;
  fields: FormField[];
  initialData?: Record<string, any> | null;
  isEditing?: boolean;
  isSubmitting?: boolean;
  submitButtonLabel?: string;
  cancelButtonLabel?: string;
  t: (key: string) => string;
}

export function FormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  fields,
  initialData,
  isEditing = false,
  isSubmitting = false,
  submitButtonLabel = 'Save',
  cancelButtonLabel = 'Cancel',
  t,
}: FormModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      const initialForm: Record<string, any> = {};
      fields.forEach((field) => {
        initialForm[field.name] = field.type === 'number' ? 0 : '';
      });
      setFormData(initialForm);
    }
    setErrors({});
  }, [initialData, isOpen, fields]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach((field) => {
      const value = formData[field.name];

      if (field.required && (!value || value.toString().trim() === '')) {
        newErrors[field.name] = t('common.requiredField');
        return;
      }

      if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          newErrors[field.name] = 'Invalid email address';
        }
      }

      if (field.type === 'number') {
        const numValue = Number(value);
        if (field.min !== undefined && numValue < Number(field.min)) {
          newErrors[field.name] = `Must be at least ${field.min}`;
        }
        if (field.max !== undefined && numValue > Number(field.max)) {
          newErrors[field.name] = `Must be at most ${field.max}`;
        }
      }
    });

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

  const renderField = (field: FormField) => {
    const baseProps = {
      label: field.label,
      placeholder: field.placeholder,
      value: formData[field.name] || '',
      onChange: (e: any) => {
        const value = e.target ? e.target.value : e;
        setFormData({ ...formData, [field.name]: value });
        if (errors[field.name]) setErrors({ ...errors, [field.name]: '' });
      },
      error: errors[field.name],
      disabled: isSubmitting,
      required: field.required,
    };

    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            key={field.name}
            {...baseProps}
            rows={field.rows || 4}
          />
        );
      case 'select':
        return (
          <Select
            key={field.name}
            {...baseProps}
            data={field.options || []}
            searchable
            clearable
          />
        );
      case 'email':
        return (
          <TextInput
            key={field.name}
            {...baseProps}
            type="email"
          />
        );
      case 'password':
        return (
          <TextInput
            key={field.name}
            {...baseProps}
            type="password"
          />
        );
      case 'number':
        return (
          <TextInput
            key={field.name}
            {...baseProps}
            type="number"
            min={field.min}
            max={field.max}
          />
        );
      case 'date':
        return (
          <TextInput
            key={field.name}
            {...baseProps}
            type="date"
          />
        );
      case 'datetime-local':
        return (
          <TextInput
            key={field.name}
            {...baseProps}
            type="datetime-local"
          />
        );
      default:
        return (
          <TextInput
            key={field.name}
            {...baseProps}
            type="text"
          />
        );
    }
  };

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={title}
      size="lg"
      centered
      closeButtonProps={{ icon: <IconX size={18} /> }}
      closeOnClickOutside={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="lg">
          {fields.map((field) => renderField(field))}

          <Group justify="flex-end" gap="sm">
            <Button
              variant="light"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {cancelButtonLabel}
            </Button>
            <Button
              type="submit"
              color="green"
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              {submitButtonLabel}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
