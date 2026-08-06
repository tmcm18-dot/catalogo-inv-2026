import { jsonError, jsonSuccess } from '@/lib/api/response';
import { PERMISSIONS } from '@/modules/authorization/permissions';
import { requireAdminPermission } from '@/modules/authorization/services/authorization-service';
import {
  listLoginAttempts,
  listSecurityEvents,
} from '@/modules/admin/services/session-admin-service';

export async function GET(request: Request) {
  try {
    await requireAdminPermission(PERMISSIONS.SECURITY_MANAGE);
    const url = new URL(request.url);
    const take = url.searchParams.get('take')
      ? Number(url.searchParams.get('take'))
      : 50;

    const [loginAttempts, securityEvents] = await Promise.all([
      listLoginAttempts({ take }),
      listSecurityEvents({ take }),
    ]);

    return jsonSuccess({ loginAttempts, securityEvents });
  } catch (error) {
    return jsonError(error);
  }
}
