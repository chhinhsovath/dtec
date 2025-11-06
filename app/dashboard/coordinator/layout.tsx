import { DashboardLayout } from '@/components/DashboardLayout';

export default function CoordinatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout requiredRole="admin">
      {children}
    </DashboardLayout>
  );
}
