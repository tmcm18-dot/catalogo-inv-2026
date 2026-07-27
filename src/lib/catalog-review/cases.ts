import type {
  CandidateProduct,
  HotspotCoords,
  PendingCasesFile,
  ReviewBatch,
  ReviewCase,
  ReviewClassification,
} from './types.ts'

export type AuditHotspotRow = {
  hotspotId: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  productId: string;
  linkedCode: string | null;
  linkedName: string | null;
  printedCode: string | null;
  candidates: string | string[] | null;
  classification: string;
  confidence: string;
  explanation: string;
  suggestedProductId?: string | null;
  evidence?: string | null;
};

export type AuditMissingHotspotRow = {
  productId: string;
  code: string;
  page: number;
  name: string;
  printedDetected?: boolean;
  printedX?: number;
  printedY?: number;
  classification: string;
  note?: string;
};

export type AuditProductRow = {
  productId: string;
  code: string;
  page: number;
  name: string;
  sizesCurrent: string;
  colorsCurrent: string;
  sizesPrinted: string;
  colorsPrinted: string;
  sizesClass: string;
  colorsClass: string;
  tcRaw?: string | null;
  sharedCode?: boolean;
};

export type CatalogProductLite = {
  id: string;
  code: string;
  name: string;
  brand?: string;
  category?: string;
  page: number;
  sizes?: string[];
  colors?: string[];
};

export type AuditReport = {
  summary?: { generatedAt?: string };
  hotspots: AuditHotspotRow[];
  missingHotspots: AuditMissingHotspotRow[];
  products: AuditProductRow[];
};

const SKIP_HOTSPOT = new Set(['MATCH', 'EXTRA_HOTSPOT']);

function splitPipe(value: string | null | undefined): string[] {
  if (!value) return [];
  return String(value)
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseCandidates(raw: string | string[] | null | undefined): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).map((s) => s.trim()).filter(Boolean);
  return String(raw)
    .split(/[|,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function pageImagePath(page: number): string {
  return `/assets/catalogo/pages/page-${String(page).padStart(3, '0')}.jpg`;
}

export function classificationToBatch(classification: ReviewClassification): ReviewBatch {
  switch (classification) {
    case 'MISMATCH_HIGH':
      return 'A';
    case 'MISMATCH_MEDIUM':
      return 'B';
    case 'AMBIGUOUS':
    case 'SHARED_CODE':
      return 'C';
    case 'NOT_FOUND':
      return 'D';
    case 'MISSING_HOTSPOT':
      return 'E';
    default:
      return 'ATTR';
  }
}

function resolveCandidates(
  codes: string[],
  page: number,
  productsByCode: Map<string, CatalogProductLite[]>,
  productsById: Map<string, CatalogProductLite>,
  suggestedProductId?: string | null,
): CandidateProduct[] {
  const out: CandidateProduct[] = [];
  const seen = new Set<string>();

  const push = (p: CatalogProductLite | undefined) => {
    if (!p || seen.has(p.id)) return;
    seen.add(p.id);
    out.push({ productId: p.id, code: p.code, name: p.name, page: p.page });
  };

  if (suggestedProductId) push(productsById.get(suggestedProductId));

  for (const code of codes) {
    const onPage = (productsByCode.get(code) || []).filter((p) => p.page === page);
    const list = onPage.length ? onPage : productsByCode.get(code) || [];
    for (const p of list) push(p);
  }

  return out;
}

function countMap(items: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const key of items) out[key] = (out[key] || 0) + 1;
  return out;
}

export function buildPendingCases(options: {
  audit: AuditReport;
  products: CatalogProductLite[];
  sourceAudit?: string;
  generatedAt?: string;
}): PendingCasesFile {
  const { audit, products } = options;
  const productsById = new Map(products.map((p) => [p.id, p]));
  const productsByCode = new Map<string, CatalogProductLite[]>();
  for (const p of products) {
    const list = productsByCode.get(p.code) || [];
    list.push(p);
    productsByCode.set(p.code, list);
  }

  const cases: ReviewCase[] = [];

  for (const row of audit.hotspots) {
    if (SKIP_HOTSPOT.has(row.classification)) continue;
    const classification = row.classification as ReviewClassification;
    if (!['MISMATCH_HIGH', 'MISMATCH_MEDIUM', 'AMBIGUOUS', 'NOT_FOUND', 'SHARED_CODE'].includes(classification)) {
      continue;
    }
    const product = productsById.get(row.productId);
    const candidateCodes = parseCandidates(row.candidates);
    if (row.printedCode && !candidateCodes.includes(row.printedCode)) candidateCodes.unshift(row.printedCode);
    const coords: HotspotCoords = {
      x: row.x,
      y: row.y,
      width: row.width,
      height: row.height,
    };
    cases.push({
      caseId: `hs:${row.hotspotId}:${classification}`,
      classification,
      confidence: row.confidence || 'unknown',
      page: row.page,
      hotspotId: row.hotspotId,
      productId: row.productId || null,
      currentCode: row.linkedCode ?? product?.code ?? null,
      currentName: row.linkedName ?? product?.name ?? null,
      currentBrand: product?.brand ?? null,
      currentCategory: product?.category ?? null,
      coordinates: coords,
      printedCode: row.printedCode,
      candidateCodes,
      candidateProducts: resolveCandidates(
        candidateCodes,
        row.page,
        productsByCode,
        productsById,
        row.suggestedProductId,
      ),
      currentSizes: product?.sizes ? [...product.sizes] : [],
      printedSizes: [],
      currentColors: product?.colors ? [...product.colors] : [],
      printedColors: [],
      explanation: row.explanation || '',
      evidencePath: row.evidence || null,
      reviewStatus: 'pending',
      batch: classificationToBatch(classification),
      suggestedProductId: row.suggestedProductId || null,
      tcRaw: null,
      pageImage: pageImagePath(row.page),
    });
  }

  for (const row of audit.missingHotspots || []) {
    const product = productsById.get(row.productId);
    cases.push({
      caseId: `missing:${row.productId}`,
      classification: 'MISSING_HOTSPOT',
      confidence: row.printedDetected ? 'medium' : 'low',
      page: row.page,
      hotspotId: null,
      productId: row.productId,
      currentCode: row.code ?? product?.code ?? null,
      currentName: row.name ?? product?.name ?? null,
      currentBrand: product?.brand ?? null,
      currentCategory: product?.category ?? null,
      coordinates: null,
      printedCode: row.code ?? null,
      candidateCodes: row.code ? [row.code] : [],
      candidateProducts: product
        ? [{ productId: product.id, code: product.code, name: product.name, page: product.page }]
        : [],
      currentSizes: product?.sizes ? [...product.sizes] : [],
      printedSizes: [],
      currentColors: product?.colors ? [...product.colors] : [],
      printedColors: [],
      explanation: row.note || 'Producto sin hotspot; requiere delimitación manual.',
      evidencePath: null,
      reviewStatus: 'pending',
      batch: 'E',
      suggestedProductId: row.productId,
      tcRaw: null,
      pageImage: pageImagePath(row.page),
    });
  }

  for (const row of audit.products || []) {
    const product = productsById.get(row.productId);
    const sizeIssue = row.sizesClass === 'MISMATCH_HIGH' || row.sizesClass === 'MISSING_DATA';
    const colorIssue = row.colorsClass === 'MISMATCH_HIGH' || row.colorsClass === 'MISSING_DATA';
    if (!sizeIssue && !colorIssue) continue;

    if (sizeIssue) {
      const classification: ReviewClassification =
        row.sizesClass === 'MISSING_DATA' ? 'SIZES_MISSING' : 'SIZES_MISMATCH';
      cases.push({
        caseId: `attr-sizes:${row.productId}`,
        classification,
        confidence: 'high',
        page: row.page,
        hotspotId: null,
        productId: row.productId,
        currentCode: row.code ?? product?.code ?? null,
        currentName: row.name ?? product?.name ?? null,
        currentBrand: product?.brand ?? null,
        currentCategory: product?.category ?? null,
        coordinates: null,
        printedCode: row.code ?? null,
        candidateCodes: row.code ? [row.code] : [],
        candidateProducts: product
          ? [{ productId: product.id, code: product.code, name: product.name, page: product.page }]
          : [],
        currentSizes: splitPipe(row.sizesCurrent),
        printedSizes: splitPipe(row.sizesPrinted),
        currentColors: splitPipe(row.colorsCurrent),
        printedColors: splitPipe(row.colorsPrinted),
        explanation: `Talles actuales ≠ impresos (clase ${row.sizesClass}).`,
        evidencePath: null,
        reviewStatus: 'pending',
        batch: 'ATTR',
        suggestedProductId: row.productId,
        tcRaw: row.tcRaw || null,
        pageImage: pageImagePath(row.page),
      });
    }

    if (colorIssue) {
      const classification: ReviewClassification =
        row.colorsClass === 'MISSING_DATA' ? 'COLORS_MISSING' : 'COLORS_MISMATCH';
      cases.push({
        caseId: `attr-colors:${row.productId}`,
        classification,
        confidence: 'high',
        page: row.page,
        hotspotId: null,
        productId: row.productId,
        currentCode: row.code ?? product?.code ?? null,
        currentName: row.name ?? product?.name ?? null,
        currentBrand: product?.brand ?? null,
        currentCategory: product?.category ?? null,
        coordinates: null,
        printedCode: row.code ?? null,
        candidateCodes: row.code ? [row.code] : [],
        candidateProducts: product
          ? [{ productId: product.id, code: product.code, name: product.name, page: product.page }]
          : [],
        currentSizes: splitPipe(row.sizesCurrent),
        printedSizes: splitPipe(row.sizesPrinted),
        currentColors: splitPipe(row.colorsCurrent),
        printedColors: splitPipe(row.colorsPrinted),
        explanation: `Colores actuales ≠ impresos (clase ${row.colorsClass}).`,
        evidencePath: null,
        reviewStatus: 'pending',
        batch: 'ATTR',
        suggestedProductId: row.productId,
        tcRaw: row.tcRaw || null,
        pageImage: pageImagePath(row.page),
      });
    }
  }

  cases.sort((a, b) => {
    if (a.page !== b.page) return a.page - b.page;
    return a.caseId.localeCompare(b.caseId);
  });

  return {
    version: 1,
    generatedAt: options.generatedAt || new Date().toISOString(),
    sourceAudit: options.sourceAudit || 'reports/catalog-integrity-audit.json',
    totals: {
      cases: cases.length,
      byClassification: countMap(cases.map((c) => c.classification)),
      byBatch: countMap(cases.map((c) => c.batch)),
      byStatus: countMap(cases.map((c) => c.reviewStatus)),
    },
    cases,
  };
}
