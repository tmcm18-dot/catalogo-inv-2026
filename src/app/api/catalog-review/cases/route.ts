import fs from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { isCatalogReviewEnabled } from '@/lib/catalog-review/security';
import { emptyDecisionsFile } from '@/lib/catalog-review/decisions';

export const dynamic = 'force-dynamic';

function blocked() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

async function readJsonSafe<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function GET() {
  if (!isCatalogReviewEnabled()) return blocked();

  const root = process.cwd();
  const pendingPath = path.join(root, 'reports/catalog-review/pending-cases.json');
  const decisionsPath = path.join(root, 'reports/catalog-review/confirmed-decisions.json');

  const pending = await readJsonSafe(pendingPath, {
    version: 1,
    generatedAt: null,
    sourceAudit: null,
    totals: { cases: 0, byClassification: {}, byBatch: {}, byStatus: {} },
    cases: [],
  });
  const decisions = await readJsonSafe(decisionsPath, emptyDecisionsFile());

  // Enrich reviewStatus from decisions without writing files on GET
  const byCase = new Map(decisions.decisions.map((d) => [d.caseId, d]));
  const cases = (pending.cases || []).map((item: { caseId: string; reviewStatus: string }) => {
    const decision = byCase.get(item.caseId);
    return decision ? { ...item, reviewStatus: decision.reviewStatus } : item;
  });

  return NextResponse.json({
    pending: { ...pending, cases },
    decisions,
  });
}
