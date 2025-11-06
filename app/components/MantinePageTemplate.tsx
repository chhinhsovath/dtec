'use client';

/**
 * Reusable Mantine Page Template
 * This component provides a consistent header and layout for all pages
 * Use this as a wrapper for all dashboard pages
 */

import { Container, Group, Button, Title, Stack, Header as MantineHeader } from '@mantine/core';
import { IconLogout } from '@tabler/icons-react';
import React from 'react';

interface PageTemplateProps {
  title: string;
  children: React.ReactNode;
  onLogout: () => void;
  language: string;
  onLanguageChange: (lang: 'en' | 'km') => void;
  t: (key: string) => string;
}

export function MantinePageTemplate({
  title,
  children,
  onLogout,
  language,
  onLanguageChange,
  t,
}: PageTemplateProps) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Container size="xl" py="md">
          <Group justify="space-between" align="center">
            <Title order={1}>{title}</Title>
            <Group gap="md">
              <Group gap="xs">
                <Button
                  onClick={() => onLanguageChange('en')}
                  variant={language === 'en' ? 'filled' : 'light'}
                  size="xs"
                >
                  EN
                </Button>
                <Button
                  onClick={() => onLanguageChange('km')}
                  variant={language === 'km' ? 'filled' : 'light'}
                  size="xs"
                >
                  ខ្មែរ
                </Button>
              </Group>
              <Button
                onClick={onLogout}
                color="red"
                leftSection={<IconLogout size={16} />}
              >
                {t('common.logout')}
              </Button>
            </Group>
          </Group>
        </Container>
      </div>

      {/* Main Content */}
      <Container size="xl" py="xl">
        {children}
      </Container>
    </div>
  );
}
