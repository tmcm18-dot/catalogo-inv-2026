import { jsonError, jsonSuccess } from '@/lib/api/response';
import { ValidationError } from '@/lib/errors';
import { getRequestMeta } from '@/lib/http/request-meta';
import { assertTrustedOrigin } from '@/lib/security/origin';
import { forgotPasswordSchema } from '@/modules/auth/schemas/auth-schemas';
import { requestPasswordReset } from '@/modules/auth/services/auth-service';

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError('Los datos enviados no son válidos.');
    }

    const meta = getRequestMeta(request);
    await requestPasswordReset(parsed.data.identifier, meta.ipHash);

    return jsonSuccess({
      message:
        'Si existe una cuenta asociada, recibirás instrucciones para recuperar el acceso.',
    });
  } catch (error) {
    return jsonError(error);
  }
}
