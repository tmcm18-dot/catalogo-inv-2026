import { describe, expect, it } from 'vitest';
import {
  applyReviewDecisions,
  buildPendingCases,
  filterReviewCases,
  generateUniqueHotspotId,
  isApplyableDecision,
  isCatalogReviewEnabled,
  catalogReviewBlockReason,
  revertApplyChanges,
  selectCandidateProductId,
  summarizeCases,
  upsertDecision,
  validateCoords,
  validateDecision,
  emptyDecisionsFile,
} from '@/lib/catalog-review';
import type { ReviewCase, ReviewDecision } from '@/lib/catalog-review/types';

const products = [
  {
    id: '8237',
    code: '8237',
    name: 'Producto A',
    brand: 'INV',
    category: 'Pack',
    page: 8,
    sizes: ['85', '90'],
    colors: ['Negro'],
    price: 10,
  },
  {
    id: '8238',
    code: '8238',
    name: 'Producto B',
    brand: 'INV',
    category: 'Pack',
    page: 8,
    sizes: ['85'],
    colors: ['Blanco'],
    price: 12,
  },
];

const audit = {
  hotspots: [
    {
      hotspotId: 'hotspot-8238',
      page: 8,
      x: 51,
      y: 8,
      width: 47,
      height: 38,
      productId: '8238',
      linkedCode: '8238',
      linkedName: 'Producto B',
      printedCode: '8237',
      candidates: '8237',
      classification: 'MISMATCH_HIGH',
      confidence: 'high',
      explanation: 'mismatch',
      suggestedProductId: '8237',
      evidence: 'reports/x.jpg',
    },
    {
      hotspotId: 'hotspot-ok',
      page: 8,
      x: 2,
      y: 8,
      width: 40,
      height: 30,
      productId: '8237',
      linkedCode: '8237',
      linkedName: 'Producto A',
      printedCode: '8237',
      candidates: '8237',
      classification: 'MATCH',
      confidence: 'high',
      explanation: 'ok',
    },
    {
      hotspotId: 'hotspot-med',
      page: 9,
      x: 10,
      y: 10,
      width: 20,
      height: 20,
      productId: '8238',
      linkedCode: '8238',
      linkedName: 'Producto B',
      printedCode: '9999',
      candidates: '9999',
      classification: 'MISMATCH_MEDIUM',
      confidence: 'medium',
      explanation: 'medium',
    },
  ],
  missingHotspots: [
    {
      productId: '11137',
      code: '11137',
      page: 61,
      name: 'Sin hotspot',
      printedDetected: true,
      classification: 'MISSING_HOTSPOT',
      note: 'requiere manual',
    },
  ],
  products: [
    {
      productId: '8238',
      code: '8238',
      page: 8,
      name: 'Producto B',
      sizesCurrent: '85',
      colorsCurrent: 'Blanco',
      sizesPrinted: '85|90',
      colorsPrinted: 'Negro',
      sizesClass: 'MISMATCH_HIGH',
      colorsClass: 'MISMATCH_HIGH',
      tcRaw: 'T: 85 al 90. C: Negro.',
    },
  ],
};

function sampleCase(overrides: Partial<ReviewCase> = {}): ReviewCase {
  return {
    caseId: 'hs:hotspot-8238:MISMATCH_HIGH',
    classification: 'MISMATCH_HIGH',
    confidence: 'high',
    page: 8,
    hotspotId: 'hotspot-8238',
    productId: '8238',
    currentCode: '8238',
    currentName: 'Producto B',
    currentBrand: 'INV',
    currentCategory: 'Pack',
    coordinates: { x: 51, y: 8, width: 47, height: 38 },
    printedCode: '8237',
    candidateCodes: ['8237'],
    candidateProducts: [{ productId: '8237', code: '8237', name: 'Producto A', page: 8 }],
    currentSizes: ['85'],
    printedSizes: [],
    currentColors: ['Blanco'],
    printedColors: [],
    explanation: 'mismatch',
    evidencePath: 'reports/x.jpg',
    reviewStatus: 'pending',
    batch: 'A',
    suggestedProductId: '8237',
    tcRaw: null,
    pageImage: '/assets/catalogo/pages/page-008.jpg',
    ...overrides,
  };
}

describe('catalog-review case generation', () => {
  it('convierte el informe de auditoría en pending-cases', () => {
    const pending = buildPendingCases({
      audit,
      products,
      generatedAt: '2026-07-27T00:00:00.000Z',
    });
    expect(pending.cases.every((c) => c.classification !== 'MISMATCH_HIGH' || c.batch === 'A')).toBe(true);
    expect(pending.cases.some((c) => c.classification === 'MISMATCH_HIGH')).toBe(true);
    expect(pending.cases.find((c) => c.caseId === 'hs:hotspot-8238:MISMATCH_HIGH')).toBeTruthy();
    expect(pending.cases.find((c) => c.caseId === 'missing:11137')).toBeTruthy();
    expect(pending.cases.find((c) => c.caseId === 'attr-sizes:8238')).toBeTruthy();
    expect(pending.cases.find((c) => c.caseId === 'attr-colors:8238')).toBeTruthy();
    expect(pending.totals.byBatch.A).toBe(1);
    expect(pending.totals.byBatch.B).toBe(1);
    expect(pending.totals.byBatch.E).toBe(1);
  });
});

describe('catalog-review filters', () => {
  const cases = [
    sampleCase(),
    sampleCase({
      caseId: 'hs:hotspot-med:MISMATCH_MEDIUM',
      classification: 'MISMATCH_MEDIUM',
      batch: 'B',
      page: 9,
      currentCode: '8238',
      productId: '8238',
      reviewStatus: 'ambiguous',
    }),
    sampleCase({
      caseId: 'missing:11137',
      classification: 'MISSING_HOTSPOT',
      batch: 'E',
      page: 61,
      productId: '11137',
      currentCode: '11137',
      hotspotId: null,
    }),
  ];

  it('filtra por clasificación', () => {
    expect(filterReviewCases(cases, { classification: 'MISMATCH_HIGH' })).toHaveLength(1);
  });

  it('filtra por página', () => {
    expect(filterReviewCases(cases, { page: 61 })).toHaveLength(1);
  });

  it('busca por código', () => {
    expect(filterReviewCases(cases, { codeQuery: '11137' })[0].caseId).toBe('missing:11137');
  });

  it('busca por productId', () => {
    expect(filterReviewCases(cases, { productIdQuery: '8237' })[0].suggestedProductId).toBe('8237');
  });

  it('muestra solo pendientes', () => {
    expect(filterReviewCases(cases, { onlyPending: true })).toHaveLength(2);
  });

  it('resume conteos', () => {
    const summary = summarizeCases(cases);
    expect(summary.total).toBe(3);
    expect(summary.pending).toBe(2);
    expect(summary.ambiguous).toBe(1);
  });

  it('selecciona candidato válido', () => {
    expect(selectCandidateProductId(cases[0], '8237')).toBe('8237');
    expect(selectCandidateProductId(cases[0], 'nope')).toBeNull();
  });
});

describe('catalog-review coords', () => {
  it('valida coordenadas en rango', () => {
    expect(validateCoords({ x: 10, y: 10, width: 20, height: 20 }).ok).toBe(true);
  });

  it('rechaza coordenadas fuera de rango', () => {
    expect(validateCoords({ x: 90, y: 10, width: 20, height: 20 }).ok).toBe(false);
    expect(validateCoords({ x: -1, y: 0, width: 10, height: 10 }).ok).toBe(false);
    expect(validateCoords({ x: 0, y: 0, width: 0, height: 10 }).ok).toBe(false);
  });

  it('genera hotspotId único', () => {
    const existing = new Set(['hotspot-11137']);
    expect(generateUniqueHotspotId('11137', 61, existing)).toBe('hotspot-11137-p61');
  });
});

describe('catalog-review decisions', () => {
  const productIds = new Set(['8237', '8238']);
  const hotspotIds = new Set(['hotspot-8238']);

  it('valida decisión de reasignación', () => {
    const result = validateDecision(
      {
        caseId: 'hs:hotspot-8238:MISMATCH_HIGH',
        classification: 'MISMATCH_HIGH',
        decision: 'reassign-product',
        page: 8,
        hotspotId: 'hotspot-8238',
        productId: '8237',
        confirmed: true,
        newValue: { productId: '8237' },
        comment: '',
        confidence: 'high',
        timestamp: '2026-07-27T00:00:00.000Z',
      },
      { productIds, hotspotIds },
    );
    expect(result.ok).toBe(true);
  });

  it('rechaza productId inexistente', () => {
    const result = validateDecision(
      {
        caseId: 'x',
        classification: 'MISMATCH_HIGH',
        decision: 'reassign-product',
        page: 8,
        confirmed: true,
        newValue: { productId: 'nope' },
      },
      { productIds, hotspotIds },
    );
    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toMatch(/inexistente/);
  });

  it('no considera aplicables las decisiones ambiguas', () => {
    const decision: ReviewDecision = {
      caseId: 'x',
      classification: 'AMBIGUOUS',
      decision: 'mark-ambiguous',
      previousValue: null,
      newValue: null,
      evidence: null,
      comment: '',
      confidence: 'medium',
      confirmed: false,
      timestamp: '2026-07-27T00:00:00.000Z',
      page: 1,
      hotspotId: null,
      productId: null,
      reviewStatus: 'ambiguous',
    };
    expect(isApplyableDecision(decision)).toBe(false);
  });

  it('upsert evita duplicados por caseId', () => {
    let file = emptyDecisionsFile();
    const base: ReviewDecision = {
      caseId: 'a',
      classification: 'MISMATCH_HIGH',
      decision: 'confirm-current',
      previousValue: null,
      newValue: null,
      evidence: null,
      comment: 'one',
      confidence: 'high',
      confirmed: true,
      timestamp: '2026-07-27T00:00:00.000Z',
      page: 1,
      hotspotId: 'h1',
      productId: 'p1',
      reviewStatus: 'confirmed-current',
    };
    file = upsertDecision(file, base);
    file = upsertDecision(file, { ...base, comment: 'two', timestamp: '2026-07-27T01:00:00.000Z' });
    expect(file.decisions).toHaveLength(1);
    expect(file.decisions[0].comment).toBe('two');
  });
});

describe('catalog-review apply/verify invariants', () => {
  const hotspots = [
    {
      id: 'hotspot-8238',
      productId: '8238',
      page: 8,
      x: 51,
      y: 8,
      width: 47,
      height: 38,
      isActive: true,
    },
  ];

  it('dry-run no modifica datos', () => {
    const decision: ReviewDecision = {
      caseId: 'hs:hotspot-8238:MISMATCH_HIGH',
      classification: 'MISMATCH_HIGH',
      decision: 'reassign-product',
      previousValue: { productId: '8238' },
      newValue: { productId: '8237' },
      evidence: null,
      comment: '',
      confidence: 'high',
      confirmed: true,
      timestamp: '2026-07-27T00:00:00.000Z',
      page: 8,
      hotspotId: 'hotspot-8238',
      productId: '8237',
      reviewStatus: 'confirmed-reassign-product',
    };
    const result = applyReviewDecisions([decision], {
      products: products.map((p) => ({ ...p, sizes: [...p.sizes], colors: [...p.colors] })),
      hotspots: hotspots.map((h) => ({ ...h })),
      whatsappNumber: '5493876106268',
    }, { confirm: false });
    expect(result.dryRun).toBe(true);
    expect(result.hotspots[0].productId).toBe('8238');
    expect(result.changes).toHaveLength(1);
  });

  it('aplica solo con confirm y preserva precios/WhatsApp', () => {
    const decision: ReviewDecision = {
      caseId: 'hs:hotspot-8238:MISMATCH_HIGH',
      classification: 'MISMATCH_HIGH',
      decision: 'reassign-product',
      previousValue: { productId: '8238' },
      newValue: { productId: '8237' },
      evidence: null,
      comment: '',
      confidence: 'high',
      confirmed: true,
      timestamp: '2026-07-27T00:00:00.000Z',
      page: 8,
      hotspotId: 'hotspot-8238',
      productId: '8237',
      reviewStatus: 'confirmed-reassign-product',
    };
    const sourceProducts = products.map((p) => ({ ...p, sizes: [...p.sizes], colors: [...p.colors] }));
    const sourceHotspots = hotspots.map((h) => ({ ...h }));
    const result = applyReviewDecisions([decision], {
      products: sourceProducts,
      hotspots: sourceHotspots,
      whatsappNumber: '5493876106268',
    }, { confirm: true });
    expect(result.ok).toBe(true);
    expect(result.dryRun).toBe(false);
    expect(result.hotspots[0].productId).toBe('8237');
    expect(result.products.map((p) => p.price)).toEqual([10, 12]);
    const reverted = revertApplyChanges(result.products, result.hotspots, result.inverse);
    expect(reverted.hotspots[0].productId).toBe('8238');
  });

  it('ignora ambiguous/rejected en apply', () => {
    const decisions: ReviewDecision[] = [
      {
        caseId: 'a',
        classification: 'AMBIGUOUS',
        decision: 'mark-ambiguous',
        previousValue: null,
        newValue: null,
        evidence: null,
        comment: '',
        confidence: 'medium',
        confirmed: false,
        timestamp: '2026-07-27T00:00:00.000Z',
        page: 1,
        hotspotId: null,
        productId: null,
        reviewStatus: 'ambiguous',
      },
    ];
    const result = applyReviewDecisions(decisions, {
      products: products.map((p) => ({ ...p, sizes: [...p.sizes], colors: [...p.colors] })),
      hotspots: hotspots.map((h) => ({ ...h })),
      whatsappNumber: '5493876106268',
    }, { confirm: true });
    expect(result.changes).toHaveLength(0);
    expect(result.skipped).toHaveLength(1);
  });

  it('rechaza intento de modificar precio en newValue', () => {
    const result = validateDecision(
      {
        caseId: 'x',
        classification: 'MISMATCH_HIGH',
        decision: 'confirm-current',
        page: 8,
        confirmed: true,
        newValue: { price: 999 },
      },
      { productIds: new Set(['8238']), hotspotIds: new Set(['hotspot-8238']) },
    );
    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toMatch(/precios/);
  });

  it('rechaza intento de modificar WhatsApp', () => {
    const result = validateDecision(
      {
        caseId: 'x',
        classification: 'MISMATCH_HIGH',
        decision: 'confirm-current',
        page: 8,
        confirmed: true,
        newValue: { whatsapp: '000' },
      },
      { productIds: new Set(['8238']), hotspotIds: new Set(['hotspot-8238']) },
    );
    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toMatch(/WhatsApp/);
  });
});

describe('catalog-review security', () => {
  it('bloquea sin CATALOG_REVIEW_MODE', () => {
    expect(isCatalogReviewEnabled({ NODE_ENV: 'development', CATALOG_REVIEW_MODE: '0' })).toBe(false);
    expect(catalogReviewBlockReason({ NODE_ENV: 'development', CATALOG_REVIEW_MODE: '0' })).toBe(
      'missing-catalog-review-mode',
    );
  });

  it('bloquea en producción', () => {
    expect(isCatalogReviewEnabled({ NODE_ENV: 'production', CATALOG_REVIEW_MODE: '1' })).toBe(false);
  });

  it('bloquea en Vercel', () => {
    expect(
      isCatalogReviewEnabled({
        NODE_ENV: 'development',
        CATALOG_REVIEW_MODE: '1',
        VERCEL: '1',
        VERCEL_ENV: 'preview',
      }),
    ).toBe(false);
  });

  it('habilita solo en desarrollo local', () => {
    expect(isCatalogReviewEnabled({ NODE_ENV: 'development', CATALOG_REVIEW_MODE: '1' })).toBe(true);
  });
});
