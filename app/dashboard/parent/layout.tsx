import { DashboardLayout } from '@/components/DashboardLayout';

export const metadata = {
  title: 'Parent Portal | DGTech LMS',
  description: 'Parent portal for monitoring student progress and communicating with educators',
};

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout requiredRole="parent">
      {children}
    </DashboardLayout>
  );
}
