'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithPassword, setSession } from '@/lib/auth/client-auth';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  Container,
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Title,
  Text,
  Group,
  Anchor,
  Checkbox,
  Stack,
  Alert,
  Center,
  Loader,
  SimpleGrid,
  Tabs,
  Badge,
  Card,
  ThemeIcon,
  Tooltip
} from '@mantine/core';
import { IconSchool, IconBookmarks, IconUser, IconUsers, IconClipboardCheck, IconAward } from '@tabler/icons-react';

export default function LoginPage() {
  const { t, language, changeLanguage, isLoaded } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user, error: authError } = await signInWithPassword(email, password);

      if (authError) throw authError;

      if (user) {
        // Store session in localStorage
        setSession(user);

        // Redirect based on role
        router.push(`/dashboard/${user.role}`);
      }
    } catch (error: any) {
      setError(error.message || t('messages.errorTryAgain'));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPassword: string = 'demo@123') => {
    setError('');
    setLoading(true);

    try {
      const { user, error: authError } = await signInWithPassword(demoEmail, demoPassword);

      if (authError) throw authError;

      if (user) {
        setSession(user);
        router.push(`/dashboard/${user.role}`);
      }
    } catch (error: any) {
      setError(error.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while translations are loading
  if (!isLoaded) {
    return (
      <Center
        h="100vh"
        style={{
          background: 'linear-gradient(135deg, #e0f2fe 0%, #c7d2fe 100%)'
        }}
      >
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #e0f2fe 0%, #c7d2fe 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: 'Hanuman, sans-serif'
      }}
    >
      <Container size="sm" style={{ width: '100%', maxWidth: '500px' }}>
        <Stack gap="xl">
          {/* Logo and Title */}
          <Stack align="center" gap="md">
            <IconSchool size={72} color="#0ea5e9" />
            <div style={{ textAlign: 'center' }}>
              <Title
                order={1}
                ta="center"
                style={{
                  fontFamily: 'Hanuman, sans-serif',
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: '#1e293b'
                }}
              >
                {t('auth.login.title')}
              </Title>
              <Text
                c="dimmed"
                ta="center"
                style={{
                  fontFamily: 'Hanuman, sans-serif',
                  fontSize: '0.95rem',
                  marginTop: '0.5rem'
                }}
              >
                {t('auth.login.subtitle')}
              </Text>
            </div>

            {/* Language Switcher */}
            <Group gap="xs" mt="xs">
              <Button
                variant={language === 'en' ? 'filled' : 'light'}
                size="xs"
                onClick={() => changeLanguage('en')}
                style={{ fontFamily: 'Hanuman, sans-serif' }}
              >
                EN
              </Button>
              <Button
                variant={language === 'km' ? 'filled' : 'light'}
                size="xs"
                onClick={() => changeLanguage('km')}
                style={{ fontFamily: 'Hanuman, sans-serif' }}
              >
                ខ្មែរ
              </Button>
            </Group>
          </Stack>

          {/* Login Form */}
          <Paper shadow="lg" p="xl" radius="md" style={{ fontFamily: 'Hanuman, sans-serif' }}>
            <form onSubmit={handleLogin}>
              <Stack gap="md">
                {error && (
                  <Alert
                    color="red"
                    title="Error"
                    style={{ fontFamily: 'Hanuman, sans-serif' }}
                  >
                    <Text style={{ fontFamily: 'Hanuman, sans-serif' }}>
                      {error}
                    </Text>
                  </Alert>
                )}

                <TextInput
                  label={t('auth.login.email')}
                  placeholder={t('auth.login.emailPlaceholder')}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  styles={{
                    label: {
                      fontFamily: 'Hanuman, sans-serif',
                      fontSize: '0.95rem',
                      fontWeight: 500,
                      color: '#334155'
                    },
                    input: {
                      fontFamily: 'Hanuman, sans-serif'
                    }
                  }}
                />

                <PasswordInput
                  label={t('auth.login.password')}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  styles={{
                    label: {
                      fontFamily: 'Hanuman, sans-serif',
                      fontSize: '0.95rem',
                      fontWeight: 500,
                      color: '#334155'
                    },
                    input: {
                      fontFamily: 'Hanuman, sans-serif'
                    }
                  }}
                />

                <Group justify="space-between">
                  <Checkbox
                    label={t('auth.login.rememberMe')}
                    size="sm"
                    styles={{
                      label: {
                        fontFamily: 'Hanuman, sans-serif',
                        fontSize: '0.9rem'
                      }
                    }}
                  />
                  <Anchor
                    component="a"
                    href="/auth/forgot-password"
                    size="sm"
                    style={{ fontFamily: 'Hanuman, sans-serif' }}
                  >
                    {t('auth.login.forgotPassword')}
                  </Anchor>
                </Group>

                <Button
                  type="submit"
                  fullWidth
                  loading={loading}
                  size="lg"
                  style={{ fontFamily: 'Hanuman, sans-serif' }}
                >
                  {loading ? t('auth.login.loggingIn') : t('auth.login.loginButton')}
                </Button>
              </Stack>
            </form>

            <Text
              ta="center"
              mt="md"
              size="sm"
              style={{ fontFamily: 'Hanuman, sans-serif' }}
            >
              {t('auth.login.noAccount')}{' '}
              <Anchor
                component="a"
                href="/auth/register"
                fw={600}
                style={{ fontFamily: 'Hanuman, sans-serif' }}
              >
                {t('auth.login.registerLink')}
              </Anchor>
            </Text>

            {/* Demo Login Section - Organized by Platform */}
            <Stack
              gap="md"
              mt="xl"
              pt="xl"
              style={{
                borderTop: '1px solid #e9ecef',
                fontFamily: 'Hanuman, sans-serif'
              }}
            >
              <Text
                size="sm"
                fw={700}
                ta="center"
                style={{
                  fontFamily: 'Hanuman, sans-serif',
                  fontSize: '1rem',
                  color: '#1e293b'
                }}
              >
                {t('auth.login.demoAccounts')} - Password: <code style={{ fontFamily: 'monospace' }}>demo@123</code>
              </Text>

              <Tabs defaultValue="pedagogy" variant="pills">
                <Tabs.List grow>
                  <Tabs.Tab
                    value="pedagogy"
                    leftSection={<IconBookmarks size={14} />}
                    style={{ fontFamily: 'Hanuman, sans-serif' }}
                  >
                    Pedagogy LMS
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="k12"
                    leftSection={<IconSchool size={14} />}
                    style={{ fontFamily: 'Hanuman, sans-serif' }}
                  >
                    K-12 LMS
                  </Tabs.Tab>
                </Tabs.List>

                {/* Pedagogy LMS Demo Accounts */}
                <Tabs.Panel value="pedagogy" pt="md">
                  <Stack gap="sm">
                    <Text
                      size="xs"
                      c="dimmed"
                      ta="center"
                      fw={500}
                      mb="xs"
                      style={{ fontFamily: 'Hanuman, sans-serif' }}
                    >
                      Contract Teacher Training Program
                    </Text>
                    <SimpleGrid cols={2} spacing="sm">
                      <Tooltip label="View competencies, teaching hours, portfolio, and certification progress">
                        <Button
                          variant="light"
                          color="cyan"
                          size="sm"
                          onClick={() => handleDemoLogin('student@pedagogy.edu')}
                          disabled={loading}
                          fullWidth
                          style={{ fontFamily: 'Hanuman, sans-serif' }}
                        >
                          <IconBookmarks size={16} style={{ marginRight: '0.5rem' }} />
                          Graduate Student
                        </Button>
                      </Tooltip>
                      <Tooltip label="Assess competencies, review portfolios, manage mentorship sessions">
                        <Button
                          variant="light"
                          color="lime"
                          size="sm"
                          onClick={() => handleDemoLogin('mentor@pedagogy.edu')}
                          disabled={loading}
                          fullWidth
                          style={{ fontFamily: 'Hanuman, sans-serif' }}
                        >
                          <IconClipboardCheck size={16} style={{ marginRight: '0.5rem' }} />
                          Mentor
                        </Button>
                      </Tooltip>
                      <div style={{ gridColumn: 'span 2' }}>
                        <Tooltip label="Manage students, mentors, certifications, and program reports">
                          <Button
                            variant="light"
                            color="grape"
                            size="sm"
                            onClick={() => handleDemoLogin('coordinator@pedagogy.edu')}
                            disabled={loading}
                            fullWidth
                            style={{ fontFamily: 'Hanuman, sans-serif' }}
                          >
                            <IconUsers size={16} style={{ marginRight: '0.5rem' }} />
                            Coordinator
                          </Button>
                        </Tooltip>
                      </div>
                    </SimpleGrid>
                  </Stack>
                </Tabs.Panel>

                {/* K-12 LMS Demo Accounts */}
                <Tabs.Panel value="k12" pt="md">
                  <Stack gap="sm">
                    <Text
                      size="xs"
                      c="dimmed"
                      ta="center"
                      fw={500}
                      mb="xs"
                      style={{ fontFamily: 'Hanuman, sans-serif' }}
                    >
                      Traditional Learning Management System
                    </Text>
                    <SimpleGrid cols={2} spacing="sm">
                      <Tooltip label="View courses, grades, assignments, and attendance">
                        <Button
                          variant="light"
                          color="blue"
                          size="sm"
                          onClick={() => handleDemoLogin('student@test.com')}
                          disabled={loading}
                          fullWidth
                          style={{ fontFamily: 'Hanuman, sans-serif' }}
                        >
                          <IconUser size={16} style={{ marginRight: '0.5rem' }} />
                          Student
                        </Button>
                      </Tooltip>
                      <Tooltip label="Manage classes, grade students, track attendance">
                        <Button
                          variant="light"
                          color="green"
                          size="sm"
                          onClick={() => handleDemoLogin('teacher@test.com')}
                          disabled={loading}
                          fullWidth
                          style={{ fontFamily: 'Hanuman, sans-serif' }}
                        >
                          <IconSchool size={16} style={{ marginRight: '0.5rem' }} />
                          Teacher
                        </Button>
                      </Tooltip>
                      <Tooltip label="View child progress and attendance">
                        <Button
                          variant="light"
                          color="orange"
                          size="sm"
                          onClick={() => handleDemoLogin('parent@test.com')}
                          disabled={loading}
                          fullWidth
                          style={{ fontFamily: 'Hanuman, sans-serif' }}
                        >
                          👨‍👩‍👧 Parent
                        </Button>
                      </Tooltip>
                      <Tooltip label="Full system access and administration">
                        <Button
                          variant="light"
                          color="red"
                          size="sm"
                          onClick={() => handleDemoLogin('admin@test.com')}
                          disabled={loading}
                          fullWidth
                          style={{ fontFamily: 'Hanuman, sans-serif' }}
                        >
                          <IconAward size={16} style={{ marginRight: '0.5rem' }} />
                          Admin
                        </Button>
                      </Tooltip>
                    </SimpleGrid>
                  </Stack>
                </Tabs.Panel>
              </Tabs>

              <Alert
                color="blue"
                title="Demo Account Info"
                icon={<IconSchool size={16} />}
                style={{ fontFamily: 'Hanuman, sans-serif' }}
              >
                <Stack gap="xs" style={{ fontSize: '0.9rem', fontFamily: 'Hanuman, sans-serif' }}>
                  <Text style={{ fontFamily: 'Hanuman, sans-serif' }}>
                    <strong>Pedagogy LMS:</strong> Contract teacher training and certification platform
                  </Text>
                  <Text style={{ fontFamily: 'Hanuman, sans-serif' }}>
                    <strong>K-12 LMS:</strong> Traditional school learning management system
                  </Text>
                </Stack>
              </Alert>
            </Stack>
          </Paper>

          {/* Back to Home */}
          <Center>
            <Anchor
              component="a"
              href="/"
              size="sm"
              style={{ fontFamily: 'Hanuman, sans-serif' }}
            >
              ← {t('common.back')}
            </Anchor>
          </Center>
        </Stack>
      </Container>
    </div>
  );
}
