import { expect, test } from '@playwright/test';
import {
  assertHotspotsForFixture,
  getPage198Fixture,
  goToFixturePage,
  openHotspotAndAssertModal,
} from './helpers/catalog';

const fixture = getPage198Fixture();

test.describe(`Nivel 1 — página ${fixture.page} (fixture declarativo)`, () => {
  test('navega, muestra hotspots y abre producto', async ({ page }, testInfo) => {
    await goToFixturePage(page, fixture);
    await expect(page.getByText(fixture.title).first()).toBeVisible();
    await assertHotspotsForFixture(page, fixture);

    await page.screenshot({
      path: testInfo.outputPath(`page-${fixture.page}-hotspots.png`),
      fullPage: true,
    });

    const sample = fixture.hotspots[1];
    await openHotspotAndAssertModal(page, sample.ariaLabel, sample.code);

    await page.screenshot({
      path: testInfo.outputPath(`page-${fixture.page}-after-modal.png`),
      fullPage: true,
    });
  });

  test('los tres códigos del fixture están visibles', async ({ page }) => {
    await goToFixturePage(page, fixture);
    for (const code of fixture.expectations.productCodes) {
      await expect(page.locator('button.hotspot span', { hasText: code })).toBeVisible();
    }
  });
});
