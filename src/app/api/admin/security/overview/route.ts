import { jsonError, jsonSuccess } from '@/lib/api/response';
import { PERMISSIONS } from '@/modules/authorization/permissions';
import { requireAdminPermission } from '@/modules/authorization/services/authorization-service';
import { getSecurityOverview } from '@/modules/admin/services/session-admin-service';

export async function GET() {
  try {
    await requireAdminPermission(PERMISSIONS.SECURITY_MANAGE);
    const overview = await getSecurityOverview();
    return jsonSuccess(overview);
  } catch (error) {
    return jsonError(error);
  }
}
