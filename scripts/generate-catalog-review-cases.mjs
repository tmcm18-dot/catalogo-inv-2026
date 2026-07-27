#!/usr/bin/env node
/**
 * Genera reports/catalog-review/pending-cases.json desde el último audit.
 * No modifica products.json ni hotspots.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

async function loadBuildPendingCases() {
  const modPath = path.join(ROOT, 'src/lib/catalog-review/cases.ts');
  const mod = await import(pathToFileURL(modPath).href);
  return mod.buildPendingCases;
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
}

function writeJson(rel, data) {
  const full = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, `${JSON.stringify(data, null, 2)}\n`);
}

async function main() {
  const buildPendingCases = await loadBuildPendingCases();
  const auditPath = 'reports/catalog-integrity-audit.json';
  if (!fs.existsSync(path.join(ROOT, auditPath))) {
    console.error(`No existe ${auditPath}. Ejecutá npm run audit:catalog primero.`);
    process.exit(1);
  }

  const audit = readJson(auditPath);
  const products = readJson('src/data/products.json');
  const pending = buildPendingCases({
    audit,
    products: products.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      brand: p.brand,
      category: p.category,
      page: p.page,
      sizes: p.sizes,
      colors: p.colors,
    })),
    sourceAudit: auditPath,
    generatedAt: new Date().toISOString(),
  });

  writeJson('reports/catalog-review/pending-cases.json', pending);

  // Placeholder decisions file if missing
  const decisionsRel = 'reports/catalog-review/confirmed-decisions.json';
  if (!fs.existsSync(path.join(ROOT, decisionsRel))) {
    writeJson(decisionsRel, { version: 1, updatedAt: new Date().toISOString(), decisions: [] });
  }

  console.log(`Casos generados: ${pending.totals.cases}`);
  console.log('Por clasificación:', pending.totals.byClassification);
  console.log('Por lote:', pending.totals.byBatch);
  console.log('Escrito: reports/catalog-review/pending-cases.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
