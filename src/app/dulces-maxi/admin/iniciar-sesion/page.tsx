import { Suspense } from 'react';
import AdminLogin from '@/components/dulces-maxi/admin/AdminLogin';

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="dm-admin-boot">
          <div className="dm-admin-spinner" />
        </div>
      }
    >
      <AdminLogin />
    </Suspense>
  );
}
