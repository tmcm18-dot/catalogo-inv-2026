import AdminDashboard from '@/components/dulces-maxi/admin/AdminDashboard';
import AdminShell from '@/components/dulces-maxi/admin/AdminShell';

export default function AdminHomePage() {
  return (
    <AdminShell>
      <AdminDashboard />
    </AdminShell>
  );
}
