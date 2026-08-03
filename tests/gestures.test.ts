import { describe, expect, it } from 'vitest';
import {
  GESTURE_DIRECTION_LOCK_THRESHOLD,
  getGestureDirection,
  isHotspotTarget,
  isInteractiveTarget,
  isSwipeGesture,
  isTapGesture,
  SWIPE_AXIS_DOMINANCE_RATIO,
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

  it('exige una dominancia horizontal de al menos 1.5', () => {
    expect(SWIPE_AXIS_DOMINANCE_RATIO).toBe(1.5);
    expect(isSwipeGesture(60, 40)).toBe(true);
    expect(isSwipeGesture(60, 41)).toBe(false);
  });

  it('no abre producto: swipe y tap son mutuamente excluyentes en la práctica', () => {
    const dx = -70;
    const dy = 5;
    expect(isSwipeGesture(dx, dy)).toBe(true);
    expect(isTapGesture(dx, dy)).toBe(false);
  });
});

describe('getGestureDirection', () => {
  it('espera aproximadamente 10px antes de fijar el eje', () => {
    expect(GESTURE_DIRECTION_LOCK_THRESHOLD).toBe(10);
    expect(getGestureDirection(6, 6)).toBe('pending');
  });

  it('fija horizontal sólo con dominancia suficiente', () => {
    expect(getGestureDirection(15, 10)).toBe('horizontal');
    expect(getGestureDirection(14, 10)).toBe('vertical');
    expect(getGestureDirection(8, 20)).toBe('vertical');
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

describe('isInteractiveTarget', () => {
  it('ignora hotspots, botones, campos y barras accesibles', () => {
    for (const selector of ['.hotspot', 'button', 'input', '[role="scrollbar"]']) {
      const target = { closest: (query: string) => (query.includes(selector) ? {} : null) };
      expect(isInteractiveTarget(target as unknown as Element)).toBe(true);
    }
  });
});
