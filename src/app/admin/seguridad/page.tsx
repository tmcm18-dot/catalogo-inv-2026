import Link from 'next/link';
import { ForbiddenError } from '@/lib/errors';
import { requireAdminSession } from '@/modules/authorization/services/authorization-service';
import { getSecurityOverview } from '@/modules/admin/services/session-admin-service';
import { guardAdminTwoFactorSetupPage } from '@/modules/admin/lib/page-guards';

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="adminMetric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default async function AdminSeguridadHubPage() {
  await guardAdminTwoFactorSetupPage();
  const session = await requireAdminSession();

  if (!session.twoFactorOk) {
    return (
      <div className="authCard">
        <h2>Configuración 2FA pendiente</h2>
        <p>
          Debés completar la autenticación en dos pasos antes de acceder al resto
          del panel de seguridad.
        </p>
        <Link className="authSubmit" href="/admin/seguridad/2fa">
          Ir a configuración 2FA
        </Link>
      </div>
    );
  }

  let overview: Awaited<ReturnType<typeof getSecurityOverview>> | null = null;
  try {
    if (session.user.permissions.includes('security.manage')) {
      overview = await getSecurityOverview();
    }
  } catch (error) {
    if (!(error instanceof ForbiddenError)) throw error;
  }

  return (
    <div>
      <p>
        Hub de seguridad. Usá la navegación para usuarios, sesiones, auditoría y
        riesgo. Nunca se muestran contraseñas, hashes, tokens ni secretos TOTP.
      </p>
      {overview ? (
        <div className="metricsGrid">
          <Stat label="Usuarios activos" value={overview.users.active} />
          <Stat label="Pendientes" value={overview.users.pending} />
          <Stat label="Bloqueados" value={overview.users.temporarilyBlocked} />
          <Stat label="Suspendidos" value={overview.users.suspended} />
          <Stat label="Admins" value={overview.users.admins} />
          <Stat label="Superadmins" value={overview.users.superadmins} />
          <Stat label="Sesiones activas" value={overview.sessions.active} />
          <Stat label="Logins fallidos 24h" value={overview.risk.failedLogins24h} />
        </div>
      ) : (
        <p>No tenés permiso para ver el resumen de seguridad.</p>
      )}
    </div>
  );
}
