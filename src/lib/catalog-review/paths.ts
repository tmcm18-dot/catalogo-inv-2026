import { catalogReviewBlockReason, isCatalogReviewEnabled } from './security.ts'

export type ReviewPaths = {
  root: string;
  pendingCases: string;
  confirmedDecisions: string;
  confirmedDecisionsCsv: string;
  appliedChanges: string;
  backupsDir: string;
};

export function getReviewPaths(root: string): ReviewPaths {
  const base = `${root.replace(/\\/g, '/')}/reports/catalog-review`;
  return {
    root,
    pendingCases: `${base}/pending-cases.json`,
    confirmedDecisions: `${base}/confirmed-decisions.json`,
    confirmedDecisionsCsv: `${base}/confirmed-decisions.csv`,
    appliedChanges: `${base}/applied-changes.json`,
    backupsDir: `${base}/backups`,
  };
}

export function assertLocalReviewAccess(env: NodeJS.ProcessEnv = process.env): void {
  if (!isCatalogReviewEnabled(env)) {
    const reason = catalogReviewBlockReason(env) || 'disabled';
    const error = new Error(`Catalog review disabled (${reason})`);
    (error as Error & { status: number }).status = 404;
    throw error;
  }
}

export { catalogReviewBlockReason, isCatalogReviewEnabled };
