import { z } from 'zod';
import { jsonError, jsonSuccess } from '@/lib/api/response';
import { prisma } from '@/lib/db/prisma';
import { ValidationError } from '@/lib/errors';
import { assertTrustedOrigin } from '@/lib/security/origin';
import { requireValidSession } from '@/modules/auth/services/session-service';

const patchSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  preferredName: z.string().trim().max(80).optional().nullable(),
});

export async function GET() {
  try {
    const session = await requireValidSession();
    const profile = await prisma.profile.findUnique({
      where: { userId: session.userId },
    });

    return jsonSuccess({
      email: session.user.email,
      phone: session.user.phone,
      status: session.user.status,
      roles: session.user.roles,
      profile,
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    assertTrustedOrigin(request);
    const session = await requireValidSession();
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError('Los datos enviados no son válidos.');
    }

    const profile = await prisma.profile.update({
      where: { userId: session.userId },
      data: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        preferredName: parsed.data.preferredName ?? undefined,
      },
    });

    return jsonSuccess({ profile });
  } catch (error) {
    return jsonError(error);
  }
}
