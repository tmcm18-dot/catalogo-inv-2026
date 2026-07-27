import fs from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import {
  decisionsToCsv,
  emptyDecisionsFile,
  removeDecision,
  upsertDecision,
  validateDecision,
} from '@/lib/catalog-review/decisions';
import { isCatalogReviewEnabled } from '@/lib/catalog-review/security';
import type { ConfirmedDecisionsFile, ReviewDecision } from '@/lib/catalog-review/types';

export const dynamic = 'force-dynamic';

function blocked() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

async function readDecisions(filePath: string): Promise<ConfirmedDecisionsFile> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as ConfirmedDecisionsFile;
  } catch {
    return emptyDecisionsFile();
  }
}

async function writeDecisions(root: string, file: ConfirmedDecisionsFile) {
  const dir = path.join(root, 'reports/catalog-review');
  await fs.mkdir(dir, { recursive: true });
  const jsonPath = path.join(dir, 'confirmed-decisions.json');
  const csvPath = path.join(dir, 'confirmed-decisions.csv');
  const tmp = `${jsonPath}.tmp`;
  await fs.writeFile(tmp, `${JSON.stringify(file, null, 2)}\n`);
  await fs.rename(tmp, jsonPath);
  await fs.writeFile(csvPath, decisionsToCsv(file.decisions));
}

export async function GET() {
  if (!isCatalogReviewEnabled()) return blocked();
  const file = await readDecisions(path.join(process.cwd(), 'reports/catalog-review/confirmed-decisions.json'));
  return NextResponse.json(file);
}

export async function POST(request: Request) {
  if (!isCatalogReviewEnabled()) return blocked();

  const root = process.cwd();
  let body: Partial<ReviewDecision>;
  try {
    body = (await request.json()) as Partial<ReviewDecision>;
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const products = JSON.parse(await fs.readFile(path.join(root, 'src/data/products.json'), 'utf8')) as { id: string }[];
  const hotspots = JSON.parse(await fs.readFile(path.join(root, 'src/data/hotspots.json'), 'utf8')) as { id: string }[];
  const productIds = new Set(products.map((p) => p.id));
  const hotspotIds = new Set(hotspots.map((h) => h.id));

  // Allow create-hotspot IDs that are new (not yet in hotspots.json)
  const validation = validateDecision(body, {
    productIds,
    hotspotIds: body.decision === 'create-hotspot'
      ? new Set([...hotspotIds].filter((id) => id !== body.newValue?.hotspotId && id !== body.hotspotId))
      : hotspotIds,
  });

  if (!validation.ok || !validation.normalized) {
    return NextResponse.json({ error: 'Decisión inválida', details: validation.errors }, { status: 400 });
  }

  const current = await readDecisions(path.join(root, 'reports/catalog-review/confirmed-decisions.json'));
  const next = upsertDecision(current, validation.normalized);
  await writeDecisions(root, next);
  return NextResponse.json({ ok: true, decision: validation.normalized, file: next });
}

export async function DELETE(request: Request) {
  if (!isCatalogReviewEnabled()) return blocked();
  const root = process.cwd();
  const url = new URL(request.url);
  const caseId = url.searchParams.get('caseId');
  if (!caseId) return NextResponse.json({ error: 'caseId requerido' }, { status: 400 });

  const current = await readDecisions(path.join(root, 'reports/catalog-review/confirmed-decisions.json'));
  const next = removeDecision(current, caseId);
  await writeDecisions(root, next);
  return NextResponse.json({ ok: true, file: next });
}
