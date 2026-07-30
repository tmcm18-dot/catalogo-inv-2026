import { expect, test } from '@playwright/test';
import {
  assertHotspotsForFixture,
  assertViewerUsableAndEmptyCart,
  getPage109Fixture,
  goToFixturePage,
  openAllFixtureHotspots,
} from './helpers/catalog';

const fixture = getPage109Fixture();

test.describe(`Nivel 1 — página ${fixture.page} (fixture declarativo)`, () => {
  test('navega, muestra hotspots y abre producto', async ({ page }, testInfo) => {
    const consoleErrors: string[] = [];
    const failedRequests: string[] = [];
    page.on('pageerror', (err) => consoleErrors.push(err.message));
    page.on('requestfailed', (req) => {
      const url = req.url();
      if (url.includes('/assets/catalogo/') || url.includes('/_next/')) {
        failedRequests.push(`${req.failure()?.errorText ?? 'failed'} ${url}`);
      }
    });

    await goToFixturePage(page, fixture);
    await assertHotspotsForFixture(page, fixture);
    await assertViewerUsableAndEmptyCart(page);

    // Un solo hotspot con código interno/comercial 161 (columna derecha).
    await expect(page.locator('button.hotspot span', { hasText: '161' })).toHaveCount(1);

    await page.screenshot({
      path: testInfo.outputPath(`page-${fixture.page}-hotspots.png`),
      fullPage: true,
    });

    await openAllFixtureHotspots(page, fixture);

    await page.screenshot({
      path: testInfo.outputPath(`page-${fixture.page}-after-modal.png`),
      fullPage: true,
    });

    expect(consoleErrors, `errores JS: ${consoleErrors.join('; ')}`).toEqual([]);
    expect(failedRequests, `requests críticos: ${failedRequests.join('; ')}`).toEqual([]);
  });

  test('los cuatro códigos del fixture están visibles', async ({ page }) => {
    await goToFixturePage(page, fixture);
    for (const code of fixture.expectations.productCodes) {
      await expect(page.locator('button.hotspot span', { hasText: code })).toBeVisible();
    }
  });

  test('bloque superior abre 101 comercial (productId 109), no un 161 vecino', async ({
    page,
  }) => {
    await goToFixturePage(page, fixture);
    const top = fixture.hotspots.find((h) => h.id === 'hotspot-109')!;
    await page.getByRole('button', { name: top.ariaLabel }).click();
    const modal = page.locator('article.productModal');
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('heading', { name: /^109\b/ })).toBeVisible();
    await expect(modal.getByRole('heading')).toContainText('101');
    await expect(modal.getByRole('heading')).not.toHaveText(/^161\b/);
    await modal.locator('button.close').click();
  });
});
