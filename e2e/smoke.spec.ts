import { expect, test } from '@playwright/test';

test.describe('Nivel 1 — smoke Preview', () => {
  test('home carga el catálogo', async ({ page }, testInfo) => {
    await page.goto('/');
    await expect(page.getByRole('banner').getByText('Catálogo INV 2026')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Página 1 de/ })).toBeVisible();
    await expect(page.locator('img.pageImage')).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath('home.png'),
      fullPage: true,
    });
  });

  test('/catalog-review responde 404 en Preview', async ({ page, request }, testInfo) => {
    const response = await request.get('/catalog-review');
    expect(response.status()).toBe(404);

    await page.goto('/catalog-review');
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath('catalog-review-404.png'),
      fullPage: true,
    });
  });
});
