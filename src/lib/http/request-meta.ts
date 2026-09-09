import { hashToken } from '@/lib/security/tokens';

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || '0.0.0.0';
  }
  return request.headers.get('x-real-ip') ?? '0.0.0.0';
}

export function getRequestMeta(request: Request) {
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent');
  return {
    ip,
    ipHash: hashToken(ip),
    userAgent,
  };
}
