import { DashboardLayout } from '@/components/DashboardLayout';

export default function MentorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout requiredRole="teacher">
      {children}
    </DashboardLayout>
  );
}
