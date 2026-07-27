#!/usr/bin/env node
/**
 * Verifica confirmed-decisions.json / applied-changes.json sin asumir aplicación.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
}

async function main() {
  const { validateDecision, isApplyableDecision } = await import(
    pathToFileURL(path.join(ROOT, 'src/lib/catalog-review/decisions.ts')).href
  );
  const { validateCoords } = await import(
    pathToFileURL(path.join(ROOT, 'src/lib/catalog-review/coords.ts')).href
  );

  const products = readJson('src/data/products.json');
  const hotspots = readJson('src/data/hotspots.json');
  const productIds = new Set(products.map((p) => p.id));
  const hotspotIds = new Set(hotspots.map((h) => h.id));
  const priceById = new Map(products.map((p) => [p.id, p.price ?? null]));

  const cartSource = fs.readFileSync(path.join(ROOT, 'src/lib/cart.ts'), 'utf8');
  const waMatch = cartSource.match(/whatsapp:\s*'([^']+)'/);
  const whatsapp = waMatch ? waMatch[1] : null;
  const hasOrderText = cartSource.includes('Hola, quiero hacer este pedido:');

  const decisionsPath = path.join(ROOT, 'reports/catalog-review/confirmed-decisions.json');
  if (!fs.existsSync(decisionsPath)) {
    console.error('No existe reports/catalog-review/confirmed-decisions.json');
    process.exit(1);
  }
  const file = readJson('reports/catalog-review/confirmed-decisions.json');
  const errors = [];
  const warnings = [];
  const seenCase = new Set();

  for (const decision of file.decisions || []) {
    if (seenCase.has(decision.caseId)) errors.push(`duplicado caseId ${decision.caseId}`);
    seenCase.add(decision.caseId);

    const result = validateDecision(decision, { productIds, hotspotIds });
    if (!result.ok) errors.push(`${decision.caseId}: ${result.errors.join('; ')}`);

    if (decision.newValue?.price !== undefined) errors.push(`${decision.caseId}: intenta modificar precio`);
    if (decision.newValue?.whatsapp !== undefined) errors.push(`${decision.caseId}: intenta modificar WhatsApp`);

    if (decision.decision === 'create-hotspot' || decision.decision === 'fix-coordinates') {
      const coords = decision.newValue?.coordinates;
      const check = validateCoords(coords);
      if (!check.ok) errors.push(`${decision.caseId}: coords ${check.errors.join(', ')}`);
    }

    if (isApplyableDecision(decision) && decision.decision === 'reassign-product') {
      const pid = decision.newValue?.productId || decision.productId;
      if (!productIds.has(pid)) errors.push(`${decision.caseId}: productId nuevo inexistente`);
    }
  }

  // Invariants on current data files (must remain untouched by review tooling until --confirm)
  for (const p of products) {
    if ((p.price ?? null) !== (priceById.get(p.id) ?? null)) {
      errors.push(`precio inconsistente ${p.id}`);
    }
  }
  if (!whatsapp) warnings.push('No se pudo leer WhatsApp desde cart.ts');
  if (!hasOrderText) errors.push('Texto del pedido ausente o modificado en cart.ts');

  // Exact duplicate hotspots check among planned creates
  const plannedIds = (file.decisions || [])
    .filter((d) => d.decision === 'create-hotspot' && d.confirmed)
    .map((d) => d.newValue?.hotspotId || d.hotspotId)
    .filter(Boolean);
  if (new Set(plannedIds).size !== plannedIds.length) {
    errors.push('hotspotIds nuevos duplicados entre decisiones');
  }

  console.log(`Decisiones: ${(file.decisions || []).length}`);
  console.log(`Errores: ${errors.length}`);
  console.log(`Advertencias: ${warnings.length}`);
  for (const e of errors) console.error(`ERROR: ${e}`);
  for (const w of warnings) console.warn(`WARN: ${w}`);

  if (errors.length) process.exit(1);
  console.log('review:verify OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
