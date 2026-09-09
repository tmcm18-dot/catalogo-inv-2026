import { notFound } from 'next/navigation';
import { ForbiddenError } from '@/lib/errors';
import { prisma } from '@/lib/db/prisma';
import { guardAdminPermissionPage } from '@/modules/admin/lib/page-guards';
import { getAdminUserDetail } from '@/modules/admin/services/user-admin-service';
import { PERMISSIONS } from '@/modules/authorization/permissions';
import { requireValidSession } from '@/modules/auth/services/session-service';
import { AdminUserActions } from './AdminUserActions';
import { AdminUserRoles } from './AdminUserRoles';

type Params = { params: Promise<{ id: string }> };

export default async function AdminUsuarioDetallePage({ params }: Params) {
  await guardAdminPermissionPage(PERMISSIONS.USERS_READ);
  const session = await requireValidSession();
  const { id } = await params;

  let detail: Awaited<ReturnType<typeof getAdminUserDetail>>;
  try {
    detail = await getAdminUserDetail(id);
  } catch (error) {
    if (error instanceof ForbiddenError) notFound();
    throw error;
  }

  const { user, sessions, history } = detail;
  const roleRows = user.roles.map((r) => ({
    code: r.code,
    name: r.name,
    assignedAt: r.assignedAt.toISOString(),
    expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null,
    expired: Boolean(r.expired),
  }));

  const availableRoles = await prisma.role.findMany({
    orderBy: { code: 'asc' },
    select: { code: true, name: true },
  });

  const canManageRoles = session.user.permissions.includes(PERMISSIONS.ROLES_MANAGE);
  const canReadRoles = session.user.permissions.includes(PERMISSIONS.ROLES_READ);

  return (
    <div>
      <h2>
        {user.firstName} {user.lastName}
      </h2>
      <dl className="adminDl">
        <dt>Email</dt>
        <dd data-testid="user-email">{user.email}</dd>
        <dt>Teléfono</dt>
        <dd>{user.phone}</dd>
        <dt>Estado</dt>
        <dd data-testid="user-status">{user.status}</dd>
        <dt>2FA</dt>
        <dd>{user.twoFactorEnabled ? 'Activo' : 'No configurado'}</dd>
        <dt>Último login</dt>
        <dd>{user.lastLoginAt?.toISOString() ?? '—'}</dd>
        <dt>Bloqueo hasta</dt>
        <dd>{user.blockedUntil?.toISOString() ?? '—'}</dd>
      </dl>

      <AdminUserRoles
        userId={user.id}
        roles={roleRows}
        availableRoles={availableRoles}
        canManageRoles={canManageRoles}
        canReadRoles={canReadRoles || canManageRoles}
        isSelf={session.userId === user.id}
        history={history.map((h) => ({
          id: h.id,
          action: h.action,
          result: h.result,
          reason: h.reason,
          createdAt: h.createdAt.toISOString(),
        }))}
      />

      <AdminUserActions
        userId={user.id}
        status={user.status}
        targetRoles={user.activeRoles ?? user.roles.filter((r) => !r.expired).map((r) => r.code)}
        actorPermissions={session.user.permissions}
        isSelf={session.userId === user.id}
      />

      <h3>Sesiones recientes</h3>
      <table className="adminTable">
        <thead>
          <tr>
            <th>Dispositivo</th>
            <th>Admin</th>
            <th>Actividad</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.id}>
              <td>{s.deviceName ?? '—'}</td>
              <td>{s.isAdminContext ? 'Sí' : 'No'}</td>
              <td>{s.lastActivityAt.toISOString()}</td>
              <td>{s.revokedAt ? `Revocada (${s.revokeReason})` : 'Activa'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Historial administrativo</h3>
      <ul>
        {history.map((h) => (
          <li key={h.id}>
            {h.createdAt.toISOString()} — {h.action} — {h.result}
            {h.reason ? ` — ${h.reason}` : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}
