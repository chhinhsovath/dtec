/**
 * Lazy Loading Utilities
 * Provides dynamic imports and lazy loading patterns for performance optimization
 */

import dynamic from 'next/dynamic';
import React from 'react';
import { ReactNode } from 'react';

/**
 * Dynamic component loader with custom loading fallback
 * @param importFunc - Function that returns dynamic import
 * @param loadingComponent - Component to show while loading
 * @returns Dynamically imported component
 */
export function lazyLoad<P extends object>(
  importFunc: () => Promise<{ default: React.ComponentType<P> }>,
  loadingComponent?: React.ReactNode
) {
  return dynamic(importFunc, {
    loading: () => {
      const LoadingFallback = loadingComponent || React.createElement('div', null, 'Loading...');
      return React.createElement(React.Fragment, null, LoadingFallback);
    },
    ssr: true,
  });
}

/**
 * Route-based lazy loading for dashboard components
 * Reduces initial bundle size by splitting route components
 */
export const DashboardComponents = {
  AdminDashboard: dynamic(
    () => import('@/app/dashboard/admin/page'),
    { loading: () => <div>Loading Admin Dashboard...</div>, ssr: true }
  ),
  StudentDashboard: dynamic(
    () => import('@/app/dashboard/student/page'),
    { loading: () => <div>Loading Student Dashboard...</div>, ssr: true }
  ),
  TeacherDashboard: dynamic(
    () => import('@/app/dashboard/teacher/page'),
    { loading: () => <div>Loading Teacher Dashboard...</div>, ssr: true }
  ),
};

/**
 * Modal and overlay components - lazy load these heavy components
 */
export const ModalComponents = {
  UserModal: dynamic(
    () => import('@/components/modals/user-modal').then(mod => ({ default: mod.UserModal })),
    { loading: () => <div>Loading Modal...</div>, ssr: false }
  ),
  ConfirmDialog: dynamic(
    () => import('@/components/modals/confirm-dialog').then(mod => ({ default: mod.ConfirmDialog })),
    { loading: () => <div>Loading Dialog...</div>, ssr: false }
  ),
};

/**
 * Heavy chart and analytics components
 * Load only when needed to keep initial bundle small
 */
export const AnalyticsComponents = {
  AttendanceChart: dynamic(
    () => import('@/components/charts/attendance-chart').then(mod => ({ default: mod.AttendanceChart })),
    { loading: () => <div>Loading Chart...</div>, ssr: true }
  ),
  GradeDistribution: dynamic(
    () => import('@/components/charts/grade-distribution').then(mod => ({ default: mod.GradeDistribution })),
    { loading: () => <div>Loading Chart...</div>, ssr: true }
  ),
  EnrollmentStats: dynamic(
    () => import('@/components/charts/enrollment-stats').then(mod => ({ default: mod.EnrollmentStats })),
    { loading: () => <div>Loading Stats...</div>, ssr: true }
  ),
};

/**
 * Table components - lazy load data-heavy components
 */
export const TableComponents = {
  StudentTable: dynamic(
    () => import('@/components/tables/student-table').then(mod => ({ default: mod.StudentTable })),
    { loading: () => <div>Loading Table...</div>, ssr: true }
  ),
  CourseTable: dynamic(
    () => import('@/components/tables/course-table').then(mod => ({ default: mod.CourseTable })),
    { loading: () => <div>Loading Table...</div>, ssr: true }
  ),
  EnrollmentTable: dynamic(
    () => import('@/components/tables/enrollment-table').then(mod => ({ default: mod.EnrollmentTable })),
    { loading: () => <div>Loading Table...</div>, ssr: true }
  ),
};

/**
 * Observer for lazy loading elements on scroll
 * Use with Intersection Observer API for better performance
 */
export function useIntersectionObserver(
  callback: (isIntersecting: boolean) => void,
  options?: IntersectionObserverInit
) {
  const elementRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      callback(entry.isIntersecting);
    }, options);

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [callback, options]);

  return elementRef;
}

/**
 * Lazy load images with placeholder
 * Reduces Largest Contentful Paint (LCP)
 */
export const LazyImage = dynamic(
  () => import('next/image').then(mod => ({ default: mod.default })),
  {
    loading: () => <div className="bg-gray-200 animate-pulse w-full h-full" />,
    ssr: true
  }
);
