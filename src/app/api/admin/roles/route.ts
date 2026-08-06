import { jsonError, jsonSuccess } from '@/lib/api/response';
import { prisma } from '@/lib/db/prisma';
import { PERMISSIONS } from '@/modules/authorization/permissions';
import { requireAdminPermission } from '@/modules/authorization/services/authorization-service';

export async function GET() {
  try {
    await requireAdminPermission(PERMISSIONS.ROLES_READ);
    const roles = await prisma.role.findMany({
      include: {
        permissions: { include: { permission: true } },
      },
      orderBy: { code: 'asc' },
    });

    return jsonSuccess({
      roles: roles.map((role) => ({
        code: role.code,
        name: role.name,
        description: role.description,
        permissions: role.permissions.map((rp) => rp.permission.code),
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}
