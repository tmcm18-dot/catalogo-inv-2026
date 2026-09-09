import { jsonError, jsonSuccess } from '@/lib/api/response';
import { PERMISSIONS } from '@/modules/authorization/permissions';
import { requireAdminPermission } from '@/modules/authorization/services/authorization-service';
import { listAuditLogs } from '@/modules/admin/services/session-admin-service';

export async function GET(request: Request) {
  try {
    await requireAdminPermission(PERMISSIONS.AUDIT_READ);
    const url = new URL(request.url);
    const data = await listAuditLogs({
      action: url.searchParams.get('action') ?? undefined,
      take: url.searchParams.get('take')
        ? Number(url.searchParams.get('take'))
        : undefined,
      skip: url.searchParams.get('skip')
        ? Number(url.searchParams.get('skip'))
        : undefined,
    });
    return jsonSuccess(data);
  } catch (error) {
    return jsonError(error);
  }
}
