import { jsonError, jsonSuccess } from '@/lib/api/response';
import { PERMISSIONS } from '@/modules/authorization/permissions';
import { requireAdminPermission } from '@/modules/authorization/services/authorization-service';
import { listAdminSessions } from '@/modules/admin/services/session-admin-service';

export async function GET(request: Request) {
  try {
    await requireAdminPermission(PERMISSIONS.SESSIONS_READ);
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') ?? undefined;
    const includeRevoked = url.searchParams.get('includeRevoked') === '1';
    const take = url.searchParams.get('take')
      ? Number(url.searchParams.get('take'))
      : undefined;

    const sessions = await listAdminSessions({ userId, includeRevoked, take });
    return jsonSuccess({ sessions });
  } catch (error) {
    return jsonError(error);
  }
}
