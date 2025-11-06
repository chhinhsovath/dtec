"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  Container,
  Paper,
  TextInput,
  Button,
  Alert,
  Title,
  Text,
  Group,
  Stack,
  Grid,
  Center,
  Loader,
  Progress,
  Badge,
  List,
} from "@mantine/core";

interface RegistrationStatus {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  status: string;
  submitted_at?: string;
  current_step: number;
  rejection_reason?: string;
  institution_name?: string;
}

export default function RegistrationStatusPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registration, setRegistration] = useState<RegistrationStatus | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError(t('registration.status.emailRequired'));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSearched(true);

      const response = await fetch(
        `/api/registrations?status=pending&status=approved&status=rejected&status=completed&limit=1000`
      );
      if (!response.ok) throw new Error(t('registration.status.notFound'));

      const data = await response.json();
      const found = data.data?.find((r: any) => r.email.toLowerCase() === email.toLowerCase());

      if (!found) {
        setError(t('registration.status.notFound'));
        setRegistration(null);
        return;
      }

      setRegistration(found);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('registration.status.notFound'));
      setRegistration(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return "⏳";
      case "approved":
        return "✅";
      case "rejected":
        return "❌";
      case "completed":
        return "🎓";
      default:
        return "❓";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "yellow";
      case "approved":
        return "green";
      case "rejected":
        return "red";
      case "completed":
        return "blue";
      default:
        return "gray";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return t('registration.status.pending.title');
      case "approved":
        return "ឆ្លោកឈានចិត្ត! ពាក្យស្នើសុំរបស់អ្នកបានឯកភាព។ អ្នកឥឡូវអាចបន្តឈានដល់ការចុះឈ្មោះ។";
      case "rejected":
        return "ពាក្យស្នើសុំរបស់អ្នកមិនបានឯកភាព។ សូមពិនិត្យមតិយោបល់ខាងក្រោម។";
      case "completed":
        return "ពាក្យស្នើសុំរបស់អ្នកបានបញ្ចប់ដូច្នេះហើយ អ្នកឥឡូវបានចុះឈ្មោះ។";
      default:
        return t('messages.unknown');
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(to bottom right, rgb(240, 249, 255), rgb(224, 242, 254))", padding: 32 }}>
      <Container size="sm">
        <Stack gap="xl">
          {/* Header */}
          <Stack gap="xs">
            <Title order={1}>{t('registration.status.title')}</Title>
            <Text c="dimmed">{t('registration.status.subtitle')}</Text>
          </Stack>

          {/* Search Form - Initial State */}
          {!registration && !searched && (
            <Paper shadow="md" p="xl" radius="md">
              <form onSubmit={handleSearch}>
                <Stack gap="md">
                  <div>
                    <Text component="label" size="sm" fw={600} mb="xs">
                      {t('registration.status.emailLabel')} <span style={{ color: "red" }}>*</span>
                    </Text>
                    <TextInput
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('registration.status.emailPlaceholder')}
                    />
                  </div>

                  {error && <Alert color="red">{error}</Alert>}

                  <Button
                    type="submit"
                    disabled={loading}
                    loading={loading}
                    fullWidth
                  >
                    {loading ? t('registration.status.searching') : t('registration.status.checkButton')}
                  </Button>

                  <Stack gap="xs" pt="md" style={{ borderTop: "1px solid #e9ecef" }}>
                    <Text size="sm" c="dimmed">{t('registration.status.readyToApply')}</Text>
                    <Button
                      onClick={() => router.push("/auth/register")}
                      variant="light"
                      color="green"
                      fullWidth
                    >
                      {t('registration.status.newApplication')}
                    </Button>
                  </Stack>
                </Stack>
              </form>
            </Paper>
          )}

          {/* Not Found State */}
          {searched && !registration && error && (
            <Paper shadow="md" p="xl" radius="md">
              <Stack align="center" gap="md" py="xl">
                <Text size="xl">🔍</Text>
                <Title order={2}>{t('registration.status.applicationNotFound')}</Title>
                <Text c="dimmed" ta="center">{error}</Text>

                <Group grow>
                  <Button
                    onClick={() => {
                      setSearched(false);
                      setEmail("");
                      setError(null);
                    }}
                  >
                    {t('registration.status.tryAgain')}
                  </Button>
                  <Button
                    onClick={() => router.push("/auth/register")}
                    color="green"
                  >
                    {t('registration.status.newApplication')}
                  </Button>
                </Group>
              </Stack>
            </Paper>
          )}

          {/* Status Display */}
          {registration && (
            <Stack gap="lg">
              {/* Status Card */}
              <Paper shadow="md" p="xl" radius="md" style={{ backgroundColor: `var(--mantine-color-${getStatusColor(registration.status)}-0)` }}>
                <Group align="flex-start" gap="lg">
                  <Text size="xl" fw={700}>{getStatusIcon(registration.status)}</Text>
                  <Stack gap="xs" flex={1}>
                    <Title order={2}>{registration.first_name} {registration.last_name}</Title>
                    <Text size="sm" c="dimmed">{registration.email}</Text>
                    <Group gap="sm">
                      <Text fw={600}>{t('registration.status.status')}</Text>
                      <Badge color={getStatusColor(registration.status)} size="lg">
                        {registration.status}
                      </Badge>
                    </Group>
                    <Text>{getStatusText(registration.status)}</Text>
                  </Stack>
                </Group>
              </Paper>

              {/* Details Card */}
              <Paper shadow="md" p="xl" radius="md">
                <Stack gap="lg">
                  <Title order={3}>{t('registration.status.applicationDetails')}</Title>

                  {/* Info Grid */}
                  <Grid gutter="md">
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Stack gap="xs">
                        <Text size="sm" c="dimmed">{t('registration.status.institution')}</Text>
                        <Text fw={600}>{registration.institution_name || t('registration.status.notSpecified')}</Text>
                      </Stack>
                    </Grid.Col>

                    {registration.submitted_at && (
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Stack gap="xs">
                          <Text size="sm" c="dimmed">{t('registration.status.submittedDate')}</Text>
                          <Text fw={600}>
                            {new Date(registration.submitted_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </Text>
                        </Stack>
                      </Grid.Col>
                    )}

                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Stack gap="xs">
                        <Text size="sm" c="dimmed">{t('registration.status.applicationProgress')}</Text>
                        <Group gap="sm">
                          <Progress
                            value={(registration.current_step / 3) * 100}
                            style={{ flex: 1 }}
                          />
                          <Text size="sm" fw={600}>{registration.current_step}{t('registration.status.progressOf')}</Text>
                        </Group>
                      </Stack>
                    </Grid.Col>
                  </Grid>

                  {/* Status-Specific Information */}
                  {registration.status === "pending" && (
                    <Alert color="blue" title={t('registration.status.pending.title')}>
                      <List type="ordered" size="sm" spacing="xs">
                        <List.Item>{t('registration.status.pending.step1')}</List.Item>
                        <List.Item>{t('registration.status.pending.step2')}</List.Item>
                        <List.Item>{t('registration.status.pending.step3')}</List.Item>
                      </List>
                    </Alert>
                  )}

                  {registration.status === "approved" && (
                    <Stack gap="md">
                      <Alert color="green" title={t('registration.status.approved.title')}>
                        <List type="ordered" size="sm" spacing="xs">
                          <List.Item>{t('registration.status.approved.step1')}</List.Item>
                          <List.Item>{t('registration.status.approved.step2')}</List.Item>
                          <List.Item>{t('registration.status.approved.step3')}</List.Item>
                        </List>
                      </Alert>
                      <Button
                        onClick={() => router.push("/auth/login")}
                        color="green"
                        fullWidth
                      >
                        {t('registration.status.approved.goToLogin')}
                      </Button>
                    </Stack>
                  )}

                  {registration.status === "rejected" && registration.rejection_reason && (
                    <Stack gap="md">
                      <Alert color="red" title={t('registration.status.rejected.title')}>
                        <Paper p="sm" bg="white" style={{ border: "1px solid #ffa8a8" }}>
                          <Text size="sm">{registration.rejection_reason}</Text>
                        </Paper>
                        <Text size="sm" mt="sm">{t('registration.status.rejected.feedback')}</Text>
                      </Alert>
                      <Button
                        onClick={() => router.push("/auth/register")}
                        color="red"
                        fullWidth
                      >
                        {t('registration.status.rejected.submitNew')}
                      </Button>
                    </Stack>
                  )}

                  {registration.status === "completed" && (
                    <Stack gap="md">
                      <Alert color="blue" title={t('registration.status.completed.title')}>
                        {t('registration.status.completed.message')}
                      </Alert>
                      <Button
                        onClick={() => router.push("/auth/login")}
                        color="blue"
                        fullWidth
                      >
                        {t('registration.status.completed.goToDashboard')}
                      </Button>
                    </Stack>
                  )}
                </Stack>
              </Paper>

              {/* Check Another Email Link */}
              <Center>
                <Button
                  onClick={() => {
                    setSearched(false);
                    setEmail("");
                    setError(null);
                    setRegistration(null);
                  }}
                  variant="subtle"
                >
                  {t('registration.status.checkAnotherEmail')}
                </Button>
              </Center>
            </Stack>
          )}
        </Stack>
      </Container>
    </div>
  );
}
