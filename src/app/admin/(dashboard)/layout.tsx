import { verifyAdminSession } from '@/lib/auth';
import AdminSidebarWrapper from '@/components/AdminSidebarWrapper';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Absolute Read-Stateful Validation (Anti-Exfiltration)
  await verifyAdminSession();

  return (
    <AdminSidebarWrapper>
      {children}
    </AdminSidebarWrapper>
  );
}
