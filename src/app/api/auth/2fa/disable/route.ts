import { jsonError, jsonSuccess } from '@/lib/api/response';
import { ValidationError } from '@/lib/errors';
import { assertTrustedOrigin } from '@/lib/security/origin';
import { twoFactorCodeSchema } from '@/modules/auth/schemas/auth-schemas';
import { requireValidSession } from '@/modules/auth/services/session-service';
import { disableTotp } from '@/modules/auth/services/two-factor-service';

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
    const session = await requireValidSession();
    const body = await request.json();
    const parsed = twoFactorCodeSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError('Código inválido.');
    }

    await disableTotp(session, parsed.data.code);
    return jsonSuccess({ disabled: true });
  } catch (error) {
    return jsonError(error);
  }
}
