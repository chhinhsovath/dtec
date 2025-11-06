'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box } from '@mantine/core';
import { getSession, AuthUser } from '@/lib/auth/client-auth';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { DashboardNavbar } from './Navbar';
import { SidebarMinimal } from './SidebarMinimal';

interface DashboardLayoutProps {
  children: React.ReactNode;
  requiredRole?: 'student' | 'teacher' | 'mentor' | 'coordinator' | 'admin' | 'parent';
  sidebarRole?: 'student' | 'teacher' | 'mentor' | 'coordinator' | 'admin' | 'parent';
}

export function DashboardLayout({
  children,
  requiredRole,
  sidebarRole,
}: DashboardLayoutProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = getSession();

    if (!session) {
      router.push('/auth/login');
      return;
    }

    if (requiredRole && session.role !== requiredRole) {
      router.push(`/dashboard/${session.role}`);
      return;
    }

    setUser(session);
    setIsLoading(false);
  }, [router, requiredRole]);

  if (isLoading) {
    return (
      <Box
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#f8f9fa',
        }}
      >
        <div>{t('components.dashboardLayout.loading')}</div>
      </Box>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
      }}
    >
      {/* Navbar */}
      <DashboardNavbar
        user={user}
        showMenuToggle={false}
      />

      {/* Main Content with Minimal Sidebar */}
      <Box style={{ display: 'flex', flex: 1 }}>
        {/* Minimal Sidebar - Icon only */}
        <SidebarMinimal role={(sidebarRole || user.role) as 'student' | 'teacher' | 'mentor' | 'coordinator' | 'admin' | 'parent'} />

        {/* Page Content */}
        <Box
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
