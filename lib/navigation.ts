/**
 * Navigation Configuration
 * Defines menu structure for each user role
 *
 * Usage: Import menuConfig and access by role
 * Example: const studentMenu = menuConfig['student'];
 */

import {
  IconDashboard,
  IconBook,
  IconAward,
  IconCalendarEvent,
  IconFileText,
  IconUsers,
  IconClipboardList,
  IconSettings,
  IconUserCircle,
  IconChalkboard,
  IconChartBar,
  IconBell,
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
  teacher: MenuItem[];
  mentor: MenuItem[];
  coordinator: MenuItem[];
  admin: MenuItem[];
  parent: MenuItem[];
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

  teacher: [
    {
      label: { km: 'ផ្ទាំងគ្រប់គ្រង', en: 'Dashboard' },
      href: '/dashboard/teacher',
      icon: IconDashboard,
    },
    {
      label: { km: 'ថ្នាក់របស់ខ្ញុំ', en: 'My Classes' },
      href: '/dashboard/teacher/classes',
      icon: IconChalkboard,
    },
    {
      label: { km: 'សិស្សម៉ាក់', en: 'Students' },
      href: '/dashboard/teacher/students',
      icon: IconUsers,
    },
    {
      label: { km: 'ពិន្ទុ', en: 'Grades' },
      href: '/dashboard/teacher/grades',
      icon: IconAward,
    },
    {
      label: { km: 'ការចូលរៀន', en: 'Attendance' },
      href: '/dashboard/teacher/attendance',
      icon: IconCalendarEvent,
    },
    {
      label: { km: 'កិច្ចការ', en: 'Assignments' },
      href: '/dashboard/teacher/assignments',
      icon: IconClipboardList,
    },
    {
      label: { km: 'ធនធាន', en: 'Resources' },
      href: '/dashboard/teacher/resources',
      icon: IconFileText,
    },
    {
      label: { km: 'របាយការណ៍', en: 'Reports' },
      href: '/dashboard/teacher/reports',
      icon: IconChartBar,
    },
    {
      label: { km: 'ប្រវត្តិលម្អិត', en: 'Profile' },
      href: '/dashboard/teacher/profile',
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

  admin: [
    {
      label: { km: 'ផ្ទាំងគ្រប់គ្រង', en: 'Dashboard' },
      href: '/dashboard/admin',
      icon: IconDashboard,
    },
    {
      label: { km: 'អ្នកប្រើប្រាស់', en: 'Users' },
      href: '/dashboard/admin/users',
      icon: IconUsers,
    },
    {
      label: { km: 'ថ្នាក់រៀន', en: 'Classes' },
      href: '/dashboard/admin/classes',
      icon: IconChalkboard,
    },
    {
      label: { km: 'វគ្គសិក្សា', en: 'Courses' },
      href: '/dashboard/admin/courses',
      icon: IconBook,
    },
    {
      label: { km: 'ការចូលរៀន', en: 'Attendance' },
      href: '/dashboard/admin/attendance',
      icon: IconCalendarEvent,
    },
    {
      label: { km: 'ពិន្ទុ', en: 'Grades' },
      href: '/dashboard/admin/grades',
      icon: IconAward,
    },
    {
      label: { km: 'របាយការណ៍', en: 'Reports' },
      href: '/dashboard/admin/reports',
      icon: IconChartBar,
    },
    {
      label: { km: 'ការកំណត់', en: 'Settings' },
      href: '/dashboard/admin/settings',
      icon: IconSettings,
    },
    {
      label: { km: 'ប្រវត្តិលម្អិត', en: 'Profile' },
      href: '/dashboard/admin/profile',
      icon: IconUserCircle,
    },
  ],

  parent: [
    {
      label: { km: 'ផ្ទាំងគ្រប់គ្រង', en: 'Dashboard' },
      href: '/dashboard/parent',
      icon: IconDashboard,
    },
    {
      label: { km: 'កូនៗរបស់ខ្ញុំ', en: 'My Children' },
      href: '/dashboard/parent/children',
      icon: IconUsers,
    },
    {
      label: { km: 'ពិន្ទុ', en: 'Grades' },
      href: '/dashboard/parent/grades',
      icon: IconAward,
    },
    {
      label: { km: 'ការចូលរៀន', en: 'Attendance' },
      href: '/dashboard/parent/attendance',
      icon: IconCalendarEvent,
    },
    {
      label: { km: 'ការជូនដំណឹង', en: 'Notifications' },
      href: '/dashboard/parent/notifications',
      icon: IconBell,
    },
    {
      label: { km: 'ប្រវត្តិលម្អិត', en: 'Profile' },
      href: '/dashboard/parent/profile',
      icon: IconUserCircle,
    },
  ],
};

export function getMenuByRole(role: 'student' | 'teacher' | 'mentor' | 'coordinator' | 'admin' | 'parent'): MenuItem[] {
  return menuConfig[role] || [];
}

export function getMenuItemLabel(item: MenuItem, language: 'en' | 'km'): string {
  return item.label[language];
}
