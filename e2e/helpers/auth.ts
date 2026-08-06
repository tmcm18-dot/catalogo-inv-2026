import { generate } from 'otplib';

export function envOrSkip(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing ${name}. Seed fixtures with scripts/e2e/seed-auth-fixtures.mjs and export E2E_* vars.`,
    );
  }
  return value;
}

export function hasAuthE2EEnv(): boolean {
  return Boolean(
    process.env.E2E_SUPER_EMAIL &&
      process.env.E2E_SUPER_PASSWORD &&
      process.env.E2E_SUPER_TOTP_SECRET &&
      process.env.E2E_SUPER_B_EMAIL &&
      process.env.E2E_SUPER_B_PASSWORD &&
      process.env.E2E_SUPER_B_TOTP_SECRET &&
      process.env.E2E_ADMIN_EMAIL &&
      process.env.E2E_ADMIN_PASSWORD &&
      process.env.E2E_ADMIN_2FA_EMAIL &&
      process.env.E2E_ADMIN_2FA_PASSWORD &&
      process.env.E2E_ADMIN_2FA_TOTP_SECRET &&
      process.env.E2E_CUSTOMER_EMAIL &&
      process.env.E2E_CUSTOMER_PASSWORD,
  );
}

export async function totpNow(secret: string): Promise<string> {
  return generate({ secret });
}

/** Wait until a TOTP distinct from `previous` (avoids same-window reuse). */
export async function totpDistinct(
  secret: string,
  previous?: string,
): Promise<string> {
  let code = await totpNow(secret);
  if (!previous || code !== previous) return code;
  const deadline = Date.now() + 35_000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 1_000));
    code = await totpNow(secret);
    if (code !== previous) return code;
  }
  return code;
}

export async function adminLogin(
  page: import('@playwright/test').Page,
  input: { email: string; password: string; totpSecret?: string },
) {
  await page.goto('/admin/iniciar-sesion');
  await page.locator('input[name="identifier"]').fill(input.email);
  await page.locator('input[name="password"]').fill(input.password);
  await page.getByRole('button', { name: /Continuar/i }).click();

  if (input.totpSecret) {
    await page.waitForURL(/\/admin\/verificar-2fa/, { timeout: 45_000 });
    const codeInput = page.locator('input[name="code"]');
    const verifyBtn = page.getByRole('button', { name: /Verificar/i });
    // Generate immediately before submit to avoid TOTP window edge races.
    await codeInput.fill(await totpNow(input.totpSecret));
    await verifyBtn.click();
    try {
      await page.waitForURL(/\/admin(?!\/iniciar-sesion|\/verificar-2fa)/, {
        timeout: 20_000,
      });
    } catch {
      // One retry with a fresh code if the first token was near expiry.
      await codeInput.fill(await totpNow(input.totpSecret));
      await verifyBtn.click();
      await page.waitForURL(/\/admin(?!\/iniciar-sesion|\/verificar-2fa)/, {
        timeout: 45_000,
      });
    }
  } else {
    await page.waitForURL(/\/admin\/(?!iniciar-sesion)/, { timeout: 45_000 });
  }
}

export async function apiJson<T>(
  request: import('@playwright/test').APIRequestContext,
  method: 'GET' | 'POST' | 'DELETE',
  url: string,
  data?: unknown,
): Promise<{ ok: boolean; status: number; body: T }> {
  const origin =
    process.env.APP_ORIGIN?.replace(/\/$/, '') ||
    process.env.PLAYWRIGHT_BASE_URL?.replace(/\/$/, '') ||
    'http://127.0.0.1:3000';
  const response = await request.fetch(url, {
    method,
    data,
    headers: {
      'content-type': 'application/json',
      origin,
    },
  });
  const body = (await response.json()) as T;
  return { ok: response.ok(), status: response.status(), body };
}
