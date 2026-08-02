import { expect, test, type Page } from '@playwright/test';

async function openProductFromSearch(page: Page, query: string) {
  await page.getByRole('button', { name: 'Productos' }).click();
  await page.getByPlaceholder('Buscar por código, nombre, talle, color, marca...').fill(query);
  await expect(page.getByText(`Cód. ${query}`).first()).toBeVisible();
  await page.getByRole('button', { name: 'Seleccionar' }).first().click();
  await expect(page.getByRole('dialog', { name: new RegExp(`^${query}\\b`) })).toBeVisible();
}

async function addSearchResultToCart(page: Page, query: string, quantity: string) {
  await openProductFromSearch(page, query);
  await expect(page.getByLabel('Color')).toHaveValue('Color según catálogo');
  await page.getByLabel('Cantidad').fill(quantity);
  await page.getByRole('button', { name: 'Agregar al carrito' }).click();
  await expect(page.getByRole('dialog', { name: 'Producto agregado al carrito' })).toBeVisible();
  await page.getByRole('button', { name: 'Ver carrito' }).click();
}

test.describe('carrito y overlays accesibles', () => {
  test('funcionan con storage corrupto, fallbacks y wa.me desde 320 px a escritorio', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'La matriz 320/escritorio corre una sola vez.');

    for (const viewport of [
      { width: 320, height: 720 },
      { width: 1280, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await page.evaluate(() => window.localStorage.setItem('inv2026-cart', '{bad json'));
      await page.reload();
      await expect(page.getByRole('button', { name: 'Carrito (0)' })).toBeVisible();

      await addSearchResultToCart(page, '6030', '0');
      await expect(page.getByRole('button', { name: 'Carrito (1)' })).toBeVisible();
      await expect(
        page.locator('.cartItem p').filter({ hasText: 'Color: Color según catálogo' }),
      ).toBeVisible();
      await expect(page.getByLabel('Cantidad de 6030')).toHaveValue('1');

      await page.getByRole('button', { name: 'Productos' }).click();
      await addSearchResultToCart(page, '6030', '2');
      await expect(page.getByRole('button', { name: 'Carrito (3)' })).toBeVisible();
      await expect(page.getByLabel('Cantidad de 6030')).toHaveValue('3');

      await page.getByLabel('Cantidad de 6030').fill('0');
      await expect(page.getByLabel('Cantidad de 6030')).toHaveValue('1');
      await expect(page.getByRole('button', { name: 'Carrito (1)' })).toBeVisible();

      await page.evaluate(() => {
        window.open = (url) => {
          window.localStorage.setItem('last-opened-url', String(url));
          return null;
        };
      });
      await page.getByRole('button', { name: 'Enviar pedido por WhatsApp' }).click();
      const openedUrl = await page.evaluate(() => window.localStorage.getItem('last-opened-url'));
      expect(openedUrl).toMatch(/^https:\/\/wa\.me\/5493876106268\?text=/);
      expect(decodeURIComponent(openedUrl?.split('text=')[1] ?? '')).toContain('Cantidad: 1');
      await expect(page.getByRole('button', { name: 'Carrito (0)' })).toBeVisible();
    }
  });

  test('atrapa foco y cierra overlays con Escape', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cobertura de teclado sin duplicar proyectos.');

    await page.goto('/');
    await openProductFromSearch(page, '6030');
    await expect(page.getByRole('dialog', { name: /^6030\b/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cerrar producto' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: /^6030\b/ })).toHaveCount(0);

    await page.getByRole('button', { name: 'Revista', exact: true }).click();
    await page.getByRole('button', { name: 'Ver la página a pantalla completa' }).click();
    await expect(page.getByRole('dialog', { name: 'Página 1 ampliada' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cerrar pantalla completa' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Página 1 ampliada' })).toHaveCount(0);
  });
});
