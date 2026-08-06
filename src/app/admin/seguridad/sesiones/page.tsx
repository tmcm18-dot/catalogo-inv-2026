import { guardAdminPermissionPage } from '@/modules/admin/lib/page-guards';
import { listAdminSessions } from '@/modules/admin/services/session-admin-service';
import { PERMISSIONS } from '@/modules/authorization/permissions';

export default async function AdminSesionesPage() {
  await guardAdminPermissionPage(PERMISSIONS.SESSIONS_READ);
  const sessions = await listAdminSessions({ includeRevoked: true, take: 50 });

  return (
    <div>
      <h2>Sesiones</h2>
      <p>Listado de sesiones activas y revocadas (sin tokens ni cookies).</p>
      <table className="adminTable">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Dispositivo</th>
            <th>Contexto</th>
            <th>Actividad</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.id}>
              <td>
                {s.userName ?? s.email ?? s.userId}
              </td>
              <td>{s.deviceName ?? '—'}</td>
              <td>
                {s.isAdminContext ? 'Admin' : 'Cliente'}
                {s.twoFactorOk ? ' · 2FA OK' : ''}
              </td>
              <td>{s.lastActivityAt.toISOString()}</td>
              <td>
                {s.revokedAt
                  ? `Revocada (${s.revokeReason ?? '—'})`
                  : 'Activa'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
