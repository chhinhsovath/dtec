'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Text, Box, Group, Menu, Avatar, Divider, Badge } from '@mantine/core';
import { IconLogout, IconUser, IconSettings, IconLanguage } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { AuthUser, clearSession } from '@/lib/auth/client-auth';

interface NavbarProps {
  user: AuthUser | null;
}

export function DashboardNavbar({ user }: NavbarProps) {
  const router = useRouter();
  const { language, changeLanguage, t } = useTranslation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      clearSession();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, { en: string; km: string }> = {
      student: { en: 'Student', km: 'សិស្ស' },
      teacher: { en: 'Teacher', km: 'គ្រូ' },
      admin: { en: 'Administrator', km: 'អ្នកគ្រប់គ្រង' },
      parent: { en: 'Parent', km: 'ឪពុកម្តាយ' },
    };
    return language === 'km'
      ? roleLabels[role]?.km || role
      : roleLabels[role]?.en || role;
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Box
      style={{
        height: 70,
        padding: '0 24px',
        borderBottom: '1px solid #e9ecef',
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Left: Logo */}
      <Box
        component={Link}
        href={`/dashboard/${user?.role}`}
        style={{
          textDecoration: 'none',
          color: 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Text fw={800} size="xl" c="cyan" style={{ letterSpacing: '0.5px' }}>
          TEC LMS
        </Text>
      </Box>

      {/* Right: User Controls */}
      <Group gap={16}>
        {/* Language Switcher */}
        <Group gap={6}>
          <Badge
            onClick={() => changeLanguage('km')}
            style={{
              cursor: 'pointer',
              backgroundColor: language === 'km' ? '#0369a1' : '#e9ecef',
              color: language === 'km' ? '#ffffff' : '#495057',
              fontWeight: 600,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = 'translateY(0)';
            }}
          >
            KM
          </Badge>
          <Badge
            onClick={() => changeLanguage('en')}
            style={{
              cursor: 'pointer',
              backgroundColor: language === 'en' ? '#0369a1' : '#e9ecef',
              color: language === 'en' ? '#ffffff' : '#495057',
              fontWeight: 600,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = 'translateY(0)';
            }}
          >
            EN
          </Badge>
        </Group>

        {/* User Info & Menu */}
        <Menu shadow="md" width={240} position="bottom-end">
          <Menu.Target>
            <button
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '6px 12px',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                const btn = e.currentTarget as HTMLElement;
                btn.style.backgroundColor = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                const btn = e.currentTarget as HTMLElement;
                btn.style.backgroundColor = 'transparent';
              }}
            >
              <Avatar size={36} color="cyan" radius="xl" style={{ fontWeight: 700 }}>
                {getInitials(user?.full_name || null)}
              </Avatar>
              <Box style={{ textAlign: 'left' }}>
                <Text fw={600} size="sm" style={{ color: '#212529' }}>
                  {user?.full_name || 'User'}
                </Text>
                <Text size="xs" c="dimmed" style={{ color: '#868e96' }}>
                  {getRoleLabel(user?.role || '')}
                </Text>
              </Box>
            </button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 600 }}>
              {user?.email}
            </Menu.Label>
            <Menu.Divider style={{ margin: '6px 0' }} />
            <Link href={`/dashboard/${user?.role}/profile`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <Menu.Item icon={<IconUser size={16} />} fw={500}>
                {t('components.navbar.profile')}
              </Menu.Item>
            </Link>
            <Link href={`/dashboard/${user?.role}/settings`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <Menu.Item icon={<IconSettings size={16} />} fw={500}>
                {t('components.navbar.settings')}
              </Menu.Item>
            </Link>
            <Menu.Divider style={{ margin: '6px 0' }} />
            <Menu.Item
              icon={<IconLogout size={16} />}
              onClick={handleLogout}
              disabled={isLoggingOut}
              color="red"
              fw={500}
            >
              {isLoggingOut
                ? t('components.navbar.signingOut')
                : t('components.navbar.logout')}
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Box>
  );
}
