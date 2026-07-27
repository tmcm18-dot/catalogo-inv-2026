import { describe, expect, it } from 'vitest';
import {
  isHotspotTarget,
  isSwipeGesture,
  isTapGesture,
  SWIPE_THRESHOLD,
  TAP_MOVEMENT_THRESHOLD,
} from '@/lib/gestures';

describe('isTapGesture', () => {
  it('acepta movimiento por debajo del umbral (~10px)', () => {
    expect(isTapGesture(0, 0)).toBe(true);
    expect(isTapGesture(6, 6)).toBe(true);
    expect(isTapGesture(TAP_MOVEMENT_THRESHOLD, 0)).toBe(true);
  });

  it('rechaza arrastres por encima del umbral', () => {
    expect(isTapGesture(TAP_MOVEMENT_THRESHOLD + 1, 0)).toBe(false);
    expect(isTapGesture(20, 20)).toBe(false);
  });
});

describe('isSwipeGesture', () => {
  it('detecta swipe horizontal dominante', () => {
    expect(isSwipeGesture(-SWIPE_THRESHOLD - 1, 10)).toBe(true);
    expect(isSwipeGesture(SWIPE_THRESHOLD + 5, 5)).toBe(true);
  });

  it('no trata un scroll vertical como swipe', () => {
    expect(isSwipeGesture(20, 80)).toBe(false);
    expect(isSwipeGesture(SWIPE_THRESHOLD + 1, SWIPE_THRESHOLD)).toBe(false);
  });

  it('no abre producto: swipe y tap son mutuamente excluyentes en la práctica', () => {
    const dx = -70;
    const dy = 5;
    expect(isSwipeGesture(dx, dy)).toBe(true);
    expect(isTapGesture(dx, dy)).toBe(false);
  });
});

describe('isHotspotTarget', () => {
  it('reconoce un elemento dentro de .hotspot', () => {
    const root = { closest: (sel: string) => (sel.includes('.hotspot') ? {} : null) };
    expect(isHotspotTarget(root as unknown as Element)).toBe(true);
  });

  it('rechaza targets nulos o no Element', () => {
    expect(isHotspotTarget(null)).toBe(false);
    expect(isHotspotTarget('x' as unknown as EventTarget)).toBe(false);
  });
});
