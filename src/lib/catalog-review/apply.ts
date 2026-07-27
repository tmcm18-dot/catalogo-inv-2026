import { isApplyableDecision, validateDecision } from './decisions.ts'
import { validateCoords } from './coords.ts'
import type { ReviewDecision } from './types.ts'

export type ProductRecord = {
  id: string;
  code: string;
  name: string;
  description?: string;
  brand?: string;
  category?: string;
  page: number;
  sizes: string[];
  colors: string[];
  price?: number | null;
  [key: string]: unknown;
};

export type HotspotRecord = {
  id: string;
  productId: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  isActive: boolean;
  [key: string]: unknown;
};

export type ApplyContext = {
  products: ProductRecord[];
  hotspots: HotspotRecord[];
  whatsappNumber: string;
  orderMessageSample?: string;
};

export type ApplyChange = {
  type: string;
  caseId: string;
  detail: Record<string, unknown>;
};

export type ApplyResult = {
  ok: boolean;
  dryRun: boolean;
  errors: string[];
  skipped: { caseId: string; reason: string }[];
  changes: ApplyChange[];
  products: ProductRecord[];
  hotspots: HotspotRecord[];
  inverse: ApplyChange[];
};

function cloneData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function applyReviewDecisions(
  decisions: ReviewDecision[],
  context: ApplyContext,
  options: { confirm?: boolean } = {},
): ApplyResult {
  const dryRun = !options.confirm;
  const products = cloneData(context.products);
  const hotspots = cloneData(context.hotspots);
  const productIds = new Set(products.map((p) => p.id));
  const hotspotIds = new Set(hotspots.map((h) => h.id));
  const prodById = new Map(products.map((p) => [p.id, p]));
  const hsById = new Map(hotspots.map((h) => [h.id, h]));

  const errors: string[] = [];
  const skipped: { caseId: string; reason: string }[] = [];
  const changes: ApplyChange[] = [];
  const inverse: ApplyChange[] = [];

  // Snapshot invariants
  const priceSnapshot = new Map(products.map((p) => [p.id, p.price ?? null]));
  const whatsapp = context.whatsappNumber;

  for (const decision of decisions) {
    const validation = validateDecision(decision, { productIds, hotspotIds });
    if (!validation.ok) {
      errors.push(`${decision.caseId}: ${validation.errors.join('; ')}`);
      continue;
    }

    if (!isApplyableDecision(decision)) {
      skipped.push({ caseId: decision.caseId, reason: `no aplicable (${decision.decision})` });
      continue;
    }

    const newValue = decision.newValue || {};

    if (decision.decision === 'confirm-current') {
      changes.push({ type: 'noop-confirm-current', caseId: decision.caseId, detail: { productId: decision.productId } });
      continue;
    }

    if (decision.decision === 'reassign-product') {
      const hotspotId = decision.hotspotId;
      const toProductId = String(newValue.productId || decision.productId || '');
      const hs = hotspotId ? hsById.get(hotspotId) : undefined;
      if (!hs) {
        errors.push(`${decision.caseId}: hotspot no encontrado`);
        continue;
      }
      if (!prodById.has(toProductId)) {
        errors.push(`${decision.caseId}: productId inexistente`);
        continue;
      }
      if (hs.page !== decision.page) {
        errors.push(`${decision.caseId}: página ajena al hotspot`);
        continue;
      }
      inverse.push({
        type: 'reassign-product',
        caseId: decision.caseId,
        detail: { hotspotId, productId: hs.productId },
      });
      changes.push({
        type: 'reassign-product',
        caseId: decision.caseId,
        detail: { hotspotId, from: hs.productId, to: toProductId },
      });
      hs.productId = toProductId;
      continue;
    }

    if (decision.decision === 'update-sizes' || decision.decision === 'update-colors') {
      const productId = decision.productId || String(newValue.productId || '');
      const product = prodById.get(productId);
      if (!product) {
        errors.push(`${decision.caseId}: producto no encontrado`);
        continue;
      }
      if (decision.decision === 'update-sizes') {
        const sizes = newValue.sizes;
        if (!Array.isArray(sizes) || !sizes.every((s) => typeof s === 'string')) {
          errors.push(`${decision.caseId}: sizes inválidos`);
          continue;
        }
        inverse.push({
          type: 'update-sizes',
          caseId: decision.caseId,
          detail: { productId, sizes: [...product.sizes] },
        });
        changes.push({
          type: 'update-sizes',
          caseId: decision.caseId,
          detail: { productId, from: [...product.sizes], to: sizes },
        });
        product.sizes = [...sizes];
      } else {
        const colors = newValue.colors;
        if (!Array.isArray(colors) || !colors.every((s) => typeof s === 'string')) {
          errors.push(`${decision.caseId}: colors inválidos`);
          continue;
        }
        inverse.push({
          type: 'update-colors',
          caseId: decision.caseId,
          detail: { productId, colors: [...product.colors] },
        });
        changes.push({
          type: 'update-colors',
          caseId: decision.caseId,
          detail: { productId, from: [...product.colors], to: colors },
        });
        product.colors = [...colors];
      }
      continue;
    }

    if (decision.decision === 'fix-coordinates') {
      const hotspotId = decision.hotspotId;
      const hs = hotspotId ? hsById.get(hotspotId) : undefined;
      const coords = newValue.coordinates as { x: number; y: number; width: number; height: number } | undefined;
      const check = validateCoords(coords);
      if (!hs) {
        errors.push(`${decision.caseId}: hotspot no encontrado`);
        continue;
      }
      if (!check.ok || !coords) {
        errors.push(`${decision.caseId}: coordenadas inválidas`);
        continue;
      }
      if (hs.page !== decision.page) {
        errors.push(`${decision.caseId}: página ajena`);
        continue;
      }
      inverse.push({
        type: 'fix-coordinates',
        caseId: decision.caseId,
        detail: { hotspotId, x: hs.x, y: hs.y, width: hs.width, height: hs.height },
      });
      changes.push({
        type: 'fix-coordinates',
        caseId: decision.caseId,
        detail: {
          hotspotId,
          from: { x: hs.x, y: hs.y, width: hs.width, height: hs.height },
          to: coords,
        },
      });
      hs.x = coords.x;
      hs.y = coords.y;
      hs.width = coords.width;
      hs.height = coords.height;
      continue;
    }

    if (decision.decision === 'create-hotspot') {
      const productId = String(newValue.productId || decision.productId || '');
      const hotspotId = String(newValue.hotspotId || '');
      const coords = newValue.coordinates as { x: number; y: number; width: number; height: number } | undefined;
      const check = validateCoords(coords);
      if (!prodById.has(productId)) {
        errors.push(`${decision.caseId}: productId inexistente`);
        continue;
      }
      if (!hotspotId || hotspotIds.has(hotspotId) || hsById.has(hotspotId)) {
        errors.push(`${decision.caseId}: hotspotId inválido o duplicado`);
        continue;
      }
      if (!check.ok || !coords) {
        errors.push(`${decision.caseId}: coordenadas inválidas`);
        continue;
      }
      const created: HotspotRecord = {
        id: hotspotId,
        productId,
        page: decision.page,
        x: coords.x,
        y: coords.y,
        width: coords.width,
        height: coords.height,
        label: typeof newValue.label === 'string' ? newValue.label : undefined,
        isActive: true,
      };
      hotspots.push(created);
      hsById.set(hotspotId, created);
      hotspotIds.add(hotspotId);
      inverse.push({ type: 'remove-hotspot', caseId: decision.caseId, detail: { hotspotId } });
      changes.push({ type: 'create-hotspot', caseId: decision.caseId, detail: { hotspot: created } });
      continue;
    }

    if (decision.decision === 'remove-hotspot') {
      const hotspotId = decision.hotspotId;
      const idx = hotspotId ? hotspots.findIndex((h) => h.id === hotspotId) : -1;
      if (idx < 0 || !hotspotId) {
        errors.push(`${decision.caseId}: hotspot no encontrado`);
        continue;
      }
      const removed = hotspots[idx];
      inverse.push({ type: 'create-hotspot', caseId: decision.caseId, detail: { hotspot: cloneData(removed) } });
      changes.push({ type: 'remove-hotspot', caseId: decision.caseId, detail: { hotspotId } });
      hotspots.splice(idx, 1);
      hsById.delete(hotspotId);
      hotspotIds.delete(hotspotId);
    }
  }

  // Invariant checks
  for (const p of products) {
    const before = priceSnapshot.get(p.id);
    if ((p.price ?? null) !== (before ?? null)) {
      errors.push(`precio modificado en producto ${p.id}`);
    }
  }
  if (whatsapp !== context.whatsappNumber) {
    errors.push('WhatsApp modificado');
  }

  return {
    ok: errors.length === 0,
    dryRun,
    errors,
    skipped,
    changes,
    products: dryRun ? cloneData(context.products) : products,
    hotspots: dryRun ? cloneData(context.hotspots) : hotspots,
    inverse: dryRun ? [] : inverse,
  };
}

export function revertApplyChanges(
  products: ProductRecord[],
  hotspots: HotspotRecord[],
  inverse: ApplyChange[],
): { products: ProductRecord[]; hotspots: HotspotRecord[] } {
  const nextProducts = cloneData(products);
  const nextHotspots = cloneData(hotspots);
  const prodById = new Map(nextProducts.map((p) => [p.id, p]));
  const hsById = new Map(nextHotspots.map((h) => [h.id, h]));

  // Apply inverse in reverse order
  for (let i = inverse.length - 1; i >= 0; i -= 1) {
    const change = inverse[i];
    if (change.type === 'reassign-product') {
      const hs = hsById.get(String(change.detail.hotspotId));
      if (hs) hs.productId = String(change.detail.productId);
    } else if (change.type === 'update-sizes') {
      const p = prodById.get(String(change.detail.productId));
      if (p) p.sizes = [...(change.detail.sizes as string[])];
    } else if (change.type === 'update-colors') {
      const p = prodById.get(String(change.detail.productId));
      if (p) p.colors = [...(change.detail.colors as string[])];
    } else if (change.type === 'fix-coordinates') {
      const hs = hsById.get(String(change.detail.hotspotId));
      if (hs) {
        hs.x = Number(change.detail.x);
        hs.y = Number(change.detail.y);
        hs.width = Number(change.detail.width);
        hs.height = Number(change.detail.height);
      }
    } else if (change.type === 'remove-hotspot') {
      const hotspotId = String(change.detail.hotspotId);
      const idx = nextHotspots.findIndex((h) => h.id === hotspotId);
      if (idx >= 0) nextHotspots.splice(idx, 1);
      hsById.delete(hotspotId);
    } else if (change.type === 'create-hotspot') {
      const hotspot = change.detail.hotspot as HotspotRecord;
      nextHotspots.push(cloneData(hotspot));
      hsById.set(hotspot.id, hotspot);
    }
  }

  return { products: nextProducts, hotspots: nextHotspots };
}
