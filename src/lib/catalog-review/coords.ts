import type { HotspotCoords } from './types.ts'

export type CoordsValidation = {
  ok: boolean;
  errors: string[];
};

export function validateCoords(coords: Partial<HotspotCoords> | null | undefined): CoordsValidation {
  const errors: string[] = [];
  if (!coords) {
    return { ok: false, errors: ['coordenadas ausentes'] };
  }

  const { x, y, width, height } = coords;
  const nums = { x, y, width, height };
  for (const [key, value] of Object.entries(nums)) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      errors.push(`${key} debe ser un número finito`);
    }
  }
  if (errors.length) return { ok: false, errors };

  if ((x as number) < 0) errors.push('x >= 0');
  if ((y as number) < 0) errors.push('y >= 0');
  if ((width as number) <= 0) errors.push('width > 0');
  if ((height as number) <= 0) errors.push('height > 0');
  if ((x as number) > 100) errors.push('x <= 100');
  if ((y as number) > 100) errors.push('y <= 100');
  if ((x as number) + (width as number) > 100) errors.push('x + width <= 100');
  if ((y as number) + (height as number) > 100) errors.push('y + height <= 100');

  return { ok: errors.length === 0, errors };
}

/** Intersección relativa al área del hotspot propuesto (0..1). */
export function overlapRatio(a: HotspotCoords, b: HotspotCoords): number {
  const ax2 = a.x + a.width;
  const ay2 = a.y + a.height;
  const bx2 = b.x + b.width;
  const by2 = b.y + b.height;
  const ix = Math.max(0, Math.min(ax2, bx2) - Math.max(a.x, b.x));
  const iy = Math.max(0, Math.min(ay2, by2) - Math.max(a.y, b.y));
  const inter = ix * iy;
  const area = Math.max(0.0001, a.width * a.height);
  return inter / area;
}

export function findWideOverlaps(
  proposed: HotspotCoords,
  others: HotspotCoords[],
  threshold = 0.35,
): { index: number; ratio: number }[] {
  const hits: { index: number; ratio: number }[] = [];
  others.forEach((other, index) => {
    const ratio = overlapRatio(proposed, other);
    if (ratio >= threshold) hits.push({ index, ratio });
  });
  return hits;
}

export function clampCoordInput(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function roundCoord(value: number, digits = 2): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}
