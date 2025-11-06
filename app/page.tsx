import Link from "next/link";
import {
  Container,
  Title,
  Text,
  Button,
  Paper,
  Group,
  SimpleGrid,
  Stack,
  Anchor
} from '@mantine/core';
import {
  IconSchool,
  IconBook,
  IconUsers,
  IconChartBar
} from '@tabler/icons-react';

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e0f2fe 0%, #c7d2fe 100%)' }}>
      {/* Header */}
      <Paper shadow="xs" p="md" mb="xl">
        <Container size="xl">
          <Group justify="space-between">
            <Group gap="xs">
              <IconSchool size={32} color="#0ea5e9" />
              <Title order={2}>ប្រព័ន្ធគ្រប់គ្រងការសិក្សា TEC</Title>
            </Group>
            <Link href="/auth/login">
              <Button>
                ចូលប្រើប្រាស់
              </Button>
            </Link>
          </Group>
        </Container>
      </Paper>

      {/* Hero Section */}
      <Container size="xl" py="xl">
        <Stack gap="xl">
          <Stack align="center" gap="md" mb="xl">
            <Title order={1} size={48} ta="center">
              ថ្នាក់រៀនដែលប្រើបច្ចេកវិទ្យាលើកកម្ពស់
            </Title>
            <Text size="xl" c="dimmed" ta="center">
              ប្រព័ន្ធគ្រប់គ្រងការសិក្សាទូលំទូលាយសម្រាប់ការអប់រំសម័យទំនើប
            </Text>
            <Group gap="md">
              <Link href="/auth/register">
                <Button size="lg">
                  ចាប់ផ្តើម
                </Button>
              </Link>
              <Button component="a" href="#features" variant="outline" size="lg">
                ស្វែងយល់បន្ថែម
              </Button>
            </Group>
          </Stack>

          {/* Features Grid */}
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} id="features" mt="xl">
            <FeatureCard
              icon={<IconBook size={48} />}
              title="ការគ្រប់គ្រងវគ្គសិក្សា"
              description="បង្កើត រៀបចំ និងផ្តល់មាតិកាវគ្គសិក្សាដែលទាក់ទាញយ៉ាងងាយស្រួល"
            />
            <FeatureCard
              icon={<IconUsers size={48} />}
              title="ព័ត៌មានសិស្ស"
              description="កំណត់ត្រាសិស្សទូលំទូលាយ និងការគ្រប់គ្រងការចុះឈ្មោះ"
            />
            <FeatureCard
              icon={<IconChartBar size={48} />}
              title="វិភាគ និងរបាយការណ៍"
              description="តាមដានវឌ្ឍនភាព និងការអនុវត្តជាមួយការវិភាគលម្អិត"
            />
            <FeatureCard
              icon={<IconSchool size={48} />}
              title="ឧបករណ៍វាយតម្លៃ"
              description="បង្កើតកម្រងសំណួរ ប្រឡង និងប្រព័ន្ធដាក់ពិន្ទុស្វ័យប្រវត្តិ"
            />
          </SimpleGrid>

          {/* Role Cards */}
          <Stack gap="xl" mt={80}>
            <Title order={2} ta="center">
              បង្កើតឡើងសម្រាប់គ្រប់គ្នា
            </Title>
            <SimpleGrid cols={{ base: 1, md: 3 }}>
              <RoleCard
                title="សិស្ស"
                description="ចូលប្រើវគ្គសិក្សា ដាក់ស្នើកិច្ចការ តាមដានវឌ្ឍនភាពរបស់អ្នក និងសហការជាមួយមិត្តភក្តិ"
                link="/dashboard/student"
              />
              <RoleCard
                title="គ្រូបង្រៀន"
                description="បង្កើតវគ្គសិក្សា គ្រប់គ្រងការវាយតម្លៃ ដាក់ពិន្ទុកិច្ចការ និងតាមដានការអនុវត្តរបស់សិស្ស"
                link="/dashboard/teacher"
              />
              <RoleCard
                title="អ្នកគ្រប់គ្រង"
                description="គ្រប់គ្រងស្ថាប័ន ត្រួតពិនិត្យប្រតិបត្តិការ បង្កើតរបាយការណ៍ និងកំណត់រចនាសម្ព័ន្ធប្រព័ន្ធ"
                link="/dashboard/admin"
              />
            </SimpleGrid>
          </Stack>
        </Stack>
      </Container>

      {/* Footer */}
      <Paper shadow="xs" p="lg" mt={80}>
        <Text ta="center" c="dimmed">
          © 2024 ប្រព័ន្ធគ្រប់គ្រងការសិក្សា TEC។ រក្សាសិទ្ធិគ្រប់យ៉ាង។
        </Text>
      </Paper>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Paper shadow="sm" p="xl" radius="md" style={{ transition: 'box-shadow 0.2s', cursor: 'default' }}>
      <Stack gap="md">
        <div style={{ color: '#0ea5e9' }}>{icon}</div>
        <Title order={3}>{title}</Title>
        <Text c="dimmed">{description}</Text>
      </Stack>
    </Paper>
  );
}

function RoleCard({
  title,
  description,
  link,
}: {
  title: string;
  description: string;
  link: string;
}) {
  return (
    <Paper shadow="sm" p="xl" radius="md" style={{ transition: 'box-shadow 0.2s' }}>
      <Stack gap="md">
        <Title order={3}>{title}</Title>
        <Text c="dimmed">{description}</Text>
        <Anchor component="a" href={link} fw={600}>
          ស្វែងយល់បន្ថែម →
        </Anchor>
      </Stack>
    </Paper>
  );
}
