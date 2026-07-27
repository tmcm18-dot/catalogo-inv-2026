/** Umbral de movimiento (px) para considerar un toque corto / tap. */
export const TAP_MOVEMENT_THRESHOLD = 10;

/** Umbral horizontal (px) para cambiar de página con swipe. */
export const SWIPE_THRESHOLD = 55;

export function movementDistance(dx: number, dy: number) {
  return Math.hypot(dx, dy);
}

/** Toque corto: movimiento total por debajo del umbral. */
export function isTapGesture(dx: number, dy: number, threshold = TAP_MOVEMENT_THRESHOLD) {
  return movementDistance(dx, dy) <= threshold;
}

/** Swipe horizontal dominante (misma regla que el visor). */
export function isSwipeGesture(dx: number, dy: number, threshold = SWIPE_THRESHOLD) {
  return Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy) * 1.3;
}

type ClosestElement = { closest: (selector: string) => unknown };

function asClosestElement(target: EventTarget | null): ClosestElement | null {
  if (!target || typeof target !== 'object') return null;
  const el = target as { closest?: unknown };
  return typeof el.closest === 'function' ? (el as ClosestElement) : null;
}

/** ¿El evento nació en un control interactivo (hotspot u otro)? */
export function isInteractiveTarget(target: EventTarget | null) {
  const el = asClosestElement(target);
  return Boolean(el?.closest('.hotspot, a, input, select, textarea, summary, label'));
}

export function isHotspotTarget(target: EventTarget | null) {
  const el = asClosestElement(target);
  return Boolean(el?.closest('.hotspot'));
}
