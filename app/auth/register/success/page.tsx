"use client";

import { useRouter } from "next/navigation";
import { IconCheck } from '@tabler/icons-react';
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Stack,
  Center,
  List,
  Alert
} from '@mantine/core';

export default function RegistrationSuccessPage() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <Center
      h="100vh"
      p="lg"
      style={{
        background: 'linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%)'
      }}
    >
      <Container size="xs" w="100%">
        <Paper shadow="lg" p="xl" radius="md" withBorder>
          <Stack align="center" gap="lg">
            {/* Success Icon */}
            <Center
              w={64}
              h={64}
              style={{
                backgroundColor: 'var(--mantine-color-green-1)',
                borderRadius: '50%'
              }}
            >
              <IconCheck size={32} stroke={2} color="var(--mantine-color-green-6)" />
            </Center>

            {/* Title */}
            <Title order={1} size="h1" fw={700} ta="center">
              {t('registration.success.title')}
            </Title>

            {/* Description */}
            <Text c="dimmed" ta="center" size="md">
              {t('registration.success.description')}
            </Text>

            {/* Next Steps Alert */}
            <Alert
              color="blue"
              variant="light"
              radius="md"
              w="100%"
            >
              <Stack gap="xs">
                <Text size="sm" fw={600} c="blue.8">
                  {t('registration.success.whatsNext')}
                </Text>
                <List size="sm" c="blue.7" spacing="xs">
                  <List.Item>{t('registration.success.step1')}</List.Item>
                  <List.Item>{t('registration.success.step2')}</List.Item>
                  <List.Item>{t('registration.success.step3')}</List.Item>
                </List>
              </Stack>
            </Alert>

            {/* Back to Login Button */}
            <Button
              onClick={() => router.push("/auth/login")}
              size="md"
              fullWidth
              color="blue"
              fw={600}
            >
              {t('registration.success.backToLogin')}
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Center>
  );
}
