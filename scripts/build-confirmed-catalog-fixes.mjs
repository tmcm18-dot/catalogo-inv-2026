#!/usr/bin/env node
/**
 * Construye reports/confirmed-catalog-fixes.json SOLO con correcciones de alta confianza:
 * 1) Reasignaciones MISMATCH_HIGH que forman una permutación sin colisiones en la página.
 * 2) Casos documentales explícitos (página 18: producto 18-p18 → código 131).
 * 3) Limpieza de basura "PACK X…" en colores cuando el PDF confirma el valor limpio.
 *
 * No incluye MISMATCH_MEDIUM / AMBIGUOUS / NOT_FOUND.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
}

function stripPackNoise(value) {
  return String(value)
    .replace(/\bPACK\s*X\s*\d*\b/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*\.\s*$/, '')
    .trim();
}

function normalizeKey(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function main() {
  const audit = readJson('reports/catalog-integrity-audit.json');
  const products = readJson('src/data/products.json');
  const prodById = new Map(products.map((p) => [p.id, p]));

  const hotspotChanges = [];
  const productFieldChanges = [];
  const productIdRenames = [];

  // --- Hotspot permutations por página ---
  const byPage = new Map();
  for (const row of audit.hotspots) {
    if (row.classification !== 'MISMATCH_HIGH' || !row.suggestedProductId) continue;
    if (!byPage.has(row.page)) byPage.set(row.page, []);
    byPage.get(row.page).push(row);
  }

  for (const [page, rows] of byPage) {
    const fromIds = rows.map((r) => r.productId);
    const toIds = rows.map((r) => r.suggestedProductId);
    // Sin colisiones en destino
    if (new Set(toIds).size !== toIds.length) continue;
    // Permutación: los destinos deben ser exactamente el conjunto de orígenes
    const fromSet = new Set(fromIds);
    const toSet = new Set(toIds);
    if (fromSet.size !== toSet.size) continue;
    let isPermutation = true;
    for (const id of toSet) if (!fromSet.has(id)) isPermutation = false;
    if (!isPermutation) continue;

    for (const row of rows) {
      if (row.productId === row.suggestedProductId) continue;
      hotspotChanges.push({
        hotspotId: row.hotspotId,
        page,
        fromProductId: row.productId,
        toProductId: row.suggestedProductId,
        fromCode: row.linkedCode,
        toCode: row.printedCode,
        reason: 'MISMATCH_HIGH con permutación segura en la página (PDF text layer)',
        evidence: row.evidence || null,
      });
    }
  }

  // --- Página 18: producto mal tipificado como código 18, es 131 ---
  const p18 = prodById.get('18-p18');
  if (p18 && p18.code === '18' && /^131\b/.test(p18.name)) {
    productFieldChanges.push({
      productId: '18-p18',
      fields: {
        code: '131',
        name: p18.name.replace(/^131\s+/, ''),
      },
      reason: 'PDF p18: código tipográfico 131 (Pack x3 Vedetina); el id 18-p18 era un falso código 18',
      evidence: 'public/assets/catalogo/pdf/inv-2026.pdf#page=18',
    });
    productIdRenames.push({
      fromId: '18-p18',
      toId: '131',
      reason: 'Alinear productId con el código tipográfico real 131',
    });
    // Asegurar asociación visual: izquierda 127, derecha 131
    // Si la permutación de auditoría ya movió left→127, el rename actualizará refs.
    // Forzar right hotspot (hoy hotspot-127 en x=51) → 131 tras rename.
    const right = audit.hotspots.find((h) => h.hotspotId === 'hotspot-127' && h.page === 18);
    const left = audit.hotspots.find((h) => h.hotspotId === 'hotspot-18-p18' && h.page === 18);
    if (left && left.productId !== '127') {
      // may already be in permutation list as →127
      if (!hotspotChanges.some((c) => c.hotspotId === 'hotspot-18-p18')) {
        hotspotChanges.push({
          hotspotId: 'hotspot-18-p18',
          page: 18,
          fromProductId: left.productId,
          toProductId: '127',
          fromCode: left.linkedCode,
          toCode: '127',
          reason: 'PDF p18: región izquierda tipográfica 127',
          evidence: left.evidence || null,
        });
      }
    }
    if (right) {
      // Quitar cualquier change previo del right que no apunte a 18-p18/131
      const filtered = hotspotChanges.filter((c) => !(c.hotspotId === 'hotspot-127' && c.page === 18));
      hotspotChanges.length = 0;
      hotspotChanges.push(...filtered);
      hotspotChanges.push({
        hotspotId: 'hotspot-127',
        page: 18,
        fromProductId: right.productId,
        toProductId: '18-p18', // apply rename lo pasará a 131 si rename corre después... 
        // apply script renames AFTER productId changes and also rewrites hotspot refs from old id.
        // Safer: set to 18-p18, then rename 18-p18→131 updates hotspot.
        fromCode: right.linkedCode,
        toCode: '131',
        reason: 'PDF p18: región derecha tipográfica 131 (antes mostraba 127)',
        evidence: right.evidence || null,
      });
    }
  }

  // --- Colores: limpiar basura PACK X cuando el PDF confirma el valor limpio ---
  for (const row of audit.products) {
    if (!row.colorsPrinted) continue;
    const printed = row.colorsPrinted.split('|').filter(Boolean);
    const current = row.colorsCurrent.split('|').filter(Boolean);
    if (!printed.length || !current.length) continue;

    const cleaned = current.map(stripPackNoise).filter(Boolean);
    const printedNorm = printed.map(normalizeKey);
    const cleanedNorm = cleaned.map(normalizeKey);

    // Caso 1: limpieza de PACK X deja igualdad con impreso
    const onlyNoise =
      cleanedNorm.length === printedNorm.length &&
      cleanedNorm.every((v, i) => v === printedNorm[i]) &&
      current.some((c, i) => c !== cleaned[i]);

    // Caso 2: colores actuales = impreso + ruido en el último elemento
    const noiseSuffix =
      !onlyNoise &&
      current.length === printed.length &&
      current.every((c, i) => normalizeKey(stripPackNoise(c)) === printedNorm[i]) &&
      current.some((c) => /pack\s*x/i.test(c));

    if (onlyNoise || noiseSuffix) {
      productFieldChanges.push({
        productId: row.productId,
        fields: { colors: printed },
        reason: 'Colores: eliminar ruido PACK X / alinear con texto PDF (confianza alta)',
        evidence: row.tcRaw || null,
      });
    }
  }

  // Talles: sólo reemplazar cuando actual es Único/vacío y PDF trae rango inequívoco numérico
  for (const row of audit.products) {
    if (row.sizesClass !== 'MISMATCH_HIGH' && row.sizesClass !== 'MISSING_DATA') continue;
    const printed = row.sizesPrinted.split('|').filter(Boolean);
    const current = row.sizesCurrent.split('|').filter(Boolean);
    if (!printed.length) continue;
    const curIsFallback = current.length === 0 || (current.length === 1 && normalizeKey(current[0]) === 'unico');
    const printedNumeric = printed.every((s) => /^\d+$/.test(s));
    if (curIsFallback && printedNumeric) {
      productFieldChanges.push({
        productId: row.productId,
        fields: { sizes: printed },
        reason: 'Talles: products.json tenía Único/vacío; PDF declara rango numérico inequívoco',
        evidence: row.tcRaw || null,
      });
    }
  }

  // Deduplicar productFieldChanges por productId+field (último gana)
  const fieldMap = new Map();
  for (const fix of productFieldChanges) {
    const prev = fieldMap.get(fix.productId) || { productId: fix.productId, fields: {}, reason: fix.reason, evidence: fix.evidence };
    Object.assign(prev.fields, fix.fields);
    prev.reason = fix.reason;
    prev.evidence = fix.evidence;
    fieldMap.set(fix.productId, prev);
  }

  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    policy: 'Solo permutaciones MISMATCH_HIGH, caso documental p18 (131), limpieza PACK X y talles Único→rango PDF',
    hotspotProductIdChanges: hotspotChanges,
    productFieldChanges: [...fieldMap.values()],
    productIdRenames,
  };

  fs.writeFileSync(
    path.join(ROOT, 'reports/confirmed-catalog-fixes.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  console.log('Manifiesto generado: reports/confirmed-catalog-fixes.json');
  console.log(`hotspot changes: ${manifest.hotspotProductIdChanges.length}`);
  console.log(`product field changes: ${manifest.productFieldChanges.length}`);
  console.log(`renames: ${manifest.productIdRenames.length}`);
}

main();
