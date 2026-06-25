import { verifyAdminSession } from '@/lib/auth';
import DashboardClient from './DashboardClient';

export default async function AdminDashboard() {
  await verifyAdminSession();

  return (
    <DashboardClient />
  );
}
