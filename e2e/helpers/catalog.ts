import { expect, type Page } from '@playwright/test';
import page198 from '../fixtures/page-198.json';

export type Page198Fixture = typeof page198;

export function getPage198Fixture(): Page198Fixture {
  return page198;
}

/** Navega a la página del fixture vía Productos (sin deep-link ni cambios de datos). */
export async function goToFixturePage(page: Page, fixture: Page198Fixture = page198) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Productos' })).toBeVisible();
  await page.getByRole('button', { name: 'Productos' }).click();
  await page
    .getByPlaceholder('Buscar por código, nombre, talle, color, marca...')
    .fill(fixture.navigation.query);
  await expect(page.getByText(`Página ${fixture.page}`).first()).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: fixture.navigation.actionLabel }).first().click();
  await expect(page.getByRole('heading', { name: new RegExp(fixture.expectations.headingPattern) })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.locator('img.pageImage')).toBeVisible();
}

export async function assertHotspotsForFixture(page: Page, fixture: Page198Fixture = page198) {
  const hotspots = page.locator('button.hotspot');
  await expect(hotspots).toHaveCount(fixture.expectations.hotspotCount);
  for (const hotspot of fixture.hotspots) {
    await expect(page.getByRole('button', { name: hotspot.ariaLabel })).toBeVisible();
  }
}

export async function openHotspotAndAssertModal(page: Page, ariaLabel: string, code: string) {
  await page.getByRole('button', { name: ariaLabel }).click();
  const modal = page.locator('article.productModal');
  await expect(modal).toBeVisible();
  await expect(modal.getByRole('heading', { name: new RegExp(`^${code}\\b`) })).toBeVisible();
  await modal.locator('button.close').click();
  await expect(modal).toHaveCount(0);
}
