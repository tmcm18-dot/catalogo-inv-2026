import Link from 'next/link';
import { UserStatus } from '@prisma/client';
import { guardAdminPermissionPage } from '@/modules/admin/lib/page-guards';
import { listAdminUsers } from '@/modules/admin/services/user-admin-service';
import { PERMISSIONS } from '@/modules/authorization/permissions';

export default async function AdminUsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await guardAdminPermissionPage(PERMISSIONS.USERS_READ);
  const params = await searchParams;
  const status =
    params.status && Object.values(UserStatus).includes(params.status as UserStatus)
      ? (params.status as UserStatus)
      : undefined;

  const data = await listAdminUsers({
    q: params.q,
    status,
    take: 50,
  });

  return (
    <div>
      <h2>Usuarios</h2>
      <form method="get" className="adminFilters">
        <label>
          Buscar
          <input name="q" defaultValue={params.q ?? ''} />
        </label>
        <label>
          Estado
          <select name="status" defaultValue={params.status ?? ''}>
            <option value="">Todos</option>
            <option value="ACTIVE">Activos</option>
            <option value="PENDING_VERIFICATION">Pendientes</option>
            <option value="TEMPORARILY_BLOCKED">Bloqueados</option>
            <option value="SUSPENDED">Suspendidos</option>
          </select>
        </label>
        <button type="submit">Filtrar</button>
      </form>
      <p>
        {data.total} resultado(s). No se muestran hashes, tokens ni secretos.
      </p>
      <table className="adminTable">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Estado</th>
            <th>Roles</th>
            <th>2FA</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {data.users.map((user) => (
            <tr key={user.id}>
              <td>
                {user.firstName} {user.lastName}
              </td>
              <td>{user.email}</td>
              <td>{user.status}</td>
              <td>
                {(user.activeRoles ?? user.roles.filter((r) => !r.expired).map((r) => r.code)).join(
                  ', ',
                )}
              </td>
              <td>{user.twoFactorEnabled ? 'Sí' : 'No'}</td>
              <td>
                <Link href={`/admin/seguridad/usuarios/${user.id}`}>Detalle</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
