/** Umbral de movimiento (px) para considerar un toque corto / tap. */
export const TAP_MOVEMENT_THRESHOLD = 10;

/** Umbral horizontal (px) para cambiar de página con swipe. */
export const SWIPE_THRESHOLD = 55;

/** Distancia inicial (px) tras la que se fija el eje del gesto. */
export const GESTURE_DIRECTION_LOCK_THRESHOLD = 10;

/** Dominancia horizontal mínima respecto del movimiento vertical. */
export const SWIPE_AXIS_DOMINANCE_RATIO = 1.5;

export type GestureDirection = 'pending' | 'horizontal' | 'vertical';

export function movementDistance(dx: number, dy: number) {
  return Math.hypot(dx, dy);
}

/** Toque corto: movimiento total por debajo del umbral. */
export function isTapGesture(dx: number, dy: number, threshold = TAP_MOVEMENT_THRESHOLD) {
  return movementDistance(dx, dy) <= threshold;
}

/** Fija una única dirección al superar la distancia inicial. */
export function getGestureDirection(
  dx: number,
  dy: number,
  threshold = GESTURE_DIRECTION_LOCK_THRESHOLD,
): GestureDirection {
  if (movementDistance(dx, dy) < threshold) return 'pending';
  return Math.abs(dx) >= Math.abs(dy) * SWIPE_AXIS_DOMINANCE_RATIO
    ? 'horizontal'
    : 'vertical';
}

/** Swipe horizontal dominante (misma regla que el visor). */
export function isSwipeGesture(dx: number, dy: number, threshold = SWIPE_THRESHOLD) {
  return Math.abs(dx) > threshold && Math.abs(dx) >= Math.abs(dy) * SWIPE_AXIS_DOMINANCE_RATIO;
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
  return Boolean(
    el?.closest(
      '.hotspot, button, a, input, select, textarea, summary, label, [role="button"], [role="slider"], [role="scrollbar"], [contenteditable="true"]',
    ),
  );
}

export function isHotspotTarget(target: EventTarget | null) {
  const el = asClosestElement(target);
  return Boolean(el?.closest('.hotspot'));
}
