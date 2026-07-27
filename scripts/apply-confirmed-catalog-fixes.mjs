#!/usr/bin/env node
/**
 * Aplica correcciones EXPLÍCITAS y versionadas de reports/confirmed-catalog-fixes.json.
 * No decide por aproximación: sólo ejecuta el manifiesto.
 *
 * Uso:
 *   node scripts/apply-confirmed-catalog-fixes.mjs
 *   node scripts/apply-confirmed-catalog-fixes.mjs --dry-run
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FIXES_PATH = path.join(ROOT, 'reports/confirmed-catalog-fixes.json');
const HOTSPOTS_PATH = path.join(ROOT, 'src/data/hotspots.json');
const PRODUCTS_PATH = path.join(ROOT, 'src/data/products.json');
const dryRun = process.argv.includes('--dry-run');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(p, data) {
  fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`);
}

function main() {
  if (!fs.existsSync(FIXES_PATH)) {
    console.error(`No existe ${FIXES_PATH}. Generá el manifiesto antes de aplicar.`);
    process.exit(1);
  }
  const manifest = readJson(FIXES_PATH);
  const hotspots = readJson(HOTSPOTS_PATH);
  const products = readJson(PRODUCTS_PATH);
  const hsById = new Map(hotspots.map((h) => [h.id, h]));
  const prodById = new Map(products.map((p) => [p.id, p]));

  const applied = {
    hotspotProductIdChanges: [],
    productFieldChanges: [],
    productIdRenames: [],
    skipped: [],
  };

  for (const fix of manifest.hotspotProductIdChanges || []) {
    const hs = hsById.get(fix.hotspotId);
    if (!hs) {
      applied.skipped.push({ type: 'hotspot', fix, reason: 'hotspot no encontrado' });
      continue;
    }
    if (fix.page != null && hs.page !== fix.page) {
      applied.skipped.push({ type: 'hotspot', fix, reason: 'página distinta' });
      continue;
    }
    if (fix.fromProductId && hs.productId !== fix.fromProductId) {
      applied.skipped.push({ type: 'hotspot', fix, reason: `productId actual ${hs.productId} ≠ from ${fix.fromProductId}` });
      continue;
    }
    if (!prodById.has(fix.toProductId)) {
      applied.skipped.push({ type: 'hotspot', fix, reason: 'toProductId inexistente' });
      continue;
    }
    // Conservar coordenadas: sólo productId (y label opcional).
    const before = hs.productId;
    if (!dryRun) {
      hs.productId = fix.toProductId;
      if (fix.label != null) hs.label = fix.label;
    }
    applied.hotspotProductIdChanges.push({
      hotspotId: fix.hotspotId,
      page: hs.page,
      before,
      after: fix.toProductId,
      coordinatesModified: false,
      evidence: fix.evidence || null,
      reason: fix.reason || null,
    });
  }

  for (const fix of manifest.productFieldChanges || []) {
    const p = prodById.get(fix.productId);
    if (!p) {
      applied.skipped.push({ type: 'product', fix, reason: 'producto no encontrado' });
      continue;
    }
    const before = {};
    const after = {};
    for (const [field, value] of Object.entries(fix.fields || {})) {
      if (!['code', 'name', 'description', 'sizes', 'colors'].includes(field)) {
        applied.skipped.push({ type: 'product-field', fix, reason: `campo no permitido: ${field}` });
        continue;
      }
      before[field] = p[field];
      after[field] = value;
      if (!dryRun) p[field] = value;
    }
    applied.productFieldChanges.push({
      productId: fix.productId,
      before,
      after,
      evidence: fix.evidence || null,
      reason: fix.reason || null,
    });
  }

  for (const fix of manifest.productIdRenames || []) {
    const p = prodById.get(fix.fromId);
    if (!p) {
      applied.skipped.push({ type: 'rename', fix, reason: 'fromId no encontrado' });
      continue;
    }
    if (prodById.has(fix.toId)) {
      applied.skipped.push({ type: 'rename', fix, reason: 'toId ya existe' });
      continue;
    }
    if (!dryRun) {
      p.id = fix.toId;
      prodById.delete(fix.fromId);
      prodById.set(fix.toId, p);
      for (const hs of hotspots) {
        if (hs.productId === fix.fromId) hs.productId = fix.toId;
      }
    }
    applied.productIdRenames.push(fix);
  }

  if (!dryRun) {
    writeJson(HOTSPOTS_PATH, hotspots);
    writeJson(PRODUCTS_PATH, products);
    const reportPath = path.join(ROOT, 'reports/catalog-fixes-applied.json');
    writeJson(reportPath, {
      appliedAt: new Date().toISOString(),
      manifestVersion: manifest.version,
      applied,
    });
  }

  console.log(dryRun ? '=== DRY RUN ===' : '=== FIXES APLICADOS ===');
  console.log(`hotspot productId changes: ${applied.hotspotProductIdChanges.length}`);
  console.log(`product field changes: ${applied.productFieldChanges.length}`);
  console.log(`product id renames: ${applied.productIdRenames.length}`);
  console.log(`skipped: ${applied.skipped.length}`);
  if (applied.skipped.length) {
    for (const s of applied.skipped.slice(0, 20)) {
      console.log(' SKIP', s.reason, s.fix?.hotspotId || s.fix?.productId || '');
    }
  }
}

main();
