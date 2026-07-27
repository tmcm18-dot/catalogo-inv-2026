import type { ReviewBatch, ReviewCase, ReviewClassification, ReviewStatus } from './types.ts'

export type CaseFilters = {
  classification?: ReviewClassification | 'ALL' | '';
  page?: number | null;
  codeQuery?: string;
  productIdQuery?: string;
  onlyPending?: boolean;
  batch?: ReviewBatch | 'ALL' | '';
  status?: ReviewStatus | 'ALL' | '';
};

export function filterReviewCases(cases: ReviewCase[], filters: CaseFilters = {}): ReviewCase[] {
  const codeQ = (filters.codeQuery || '').trim().toLowerCase();
  const productQ = (filters.productIdQuery || '').trim().toLowerCase();
  const classification = filters.classification && filters.classification !== 'ALL' ? filters.classification : null;
  const batch = filters.batch && filters.batch !== 'ALL' ? filters.batch : null;
  const status = filters.status && filters.status !== 'ALL' ? filters.status : null;
  const page = typeof filters.page === 'number' && Number.isFinite(filters.page) ? filters.page : null;

  return cases.filter((item) => {
    if (classification && item.classification !== classification) return false;
    if (batch && item.batch !== batch) return false;
    if (status && item.reviewStatus !== status) return false;
    if (page != null && item.page !== page) return false;
    if (filters.onlyPending && item.reviewStatus !== 'pending') return false;
    if (codeQ) {
      const hay = `${item.currentCode || ''} ${item.printedCode || ''} ${item.candidateCodes.join(' ')}`.toLowerCase();
      if (!hay.includes(codeQ)) return false;
    }
    if (productQ) {
      const hay = `${item.productId || ''} ${item.suggestedProductId || ''} ${item.candidateProducts.map((c) => c.productId).join(' ')}`.toLowerCase();
      if (!hay.includes(productQ)) return false;
    }
    return true;
  });
}

export function summarizeCases(cases: ReviewCase[]) {
  const byClassification: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  let pending = 0;
  let reviewed = 0;
  let confirmed = 0;
  let ambiguous = 0;
  let rejected = 0;

  for (const item of cases) {
    byClassification[item.classification] = (byClassification[item.classification] || 0) + 1;
    byStatus[item.reviewStatus] = (byStatus[item.reviewStatus] || 0) + 1;
    if (item.reviewStatus === 'pending') pending += 1;
    else reviewed += 1;
    if (item.reviewStatus.startsWith('confirmed-')) confirmed += 1;
    if (item.reviewStatus === 'ambiguous') ambiguous += 1;
    if (item.reviewStatus === 'rejected') rejected += 1;
  }

  return {
    total: cases.length,
    pending,
    reviewed,
    confirmed,
    ambiguous,
    rejected,
    byClassification,
    byStatus,
  };
}

export function nextPendingIndex(cases: ReviewCase[], fromIndex: number): number {
  if (!cases.length) return -1;
  const start = Math.max(0, fromIndex);
  for (let i = start + 1; i < cases.length; i += 1) {
    if (cases[i].reviewStatus === 'pending') return i;
  }
  for (let i = 0; i <= start; i += 1) {
    if (cases[i].reviewStatus === 'pending') return i;
  }
  return -1;
}

export function selectCandidateProductId(
  casesItem: ReviewCase,
  selectedProductId: string | null | undefined,
): string | null {
  if (!selectedProductId) return casesItem.suggestedProductId || casesItem.productId;
  const hit = casesItem.candidateProducts.find((c) => c.productId === selectedProductId);
  return hit ? hit.productId : null;
}
