'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Stack, Box, Badge } from '@mantine/core';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { getMenuByRole, MenuItem } from '@/lib/navigation';

interface SidebarProps {
  role: 'student' | 'teacher' | 'admin' | 'parent';
  width?: number;
}

export function Sidebar({ role, width = 250 }: SidebarProps) {
  const pathname = usePathname();
  const { language } = useTranslation();
  const menu = getMenuByRole(role);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleSection = (label: string) => {
    setExpandedSections((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
    );
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const renderMenuItem = (item: MenuItem, depth: number = 0) => {
    const itemLabel = language === 'km' ? item.label.km : item.label.en;
    const isItemActive = isActive(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const Icon = item.icon;

    return (
      <Box key={item.href}>
        <Link href={item.href} style={{ textDecoration: 'none', color: 'inherit' }}>
          <Box
            onClick={() => {
              if (hasChildren) {
                toggleSection(item.href);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: isItemActive ? 'var(--mantine-color-cyan-0)' : 'transparent',
              color: isItemActive ? 'var(--mantine-color-cyan-7)' : '#495057',
              fontWeight: isItemActive ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: '4px',
            }}
            onMouseEnter={(e) => {
              if (!isItemActive) {
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  'var(--mantine-color-gray-1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isItemActive) {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              }
            }}
          >
            <Icon size={18} stroke={1.5} />
            <span style={{ flex: 1 }}>{itemLabel}</span>
            {item.badge && (
              <Badge size="xs" variant="light">
                {item.badge}
              </Badge>
            )}
          </Box>
        </Link>
        {hasChildren && expandedSections.includes(item.href) && (
          <Stack gap={0} style={{ marginLeft: 24 }}>
            {item.children.map((child) => renderMenuItem(child, depth + 1))}
          </Stack>
        )}
      </Box>
    );
  };

  return (
    <Box
      style={{
        width: width,
        borderRight: '1px solid var(--mantine-color-gray-2)',
        overflowY: 'auto',
        backgroundColor: '#ffffff',
        padding: '16px',
      }}
    >
      <Stack gap={0}>
        {menu.map((item) => renderMenuItem(item))}
      </Stack>
    </Box>
  );
}
