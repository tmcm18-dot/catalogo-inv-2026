/** Tipos de la herramienta local de revisión de integridad del catálogo. */

export const REVIEW_STATUSES = [
  'pending',
  'confirmed-current',
  'confirmed-reassign-product',
  'confirmed-update-sizes',
  'confirmed-update-colors',
  'confirmed-create-hotspot',
  'confirmed-remove-hotspot',
  'ambiguous',
  'rejected',
  'needs-manual-source',
] as const;

export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const REVIEW_CLASSIFICATIONS = [
  'MISMATCH_HIGH',
  'MISMATCH_MEDIUM',
  'AMBIGUOUS',
  'NOT_FOUND',
  'SHARED_CODE',
  'MISSING_HOTSPOT',
  'SIZES_MISMATCH',
  'COLORS_MISMATCH',
  'SIZES_MISSING',
  'COLORS_MISSING',
] as const;

export type ReviewClassification = (typeof REVIEW_CLASSIFICATIONS)[number];

export type ReviewBatch = 'A' | 'B' | 'C' | 'D' | 'E' | 'ATTR';

export type HotspotCoords = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CandidateProduct = {
  productId: string;
  code: string;
  name: string;
  page: number;
};

export type ReviewCase = {
  caseId: string;
  classification: ReviewClassification;
  confidence: string;
  page: number;
  hotspotId: string | null;
  productId: string | null;
  currentCode: string | null;
  currentName: string | null;
  currentBrand: string | null;
  currentCategory: string | null;
  coordinates: HotspotCoords | null;
  printedCode: string | null;
  candidateCodes: string[];
  candidateProducts: CandidateProduct[];
  currentSizes: string[];
  printedSizes: string[];
  currentColors: string[];
  printedColors: string[];
  explanation: string;
  evidencePath: string | null;
  reviewStatus: ReviewStatus;
  batch: ReviewBatch;
  suggestedProductId: string | null;
  tcRaw: string | null;
  pageImage: string;
};

export type ReviewDecisionKind =
  | 'confirm-current'
  | 'reassign-product'
  | 'update-sizes'
  | 'update-colors'
  | 'create-hotspot'
  | 'remove-hotspot'
  | 'fix-coordinates'
  | 'mark-ambiguous'
  | 'mark-rejected'
  | 'needs-manual-source';

export type ReviewDecision = {
  caseId: string;
  classification: ReviewClassification;
  decision: ReviewDecisionKind;
  previousValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  evidence: string | null;
  comment: string;
  confidence: string;
  confirmed: boolean;
  timestamp: string;
  page: number;
  hotspotId: string | null;
  productId: string | null;
  reviewStatus: ReviewStatus;
};

export type PendingCasesFile = {
  version: number;
  generatedAt: string;
  sourceAudit: string;
  totals: {
    cases: number;
    byClassification: Record<string, number>;
    byBatch: Record<string, number>;
    byStatus: Record<string, number>;
  };
  cases: ReviewCase[];
};

export type ConfirmedDecisionsFile = {
  version: number;
  updatedAt: string;
  decisions: ReviewDecision[];
};
