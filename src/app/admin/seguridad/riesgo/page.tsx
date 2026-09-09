import { guardAdminPermissionPage } from '@/modules/admin/lib/page-guards';
import {
  listLoginAttempts,
  listSecurityEvents,
} from '@/modules/admin/services/session-admin-service';
import { PERMISSIONS } from '@/modules/authorization/permissions';

export default async function AdminRiesgoPage() {
  await guardAdminPermissionPage(PERMISSIONS.SECURITY_MANAGE);
  const [loginAttempts, securityEvents] = await Promise.all([
    listLoginAttempts({ take: 40 }),
    listSecurityEvents({ take: 40 }),
  ]);

  return (
    <div>
      <h2>Riesgo</h2>
      <p>
        Intentos de login y eventos de seguridad (hashes seudonimizados; sin
        secretos).
      </p>

      <h3>Intentos de inicio de sesión</h3>
      <table className="adminTable">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Éxito</th>
            <th>IP hash</th>
            <th>Identificador hash</th>
          </tr>
        </thead>
        <tbody>
          {loginAttempts.map((a) => (
            <tr key={a.id}>
              <td>{a.createdAt.toISOString()}</td>
              <td>{a.success ? 'Sí' : 'No'}</td>
              <td className="authMono">{a.ipHash?.slice(0, 12) ?? '—'}</td>
              <td className="authMono">
                {a.identifierHash?.slice(0, 12) ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Eventos de seguridad</h3>
      <ul>
        {securityEvents.map((e) => (
          <li key={e.id}>
            {e.createdAt.toISOString()} — {e.eventType} — user {e.userId ?? '—'}
          </li>
        ))}
      </ul>
    </div>
  );
}
