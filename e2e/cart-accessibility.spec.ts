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

      const cartQuantity = page.getByLabel('Cantidad de 6030');
      await cartQuantity.fill('');
      await expect(cartQuantity).toHaveValue('');
      await cartQuantity.pressSequentially('2');
      await expect(cartQuantity).toHaveValue('2');
      await cartQuantity.blur();
      await expect(cartQuantity).toHaveValue('2');
      await expect(page.getByRole('button', { name: 'Carrito (2)' })).toBeVisible();

      await cartQuantity.fill('0');
      await expect(cartQuantity).toHaveValue('0');
      await cartQuantity.blur();
      await expect(cartQuantity).toHaveValue('1');
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

  test('permite reemplazar 1 por 2, agregar con vacío y fusionar la misma variante', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'La regresión de cantidad corre una sola vez.');

    await page.goto('/');
    await openProductFromSearch(page, '6030');
    const productQuantity = page.getByLabel('Cantidad');
    await expect(productQuantity).toHaveValue('1');
    await productQuantity.fill('');
    await expect(productQuantity).toHaveValue('');
    await productQuantity.pressSequentially('2');
    await expect(productQuantity).toHaveValue('2');
    await page.getByRole('button', { name: 'Agregar al carrito' }).click();
    await page.getByRole('button', { name: 'Ver carrito' }).click();
    await expect(page.getByRole('button', { name: 'Carrito (2)' })).toBeVisible();
    await expect(page.getByLabel('Cantidad de 6030')).toHaveValue('2');

    await page.getByRole('button', { name: 'Vaciar carrito' }).click();
    await expect(page.getByRole('button', { name: 'Carrito (0)' })).toBeVisible();

    await openProductFromSearch(page, '6030');
    const emptyQuantity = page.getByLabel('Cantidad');
    await emptyQuantity.fill('');
    await expect(emptyQuantity).toHaveValue('');
    await page.getByRole('button', { name: 'Agregar al carrito' }).click();
    await page.getByRole('button', { name: 'Ver carrito' }).click();
    await expect(page.getByLabel('Cantidad de 6030')).toHaveValue('1');

    await openProductFromSearch(page, '6030');
    await page.getByRole('button', { name: 'Agregar al carrito' }).click();
    await page.getByRole('button', { name: 'Ver carrito' }).click();
    await expect(page.locator('.cartItem')).toHaveCount(1);
    await expect(page.getByLabel('Cantidad de 6030')).toHaveValue('2');
    await expect(page.getByRole('button', { name: 'Carrito (2)' })).toBeVisible();
  });

  test('normaliza vacío, cero, negativos y valores no enteros al perder foco', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'La regresión de cantidad corre una sola vez.');

    await page.goto('/');
    await openProductFromSearch(page, '6030');
    const quantity = page.getByLabel('Cantidad');

    await quantity.fill('');
    await expect(quantity).toHaveValue('');
    await quantity.blur();
    await expect(quantity).toHaveValue('1');

    for (const invalidValue of ['0', '-3', '2.5']) {
      await quantity.fill(invalidValue);
      await expect(quantity).toHaveValue(invalidValue);
      await quantity.blur();
      await expect(quantity).toHaveValue('1');
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
