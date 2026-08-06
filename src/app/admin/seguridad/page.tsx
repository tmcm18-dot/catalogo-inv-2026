import { redirect } from 'next/navigation';
import { ForbiddenError, UnauthorizedError } from '@/lib/errors';
import { requireAdminSession } from '@/modules/authorization/services/authorization-service';
import AdminSeguridadClient from './AdminSeguridadClient';

export default async function AdminSeguridadPage() {
  try {
    await requireAdminSession();
  } catch (error) {
    if (error instanceof ForbiddenError) {
      redirect('/admin/acceso-denegado');
    }
    if (error instanceof UnauthorizedError) {
      redirect('/admin/iniciar-sesion');
    }
    redirect('/admin/iniciar-sesion');
  }

  return <AdminSeguridadClient />;
}
