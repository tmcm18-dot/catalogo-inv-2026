import { test, expect } from '@playwright/test';
import {
  adminLogin,
  apiJson,
  envOrSkip,
  hasAuthE2EEnv,
  totpDistinct,
  totpNow,
} from './helpers/auth';

/**
 * Auth / admin security (Nivel 1 ampliado + flujos autenticados).
 *
 * Local smoke (sin fixtures):
 *   PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npx playwright test e2e/admin-security.spec.ts
 *
 * Flujos autenticados (requiere DB + seed):
 *   npm run e2e:seed-auth
 *   (exportar E2E_* y secretos TOTP; ver docs/security.md)
 *   PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npx playwright test e2e/admin-security.spec.ts --workers=1
 *
 * Never Production. No WhatsApp orders.
 */
test.describe('admin security access control', () => {
  test('unauthenticated visit to /admin redirects to login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/iniciar-sesion/);
  });

  test('unauthenticated visit to /admin/seguridad/usuarios redirects to login', async ({
    page,
  }) => {
    await page.goto('/admin/seguridad/usuarios');
    await expect(page).toHaveURL(/\/admin\/iniciar-sesion/);
  });

  test('customer account area stays separate from admin shell', async ({ page }) => {
    await page.goto('/cuenta/iniciar-sesion');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page).not.toHaveURL(/\/admin\//);
  });

  test('admin login page renders without exposing secrets', async ({ page }) => {
    await page.goto('/admin/iniciar-sesion');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const body = await page.locator('body').innerText();
    expect(body.toLowerCase()).not.toContain('passwordhash');
    expect(body.toLowerCase()).not.toContain('totp_encryption');
    expect(body.toLowerCase()).not.toContain('turnstile_secret');
  });
});

test.describe('admin security authenticated flows', () => {
  test.skip(!hasAuthE2EEnv(), 'E2E_* auth fixture env vars not configured');

  test('1) customer cannot use admin login', async ({ page }) => {
    await page.goto('/admin/iniciar-sesion');
    await page.locator('input[name="identifier"]').fill(envOrSkip('E2E_CUSTOMER_EMAIL'));
    await page.locator('input[name="password"]').fill(envOrSkip('E2E_CUSTOMER_PASSWORD'));
    await page.getByRole('button', { name: /Continuar/i }).click();
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/admin\/iniciar-sesion/);
  });

  test('2) admin without 2FA is sent to setup', async ({ page }) => {
    await adminLogin(page, {
      email: envOrSkip('E2E_ADMIN_EMAIL'),
      password: envOrSkip('E2E_ADMIN_PASSWORD'),
    });
    await page.waitForURL(/\/admin\/seguridad(\/2fa)?/, { timeout: 45_000 });
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/seguridad/);
  });

  test('3) admin with 2FA reaches panel', async ({ page }) => {
    await adminLogin(page, {
      email: envOrSkip('E2E_ADMIN_2FA_EMAIL'),
      password: envOrSkip('E2E_ADMIN_2FA_PASSWORD'),
      totpSecret: envOrSkip('E2E_ADMIN_2FA_TOTP_SECRET'),
    });
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: /Panel administrador/i })).toBeVisible();
  });

  test('4) SUPERADMIN completes critical action via reauth', async ({ page }) => {
    await adminLogin(page, {
      email: envOrSkip('E2E_SUPER_EMAIL'),
      password: envOrSkip('E2E_SUPER_PASSWORD'),
      totpSecret: envOrSkip('E2E_SUPER_TOTP_SECRET'),
    });

    // Resolve Super B user id from list API
    const list = await page.request.get('/api/admin/users?q=SuperB&take=10');
    expect(list.ok()).toBeTruthy();
    const listBody = await list.json();
    const target = listBody.data.users.find(
      (u: { email?: string }) => u.email === envOrSkip('E2E_SUPER_B_EMAIL'),
    );
    expect(target?.id).toBeTruthy();

    await page.goto(`/admin/seguridad/usuarios/${target.id}`);
    await expect(page.getByTestId('user-email')).toHaveText(envOrSkip('E2E_SUPER_B_EMAIL'));

    await page.getByTestId('admin-reason').fill('E2E bloqueo temporal de prueba');
    await page.getByTestId('admin-action-block').click();
    await expect(page.getByRole('heading', { name: /Reautenticación/i })).toBeVisible();

    const reauth = page.getByRole('dialog');
    await reauth.locator('input[type="password"]').fill(envOrSkip('E2E_SUPER_PASSWORD'));
    await reauth
      .locator('input[autocomplete="one-time-code"]')
      .fill(await totpNow(envOrSkip('E2E_SUPER_TOTP_SECRET')));
    await reauth.locator('button[type="submit"]').click();

    await expect(page.getByRole('status')).toContainText(/completada|Bloqueo/i, {
      timeout: 15_000,
    });
  });

  test('5) withdrawing last active SUPERADMIN role is rejected', async ({ page }) => {
    await adminLogin(page, {
      email: envOrSkip('E2E_SUPER_EMAIL'),
      password: envOrSkip('E2E_SUPER_PASSWORD'),
      totpSecret: envOrSkip('E2E_SUPER_TOTP_SECRET'),
    });

    const list = await page.request.get('/api/admin/users?role=SUPERADMIN&take=20');
    const listBody = await list.json();
    const superB = listBody.data.users.find(
      (u: { email?: string }) => u.email === envOrSkip('E2E_SUPER_B_EMAIL'),
    );
    expect(superB?.id).toBeTruthy();

    // Suspend SuperB so only SuperA remains active SUPERADMIN.
    const totp = await totpNow(envOrSkip('E2E_SUPER_TOTP_SECRET'));
    const grant = await apiJson<{
      data: { grantToken: string };
      error?: { message: string };
    }>(page.request, 'POST', '/api/admin/reauth/confirm', {
      scope: 'users.suspend_admin',
      password: envOrSkip('E2E_SUPER_PASSWORD'),
      totpCode: totp,
    });
    expect(grant.ok).toBeTruthy();

    const suspend = await apiJson(
      page.request,
      'POST',
      `/api/admin/users/${superB.id}/suspend`,
      {
        reason: 'E2E suspend to isolate last superadmin',
        grantToken: grant.body.data.grantToken,
      },
    );
    expect(suspend.ok).toBeTruthy();

    // Attempt to revoke SUPERADMIN from suspended SuperB while only one active remains.
    // Wait for a new TOTP window — same-period codes can fail after the first reauth.
    const totp2 = await totpDistinct(envOrSkip('E2E_SUPER_TOTP_SECRET'), totp);
    const roleGrant = await apiJson<{ data: { grantToken: string } }>(
      page.request,
      'POST',
      '/api/admin/reauth/confirm',
      {
        scope: 'roles.manage',
        password: envOrSkip('E2E_SUPER_PASSWORD'),
        totpCode: totp2,
      },
    );
    expect(roleGrant.ok).toBeTruthy();

    const revoke = await apiJson<{ error?: { code?: string; message?: string } }>(
      page.request,
      'DELETE',
      `/api/admin/users/${superB.id}/roles`,
      {
        reason: 'E2E attempt remove last super role',
        roleCode: 'SUPERADMIN',
        grantToken: roleGrant.body.data.grantToken,
      },
    );
    expect(revoke.ok).toBeFalsy();
    expect(revoke.body.error?.code === 'LAST_SUPERADMIN' || revoke.status === 403).toBeTruthy();

    // Cleanup: reactivate SuperB for subsequent runs
    await apiJson(page.request, 'POST', `/api/admin/users/${superB.id}/reactivate`, {
      reason: 'E2E cleanup reactivate super B',
    });
  });

  test('6) sensitive grant cannot be reused', async ({ page }) => {
    await adminLogin(page, {
      email: envOrSkip('E2E_SUPER_EMAIL'),
      password: envOrSkip('E2E_SUPER_PASSWORD'),
      totpSecret: envOrSkip('E2E_SUPER_TOTP_SECRET'),
    });

    const list = await page.request.get(
      `/api/admin/users?q=${encodeURIComponent(envOrSkip('E2E_SUPER_B_EMAIL'))}`,
    );
    const listBody = await list.json();
    const superB = listBody.data.users[0];
    expect(superB?.id).toBeTruthy();

    const totp = await totpNow(envOrSkip('E2E_SUPER_TOTP_SECRET'));
    const grant = await apiJson<{ data: { grantToken: string } }>(
      page.request,
      'POST',
      '/api/admin/reauth/confirm',
      {
        scope: 'sessions.revoke_admin',
        password: envOrSkip('E2E_SUPER_PASSWORD'),
        totpCode: totp,
      },
    );
    expect(grant.ok).toBeTruthy();
    const token = grant.body.data.grantToken;

    const first = await apiJson(
      page.request,
      'POST',
      `/api/admin/users/${superB.id}/sessions/revoke-all`,
      { reason: 'E2E revoke sessions once', grantToken: token },
    );
    expect(first.ok).toBeTruthy();

    const second = await apiJson<{ error?: { code?: string } }>(
      page.request,
      'POST',
      `/api/admin/users/${superB.id}/sessions/revoke-all`,
      { reason: 'E2E reuse grant should fail', grantToken: token },
    );
    expect(second.ok).toBeFalsy();
    expect(
      second.body.error?.code === 'REAUTH_REQUIRED' || second.status === 403,
    ).toBeTruthy();
  });
});
