import { jsonError, jsonSuccess } from '@/lib/api/response';
import { ValidationError } from '@/lib/errors';
import { RoleCode, UserStatus } from '@prisma/client';
import { PERMISSIONS } from '@/modules/authorization/permissions';
import { requireAdminPermission } from '@/modules/authorization/services/authorization-service';
import { adminUserListQuerySchema } from '@/modules/admin/schemas/admin-schemas';
import { listAdminUsers } from '@/modules/admin/services/user-admin-service';

export async function GET(request: Request) {
  try {
    await requireAdminPermission(PERMISSIONS.USERS_READ);
    const url = new URL(request.url);
    const parsed = adminUserListQuerySchema.safeParse({
      q: url.searchParams.get('q') ?? undefined,
      status: url.searchParams.get('status') ?? undefined,
      role: url.searchParams.get('role') ?? undefined,
      take: url.searchParams.get('take') ?? undefined,
      skip: url.searchParams.get('skip') ?? undefined,
    });
    if (!parsed.success) throw new ValidationError();

    const data = await listAdminUsers({
      q: parsed.data.q,
      status: parsed.data.status as UserStatus | undefined,
      role: parsed.data.role as RoleCode | undefined,
      take: parsed.data.take,
      skip: parsed.data.skip,
    });
    return jsonSuccess(data);
  } catch (error) {
    return jsonError(error);
  }
}
