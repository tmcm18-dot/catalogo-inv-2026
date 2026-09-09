import { guardAdminTwoFactorSetupPage } from '@/modules/admin/lib/page-guards';
import AdminTwoFactorClient from './AdminTwoFactorClient';

export default async function AdminSeguridad2faPage() {
  await guardAdminTwoFactorSetupPage();
  return <AdminTwoFactorClient />;
}
