import { createRequestId } from '@/lib/api/response';
import { getRequestMeta } from '@/lib/http/request-meta';
import { hashToken } from '@/lib/security/tokens';

export function adminRequestContext(request: Request) {
  const requestId = createRequestId();
  const meta = getRequestMeta(request);
  return {
    requestId,
    ipHash: meta.ipHash,
    userAgentHash: meta.userAgent ? hashToken(meta.userAgent) : undefined,
    ip: meta.ip,
    userAgent: meta.userAgent ?? undefined,
  };
}
