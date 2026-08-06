export type CaptchaVerifyInput = {
  token: string | null | undefined;
  ip?: string | null;
};

export type CaptchaVerifyResult = {
  success: boolean;
  provider: string;
  reason?: string;
};

export interface CaptchaProvider {
  readonly name: string;
  verify(input: CaptchaVerifyInput): Promise<CaptchaVerifyResult>;
  /** Public site key for client widgets (never the secret). */
  getSiteKey(): string | null;
}

function resolvePublicSiteKey(): string | null {
  return (
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ||
    process.env.TURNSTILE_SITE_KEY?.trim() ||
    null
  );
}

/**
 * Safe local/dev provider. Accepts "mock-ok" / "mock-*" tokens.
 * Forbidden in production unless CAPTCHA_ALLOW_MOCK=1.
 */
export class MockCaptchaProvider implements CaptchaProvider {
  readonly name = 'mock';

  getSiteKey(): string | null {
    return resolvePublicSiteKey() || 'mock-site-key';
  }

  async verify(input: CaptchaVerifyInput): Promise<CaptchaVerifyResult> {
    const token = input.token?.trim() ?? '';
    if (!token) {
      return { success: false, provider: this.name, reason: 'MISSING_TOKEN' };
    }
    if (token === 'mock-ok' || token.startsWith('mock-')) {
      return { success: true, provider: this.name };
    }
    return { success: false, provider: this.name, reason: 'INVALID_TOKEN' };
  }
}

export class TurnstileCaptchaProvider implements CaptchaProvider {
  readonly name = 'turnstile';

  getSiteKey(): string | null {
    return resolvePublicSiteKey();
  }

  async verify(input: CaptchaVerifyInput): Promise<CaptchaVerifyResult> {
    const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
    const token = input.token?.trim() ?? '';
    if (!secret) {
      return { success: false, provider: this.name, reason: 'MISSING_SECRET' };
    }
    if (!token) {
      return { success: false, provider: this.name, reason: 'MISSING_TOKEN' };
    }

    const body = new URLSearchParams();
    body.set('secret', secret);
    body.set('response', token);
    if (input.ip) body.set('remoteip', input.ip);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!res.ok) {
      return { success: false, provider: this.name, reason: 'SITEVERIFY_HTTP' };
    }

    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] };
    if (!data.success) {
      return {
        success: false,
        provider: this.name,
        reason: (data['error-codes'] ?? ['FAILED']).join(','),
      };
    }
    return { success: true, provider: this.name };
  }
}

let cachedProvider: CaptchaProvider | null = null;

export function getCaptchaProvider(): CaptchaProvider {
  if (cachedProvider) return cachedProvider;

  const name = (process.env.CAPTCHA_PROVIDER ?? 'mock').toLowerCase();
  const allowMockInProd = process.env.CAPTCHA_ALLOW_MOCK === '1';

  if (name === 'turnstile') {
    cachedProvider = new TurnstileCaptchaProvider();
  } else if (name === 'mock') {
    if (process.env.NODE_ENV === 'production' && !allowMockInProd) {
      // Refuse silent mock acceptance in production builds/runtimes.
      cachedProvider = new TurnstileCaptchaProvider();
    } else {
      cachedProvider = new MockCaptchaProvider();
    }
  } else {
    cachedProvider = new TurnstileCaptchaProvider();
  }
  return cachedProvider;
}

export function setCaptchaProviderForTests(provider: CaptchaProvider | null): void {
  cachedProvider = provider;
}

export async function verifyCaptchaIfRequired(input: {
  required: boolean;
  token?: string | null;
  ip?: string | null;
}): Promise<CaptchaVerifyResult | null> {
  if (!input.required) return null;
  return getCaptchaProvider().verify({ token: input.token, ip: input.ip });
}
