/**
 * Guardas de seguridad para la herramienta local de revisión.
 * Nunca habilitar en Vercel Production ni Preview.
 */

export type ReviewEnv = {
  NODE_ENV?: string;
  CATALOG_REVIEW_MODE?: string;
  VERCEL?: string;
  VERCEL_ENV?: string;
};

export function isCatalogReviewEnabled(env: ReviewEnv = process.env): boolean {
  if (env.CATALOG_REVIEW_MODE !== '1') return false;
  if (env.NODE_ENV !== 'development') return false;
  // Cualquier entorno Vercel (production / preview / development remoto) queda bloqueado.
  if (env.VERCEL === '1') return false;
  if (env.VERCEL_ENV && env.VERCEL_ENV !== '') return false;
  return true;
}

export function catalogReviewBlockReason(env: ReviewEnv = process.env): string | null {
  if (env.VERCEL === '1' || (env.VERCEL_ENV && env.VERCEL_ENV !== '')) {
    return 'blocked-on-vercel';
  }
  if (env.NODE_ENV !== 'development') return 'blocked-non-development';
  if (env.CATALOG_REVIEW_MODE !== '1') return 'missing-catalog-review-mode';
  return null;
}
