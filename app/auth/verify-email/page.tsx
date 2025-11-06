'use client';

import Link from 'next/link';
import { IconMail, IconSchool } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Center,
  Loader,
  Alert,
  ActionIcon,
  Box
} from '@mantine/core';

export default function VerifyEmailPage() {
  const { t, language, changeLanguage, isLoaded } = useTranslation();

  // Show loading state while translations are loading
  if (!isLoaded) {
    return (
      <Center
        h="100vh"
        style={{
          background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)'
        }}
      >
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">{t('common.loading')}</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Center
      h="100vh"
      p="md"
      style={{
        background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)'
      }}
    >
      <Container size="xs" w="100%">
        {/* Logo and Title */}
        <Stack align="center" gap="lg" mb="xl">
          <Center>
            <IconSchool size={64} stroke={1.5} color="var(--mantine-primary-color-6)" />
          </Center>
          <Title order={1} size="h1" fw={700}>
            TEC LMS
          </Title>

          {/* Language Switcher */}
          <Group gap="xs" justify="center">
            <Button
              onClick={() => changeLanguage('en')}
              variant={language === 'en' ? 'filled' : 'light'}
              color={language === 'en' ? 'blue' : 'gray'}
              size="xs"
              fw={500}
            >
              EN
            </Button>
            <Button
              onClick={() => changeLanguage('km')}
              variant={language === 'km' ? 'filled' : 'light'}
              color={language === 'km' ? 'blue' : 'gray'}
              size="xs"
              fw={500}
            >
              ខ្មែរ
            </Button>
          </Group>
        </Stack>

        {/* Verification Message */}
        <Paper shadow="lg" p="xl" radius="md" withBorder>
          <Stack align="center" gap="lg">
            <Center
              w={80}
              h={80}
              style={{
                backgroundColor: 'var(--mantine-color-green-1)',
                borderRadius: '50%'
              }}
            >
              <IconMail size={48} stroke={1.5} color="var(--mantine-color-green-6)" />
            </Center>

            <Title order={2} size="h2" fw={700} ta="center">
              {t('auth.verification.checkEmail')}
            </Title>

            <Text c="dimmed" ta="center" size="md">
              {t('auth.verification.emailSent')}
            </Text>

            <Alert
              color="blue"
              variant="light"
              radius="md"
              w="100%"
            >
              <Text size="sm" c="blue.8">
                {t('auth.verification.spamNote')}
              </Text>
            </Alert>

            <Button
              component="a"
              href="/auth/login"
              size="md"
              fullWidth
              color="blue"
            >
              {t('auth.verification.backToLogin')}
            </Button>
          </Stack>
        </Paper>

        {/* Back to Home */}
        <Center mt="lg">
          <Button
            component="a"
            href="/"
            variant="subtle"
            color="gray"
            size="sm"
            leftSection={<Text size="sm">←</Text>}
          >
            {t('common.back')}
          </Button>
        </Center>
      </Container>
    </Center>
  );
}
