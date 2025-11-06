'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Stack, Tooltip, UnstyledButton } from '@mantine/core';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { getMenuByRole, MenuItem } from '@/lib/navigation';
import classes from './NavbarMinimal.module.css';

interface SidebarMinimalProps {
  role: 'student' | 'teacher' | 'mentor' | 'coordinator' | 'admin' | 'parent';
}

interface NavbarLinkProps {
  icon: React.ComponentType<any>;
  label: string;
  href: string;
  active?: boolean;
}

function NavbarLink({ icon: Icon, label, href, active }: NavbarLinkProps) {
  return (
    <Tooltip label={label} position="right" transitionProps={{ duration: 0 }}>
      <UnstyledButton
        component={Link}
        href={href}
        className={classes.link}
        data-active={active || undefined}
      >
        <Icon size={20} stroke={1.5} />
      </UnstyledButton>
    </Tooltip>
  );
}

export function SidebarMinimal({ role }: SidebarMinimalProps) {
  const pathname = usePathname();
  const { language } = useTranslation();
  const menu = getMenuByRole(role);

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const links = menu.map((link: MenuItem) => {
    const label = language === 'km' ? link.label.km : link.label.en;
    return (
      <NavbarLink
        key={link.href}
        icon={link.icon}
        label={label}
        href={link.href}
        active={isActive(link.href)}
      />
    );
  });

  return (
    <nav className={classes.navbar}>
      {/* Navigation Links Only */}
      <div className={classes.navbarMain}>
        <Stack justify="center" gap={0}>
          {links}
        </Stack>
      </div>
    </nav>
  );
}
