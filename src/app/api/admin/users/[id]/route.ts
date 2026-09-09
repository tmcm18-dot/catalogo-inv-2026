import { jsonError, jsonSuccess } from '@/lib/api/response';
import { PERMISSIONS } from '@/modules/authorization/permissions';
import { requireAdminPermission } from '@/modules/authorization/services/authorization-service';
import { getAdminUserDetail } from '@/modules/admin/services/user-admin-service';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAdminPermission(PERMISSIONS.USERS_READ);
    const { id } = await params;
    const data = await getAdminUserDetail(id);
    return jsonSuccess(data);
  } catch (error) {
    return jsonError(error);
  }
}
