import { expect, type Page } from '@playwright/test';
import page198 from '../fixtures/page-198.json';

export type Page198Fixture = typeof page198;

export function getPage198Fixture(): Page198Fixture {
  return page198;
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
export async function goToFixturePage(page: Page, fixture: Page198Fixture = page198) {
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

export async function assertHotspotsForFixture(page: Page, fixture: Page198Fixture = page198) {
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

/** Abre cada hotspot del fixture y verifica código / nombre comercial sin vecinos. */
export async function openAllFixtureHotspots(page: Page, fixture: Page198Fixture = page198) {
  const codes = fixture.hotspots.map((h) => h.code);
  for (const hotspot of fixture.hotspots) {
    const nameIncludes = hotspot.code === '198' ? '5123' : undefined;
    await openHotspotAndAssertModal(page, hotspot.ariaLabel, hotspot.code, {
      nameIncludes,
      forbiddenCodes: codes,
    });
  }
}
