import { ForbiddenError } from '@/lib/errors';

export function assertTrustedOrigin(request: Request): void {
  if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') {
    return;
  }

  const origin = request.headers.get('origin');
  const allowedOrigin = process.env.APP_ORIGIN;

  if (!allowedOrigin) {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenError('INVALID_ORIGIN');
    }
    return;
  }

  if (!origin || origin !== allowedOrigin) {
    throw new ForbiddenError('INVALID_ORIGIN');
  }
}
