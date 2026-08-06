import { redirect } from 'next/navigation';
import { ForbiddenError, UnauthorizedError } from '@/lib/errors';
import {
  requireAdminAccess,
  requireAdminPermission,
  requireAdminSession,
} from '@/modules/authorization/services/authorization-service';

export async function guardAdminSecurityPage(options?: {
  /** If true, requires completed 2FA (dashboard subsections). */
  requireTwoFactor?: boolean;
}) {
  try {
    if (options?.requireTwoFactor === false) {
      await requireAdminSession();
      return;
    }
    await requireAdminAccess();
  } catch (error) {
    if (error instanceof ForbiddenError && error.code === 'TWO_FACTOR_REQUIRED') {
      redirect('/admin/seguridad/2fa');
    }
    if (error instanceof ForbiddenError) {
      redirect('/admin/acceso-denegado');
    }
    if (error instanceof UnauthorizedError) {
      redirect('/admin/iniciar-sesion');
    }
    redirect('/admin/iniciar-sesion');
  }
}

export async function guardAdminPermissionPage(permissionCode: string) {
  await guardAdminSecurityPage({ requireTwoFactor: true });
  try {
    await requireAdminPermission(permissionCode);
  } catch (error) {
    if (error instanceof ForbiddenError && error.code === 'TWO_FACTOR_REQUIRED') {
      redirect('/admin/seguridad/2fa');
    }
    if (error instanceof ForbiddenError) {
      redirect('/admin/acceso-denegado');
    }
    if (error instanceof UnauthorizedError) {
      redirect('/admin/iniciar-sesion');
    }
    redirect('/admin/iniciar-sesion');
  }
}

export async function guardAdminTwoFactorSetupPage() {
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
}
