import { guardAdminPermissionPage } from '@/modules/admin/lib/page-guards';
import { listAuditLogs } from '@/modules/admin/services/session-admin-service';
import { PERMISSIONS } from '@/modules/authorization/permissions';

export default async function AdminAuditoriaPage() {
  await guardAdminPermissionPage(PERMISSIONS.AUDIT_READ);
  const data = await listAuditLogs({ take: 50 });

  return (
    <div>
      <h2>Auditoría</h2>
      <p>
        Registros de acciones sensibles. No incluyen contraseñas, hashes ni
        secretos.
      </p>
      <table className="adminTable">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Acción</th>
            <th>Resultado</th>
            <th>Recurso</th>
            <th>Razón</th>
            <th>Request</th>
          </tr>
        </thead>
        <tbody>
          {data.logs.map((log) => (
            <tr key={log.id}>
              <td>{log.createdAt.toISOString()}</td>
              <td>{log.action}</td>
              <td>{log.result}</td>
              <td>
                {log.resourceType}/{log.resourceId}
              </td>
              <td>{log.reason ?? '—'}</td>
              <td className="authMono">{log.requestId ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
