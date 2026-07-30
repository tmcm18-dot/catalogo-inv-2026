import { expect, type Page } from '@playwright/test';
import page109 from '../fixtures/page-109.json';
import page198 from '../fixtures/page-198.json';

export type CatalogPageFixture = typeof page198 | typeof page109;
export type Page198Fixture = typeof page198;
export type Page109Fixture = typeof page109;

export function getPage198Fixture(): Page198Fixture {
  return page198;
}

export function getPage109Fixture(): Page109Fixture {
  return page109;
}

/**
 * Home cargada de verdad.
 *
 * El brand vive en `<strong>` dentro de `<header class="topbar">` anidado en
 * `<main>`, por lo que NO expone rol ARIA `banner` (HTML-AAM). Además, con
 * viewport desktop de Playwright (alto ≤ 760px) `.topbarMeta` queda
 * `display:none`, así que no se puede exigir “218 páginas / 743 productos”
 * como texto visible en ese viewport.
 */
export async function assertCatalogHomeLoaded(page: Page) {
  await expect(page.getByText('Catálogo INV 2026', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Revista' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Productos' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Página 1 de 218$/ })).toBeVisible();
  await expect(page.locator('img.pageImage')).toBeVisible();
  await expect(page.locator('img.pageImage')).toHaveAttribute(
    'src',
    /\/assets\/catalogo\/pages\/page-001\.jpg$/,
  );
}

/**
 * Página activa del visor. El título de sección (p. ej. “Acróbata · Hombres”)
 * vive en `.viewerMeta`, oculto por CSS cuando `max-height: 760px` — el viewport
 * desktop de Playwright cae en ese breakpoint. Por eso la prueba ancla en el
 * `<h1>` visible “Página N de 218” y, solo si está visible, en la miniatura
 * seleccionada (no en una coincidencia global que puede tomar el meta oculto).
 */
export async function assertActiveCatalogPage(page: Page, pageNumber: number, title?: string) {
  const heading = page.getByRole('heading', {
    name: new RegExp(`^Página ${pageNumber} de 218$`),
  });
  await expect(heading).toBeVisible();
  await expect(page.locator('img.pageImage')).toBeVisible();

  const selectedThumb = page.locator('button.selectedThumb');
  if ((await selectedThumb.count()) > 0 && (await selectedThumb.isVisible())) {
    await expect(selectedThumb.locator(':scope > span')).toHaveText(String(pageNumber));
    if (title) {
      await expect(selectedThumb.locator('small')).toHaveText(title);
    }
  }
}

/** Navega a la página del fixture vía Productos (sin deep-link ni cambios de datos). */
export async function goToFixturePage(page: Page, fixture: CatalogPageFixture) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Productos' })).toBeVisible();
  await page.getByRole('button', { name: 'Productos' }).click();
  await page
    .getByPlaceholder('Buscar por código, nombre, talle, color, marca...')
    .fill(fixture.navigation.query);
  await expect(page.getByText(`Página ${fixture.page}`).first()).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: fixture.navigation.actionLabel }).first().click();
  await assertActiveCatalogPage(page, fixture.page, fixture.title);
}

export async function assertHotspotsForFixture(page: Page, fixture: CatalogPageFixture) {
  const hotspots = page.locator('button.hotspot');
  await expect(hotspots).toHaveCount(fixture.expectations.hotspotCount);
  for (const hotspot of fixture.hotspots) {
    await expect(page.getByRole('button', { name: hotspot.ariaLabel })).toBeVisible();
  }
}

export async function openHotspotAndAssertModal(
  page: Page,
  ariaLabel: string,
  code: string,
  options?: { nameIncludes?: string; forbiddenCodes?: string[] },
) {
  await page.getByRole('button', { name: ariaLabel }).click();
  const modal = page.locator('article.productModal');
  await expect(modal).toBeVisible();
  await expect(modal.getByRole('heading', { name: new RegExp(`^${code}\\b`) })).toBeVisible();
  if (options?.nameIncludes) {
    await expect(modal.getByRole('heading')).toContainText(options.nameIncludes);
  }
  for (const forbidden of options?.forbiddenCodes ?? []) {
    if (forbidden === code) continue;
    await expect(modal.getByRole('heading')).not.toHaveText(new RegExp(`^${forbidden}\\b`));
  }
  await modal.locator('button.close').click();
  await expect(modal).toHaveCount(0);
}

function commercialNameIncludes(hotspot: CatalogPageFixture['hotspots'][number]): string | undefined {
  if ('commercialCode' in hotspot && typeof hotspot.commercialCode === 'string') {
    if (hotspot.commercialCode !== hotspot.code) return hotspot.commercialCode;
    return undefined;
  }
  // Compat page-198: folio interno 198 ↔ tipográfico 5123
  if (hotspot.code === '198') return '5123';
  return undefined;
}

/** Abre cada hotspot del fixture y verifica código / nombre comercial sin vecinos. */
export async function openAllFixtureHotspots(page: Page, fixture: CatalogPageFixture) {
  const codes = fixture.hotspots.map((h) => h.code);
  for (const hotspot of fixture.hotspots) {
    await openHotspotAndAssertModal(page, hotspot.ariaLabel, hotspot.code, {
      nameIncludes: commercialNameIncludes(hotspot),
      forbiddenCodes: codes,
    });
  }
}

/** Carrito en 0 y visor usable (scroll / zoom / nav) sin asserts de Production. */
export async function assertViewerUsableAndEmptyCart(page: Page) {
  await expect(page.getByRole('button', { name: /Carrito \(0\)/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Página siguiente' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Ampliar' })).toBeVisible();
  await page.getByRole('button', { name: 'Ampliar' }).click();
  await expect(page.getByRole('button', { name: 'Ampliar' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Ajustar' }).click();
  await expect(page.getByRole('button', { name: 'Ajustar' })).toHaveAttribute('aria-pressed', 'true');
}
