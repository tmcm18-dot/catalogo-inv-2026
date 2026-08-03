import { expect, test, type BrowserContext, type Locator, type Page } from '@playwright/test';
import { assertActiveCatalogPage, getPage109Fixture, goToFixturePage } from './helpers/catalog';

const fixture = getPage109Fixture();

async function getViewerMetrics(page: Page) {
  return page.evaluate(() => {
    const topbar = document.querySelector<HTMLElement>('.topbar');
    const brand = document.querySelector<HTMLElement>('.brand');
    const topbarNav = document.querySelector<HTMLElement>('.topbar nav');
    const viewerHeader = document.querySelector<HTMLElement>('.viewerHeader');
    const scroll = document.querySelector<HTMLElement>('.catalogScroll');
    const stage = document.querySelector<HTMLElement>('.catalogPageStage');
    const image = document.querySelector<HTMLImageElement>('.catalogPageStage > img.pageImage');
    const controls = [
      ...document.querySelectorAll<HTMLElement>('.topbar nav button, .topbar nav summary'),
      ...document.querySelectorAll<HTMLElement>('.viewerTools button'),
      ...document.querySelectorAll<HTMLElement>('.pageNav'),
    ];
    if (!topbar || !brand || !topbarNav || !viewerHeader || !scroll || !stage || !image) {
      throw new Error('Estructura incompleta del visor de la revista.');
    }

    const topbarRect = topbar.getBoundingClientRect();
    const brandRect = brand.getBoundingClientRect();
    const navRect = topbarNav.getBoundingClientRect();
    const headerRect = viewerHeader.getBoundingClientRect();
    const scrollRect = scroll.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    const withinViewport = (rect: DOMRect) =>
      rect.top >= -0.5 &&
      rect.left >= -0.5 &&
      rect.right <= window.innerWidth + 0.5 &&
      rect.bottom <= window.innerHeight + 0.5;

    return {
      topbarHeight: topbarRect.height,
      brandAndNavShareRow:
        brandRect.top < navRect.bottom && brandRect.bottom > navRect.top,
      headerWithinViewport: withinViewport(headerRect),
      controlsWithinViewport: controls.every((control) => withinViewport(control.getBoundingClientRect())),
      controlsMeetTouchTarget: controls.every((control) => {
        const rect = control.getBoundingClientRect();
        return rect.width >= 44 && rect.height >= 44;
      }),
      stageWidth: stageRect.width,
      stageHeight: stageRect.height,
      renderedRatio: stageRect.width / stageRect.height,
      naturalRatio: image.naturalWidth / image.naturalHeight,
      stageFitsScroll:
        stageRect.left >= scrollRect.left - 0.5 &&
        stageRect.top >= scrollRect.top - 0.5 &&
        stageRect.right <= scrollRect.right + 0.5 &&
        stageRect.bottom <= scrollRect.bottom + 0.5,
      documentHasNoOverflow:
        document.documentElement.scrollWidth <= window.innerWidth &&
        document.documentElement.scrollHeight <= window.innerHeight,
      mode: document.querySelector<HTMLElement>('.catalogReaderShell')?.className ?? '',
      imageCount: document.querySelectorAll('.catalogReaderShell img.pageImage').length,
    };
  });
}

async function getHotspotAlignment(hotspot: Locator) {
  return hotspot.evaluate((element) => {
    const stage = element.closest<HTMLElement>('.catalogPageStage');
    if (!stage) throw new Error('El hotspot no pertenece a una página del catálogo.');
    const stageRect = stage.getBoundingClientRect();
    const hotspotRect = element.getBoundingClientRect();
    return {
      left: ((hotspotRect.left - stageRect.left) / stageRect.width) * 100,
      top: ((hotspotRect.top - stageRect.top) / stageRect.height) * 100,
      width: (hotspotRect.width / stageRect.width) * 100,
      height: (hotspotRect.height / stageRect.height) * 100,
    };
  });
}

function expectSameAlignment(
  actual: Awaited<ReturnType<typeof getHotspotAlignment>>,
  expected: Awaited<ReturnType<typeof getHotspotAlignment>>,
) {
  for (const property of ['left', 'top', 'width', 'height'] as const) {
    expect(Math.abs(actual[property] - expected[property])).toBeLessThan(0.1);
  }
}

async function swipePageLeft(context: BrowserContext, page: Page) {
  const scrollBox = await page.locator('.catalogScroll').boundingBox();
  if (!scrollBox) throw new Error('No se pudo medir el área de gestos del catálogo.');

  const session = await context.newCDPSession(page);
  await session.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  const startX = scrollBox.x + scrollBox.width * 0.72;
  const endX = scrollBox.x + scrollBox.width * 0.28;
  const y = scrollBox.y + scrollBox.height * 0.5;
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: startX, y, id: 0 }],
  });
  for (let step = 1; step <= 6; step += 1) {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: startX + ((endX - startX) * step) / 6, y, id: 0 }],
    });
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await session.detach();
}

test.describe('visor de revista en orientación horizontal', () => {
  test('usa el ancho en 667x375 y navega con clic, toque, gesto y teclado', async ({
    context,
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chromium', 'Los gestos táctiles corren una sola vez.');

    await page.setViewportSize({ width: 667, height: 375 });
    await page.goto('/');
    await assertActiveCatalogPage(page, 1);
    await expect(page.getByRole('button', { name: 'Lectura', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    const reading = await getViewerMetrics(page);
    expect(reading.topbarHeight).toBeLessThan(70);
    expect(reading.brandAndNavShareRow).toBe(true);
    expect(reading.headerWithinViewport).toBe(true);
    expect(reading.controlsWithinViewport).toBe(true);
    expect(reading.controlsMeetTouchTarget).toBe(true);
    expect(reading.stageWidth).toBeGreaterThanOrEqual(400);
    expect(reading.renderedRatio).toBeCloseTo(reading.naturalRatio, 2);
    expect(reading.documentHasNoOverflow).toBe(true);
    expect(reading.imageCount).toBe(1);

    await page.getByRole('button', { name: 'Ajustar', exact: true }).tap();
    await expect(page.getByRole('button', { name: 'Ajustar', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const fitted = await getViewerMetrics(page);
    expect(fitted.stageFitsScroll).toBe(true);
    expect(fitted.renderedRatio).toBeCloseTo(fitted.naturalRatio, 2);

    await page.getByRole('button', { name: 'Página siguiente' }).click();
    await assertActiveCatalogPage(page, 2);
    await page.getByRole('button', { name: 'Página anterior' }).tap();
    await assertActiveCatalogPage(page, 1);

    await page.keyboard.press('ArrowRight');
    await assertActiveCatalogPage(page, 2);
    await swipePageLeft(context, page);
    await assertActiveCatalogPage(page, 3);
    await expect(page.locator('article.productModal')).toHaveCount(0);
  });

  test('recalcula una tablet al girar y conserva página, zoom, carrito y hotspots', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'La rotación de tablet corre una sola vez.');

    await page.setViewportSize({ width: 768, height: 1024 });
    await goToFixturePage(page, fixture);
    await expect(page.getByRole('button', { name: 'Ajustar', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    const hotspot = page.getByRole('button', { name: fixture.hotspots[0].ariaLabel });
    const portraitAlignment = await getHotspotAlignment(hotspot);
    await hotspot.click();
    await page.getByRole('button', { name: 'Agregar al carrito' }).click();
    await page.getByRole('button', { name: 'Seguir viendo' }).click();
    await expect(page.getByRole('button', { name: 'Carrito (1)' })).toBeVisible();

    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(page.getByRole('button', { name: 'Lectura', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await assertActiveCatalogPage(page, fixture.page, fixture.title);
    await expect(page.getByRole('button', { name: 'Carrito (1)' })).toBeVisible();
    const landscapeAlignment = await getHotspotAlignment(hotspot);
    expectSameAlignment(landscapeAlignment, portraitAlignment);

    const tablet = await getViewerMetrics(page);
    expect(tablet.brandAndNavShareRow).toBe(true);
    expect(tablet.headerWithinViewport).toBe(true);
    expect(tablet.controlsWithinViewport).toBe(true);
    expect(tablet.controlsMeetTouchTarget).toBe(true);
    expect(tablet.stageWidth).toBeGreaterThanOrEqual(400);
    expect(tablet.renderedRatio).toBeCloseTo(tablet.naturalRatio, 2);
    expect(tablet.documentHasNoOverflow).toBe(true);

    await page.getByRole('button', { name: 'Aumentar zoom' }).click();
    await expect(page.locator('.zoomControls > span')).toHaveText('125%');
    const zoomedLandscapeAlignment = await getHotspotAlignment(hotspot);

    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('.zoomControls > span')).toHaveText('125%');
    await assertActiveCatalogPage(page, fixture.page, fixture.title);
    await expect(page.getByRole('button', { name: 'Carrito (1)' })).toBeVisible();
    expectSameAlignment(await getHotspotAlignment(hotspot), zoomedLandscapeAlignment);

    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(page.locator('.zoomControls > span')).toHaveText('125%');
    await assertActiveCatalogPage(page, fixture.page, fixture.title);
    await expect(page.getByRole('button', { name: 'Carrito (1)' })).toBeVisible();
    expect((await getViewerMetrics(page)).documentHasNoOverflow).toBe(true);
  });
});
