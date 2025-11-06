/**
 * Navigation Configuration
 * Defines menu structure for each user role
 *
 * Usage: Import menuConfig and access by role
 * Example: const studentMenu = menuConfig['student'];
 */

import {
  IconDashboard,
  IconAward,
  IconUsers,
  IconSettings,
  IconUserCircle,
  IconChalkboard,
  IconChartBar,
  IconClipboardCheck,
  IconBriefcase,
  IconMessageCircle,
  IconClock,
  IconCertificate,
} from '@tabler/icons-react';

export interface MenuItem {
  label: { en: string; km: string };
  href: string;
  icon: React.ComponentType<any>;
  badge?: string;
  children?: MenuItem[];
}

export interface MenuConfig {
  student: MenuItem[];
  mentor: MenuItem[];
  coordinator: MenuItem[];
}

export const menuConfig: MenuConfig = {
  student: [
    {
      label: { km: 'ផ្ទាំងគ្រប់គ្រង', en: 'Dashboard' },
      href: '/dashboard/graduate-student',
      icon: IconDashboard,
    },
    {
      label: { km: 'សមត្ថភាព', en: 'Competencies' },
      href: '/dashboard/graduate-student/competencies',
      icon: IconClipboardCheck,
    },
    {
      label: { km: 'ការងារគន្លឹះ', en: 'Practicum' },
      href: '/dashboard/graduate-student/practicum',
      icon: IconChalkboard,
    },
    {
      label: { km: 'ម៉ោងបង្រៀន', en: 'Teaching Hours' },
      href: '/dashboard/graduate-student/teaching-hours',
      icon: IconClock,
    },
    {
      label: { km: 'ផលប័ត្រ', en: 'Portfolio' },
      href: '/dashboard/graduate-student/portfolio',
      icon: IconBriefcase,
    },
    {
      label: { km: 'គ្រូលម្អិត', en: 'Mentorship' },
      href: '/dashboard/graduate-student/mentorship',
      icon: IconMessageCircle,
    },
    {
      label: { km: 'សង្សყម', en: 'Certification' },
      href: '/dashboard/graduate-student/certification',
      icon: IconCertificate,
    },
    {
      label: { km: 'ប្រវត្តិលម្អិត', en: 'Profile' },
      href: '/dashboard/graduate-student/profile',
      icon: IconUserCircle,
    },
  ],

  mentor: [
    {
      label: { km: 'ផ្ទាំងគ្រប់គ្រង', en: 'Dashboard' },
      href: '/dashboard/mentor',
      icon: IconDashboard,
    },
    {
      label: { km: 'វាយតម្លៃសមត្ថភាព', en: 'Competency Assessment' },
      href: '/dashboard/mentor/competency-assessment',
      icon: IconClipboardCheck,
    },
    {
      label: { km: 'ពិនិត្យផលប័ត្រ', en: 'Portfolio Review' },
      href: '/dashboard/mentor/portfolio-review',
      icon: IconBriefcase,
    },
    {
      label: { km: 'វគ្គលម្អិត', en: 'Mentorship Sessions' },
      href: '/dashboard/mentor/mentorship-sessions',
      icon: IconMessageCircle,
    },
    {
      label: { km: 'ប្រវត្តិលម្អិត', en: 'Profile' },
      href: '/dashboard/mentor/profile',
      icon: IconUserCircle,
    },
  ],

  coordinator: [
    {
      label: { km: 'ផ្ទាំងគ្រប់គ្រង', en: 'Dashboard' },
      href: '/dashboard/coordinator',
      icon: IconDashboard,
    },
    {
      label: { km: 'សិស្ស', en: 'Students' },
      href: '/dashboard/coordinator/students',
      icon: IconUsers,
    },
    {
      label: { km: 'គ្រូលម្អិត', en: 'Mentors' },
      href: '/dashboard/coordinator/mentors',
      icon: IconUsers,
    },
    {
      label: { km: 'សង្សយម', en: 'Certifications' },
      href: '/dashboard/coordinator/certification-issuance',
      icon: IconAward,
    },
    {
      label: { km: 'របាយការណ៍', en: 'Reports' },
      href: '/dashboard/coordinator/reports',
      icon: IconChartBar,
    },
    {
      label: { km: 'សមត្ថភាព', en: 'Competencies' },
      href: '/dashboard/coordinator/competencies',
      icon: IconClipboardCheck,
    },
    {
      label: { km: 'ការកំណត់', en: 'Settings' },
      href: '/dashboard/coordinator/settings',
      icon: IconSettings,
    },
  ],
};

export function getMenuByRole(role: 'student' | 'mentor' | 'coordinator'): MenuItem[] {
  return menuConfig[role] || [];
}

export function getMenuItemLabel(item: MenuItem, language: 'en' | 'km'): string {
  return item.label[language];
}
