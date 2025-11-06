'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Title,
  Text,
  Card,
  Loader,
  Center,
  Stack,
  Group,
  Alert,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconAlertCircle,
} from '@tabler/icons-react';
import { getSession, AuthUser } from '@/lib/auth/client-auth';
import { Button } from '@mantine/core';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function MentorProfilePage() {
  const { language } = useTranslation();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        const session = getSession();

        if (!session) {
          router.push('/auth/login');
          return;
        }

        if (session.role !== 'teacher' && session.role !== 'admin') {
          router.push(`/dashboard/${session.role}`);
          return;
        }

        setUser(session);
        setLoading(false);
      } catch (err) {
        console.error('Error loading profile:', err);
        setError(err instanceof Error ? err.message : (language === 'km' ? 'មិនអាចផ្ទុកប្រវត្តិរូបបាន' : 'Failed to load profile'));
        setLoading(false);
      }
    };

    loadData();
  }, [router, language]);

  if (loading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  if (error) {
    return (
      <Container size="lg" py="xl">
        <Alert icon={<IconAlertCircle />} color="red" title={language === 'km' ? 'កំហុស' : 'Error'}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      {/* Header */}
      <Group mb="xl">
        <Button
          variant="default"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => router.back()}
        >
          {language === 'km' ? 'ត្រឡប់ក្រោយ' : 'Back'}
        </Button>
        <div style={{ flex: 1 }}>
          <Title order={1}>
            {language === 'km' ? 'ប្រវត្តិរូបគ្រូបង្រៀន' : 'Mentor Profile'}
          </Title>
          <Text c="dimmed">
            {language === 'km' ? 'ព័ត៌មានគណនីគ្រូបង្រៀនរបស់អ្នក' : 'Your mentor account information'}
          </Text>
        </div>
      </Group>

      {/* Profile Card */}
      <Card withBorder p="lg" radius="md">
        <Title order={3} mb="lg">
          {language === 'km' ? 'ព័ត៌មានគណនី' : 'Account Information'}
        </Title>

        <Stack gap="md">
          <div>
            <Text fw={500} size="sm" c="dimmed">
              {language === 'km' ? 'ឈ្មោះ' : 'Name'}
            </Text>
            <Text size="lg">{user?.full_name || (language === 'km' ? 'មិនមាន' : 'N/A')}</Text>
          </div>

          <div>
            <Text fw={500} size="sm" c="dimmed">
              {language === 'km' ? 'អ៊ីមែល' : 'Email'}
            </Text>
            <Text size="lg">{user?.email || (language === 'km' ? 'មិនមាន' : 'N/A')}</Text>
          </div>

          <div>
            <Text fw={500} size="sm" c="dimmed">
              {language === 'km' ? 'តួនាទី' : 'Role'}
            </Text>
            <Text size="lg">
              {language === 'km' ? 'គ្រូបង្រៀន' : 'Mentor'}
            </Text>
          </div>

          <div>
            <Text fw={500} size="sm" c="dimmed">
              {language === 'km' ? 'លេខសម្គាល់អ្នកប្រើប្រាស់' : 'User ID'}
            </Text>
            <Text size="lg" style={{ fontFamily: 'monospace' }}>
              {user?.id || (language === 'km' ? 'មិនមាន' : 'N/A')}
            </Text>
          </div>
        </Stack>
      </Card>

      {/* Pedagogy LMS Information */}
      <Card withBorder p="lg" radius="md" mt="xl">
        <Title order={3} mb="lg">
          {language === 'km' ? 'តួនាទីក្នុងប្រព័ន្ធគ្រប់គ្រងការសិក្សា' : 'Pedagogy LMS Role'}
        </Title>

        <Alert color="blue" title={language === 'km' ? 'តួនាទីគ្រូបង្រៀន' : 'Mentor Role'}>
          {language === 'km' ? (
            <>
              ក្នុងនាមជាគ្រូបង្រៀនក្នុងប្រព័ន្ធគ្រប់គ្រងការសិក្សា អ្នកមានទំនួលខុសត្រូវចំពោះ៖
              <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                <li>វាយតម្លៃកម្រិតសមត្ថភាពរបស់និស្សិតបញ្ចប់ការសិក្សា (មាត្រដ្ឋាន ១-៥)</li>
                <li>ពិនិត្យនិងផ្តល់មតិយោបល់លើផលប័ត្ររបស់សិស្ស</li>
                <li>កំណត់ពេលវេលានិងធ្វើវគ្គដឹកនាំ</li>
                <li>តាមដានវឌ្ឍនភាពរបស់សិស្សឆ្ពោះទៅរកវិញ្ញាបនបត្រ</li>
                <li>គាំទ្រសិស្សក្នុងការសម្រេចតម្រូវការសមត្ថភាព ១០ ឬច្រើនជាងនេះ</li>
              </ul>
            </>
          ) : (
            <>
              As a mentor in the Pedagogy LMS, you are responsible for:
              <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                <li>Assessing graduate students' competency levels (1-5 scale)</li>
                <li>Reviewing and providing feedback on student portfolios</li>
                <li>Scheduling and conducting mentorship sessions</li>
                <li>Tracking student progress toward certification</li>
                <li>Supporting students in achieving 10+ competency requirements</li>
              </ul>
            </>
          )}
        </Alert>
      </Card>
    </Container>
  );
}
