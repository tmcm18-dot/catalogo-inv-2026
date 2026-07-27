#!/usr/bin/env node
/**
 * Auditoría documental de integridad del catálogo INV 2026.
 *
 * Compara hotspots/productos contra la capa de texto del PDF original.
 * NO modifica datos: sólo genera informes en reports/.
 *
 * Exit 0: auditoría completada (aunque haya mismatches).
 * Exit 1: fallo técnico (PDF ilegible, JSON inválido, etc.).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REPORTS = path.join(ROOT, 'reports');
const IMAGES_OUT = path.join(REPORTS, 'catalog-integrity-images');
const PDF_PATH = path.join(ROOT, 'public/assets/catalogo/pdf/inv-2026.pdf');
const PAGES_DIR = path.join(ROOT, 'public/assets/catalogo/pages');

const require = createRequire(import.meta.url);

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function normalizeKey(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function expandSizeToken(raw) {
  const text = String(raw ?? '').trim();
  if (!text) return [];
  const uniq = normalizeKey(text);
  if (uniq === 'unico' || uniq === 't.unico' || uniq === 't unico') return ['Único'];

  const range = text.match(/(\d+)\s*al\s*(\d+)/i);
  if (range) {
    const a = Number(range[1]);
    const b = Number(range[2]);
    if (!Number.isFinite(a) || !Number.isFinite(b) || a > b) return [text];
    const span = b - a;
    let step = 1;
    if (span > 6 && a >= 80 && a % 5 === 0 && b % 5 === 0) step = 5;
    else if (span > 10 && a % 2 === 0 && b % 2 === 0) step = 2;
    const out = [];
    for (let n = a; n <= b; n += step) out.push(String(n));
    return out;
  }

  // Listas "85-90-95" / "85, 90, 95"
  if (/[\d]/.test(text) && /[-–,\/]/.test(text) && !/[a-zA-Záéíóú]/i.test(text.replace(/\s/g, ''))) {
    return text.split(/[-–,\/]/).map((s) => s.trim()).filter(Boolean);
  }
  return [text];
}

function parseSizesField(raw) {
  const text = String(raw ?? '').replace(/^T:\s*/i, '').trim();
  if (!text) return [];
  // Puede venir "85 al 100" o "S / M / L"
  if (/\bal\b/i.test(text)) return expandSizeToken(text);
  return text
    .split(/[\/,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .flatMap((part) => expandSizeToken(part));
}

function parseColorsField(raw) {
  const text = String(raw ?? '')
    .replace(/^C:\s*/i, '')
    .replace(/\bPACK\s*X\s*\d+\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.\s]+$/, '');
  if (!text) return [];

  // Grupos separados por "/" (packs alternativos)
  if (text.includes('/')) {
    return text
      .split('/')
      .map((s) => s.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
  }
  // Colores sueltos "Blanco - Negro - Rosa vintage" se conservan como un pack
  // si hay guiones entre nombres; si son simples, se parten por coma.
  if (text.includes(',')) {
    return text.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [text];
}

function parseTC(line) {
  const m = String(line).match(/T:\s*(.+?)\s*C:\s*(.+)$/i);
  if (!m) return null;
  return {
    sizes: parseSizesField(m[1].replace(/\.\s*$/, '')),
    colors: parseColorsField(m[2]),
    raw: line,
  };
}

function sameStringList(a, b) {
  if (a.length !== b.length) return false;
  const na = a.map(normalizeKey);
  const nb = b.map(normalizeKey);
  return na.every((v, i) => v === nb[i]);
}

function listClassification(current, printed) {
  if (!printed || printed.length === 0) return 'AMBIGUOUS';
  if (!current || current.length === 0) return 'MISSING_DATA';
  if (sameStringList(current, printed)) return 'MATCH';
  const nc = new Set(current.map(normalizeKey));
  const np = new Set(printed.map(normalizeKey));
  const missing = [...np].filter((x) => !nc.has(x));
  const extra = [...nc].filter((x) => !np.has(x));
  if (missing.length && !extra.length) return 'MISSING_DATA';
  if (extra.length && !missing.length) return 'EXTRA_DATA';
  return 'MISMATCH_HIGH';
}

async function loadPdf() {
  const pdfjsPath = require.resolve('pdfjs-dist/legacy/build/pdf.mjs');
  const { getDocument } = await import(pathToFileURL(pdfjsPath).href);
  if (!fs.existsSync(PDF_PATH)) {
    throw new Error(`PDF no encontrado: ${PDF_PATH}`);
  }
  return getDocument({
    url: pathToFileURL(PDF_PATH).href,
    useSystemFonts: true,
    disableWorker: true,
  }).promise;
}

async function extractPage(doc, pageNumber) {
  const page = await doc.getPage(pageNumber);
  const vp = page.getViewport({ scale: 1 });
  const tc = await page.getTextContent();
  const items = [];
  for (const item of tc.items) {
    const str = String(item.str ?? '');
    if (!str.trim()) continue;
    const x = item.transform[4];
    const y = item.transform[5];
    items.push({
      str,
      x,
      y,
      xPct: (x / vp.width) * 100,
      yTopPct: ((vp.height - y) / vp.height) * 100,
      wPct: ((item.width || 0) / vp.width) * 100,
    });
  }
  return { width: vp.width, height: vp.height, items };
}

function detectPrintedProducts(pageNumber, pageData, productsByPage, allCodes) {
  const pageProducts = productsByPage.get(pageNumber) || [];
  const pageCodes = new Set(pageProducts.map((p) => p.code));
  const printed = [];

  for (let i = 0; i < pageData.items.length; i++) {
    const item = pageData.items[i];
    const token = item.str.trim();
    // Código tipográfico típico: 2–5 dígitos solos.
    if (!/^\d{2,5}$/.test(token)) continue;
    // Página impresa en el ángulo (ej. "18" arriba a la derecha) no es producto.
    if (item.yTopPct < 6 && item.xPct > 85) continue;
    if (String(pageNumber) === token && item.yTopPct < 8) continue;

    const knownOnPage = pageCodes.has(token);
    const knownAnywhere = allCodes.has(token);

    // Buscar línea T:/C: en las siguientes ~8 piezas de texto cercanas en Y.
    let tc = null;
    let nameParts = [];
    for (let j = i + 1; j < Math.min(i + 10, pageData.items.length); j++) {
      const next = pageData.items[j];
      if (Math.abs(next.yTopPct - item.yTopPct) > 8) break;
      if (/T:\s*.+C:\s*.+/i.test(next.str)) {
        tc = parseTC(next.str);
        break;
      }
      if (!/^\d{2,5}$/.test(next.str.trim()) && !/^T:/i.test(next.str)) {
        nameParts.push(next.str.trim());
      }
    }

    // Aceptar códigos desconocidos sólo si traen ficha T:/C: (producto tipográfico real).
    if (!knownOnPage && !knownAnywhere && !tc) continue;

    printed.push({
      code: token,
      xPct: item.xPct,
      yTopPct: item.yTopPct,
      sizes: tc?.sizes ?? null,
      colors: tc?.colors ?? null,
      tcRaw: tc?.raw ?? null,
      nameHint: nameParts.join(' ').slice(0, 120),
      knownOnPage,
      knownAnywhere,
      hasCatalogCard: Boolean(tc),
    });
  }
  return printed;
}

function hotspotContainsCode(hotspot, code) {
  const left = hotspot.x - 3;
  const right = hotspot.x + hotspot.width + 3;
  const top = hotspot.y - 2;
  const bottom = hotspot.y + hotspot.height + 16;
  return (
    code.xPct >= left &&
    code.xPct <= right &&
    code.yTopPct >= top &&
    code.yTopPct <= bottom
  );
}

function classifyHotspot(hotspot, product, printedCodes, productsByCodeOnPage, sharedCodes) {
  const linkedCode = product?.code ?? null;
  const covering = printedCodes.filter((c) => hotspotContainsCode(hotspot, c));

  if (covering.length === 0) {
    return {
      classification: 'NOT_FOUND',
      confidence: 'low',
      printedCode: null,
      candidates: [],
      explanation: 'No se encontró código impreso asociado a la región del hotspot.',
    };
  }

  // Preferir códigos de la misma página de products.json
  const preferred = covering.filter((c) => c.knownOnPage);
  const pool = preferred.length ? preferred : covering;
  // Si hay varios, elegir el más cercano al centro inferior del hotspot
  const cx = hotspot.x + hotspot.width / 2;
  const cy = hotspot.y + hotspot.height * 0.85;
  pool.sort(
    (a, b) =>
      Math.hypot(a.xPct - cx, a.yTopPct - cy) - Math.hypot(b.xPct - cx, b.yTopPct - cy),
  );
  const best = pool[0];
  const candidates = [...new Set(pool.map((c) => c.code))];

  if (candidates.length > 1 && !(candidates.length === 1)) {
    // si tras preferir knownOnPage sigue habiendo varios códigos distintos
    const unique = [...new Set(pool.map((c) => c.code))];
    if (unique.length > 1) {
      return {
        classification: 'AMBIGUOUS',
        confidence: 'medium',
        printedCode: best.code,
        candidates: unique,
        explanation: `Varios códigos impresos en la región: ${unique.join(', ')}.`,
      };
    }
  }

  const printedCode = best.code;
  if (sharedCodes.has(printedCode) && (productsByCodeOnPage.get(printedCode)?.length ?? 0) !== 1) {
    if (linkedCode === printedCode) {
      return {
        classification: 'SHARED_CODE',
        confidence: 'medium',
        printedCode,
        candidates: [printedCode],
        explanation: 'Código compartido entre variantes; la asociación por código coincide pero la variante puede ser ambigua.',
      };
    }
  }

  if (linkedCode === printedCode) {
    return {
      classification: 'MATCH',
      confidence: 'high',
      printedCode,
      candidates: [printedCode],
      explanation: 'El productId enlazado coincide con el código impreso detectado en el PDF.',
    };
  }

  const targets = productsByCodeOnPage.get(printedCode) || [];
  if (targets.length === 1) {
    return {
      classification: 'MISMATCH_HIGH',
      confidence: 'high',
      printedCode,
      candidates: [printedCode],
      suggestedProductId: targets[0].id,
      explanation: `Código enlazado ${linkedCode} ≠ impreso ${printedCode}; existe un único producto candidato en la página (${targets[0].id}).`,
    };
  }
  if (targets.length > 1) {
    return {
      classification: 'AMBIGUOUS',
      confidence: 'medium',
      printedCode,
      candidates: targets.map((t) => t.id),
      explanation: `Código impreso ${printedCode} tiene ${targets.length} variantes en la página.`,
    };
  }

  // Código impreso conocido en el catálogo pero no en esta página
  return {
    classification: 'MISMATCH_MEDIUM',
    confidence: 'medium',
    printedCode,
    candidates: [printedCode],
    explanation: `Código impreso ${printedCode} no tiene producto en la página ${hotspot.page} (enlazado: ${linkedCode}).`,
  };
}

async function annotateImage({ pageNumber, hotspot, linkedCode, printedCode, label, outName }) {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    return null;
  }
  const src = path.join(PAGES_DIR, `page-${String(pageNumber).padStart(3, '0')}.jpg`);
  if (!fs.existsSync(src)) return null;
  const image = sharp(src);
  const meta = await image.metadata();
  const w = meta.width || 1;
  const h = meta.height || 1;
  const x = Math.round((hotspot.x / 100) * w);
  const y = Math.round((hotspot.y / 100) * h);
  const rw = Math.max(1, Math.round((hotspot.width / 100) * w));
  const rh = Math.max(1, Math.round((hotspot.height / 100) * h));
  const svg = Buffer.from(`
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${x}" y="${y}" width="${rw}" height="${rh}" fill="rgba(220,38,38,0.18)" stroke="#dc2626" stroke-width="6"/>
      <rect x="${Math.max(0, x)}" y="${Math.max(0, y - 70)}" width="520" height="66" rx="10" fill="rgba(0,0,0,0.75)"/>
      <text x="${x + 12}" y="${Math.max(24, y - 42)}" fill="#fff" font-size="26" font-family="DejaVu Sans, Arial, sans-serif">${label}</text>
      <text x="${x + 12}" y="${Math.max(52, y - 14)}" fill="#fdba74" font-size="22" font-family="DejaVu Sans, Arial, sans-serif">enlazado:${linkedCode ?? '?'} impreso:${printedCode ?? '?'}</text>
    </svg>
  `);
  const outPath = path.join(IMAGES_OUT, outName);
  await image.composite([{ input: svg, top: 0, left: 0 }]).jpeg({ quality: 85 }).toFile(outPath);
  return path.relative(ROOT, outPath).replace(/\\/g, '/');
}

function toCsv(rows) {
  if (!rows.length) return 'hotspotId,page,classification,linkedCode,printedCode,confidence,explanation\n';
  const headers = Object.keys(rows[0]);
  const esc = (v) => {
    const s = String(v ?? '');
    return /["',\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n');
}

async function main() {
  ensureDir(REPORTS);
  ensureDir(IMAGES_OUT);

  const products = readJson('src/data/products.json');
  const hotspots = readJson('src/data/hotspots.json');
  const pages = readJson('src/data/catalog-pages.json');

  const productsById = new Map(products.map((p) => [p.id, p]));
  const productsByPage = new Map();
  const productsByCode = new Map();
  const allCodes = new Set();
  for (const p of products) {
    allCodes.add(p.code);
    if (!productsByPage.has(p.page)) productsByPage.set(p.page, []);
    productsByPage.get(p.page).push(p);
    if (!productsByCode.has(p.code)) productsByCode.set(p.code, []);
    productsByCode.get(p.code).push(p);
  }
  const sharedCodes = new Set(
    [...productsByCode.entries()].filter(([, list]) => list.length > 1).map(([code]) => code),
  );

  const hsByProduct = new Set(hotspots.map((h) => h.productId));
  const missingHotspotProducts = products.filter((p) => !hsByProduct.has(p.id));

  console.log('Cargando PDF y auditando…');
  const doc = await loadPdf();

  const hotspotRows = [];
  const counts = {
    MATCH: 0,
    MISMATCH_HIGH: 0,
    MISMATCH_MEDIUM: 0,
    AMBIGUOUS: 0,
    NOT_FOUND: 0,
    SHARED_CODE: 0,
    EXTRA_HOTSPOT: 0,
  };
  const productAttrRows = [];
  const pagePrinted = new Map();
  const mismatchEvidence = [];

  const pageNumbers = [...new Set([
    ...pages.map((p) => p.pageNumber),
    ...hotspots.map((h) => h.page),
  ])].sort((a, b) => a - b);

  for (const pageNumber of pageNumbers) {
    const pageData = await extractPage(doc, pageNumber);
    const printed = detectPrintedProducts(pageNumber, pageData, productsByPage, allCodes);
    pagePrinted.set(pageNumber, printed);

    const onPage = productsByPage.get(pageNumber) || [];
    const byCodeOnPage = new Map();
    for (const p of onPage) {
      if (!byCodeOnPage.has(p.code)) byCodeOnPage.set(p.code, []);
      byCodeOnPage.get(p.code).push(p);
    }

    const pageHotspots = hotspots.filter((h) => h.page === pageNumber);
    for (const hotspot of pageHotspots) {
      const product = productsById.get(hotspot.productId);
      if (!product) {
        counts.EXTRA_HOTSPOT += 1;
        hotspotRows.push({
          hotspotId: hotspot.id,
          page: pageNumber,
          x: hotspot.x,
          y: hotspot.y,
          width: hotspot.width,
          height: hotspot.height,
          productId: hotspot.productId,
          linkedCode: null,
          linkedName: null,
          printedCode: null,
          candidates: '',
          classification: 'EXTRA_HOTSPOT',
          confidence: 'high',
          explanation: 'Hotspot sin producto existente.',
          evidence: '',
        });
        continue;
      }

      const result = classifyHotspot(hotspot, product, printed, byCodeOnPage, sharedCodes);
      counts[result.classification] = (counts[result.classification] || 0) + 1;

      let evidence = '';
      if (result.classification === 'MISMATCH_HIGH' || (pageNumber === 5 || pageNumber === 18) && result.classification !== 'MATCH') {
        const outName = `page-${String(pageNumber).padStart(3, '0')}-${hotspot.id}-${result.classification.toLowerCase()}.jpg`;
        try {
          evidence = (await annotateImage({
            pageNumber,
            hotspot,
            linkedCode: product.code,
            printedCode: result.printedCode,
            label: `${result.classification} p${pageNumber}`,
            outName,
          })) || '';
        } catch {
          evidence = '';
        }
        if (result.classification === 'MISMATCH_HIGH') {
          mismatchEvidence.push({
            hotspotId: hotspot.id,
            page: pageNumber,
            fromProductId: hotspot.productId,
            toProductId: result.suggestedProductId,
            fromCode: product.code,
            toCode: result.printedCode,
            evidence,
          });
        }
      }

      hotspotRows.push({
        hotspotId: hotspot.id,
        page: pageNumber,
        x: hotspot.x,
        y: hotspot.y,
        width: hotspot.width,
        height: hotspot.height,
        productId: hotspot.productId,
        linkedCode: product.code,
        linkedName: product.name,
        printedCode: result.printedCode,
        candidates: (result.candidates || []).join('|'),
        classification: result.classification,
        confidence: result.confidence,
        explanation: result.explanation,
        suggestedProductId: result.suggestedProductId || '',
        evidence,
      });
    }

    // Auditoría de talles/colores por código impreso
    for (const p of onPage) {
      const printedMatch = printed.filter((c) => c.code === p.code);
      const best = printedMatch[0];
      const sizeClass = best?.sizes ? listClassification(p.sizes || [], best.sizes) : (sharedCodes.has(p.code) ? 'SHARED_VARIANT' : 'AMBIGUOUS');
      const colorClass = best?.colors ? listClassification(p.colors || [], best.colors) : (sharedCodes.has(p.code) ? 'SHARED_VARIANT' : 'AMBIGUOUS');
      productAttrRows.push({
        productId: p.id,
        code: p.code,
        page: pageNumber,
        name: p.name,
        sizesCurrent: (p.sizes || []).join('|'),
        colorsCurrent: (p.colors || []).join('|'),
        sizesPrinted: (best?.sizes || []).join('|'),
        colorsPrinted: (best?.colors || []).join('|'),
        sizesClass: sizeClass,
        colorsClass: colorClass,
        tcRaw: best?.tcRaw || '',
        sharedCode: sharedCodes.has(p.code),
      });
    }
  }

  // Hotspots faltantes: producto en página con código impreso y sin hotspot
  const missingHotspotRows = [];
  for (const p of missingHotspotProducts) {
    const printed = pagePrinted.get(p.page) || [];
    const hit = printed.find((c) => c.code === p.code);
    missingHotspotRows.push({
      productId: p.id,
      code: p.code,
      page: p.page,
      name: p.name,
      printedDetected: Boolean(hit),
      printedX: hit?.xPct ?? null,
      printedY: hit?.yTopPct ?? null,
      classification: 'MISSING_HOTSPOT',
      note: hit
        ? 'Código impreso detectado; coordenadas de hotspot requieren revisión (no se auto-genera grilla).'
        : 'Producto sin hotspot y sin código tipográfico claro en el PDF de esa página.',
    });
  }

  const pageImpact = {};
  for (const row of hotspotRows) {
    if (row.classification === 'MATCH' || row.classification === 'SHARED_CODE') continue;
    pageImpact[row.page] = (pageImpact[row.page] || 0) + 1;
  }
  const topPages = Object.entries(pageImpact)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([page, issues]) => ({ page: Number(page), issues }));

  const summary = {
    generatedAt: new Date().toISOString(),
    sources: {
      pdf: 'public/assets/catalogo/pdf/inv-2026.pdf',
      pages: 'public/assets/catalogo/pages/page-NNN.jpg',
      products: 'src/data/products.json',
      hotspots: 'src/data/hotspots.json',
    },
    totals: {
      pages: pages.length,
      products: products.length,
      hotspots: hotspots.length,
      productsWithoutHotspot: missingHotspotProducts.length,
      hotspotsWithoutProduct: hotspots.filter((h) => !productsById.has(h.productId)).length,
      emptySizes: products.filter((p) => !p.sizes?.length).length,
      emptyColors: products.filter((p) => !p.colors?.length).length,
      sharedCodes: sharedCodes.size,
    },
    hotspotClassifications: counts,
    missingHotspots: missingHotspotRows.length,
    productAttributeCounts: {
      sizesMatch: productAttrRows.filter((r) => r.sizesClass === 'MATCH').length,
      sizesMismatchHigh: productAttrRows.filter((r) => r.sizesClass === 'MISMATCH_HIGH').length,
      sizesMissing: productAttrRows.filter((r) => r.sizesClass === 'MISSING_DATA').length,
      colorsMatch: productAttrRows.filter((r) => r.colorsClass === 'MATCH').length,
      colorsMismatchHigh: productAttrRows.filter((r) => r.colorsClass === 'MISMATCH_HIGH').length,
      colorsMissing: productAttrRows.filter((r) => r.colorsClass === 'MISSING_DATA').length,
    },
    topAffectedPages: topPages,
    page5: hotspotRows.filter((r) => r.page === 5),
    page18: hotspotRows.filter((r) => r.page === 18),
    mismatchHighSuggestions: mismatchEvidence,
    hotspotsCreated: [],
    associationsCorrected: [],
    sizesCorrected: [],
    colorsCorrected: [],
    pendingReview: hotspotRows.filter((r) =>
      ['MISMATCH_MEDIUM', 'AMBIGUOUS', 'NOT_FOUND'].includes(r.classification),
    ).length,
  };

  const reportJson = {
    summary,
    hotspots: hotspotRows,
    missingHotspots: missingHotspotRows,
    products: productAttrRows,
  };

  fs.writeFileSync(path.join(REPORTS, 'catalog-integrity-audit.json'), JSON.stringify(reportJson, null, 2));
  fs.writeFileSync(
    path.join(REPORTS, 'catalog-integrity-audit.csv'),
    toCsv(
      hotspotRows.map((r) => ({
        hotspotId: r.hotspotId,
        page: r.page,
        classification: r.classification,
        linkedCode: r.linkedCode,
        printedCode: r.printedCode,
        confidence: r.confidence,
        suggestedProductId: r.suggestedProductId,
        explanation: r.explanation,
      })),
    ),
  );

  const md = [];
  md.push('# Auditoría de integridad — Catálogo INV 2026');
  md.push('');
  md.push(`Generado: ${summary.generatedAt}`);
  md.push('');
  md.push('## Resumen');
  md.push('');
  md.push(`- Páginas: **${summary.totals.pages}**`);
  md.push(`- Productos: **${summary.totals.products}**`);
  md.push(`- Hotspots: **${summary.totals.hotspots}**`);
  md.push(`- Productos sin hotspot: **${summary.totals.productsWithoutHotspot}**`);
  md.push(`- Hotspots sin producto: **${summary.totals.hotspotsWithoutProduct}**`);
  md.push(`- Códigos compartidos: **${summary.totals.sharedCodes}**`);
  md.push('');
  md.push('### Clasificación de hotspots');
  md.push('');
  for (const [k, v] of Object.entries(counts)) md.push(`- ${k}: **${v}**`);
  md.push('');
  md.push('### Talles / colores (contra texto PDF)');
  md.push('');
  md.push(`- Talles MATCH: ${summary.productAttributeCounts.sizesMatch}`);
  md.push(`- Talles MISMATCH_HIGH: ${summary.productAttributeCounts.sizesMismatchHigh}`);
  md.push(`- Talles MISSING_DATA: ${summary.productAttributeCounts.sizesMissing}`);
  md.push(`- Colores MATCH: ${summary.productAttributeCounts.colorsMatch}`);
  md.push(`- Colores MISMATCH_HIGH: ${summary.productAttributeCounts.colorsMismatchHigh}`);
  md.push(`- Colores MISSING_DATA: ${summary.productAttributeCounts.colorsMissing}`);
  md.push('');
  md.push('## Página 5 (caso obligatorio)');
  md.push('');
  for (const r of summary.page5) {
    md.push(`- \`${r.hotspotId}\` @ (${r.x},${r.y}) → enlazado **${r.linkedCode}** / impreso **${r.printedCode}** → ${r.classification}`);
    if (r.evidence) md.push(`  - Evidencia: \`${r.evidence}\``);
  }
  md.push('');
  md.push('## Página 18 (caso obligatorio)');
  md.push('');
  for (const r of summary.page18) {
    md.push(`- \`${r.hotspotId}\` @ (${r.x},${r.y}) → enlazado **${r.linkedCode}** / impreso **${r.printedCode}** → ${r.classification}`);
    if (r.evidence) md.push(`  - Evidencia: \`${r.evidence}\``);
  }
  md.push('');
  md.push('## MISMATCH_HIGH sugeridos (no aplicados por este script)');
  md.push('');
  if (!mismatchEvidence.length) md.push('_Ninguno._');
  for (const m of mismatchEvidence) {
    md.push(`- p${m.page} \`${m.hotspotId}\`: ${m.fromCode} → ${m.toCode} (productId ${m.fromProductId} → ${m.toProductId})`);
  }
  md.push('');
  md.push('## Hotspots faltantes');
  md.push('');
  md.push(`Total: ${missingHotspotRows.length}. No se crean automáticamente por grilla; ver JSON.`);
  md.push('');
  md.push('## Páginas más afectadas');
  md.push('');
  for (const p of topPages.slice(0, 10)) md.push(`- Página ${p.page}: ${p.issues} issues`);
  md.push('');
  md.push('> Este informe es de **auditoría documental**. La validación estructural sigue siendo `npm run validate:data`.');

  fs.writeFileSync(path.join(REPORTS, 'catalog-integrity-audit.md'), md.join('\n'));

  console.log('\n=== AUDITORÍA DOCUMENTAL ===');
  console.log(`Páginas: ${summary.totals.pages}`);
  console.log(`Productos: ${summary.totals.products}`);
  console.log(`Hotspots: ${summary.totals.hotspots}`);
  for (const [k, v] of Object.entries(counts)) console.log(`${k}: ${v}`);
  console.log(`MISSING_HOTSPOT (productos): ${missingHotspotRows.length}`);
  console.log(`Informes: reports/catalog-integrity-audit.{json,csv,md}`);
  console.log('RESULTADO: AUDITORÍA COMPLETADA');
}

main().catch((err) => {
  console.error('ERROR TÉCNICO en auditoría:', err);
  process.exit(1);
});
