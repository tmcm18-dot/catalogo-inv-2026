import { validateCoords } from './coords.ts'
import type {
  ConfirmedDecisionsFile,
  ReviewDecision,
  ReviewDecisionKind,
  ReviewStatus,
} from './types.ts'
import { REVIEW_STATUSES } from './types.ts'

const DECISION_TO_STATUS: Record<ReviewDecisionKind, ReviewStatus> = {
  'confirm-current': 'confirmed-current',
  'reassign-product': 'confirmed-reassign-product',
  'update-sizes': 'confirmed-update-sizes',
  'update-colors': 'confirmed-update-colors',
  'create-hotspot': 'confirmed-create-hotspot',
  'remove-hotspot': 'confirmed-remove-hotspot',
  'fix-coordinates': 'confirmed-create-hotspot',
  'mark-ambiguous': 'ambiguous',
  'mark-rejected': 'rejected',
  'needs-manual-source': 'needs-manual-source',
};

const APPLYABLE = new Set<ReviewDecisionKind>([
  'confirm-current',
  'reassign-product',
  'update-sizes',
  'update-colors',
  'create-hotspot',
  'remove-hotspot',
  'fix-coordinates',
]);

export type DecisionValidationOptions = {
  productIds: Set<string>;
  hotspotIds: Set<string>;
  existingPricesByProductId?: Map<string, number | null | undefined>;
  whatsappNumber?: string;
};

export type DecisionValidationResult = {
  ok: boolean;
  errors: string[];
  normalized?: ReviewDecision;
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

export function decisionKindToStatus(kind: ReviewDecisionKind): ReviewStatus {
  return DECISION_TO_STATUS[kind];
}

export function isApplyableDecision(decision: ReviewDecision): boolean {
  if (!decision.confirmed) return false;
  if (decision.reviewStatus === 'ambiguous' || decision.decision === 'mark-ambiguous') return false;
  if (decision.reviewStatus === 'rejected' || decision.decision === 'mark-rejected') return false;
  if (decision.reviewStatus === 'needs-manual-source' || decision.decision === 'needs-manual-source') return false;
  return APPLYABLE.has(decision.decision);
}

export function validateDecision(
  raw: Partial<ReviewDecision>,
  options: DecisionValidationOptions,
): DecisionValidationResult {
  const errors: string[] = [];
  if (!raw.caseId || typeof raw.caseId !== 'string') errors.push('caseId requerido');
  if (!raw.decision || typeof raw.decision !== 'string') errors.push('decision requerida');
  if (!raw.classification || typeof raw.classification !== 'string') errors.push('classification requerida');
  if (typeof raw.page !== 'number' || !Number.isFinite(raw.page) || raw.page < 1) errors.push('page inválida');
  if (typeof raw.confirmed !== 'boolean') errors.push('confirmed debe ser boolean');

  const decision = raw.decision as ReviewDecisionKind;
  const newValue = (raw.newValue || {}) as Record<string, unknown>;

  if (decision === 'reassign-product' || decision === 'create-hotspot') {
    const productId = (newValue.productId as string) || raw.productId;
    if (!productId || !options.productIds.has(productId)) {
      errors.push('productId inexistente');
    }
  }

  if (decision === 'create-hotspot') {
    const hotspotId = (newValue.hotspotId as string) || raw.hotspotId;
    if (!hotspotId || typeof hotspotId !== 'string') errors.push('hotspotId requerido para create-hotspot');
    else if (options.hotspotIds.has(hotspotId)) errors.push('hotspotId duplicado');
    const coords = newValue.coordinates as { x: number; y: number; width: number; height: number } | undefined;
    const coordsCheck = validateCoords(coords);
    if (!coordsCheck.ok) errors.push(...coordsCheck.errors.map((e) => `coords: ${e}`));
  }

  if (decision === 'fix-coordinates') {
    const coords = newValue.coordinates as { x: number; y: number; width: number; height: number } | undefined;
    const coordsCheck = validateCoords(coords);
    if (!coordsCheck.ok) errors.push(...coordsCheck.errors.map((e) => `coords: ${e}`));
  }

  if (decision === 'update-sizes') {
    if (!isStringArray(newValue.sizes)) errors.push('sizes debe ser un array de strings');
  }
  if (decision === 'update-colors') {
    if (!isStringArray(newValue.colors)) errors.push('colors debe ser un array de strings');
  }

  if (decision === 'mark-ambiguous' && raw.confirmed === true && APPLYABLE.has(decision)) {
    // mark-ambiguous is never applyable; still allow storing the decision
  }

  if (newValue.price !== undefined) errors.push('no se permite modificar precios');
  if (newValue.whatsapp !== undefined) errors.push('no se permite modificar WhatsApp');
  if (newValue.orderMessage !== undefined) errors.push('no se permite modificar texto del pedido');

  if (errors.length) return { ok: false, errors };

  const reviewStatus = raw.reviewStatus && REVIEW_STATUSES.includes(raw.reviewStatus as ReviewStatus)
    ? (raw.reviewStatus as ReviewStatus)
    : decisionKindToStatus(decision);

  const normalized: ReviewDecision = {
    caseId: raw.caseId as string,
    classification: raw.classification as ReviewDecision['classification'],
    decision,
    previousValue: (raw.previousValue as Record<string, unknown>) || null,
    newValue: Object.keys(newValue).length ? newValue : null,
    evidence: (raw.evidence as string) || null,
    comment: typeof raw.comment === 'string' ? raw.comment : '',
    confidence: typeof raw.confidence === 'string' ? raw.confidence : 'manual',
    confirmed: Boolean(raw.confirmed),
    timestamp: typeof raw.timestamp === 'string' ? raw.timestamp : new Date().toISOString(),
    page: raw.page as number,
    hotspotId: (raw.hotspotId as string) || (newValue.hotspotId as string) || null,
    productId: (raw.productId as string) || (newValue.productId as string) || null,
    reviewStatus,
  };

  return { ok: true, errors: [], normalized };
}

export function upsertDecision(
  file: ConfirmedDecisionsFile,
  decision: ReviewDecision,
): ConfirmedDecisionsFile {
  const decisions = file.decisions.filter((d) => d.caseId !== decision.caseId);
  decisions.push(decision);
  decisions.sort((a, b) => {
    if (a.page !== b.page) return a.page - b.page;
    return a.caseId.localeCompare(b.caseId);
  });
  return {
    version: file.version || 1,
    updatedAt: decision.timestamp,
    decisions,
  };
}

export function removeDecision(
  file: ConfirmedDecisionsFile,
  caseId: string,
): ConfirmedDecisionsFile {
  return {
    version: file.version || 1,
    updatedAt: new Date().toISOString(),
    decisions: file.decisions.filter((d) => d.caseId !== caseId),
  };
}

export function decisionsToCsv(decisions: ReviewDecision[]): string {
  const header = [
    'caseId',
    'classification',
    'decision',
    'reviewStatus',
    'page',
    'hotspotId',
    'productId',
    'confirmed',
    'confidence',
    'comment',
    'evidence',
    'timestamp',
  ];
  const escape = (value: unknown) => {
    const text = value == null ? '' : String(value);
    if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  };
  const lines = [header.join(',')];
  for (const d of decisions) {
    lines.push(
      [
        d.caseId,
        d.classification,
        d.decision,
        d.reviewStatus,
        d.page,
        d.hotspotId,
        d.productId,
        d.confirmed,
        d.confidence,
        d.comment,
        d.evidence,
        d.timestamp,
      ]
        .map(escape)
        .join(','),
    );
  }
  return `${lines.join('\n')}\n`;
}

export function generateUniqueHotspotId(
  productId: string,
  page: number,
  existing: Set<string>,
): string {
  const base = `hotspot-${productId}`;
  if (!existing.has(base)) return base;
  const withPage = `hotspot-${productId}-p${page}`;
  if (!existing.has(withPage)) return withPage;
  let n = 2;
  while (existing.has(`${withPage}-${n}`)) n += 1;
  return `${withPage}-${n}`;
}

export function emptyDecisionsFile(): ConfirmedDecisionsFile {
  return { version: 1, updatedAt: new Date().toISOString(), decisions: [] };
}
