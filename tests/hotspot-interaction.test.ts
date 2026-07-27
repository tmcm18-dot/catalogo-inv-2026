import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isSwipeGesture, isTapGesture } from '@/lib/gestures';

const css = readFileSync(resolve(process.cwd(), 'src/app/globals.css'), 'utf8');

function cssBlock(selector: string) {
  const re = new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`);
  const m = css.match(re);
  return m?.[1] ?? '';
}

describe('CSS de hotspots (clic / toque)', () => {
  it('el hotspot exterior tiene pointer-events auto, z-index y cursor pointer', () => {
    const block = cssBlock('.hotspot');
    expect(block).toMatch(/pointer-events:\s*auto/);
    expect(block).toMatch(/z-index:\s*3/);
    expect(block).toMatch(/cursor:\s*pointer/);
  });

  it('la decoración interior (.hotspot span) no captura eventos', () => {
    expect(cssBlock('.hotspot span')).toMatch(/pointer-events:\s*none/);
  });

  it('con zoom, el hotspot permite pan (no roba el arrastre)', () => {
    expect(cssBlock('.catalogReaderShell.is-zoomed .hotspot')).toMatch(/touch-action:\s*pan-x pan-y/);
  });
});

describe('política de gestos sobre hotspots', () => {
  it('clic/toque corto (≤10px) abre producto; swipe no', () => {
    expect(isTapGesture(3, 4)).toBe(true);
    expect(isSwipeGesture(3, 4)).toBe(false);
  });

  it('swipe horizontal no es tap (no debe abrir producto)', () => {
    expect(isSwipeGesture(-80, 8)).toBe(true);
    expect(isTapGesture(-80, 8)).toBe(false);
  });

  it('arrastre diagonal moderado suprime tap pero no es swipe de página', () => {
    expect(isTapGesture(30, 25)).toBe(false);
    expect(isSwipeGesture(30, 25)).toBe(false);
  });
});
