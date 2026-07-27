#!/usr/bin/env node
/**
 * Aplica decisions de reports/catalog-review/confirmed-decisions.json.
 * Dry-run por defecto. Requiere --confirm para escribir.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const confirm = process.argv.includes('--confirm');
const revertTo = (() => {
  const idx = process.argv.indexOf('--revert');
  return idx >= 0 ? process.argv[idx + 1] : null;
})();

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
}

function writeJsonAtomic(rel, data) {
  const full = path.join(ROOT, rel);
  const tmp = `${full}.tmp`;
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`);
  fs.renameSync(tmp, full);
}

async function loadApply() {
  const mod = await import(pathToFileURL(path.join(ROOT, 'src/lib/catalog-review/apply.ts')).href);
  return mod;
}

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`;
}

async function main() {
  const { applyReviewDecisions, revertApplyChanges } = await loadApply();
  const decisionsPath = 'reports/catalog-review/confirmed-decisions.json';
  if (!fs.existsSync(path.join(ROOT, decisionsPath))) {
    console.error(`No existe ${decisionsPath}`);
    process.exit(1);
  }

  const productsPath = 'src/data/products.json';
  const hotspotsPath = 'src/data/hotspots.json';
  const products = readJson(productsPath);
  const hotspots = readJson(hotspotsPath);
  const cartSource = fs.readFileSync(path.join(ROOT, 'src/lib/cart.ts'), 'utf8');
  const waMatch = cartSource.match(/whatsapp:\s*'([^']+)'/);
  const whatsappNumber = waMatch ? waMatch[1] : '';

  if (revertTo) {
    const applied = readJson(revertTo);
    if (!applied.inverse || !Array.isArray(applied.inverse)) {
      console.error('El manifiesto no tiene inverse[] para revertir.');
      process.exit(1);
    }
    if (!confirm) {
      console.log(`[dry-run] Reversión desde ${revertTo}: ${applied.inverse.length} cambios inversos.`);
      console.log('Pasá --confirm para aplicar la reversión.');
      process.exit(0);
    }
    const backupDir = path.join(ROOT, 'reports/catalog-review/backups', `revert-${stamp()}`);
    fs.mkdirSync(backupDir, { recursive: true });
    fs.copyFileSync(path.join(ROOT, productsPath), path.join(backupDir, 'products.json'));
    fs.copyFileSync(path.join(ROOT, hotspotsPath), path.join(backupDir, 'hotspots.json'));
    const reverted = revertApplyChanges(products, hotspots, applied.inverse);
    writeJsonAtomic(productsPath, reverted.products);
    writeJsonAtomic(hotspotsPath, reverted.hotspots);
    console.log(`Reversión aplicada. Backup en ${path.relative(ROOT, backupDir)}`);
    process.exit(0);
  }

  const file = readJson(decisionsPath);
  const result = applyReviewDecisions(file.decisions || [], {
    products,
    hotspots,
    whatsappNumber,
  }, { confirm });

  console.log(result.dryRun ? '=== DRY-RUN (sin escritura) ===' : '=== APPLY --confirm ===');
  console.log(`Cambios: ${result.changes.length}`);
  console.log(`Omitidos: ${result.skipped.length}`);
  console.log(`Errores: ${result.errors.length}`);
  for (const err of result.errors) console.error(`  ERROR: ${err}`);
  for (const s of result.skipped.slice(0, 20)) console.log(`  skip ${s.caseId}: ${s.reason}`);

  const appliedRel = 'reports/catalog-review/applied-changes.json';
  const manifest = {
    generatedAt: new Date().toISOString(),
    dryRun: result.dryRun,
    confirm,
    changes: result.changes,
    skipped: result.skipped,
    errors: result.errors,
    inverse: result.inverse,
  };
  writeJsonAtomic(appliedRel, manifest);

  if (!result.ok) {
    console.error('Validación fallida; no se escriben datos del catálogo.');
    process.exit(1);
  }

  if (result.dryRun) {
    console.log('Dry-run OK. Revisá reports/catalog-review/applied-changes.json');
    console.log('Para aplicar: npm run review:apply -- --confirm');
    process.exit(0);
  }

  const backupDir = path.join(ROOT, 'reports/catalog-review/backups', stamp());
  fs.mkdirSync(backupDir, { recursive: true });
  fs.copyFileSync(path.join(ROOT, productsPath), path.join(backupDir, 'products.json'));
  fs.copyFileSync(path.join(ROOT, hotspotsPath), path.join(backupDir, 'hotspots.json'));
  fs.writeFileSync(
    path.join(backupDir, 'inverse.json'),
    `${JSON.stringify({ generatedAt: new Date().toISOString(), inverse: result.inverse }, null, 2)}\n`,
  );

  writeJsonAtomic(productsPath, result.products);
  writeJsonAtomic(hotspotsPath, result.hotspots);
  writeJsonAtomic(appliedRel, {
    ...manifest,
    backupDir: path.relative(ROOT, backupDir).replace(/\\/g, '/'),
  });
  console.log(`Aplicado. Backup: ${path.relative(ROOT, backupDir)}`);
  console.log('Revertir: npm run review:apply -- --revert reports/catalog-review/applied-changes.json --confirm');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
