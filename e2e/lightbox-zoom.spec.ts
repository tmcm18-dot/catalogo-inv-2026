import { expect, test, type Locator, type Page } from '@playwright/test';

async function openLightbox(page: Page) {
  await page.getByRole('button', { name: 'Ver la página a pantalla completa' }).click();
  const dialog = page.getByRole('dialog', { name: /Página 1 ampliada/ });
  const image = dialog.locator('.lightboxImageWrapper img');

  await expect(dialog).toBeVisible();
  await expect(image).toBeVisible();
  await expect
    .poll(() =>
      image.evaluate((element) => {
        const pageImage = element as HTMLImageElement;
        return pageImage.complete && pageImage.naturalWidth > 0;
      }),
    )
    .toBe(true);

  return dialog;
}

async function activate(control: Locator, touch: boolean) {
  if (touch) await control.tap();
  else await control.click();
}

async function readZoom(dialog: Locator) {
  const value = await dialog.getByLabel('Zoom actual').textContent();
  return Number(value?.replace('%', ''));
}

async function zoomToMaximum(dialog: Locator, touch: boolean) {
  const plus = dialog.getByRole('button', { name: 'Aumentar zoom de pantalla completa' });
  while (!(await plus.isDisabled())) await activate(plus, touch);
  await expect(dialog.getByLabel('Zoom actual')).toHaveText('300%');
}

async function getLightboxMetrics(dialog: Locator) {
  return dialog.locator('.lightboxImageWrapper').evaluate((wrapper) => {
    const overlay = wrapper.closest<HTMLElement>('.lightboxOverlay');
    const stage = wrapper.querySelector<HTMLElement>('.catalogPageStage');
    const toolbar = document.querySelector<HTMLElement>('.lightboxToolbar');
    const close = document.querySelector<HTMLButtonElement>('.lightboxClose');
    const exit = Array.from(toolbar?.querySelectorAll<HTMLButtonElement>('button') ?? []).find(
      (button) => button.textContent?.trim() === 'Salir',
    );
    const plus = document.querySelector<HTMLButtonElement>(
      '[aria-label="Aumentar zoom de pantalla completa"]',
    );
    if (!overlay || !stage || !toolbar || !close || !exit || !plus) {
      throw new Error('Estructura incompleta del visor ampliado.');
    }

    const stageRect = stage.getBoundingClientRect();
    const toolbarRect = toolbar.getBoundingClientRect();
    const closeRect = close.getBoundingClientRect();
    const exitRect = exit.getBoundingClientRect();
    const plusRect = plus.getBoundingClientRect();
    const plusHit = document.elementFromPoint(
      plusRect.left + plusRect.width / 2,
      plusRect.top + plusRect.height / 2,
    );
    const withinViewport = (rect: DOMRect) =>
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.right <= window.innerWidth &&
      rect.bottom <= window.innerHeight;

    return {
      stageWidth: stageRect.width,
      stageHeight: stageRect.height,
      wrapperClientWidth: wrapper.clientWidth,
      wrapperClientHeight: wrapper.clientHeight,
      wrapperScrollWidth: wrapper.scrollWidth,
      wrapperScrollHeight: wrapper.scrollHeight,
      wrapperScrollLeft: wrapper.scrollLeft,
      wrapperScrollTop: wrapper.scrollTop,
      toolbarTop: toolbarRect.top,
      toolbarWithinViewport: withinViewport(toolbarRect),
      closeTop: closeRect.top,
      closeWithinViewport: withinViewport(closeRect),
      exitWithinViewport: withinViewport(exitRect),
      plusReceivesPointer: plusHit === plus || plus.contains(plusHit),
      bodyOverflow: getComputedStyle(document.body).overflow,
      overlayOverflow: getComputedStyle(overlay).overflow,
      wrapperOverflowX: getComputedStyle(wrapper).overflowX,
      wrapperOverflowY: getComputedStyle(wrapper).overflowY,
      wrapperTouchAction: getComputedStyle(wrapper).touchAction,
      stageCursor: getComputedStyle(stage).cursor,
      canMousePan: wrapper.classList.contains('canMousePan'),
      isMouseDragging: overlay.classList.contains('isMouseDragging'),
      windowScrollY: window.scrollY,
    };
  });
}

async function centerLightboxScroll(wrapper: Locator) {
  await wrapper.evaluate((element) => {
    element.scrollLeft = (element.scrollWidth - element.clientWidth) / 2;
    element.scrollTop = (element.scrollHeight - element.clientHeight) / 2;
  });
}

async function getMouseStart(wrapper: Locator) {
  const box = await wrapper.boundingBox();
  if (!box) throw new Error('No se pudo medir el área desplazable del visor.');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

test.describe('zoom del visor ampliado', () => {
  test('controla escala, límites, ajuste y desplazamiento con clic o toque', async ({
    page,
  }, testInfo) => {
    const touch = testInfo.project.name === 'mobile-chromium';
    await page.goto('/');
    const dialog = await openLightbox(page);
    const minus = dialog.getByRole('button', { name: 'Reducir zoom de pantalla completa' });
    const plus = dialog.getByRole('button', { name: 'Aumentar zoom de pantalla completa' });
    const fit = dialog.getByRole('button', { name: 'Ajustar' });
    const exit = dialog.getByRole('button', { name: 'Salir' });
    const wrapper = dialog.locator('.lightboxImageWrapper');

    await expect(dialog.getByLabel('Zoom actual')).toHaveText('100%');
    await expect(minus).toBeDisabled();
    await expect(plus).toBeEnabled();
    await expect(exit).toBeVisible();

    const initial = await getLightboxMetrics(dialog);
    expect(initial.stageWidth).toBeLessThanOrEqual(initial.wrapperClientWidth + 1);
    expect(initial.stageHeight).toBeLessThanOrEqual(initial.wrapperClientHeight + 1);
    expect(initial.toolbarWithinViewport).toBe(true);
    expect(initial.closeWithinViewport).toBe(true);
    expect(initial.exitWithinViewport).toBe(true);
    expect(initial.plusReceivesPointer).toBe(true);
    expect(initial.bodyOverflow).toBe('hidden');
    expect(initial.overlayOverflow).toBe('hidden');
    expect(initial.wrapperOverflowX).toBe('auto');
    expect(initial.wrapperOverflowY).toBe('auto');

    await activate(plus, touch);
    await expect(dialog.getByLabel('Zoom actual')).toHaveText('125%');
    const enlarged = await getLightboxMetrics(dialog);
    expect(enlarged.stageWidth).toBeGreaterThan(initial.stageWidth * 1.2);
    expect(enlarged.stageHeight).toBeGreaterThan(initial.stageHeight * 1.2);

    await activate(minus, touch);
    await expect(dialog.getByLabel('Zoom actual')).toHaveText('100%');
    const reduced = await getLightboxMetrics(dialog);
    expect(reduced.stageWidth).toBeCloseTo(initial.stageWidth, 0);
    expect(reduced.stageHeight).toBeCloseTo(initial.stageHeight, 0);

    await activate(plus, touch);
    await activate(plus, touch);
    await activate(fit, touch);
    await expect(dialog.getByLabel('Zoom actual')).toHaveText('100%');
    const adjusted = await getLightboxMetrics(dialog);
    expect(adjusted.stageWidth).toBeLessThanOrEqual(adjusted.wrapperClientWidth + 1);
    expect(adjusted.stageHeight).toBeLessThanOrEqual(adjusted.wrapperClientHeight + 1);

    let previousZoom = await readZoom(dialog);
    while (!(await plus.isDisabled())) {
      await activate(plus, touch);
      const currentZoom = await readZoom(dialog);
      expect(currentZoom).toBe(previousZoom + 25);
      previousZoom = currentZoom;
    }
    expect(previousZoom).toBe(300);
    await expect(plus).toBeDisabled();
    const maximum = await getLightboxMetrics(dialog);
    expect(maximum.wrapperScrollWidth).toBeGreaterThan(maximum.wrapperClientWidth);
    expect(maximum.wrapperScrollHeight).toBeGreaterThan(maximum.wrapperClientHeight);

    await wrapper.evaluate((element) => {
      element.scrollLeft = element.scrollWidth;
      element.scrollTop = element.scrollHeight;
    });
    await expect.poll(async () => (await getLightboxMetrics(dialog)).wrapperScrollLeft).toBeGreaterThan(0);
    await expect.poll(async () => (await getLightboxMetrics(dialog)).wrapperScrollTop).toBeGreaterThan(0);
    const panned = await getLightboxMetrics(dialog);
    expect(panned.windowScrollY).toBe(initial.windowScrollY);
    expect(panned.toolbarTop).toBeCloseTo(initial.toolbarTop, 0);
    expect(panned.closeTop).toBeCloseTo(initial.closeTop, 0);
    expect(panned.toolbarWithinViewport).toBe(true);
    expect(panned.closeWithinViewport).toBe(true);
    expect(panned.exitWithinViewport).toBe(true);

    const maximumZoom = await readZoom(dialog);
    await plus.evaluate((button: HTMLButtonElement) => button.click());
    expect(await readZoom(dialog)).toBe(maximumZoom);

    while (!(await minus.isDisabled())) {
      await activate(minus, touch);
    }
    await expect(dialog.getByLabel('Zoom actual')).toHaveText('100%');
    await expect(minus).toBeDisabled();
    await minus.evaluate((button: HTMLButtonElement) => button.click());
    expect(await readZoom(dialog)).toBe(100);

    await activate(exit, touch);
    await expect(dialog).toHaveCount(0);
  });

  test('conserva cierre mediante X, Escape y clic exterior', async ({ page }, testInfo) => {
    const touch = testInfo.project.name === 'mobile-chromium';
    await page.goto('/');

    let dialog = await openLightbox(page);
    await activate(dialog.getByRole('button', { name: 'Cerrar pantalla completa' }), touch);
    await expect(dialog).toHaveCount(0);

    dialog = await openLightbox(page);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);

    dialog = await openLightbox(page);
    await page.mouse.click(2, 2);
    await expect(dialog).toHaveCount(0);
  });

  test('arrastra con mouse en horizontal, vertical y diagonal sin clic accidental', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'El drag con mouse corre en desktop.');
    await page.goto('/');
    const dialog = await openLightbox(page);
    const wrapper = dialog.locator('.lightboxImageWrapper');
    const stage = wrapper.locator('.catalogPageStage');

    await zoomToMaximum(dialog, false);
    await expect(wrapper).toHaveClass(/canMousePan/);
    await centerLightboxScroll(wrapper);
    const start = await getMouseStart(wrapper);
    await page.mouse.move(start.x, start.y);
    await expect(stage).toHaveCSS('cursor', 'grab');

    await wrapper.evaluate((element) => {
      const state = { captures: 0, releases: 0, nativeDrags: 0 };
      (window as Window & { __lightboxDragEvents?: typeof state }).__lightboxDragEvents = state;
      element.addEventListener('gotpointercapture', () => state.captures += 1);
      element.addEventListener('lostpointercapture', () => state.releases += 1);
      element.addEventListener('dragstart', () => state.nativeDrags += 1);
    });

    const beforeThreshold = await getLightboxMetrics(dialog);
    await page.mouse.down();
    await expect(dialog).toHaveClass(/isMouseDragging/);
    await expect(dialog).toHaveCSS('cursor', 'grabbing');
    await page.mouse.move(start.x + 3, start.y + 2);
    const belowThreshold = await getLightboxMetrics(dialog);
    expect(belowThreshold.wrapperScrollLeft).toBeCloseTo(beforeThreshold.wrapperScrollLeft, 0);
    expect(belowThreshold.wrapperScrollTop).toBeCloseTo(beforeThreshold.wrapperScrollTop, 0);
    await page.mouse.up();
    await expect(dialog).not.toHaveClass(/isMouseDragging/);

    await centerLightboxScroll(wrapper);
    const beforeHorizontal = await getLightboxMetrics(dialog);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x - 60, start.y, { steps: 6 });
    await page.mouse.up();
    const afterHorizontal = await getLightboxMetrics(dialog);
    expect(afterHorizontal.wrapperScrollLeft).toBeGreaterThan(beforeHorizontal.wrapperScrollLeft);
    expect(afterHorizontal.wrapperScrollTop).toBeCloseTo(beforeHorizontal.wrapperScrollTop, 0);

    await centerLightboxScroll(wrapper);
    const beforeVertical = await getLightboxMetrics(dialog);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x, start.y - 60, { steps: 6 });
    await page.mouse.up();
    const afterVertical = await getLightboxMetrics(dialog);
    expect(afterVertical.wrapperScrollLeft).toBeCloseTo(beforeVertical.wrapperScrollLeft, 0);
    expect(afterVertical.wrapperScrollTop).toBeGreaterThan(beforeVertical.wrapperScrollTop);

    await centerLightboxScroll(wrapper);
    const beforeDiagonal = await getLightboxMetrics(dialog);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x - 70, start.y - 70, { steps: 7 });
    await page.mouse.up();
    const afterDiagonal = await getLightboxMetrics(dialog);
    expect(afterDiagonal.wrapperScrollLeft).toBeGreaterThan(beforeDiagonal.wrapperScrollLeft);
    expect(afterDiagonal.wrapperScrollTop).toBeGreaterThan(beforeDiagonal.wrapperScrollTop);

    await centerLightboxScroll(wrapper);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(2, 2, { steps: 10 });
    await expect(dialog).toHaveClass(/isMouseDragging/);
    await page.mouse.up();
    await expect(dialog).not.toHaveClass(/isMouseDragging/);
    await expect(dialog).toBeVisible();
    await expect(page.locator('article.productModal')).toHaveCount(0);

    const dragEvents = await page.evaluate(() =>
      (window as Window & {
        __lightboxDragEvents?: { captures: number; releases: number; nativeDrags: number };
      }).__lightboxDragEvents,
    );
    expect(dragEvents?.captures).toBeGreaterThanOrEqual(4);
    expect(dragEvents?.releases).toBe(dragEvents?.captures);
    expect(dragEvents?.nativeDrags).toBe(0);
    expect(await page.evaluate(() => window.getSelection()?.toString() ?? '')).toBe('');
  });

  test('conserva barras, rueda y desplazamiento tipo trackpad', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'La rueda corre en desktop.');
    await page.goto('/');
    const dialog = await openLightbox(page);
    const wrapper = dialog.locator('.lightboxImageWrapper');

    await zoomToMaximum(dialog, false);
    const scrollable = await getLightboxMetrics(dialog);
    expect(scrollable.wrapperOverflowX).toBe('auto');
    expect(scrollable.wrapperOverflowY).toBe('auto');
    expect(scrollable.wrapperScrollWidth).toBeGreaterThan(scrollable.wrapperClientWidth);
    expect(scrollable.wrapperScrollHeight).toBeGreaterThan(scrollable.wrapperClientHeight);

    await wrapper.evaluate((element) => {
      element.scrollLeft = 0;
      element.scrollTop = 0;
    });
    const start = await getMouseStart(wrapper);
    await page.mouse.move(start.x, start.y);
    await page.mouse.wheel(30, 90);
    await expect.poll(async () => (await getLightboxMetrics(dialog)).wrapperScrollLeft).toBeGreaterThan(0);
    await expect.poll(async () => (await getLightboxMetrics(dialog)).wrapperScrollTop).toBeGreaterThan(0);
    expect((await getLightboxMetrics(dialog)).windowScrollY).toBe(0);
  });

  test('mantiene el desplazamiento táctil nativo sin activar el drag de mouse', async ({
    context,
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chromium', 'El gesto táctil corre en móvil.');
    await page.goto('/');
    const dialog = await openLightbox(page);
    const wrapper = dialog.locator('.lightboxImageWrapper');

    await zoomToMaximum(dialog, true);
    await wrapper.evaluate((element) => {
      element.scrollLeft = 0;
      element.scrollTop = 0;
    });
    const beforeTouch = await getLightboxMetrics(dialog);
    expect(beforeTouch.wrapperTouchAction).toBe('pan-x pan-y');

    const start = await getMouseStart(wrapper);
    const session = await context.newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: start.x, y: start.y, id: 0 }],
    });
    for (let step = 1; step <= 6; step += 1) {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: start.x - step * 12, y: start.y - step * 12, id: 0 }],
      });
      await page.waitForTimeout(16);
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

    await expect.poll(async () => (await getLightboxMetrics(dialog)).wrapperScrollLeft).toBeGreaterThan(0);
    await expect.poll(async () => (await getLightboxMetrics(dialog)).wrapperScrollTop).toBeGreaterThan(0);
    const afterTouch = await getLightboxMetrics(dialog);
    expect(afterTouch.isMouseDragging).toBe(false);
    expect(afterTouch.windowScrollY).toBe(beforeTouch.windowScrollY);
    await expect(dialog.getByRole('button', { name: 'Salir' })).toBeEnabled();
  });
});
