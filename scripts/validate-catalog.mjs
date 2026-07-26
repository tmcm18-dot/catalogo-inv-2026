#!/usr/bin/env node
/**
 * validate-catalog.mjs — Validación de integridad de datos del Catálogo INV 2026.
 *
 * Comprueba, sin modificar nada, la coherencia entre:
 *   - páginas del catálogo (src/data/catalog-pages.json)
 *   - productos          (src/data/products.json)
 *   - hotspots           (src/data/hotspots.json)
 *   - imágenes JPG        (public/assets/catalogo/pages/)
 *
 * Usa únicamente módulos nativos de Node.js (node:fs, node:path, node:url).
 *
 * Salida:
 *   - exit code 0  => sin ERRORES (puede haber ADVERTENCIAS)
 *   - exit code 1  => al menos un ERROR
 *
 * Las ADVERTENCIAS nunca provocan exit code 1.
 *
 * FUENTE DE VERDAD DE CONTEOS
 *   - Páginas esperadas: derivadas de catalog-pages.json (secuencia 1..N).
 *     La UI (src/components/CatalogApp.tsx) y las imágenes deben coincidir con ese N.
 *   - Productos / hotspots: se cuentan desde sus JSON; no se fuerzan cifras.
 *   - EXPECTED_REFERENCE contiene las cifras históricas documentadas SOLO como
 *     verificación informativa (genera ADVERTENCIA si difieren, nunca ERROR).
 *
 * ESCALA DE COORDENADAS DE HOTSPOTS
 *   Los hotspots usan porcentajes 0..100 (x, y, width, height). Verificado contra
 *   los datos reales; los límites aplicados son:
 *     x >= 0, y >= 0, width > 0, height > 0,
 *     x <= 100, y <= 100, x + width <= 100, y + height <= 100.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Localización segura de la raíz del proyecto
// ---------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Sube desde este script hasta encontrar la raíz (package.json + src/data). */
function findProjectRoot(startDir) {
  let dir = startDir;
  for (let i = 0; i < 8; i += 1) {
    const hasPkg = fs.existsSync(path.join(dir, 'package.json'));
    const hasData = fs.existsSync(path.join(dir, 'src', 'data'));
    if (hasPkg && hasData) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // Fallback: un nivel por encima de scripts/
  return path.resolve(__dirname, '..');
}

const ROOT = findProjectRoot(__dirname);

const PATHS = {
  products: path.join(ROOT, 'src', 'data', 'products.json'),
  pages: path.join(ROOT, 'src', 'data', 'catalog-pages.json'),
  hotspots: path.join(ROOT, 'src', 'data', 'hotspots.json'),
  pagesDir: path.join(ROOT, 'public', 'assets', 'catalogo', 'pages'),
  publicDir: path.join(ROOT, 'public'),
};

// Cifras históricas documentadas (solo verificación informativa → ADVERTENCIA).
const EXPECTED_REFERENCE = {
  pages: 218,
  products: 743,
  hotspots: 727,
};

// ---------------------------------------------------------------------------
// Acumuladores de resultados
// ---------------------------------------------------------------------------
const errors = [];
const warnings = [];

function addError(message) {
  errors.push(message);
}
function addWarning(message) {
  warnings.push(message);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function relative(p) {
  return path.relative(ROOT, p) || p;
}

/** Lee y parsea un JSON. Devuelve null y registra ERROR si falla. */
function readJson(label, filePath) {
  if (!fs.existsSync(filePath)) {
    addError(`Archivo faltante: ${label} (${relative(filePath)})`);
    return null;
  }
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    addError(`No se pudo leer ${label} (${relative(filePath)}): ${err.message}`);
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    addError(`JSON inválido en ${label} (${relative(filePath)}): ${err.message}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Carga de datos
// ---------------------------------------------------------------------------
const products = readJson('products.json', PATHS.products);
const pages = readJson('catalog-pages.json', PATHS.pages);
const hotspots = readJson('hotspots.json', PATHS.hotspots);

// Estructura raíz esperada: array en los tres casos.
function ensureArray(label, value) {
  if (value === null) return null; // ya se reportó error de lectura/parseo
  if (!Array.isArray(value)) {
    addError(`Estructura inesperada en ${label}: se esperaba un array.`);
    return null;
  }
  return value;
}

const productsArr = ensureArray('products.json', products);
const pagesArr = ensureArray('catalog-pages.json', pages);
const hotspotsArr = ensureArray('hotspots.json', hotspots);

// Índices reutilizables
const productById = new Map();

// ---------------------------------------------------------------------------
// B. Páginas del catálogo
// ---------------------------------------------------------------------------
let expectedPageCount = 0;
const declaredPageNumbers = new Set();

function validatePages() {
  if (!pagesArr) return;

  const seenNumbers = new Set();
  const seenIds = new Set();
  const numbers = [];

  pagesArr.forEach((page, index) => {
    const where = `catalog-pages[${index}]`;
    if (!isPlainObject(page)) {
      addError(`${where}: cada página debe ser un objeto.`);
      return;
    }

    const { id, pageNumber, title, pdf, status } = page;

    if (!isNonEmptyString(id)) {
      addError(`${where}: campo "id" vacío o ausente.`);
    } else if (seenIds.has(id)) {
      addError(`${where}: id de página duplicado "${id}".`);
    } else {
      seenIds.add(id);
    }

    if (!isFiniteNumber(pageNumber) || !Number.isInteger(pageNumber)) {
      addError(`${where}: "pageNumber" no es un entero finito (${JSON.stringify(pageNumber)}).`);
      return;
    }
    if (pageNumber < 1) {
      addError(`${where}: "pageNumber" menor que 1 (${pageNumber}).`);
    }
    if (seenNumbers.has(pageNumber)) {
      addError(`${where}: "pageNumber" duplicado (${pageNumber}).`);
    } else {
      seenNumbers.add(pageNumber);
      declaredPageNumbers.add(pageNumber);
    }
    numbers.push(pageNumber);

    // id esperado según el patrón real "page-NNN" (padding a 3).
    if (isNonEmptyString(id)) {
      const expectedId = `page-${String(pageNumber).padStart(3, '0')}`;
      if (id !== expectedId) {
        addError(`${where}: id "${id}" no coincide con el patrón esperado "${expectedId}".`);
      }
    }

    if (!isNonEmptyString(title)) {
      addWarning(`${where}: "title" vacío para la página ${pageNumber}.`);
    }
    if (pdf !== undefined && !isNonEmptyString(pdf)) {
      addError(`${where}: "pdf" presente pero vacío.`);
    }
    if (status !== undefined && !['loaded', 'pending', 'error'].includes(status)) {
      addError(`${where}: "status" con valor inesperado "${status}".`);
    }
  });

  if (numbers.length === 0) {
    addError('catalog-pages.json no contiene páginas.');
    return;
  }

  const max = Math.max(...numbers);
  const min = Math.min(...numbers);
  expectedPageCount = max;

  // Secuencia contigua 1..max sin saltos.
  for (let n = 1; n <= max; n += 1) {
    if (!seenNumbers.has(n)) {
      addError(`Falta la página número ${n} en la secuencia (1..${max}).`);
    }
  }
  if (min > 1) {
    addError(`La secuencia de páginas no comienza en 1 (mínimo declarado: ${min}).`);
  }
  if (max !== pagesArr.length) {
    addWarning(
      `La página máxima (${max}) no coincide con la cantidad de páginas declaradas (${pagesArr.length}).`,
    );
  }
}

// ---------------------------------------------------------------------------
// C. Imágenes JPG
// ---------------------------------------------------------------------------
function validateImages() {
  if (!fs.existsSync(PATHS.pagesDir)) {
    addError(`Carpeta de imágenes faltante: ${relative(PATHS.pagesDir)}`);
    return;
  }
  const entries = fs.readdirSync(PATHS.pagesDir, { withFileTypes: true });
  const files = entries.filter((e) => e.isFile()).map((e) => e.name);
  const fileSet = new Set(files);

  const count = expectedPageCount || pagesArr?.length || 0;

  // Existencia de cada página esperada + archivos vacíos.
  for (let n = 1; n <= count; n += 1) {
    const name = `page-${String(n).padStart(3, '0')}.jpg`;
    if (!fileSet.has(name)) {
      addError(`Imagen faltante para la página ${n}: ${name}`);
      continue;
    }
    try {
      const st = fs.statSync(path.join(PATHS.pagesDir, name));
      if (st.size === 0) {
        addError(`Imagen vacía (0 bytes): ${name}`);
      }
    } catch (err) {
      addError(`No se pudo inspeccionar ${name}: ${err.message}`);
    }
  }

  // Duplicados por número (p.ej. page-001.jpg y page-1.jpg) → ERROR.
  const byNumber = new Map();
  for (const name of files) {
    const m = /^page-(\d+)\.jpg$/i.exec(name);
    if (!m) continue;
    const num = Number(m[1]);
    const list = byNumber.get(num) || [];
    list.push(name);
    byNumber.set(num, list);
  }
  for (const [num, list] of byNumber) {
    if (list.length > 1) {
      addError(`Página ${num} con múltiples archivos JPG: ${list.join(', ')}`);
    }
  }

  // Archivos que no forman parte del patrón esperado → ADVERTENCIA.
  const extras = files.filter((name) => !/^page-\d{3}\.jpg$/.test(name));
  if (extras.length > 0) {
    addWarning(
      `Archivos en la carpeta de páginas que no siguen el patrón page-NNN.jpg (${extras.length}): ` +
        `${extras.slice(0, 5).join(', ')}${extras.length > 5 ? ', ...' : ''}`,
    );
  }

  return fileSet;
}

// ---------------------------------------------------------------------------
// Validación de rutas seguras (dentro de /public, sin "..")
// ---------------------------------------------------------------------------
function validateSafePath(where, value) {
  if (!isNonEmptyString(value)) return;
  if (value.includes('..')) {
    addError(`${where}: la ruta "${value}" contiene ".." (escape de carpeta no permitido).`);
    return;
  }
  if (!value.startsWith('/assets/')) {
    addError(`${where}: la ruta "${value}" no apunta a /assets/ dentro de public.`);
    return;
  }
  const resolved = path.resolve(PATHS.publicDir, `.${value}`);
  if (!resolved.startsWith(PATHS.publicDir + path.sep)) {
    addError(`${where}: la ruta "${value}" se resuelve fuera de public.`);
  }
}

// ---------------------------------------------------------------------------
// D. Productos
// ---------------------------------------------------------------------------
function validateProducts() {
  if (!productsArr) return;

  const seenIds = new Set();
  const byCode = new Map();

  productsArr.forEach((product, index) => {
    const where = `products[${index}]`;
    if (!isPlainObject(product)) {
      addError(`${where}: cada producto debe ser un objeto.`);
      return;
    }

    const { id, code, name, page, sizes, colors, price, sourcePagePdf } = product;

    // id
    if (typeof id !== 'string' || id.trim().length === 0) {
      addError(`${where}: "id" ausente o no es string no vacío.`);
    } else if (seenIds.has(id)) {
      addError(`${where}: id de producto duplicado "${id}".`);
    } else {
      seenIds.add(id);
      productById.set(id, product);
    }

    // code (requerido por el esquema y usado en carrito / WhatsApp)
    if (!isNonEmptyString(code)) {
      addError(`${where}: "code" vacío o ausente (producto ${id ?? '¿?'}).`);
    } else {
      const list = byCode.get(code) || [];
      list.push(id);
      byCode.set(code, list);
    }

    // name
    if (!isNonEmptyString(name)) {
      addError(`${where}: "name" vacío o ausente (producto ${id ?? '¿?'}).`);
    }

    // page
    if (!isFiniteNumber(page) || !Number.isInteger(page)) {
      addError(`${where}: "page" no es un entero finito (${JSON.stringify(page)}).`);
    } else if (expectedPageCount && (page < 1 || page > expectedPageCount)) {
      addError(`${where}: "page" ${page} fuera de rango (1..${expectedPageCount}).`);
    } else if (page >= 1 && declaredPageNumbers.size && !declaredPageNumbers.has(page)) {
      addError(`${where}: "page" ${page} no existe en catalog-pages.json.`);
    }

    // sizes
    if (!Array.isArray(sizes)) {
      addError(`${where}: "sizes" debe ser un array.`);
    } else {
      if (sizes.length === 0) {
        addWarning(`Producto ${id ?? '¿?'}: sin talles declarados (la app usa "Único").`);
      }
      const dup = sizes.filter((s, i) => sizes.indexOf(s) !== i);
      if (dup.length > 0) {
        addError(`${where}: talles duplicados exactos [${[...new Set(dup)].join(', ')}].`);
      }
    }

    // colors
    if (!Array.isArray(colors)) {
      addError(`${where}: "colors" debe ser un array.`);
    } else {
      if (colors.length === 0) {
        addWarning(`Producto ${id ?? '¿?'}: sin colores declarados (la app usa "No especificado").`);
      }
      const dup = colors.filter((c, i) => colors.indexOf(c) !== i);
      if (dup.length > 0) {
        addError(`${where}: colores duplicados exactos [${[...new Set(dup)].join(', ')}].`);
      }
    }

    // price (opcional: null permitido; si es número debe ser finito y >= 0)
    if (price !== undefined && price !== null) {
      if (!isFiniteNumber(price)) {
        addError(`${where}: "price" no es un número finito (${JSON.stringify(price)}).`);
      } else if (price < 0) {
        addError(`${where}: "price" negativo (${price}).`);
      }
    }

    // sourcePagePdf: ruta segura si está presente
    if (sourcePagePdf !== undefined) {
      validateSafePath(`${where}.sourcePagePdf`, sourcePagePdf);
    }
  });

  // Códigos repetidos entre IDs distintos → ADVERTENCIA (variantes legítimas).
  for (const [code, ids] of byCode) {
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length > 1) {
      addWarning(
        `Código "${code}" compartido por ${uniqueIds.length} productos con IDs distintos ` +
          `(${uniqueIds.slice(0, 4).join(', ')}${uniqueIds.length > 4 ? ', ...' : ''}).`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// E. Hotspots + F. Relaciones cruzadas
// ---------------------------------------------------------------------------
function validateHotspots() {
  if (!hotspotsArr) return;

  const seenIds = new Set();
  const productRefCount = new Map();
  const geomByKey = new Map();
  const byPage = new Map();

  hotspotsArr.forEach((h, index) => {
    const where = `hotspots[${index}]`;
    if (!isPlainObject(h)) {
      addError(`${where}: cada hotspot debe ser un objeto.`);
      return;
    }

    const { id, productId, page, x, y, width, height } = h;

    // id
    if (!isNonEmptyString(id)) {
      addError(`${where}: "id" vacío o ausente.`);
    } else if (seenIds.has(id)) {
      addError(`${where}: id de hotspot duplicado "${id}".`);
    } else {
      seenIds.add(id);
    }

    // productId → debe existir
    if (!isNonEmptyString(productId)) {
      addError(`${where}: "productId" vacío o ausente.`);
    } else {
      productRefCount.set(productId, (productRefCount.get(productId) || 0) + 1);
      if (productById.size && !productById.has(productId)) {
        addError(`${where} (${id ?? '¿?'}): referencia al producto inexistente "${productId}".`);
      }
    }

    // page
    let pageOk = true;
    if (!isFiniteNumber(page) || !Number.isInteger(page)) {
      addError(`${where}: "page" no es un entero finito (${JSON.stringify(page)}).`);
      pageOk = false;
    } else if (expectedPageCount && (page < 1 || page > expectedPageCount)) {
      addError(`${where}: "page" ${page} fuera de rango (1..${expectedPageCount}).`);
      pageOk = false;
    } else if (declaredPageNumbers.size && !declaredPageNumbers.has(page)) {
      addError(`${where}: "page" ${page} no existe en catalog-pages.json.`);
      pageOk = false;
    }

    // Coordenadas (porcentajes 0..100)
    const coords = { x, y, width, height };
    let coordsOk = true;
    for (const [key, val] of Object.entries(coords)) {
      if (!isFiniteNumber(val)) {
        addError(`${where}: coordenada "${key}" no es un número finito (${JSON.stringify(val)}).`);
        coordsOk = false;
      }
    }
    if (coordsOk) {
      if (width <= 0) addError(`${where}: "width" debe ser > 0 (${width}).`);
      if (height <= 0) addError(`${where}: "height" debe ser > 0 (${height}).`);
      if (x < 0) addError(`${where}: "x" no puede ser negativo (${x}).`);
      if (y < 0) addError(`${where}: "y" no puede ser negativo (${y}).`);
      if (x > 100) addError(`${where}: "x" fuera de escala 0..100 (${x}).`);
      if (y > 100) addError(`${where}: "y" fuera de escala 0..100 (${y}).`);
      if (x + width > 100) addError(`${where}: "x + width" excede 100 (${x} + ${width}).`);
      if (y + height > 100) addError(`${where}: "y + height" excede 100 (${y} + ${height}).`);
    }

    // Duplicado exacto (misma página, mismo producto, misma geometría) → ERROR
    if (pageOk && coordsOk && isNonEmptyString(productId)) {
      const key = `${page}|${productId}|${x}|${y}|${width}|${height}`;
      if (geomByKey.has(key)) {
        addError(`${where}: hotspot duplicado exacto de ${geomByKey.get(key)} (mismo producto y geometría).`);
      } else {
        geomByKey.set(key, id ?? where);
      }

      const list = byPage.get(page) || [];
      list.push({ id: id ?? where, x, y, width, height });
      byPage.set(page, list);
    }
  });

  // Productos referenciados por múltiples hotspots → ADVERTENCIA
  for (const [productId, refs] of productRefCount) {
    if (refs > 1) {
      addWarning(`Producto "${productId}" referenciado por ${refs} hotspots.`);
    }
  }

  // Solapamientos por página: exacto → ERROR (ya cubierto arriba si mismo producto);
  // solapamiento geométrico exacto entre distintos → ERROR; parcial → ADVERTENCIA.
  for (const [page, list] of byPage) {
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        const a = list[i];
        const b = list[j];
        const sameBox = a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
        if (sameBox) {
          addError(`Página ${page}: hotspots ${a.id} y ${b.id} ocupan exactamente la misma área.`);
          continue;
        }
        const overlapX = a.x < b.x + b.width && b.x < a.x + a.width;
        const overlapY = a.y < b.y + b.height && b.y < a.y + a.height;
        if (overlapX && overlapY) {
          addWarning(`Página ${page}: solapamiento parcial entre hotspots ${a.id} y ${b.id}.`);
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Productos sin hotspot (ADVERTENCIA) + imágenes declaradas por páginas
// ---------------------------------------------------------------------------
function validateCrossRelations(imageFileSet) {
  if (!productsArr || !hotspotsArr) return;

  const referencedProductIds = new Set(
    hotspotsArr.filter(isPlainObject).map((h) => h.productId),
  );
  for (const product of productsArr) {
    if (!isPlainObject(product) || !isNonEmptyString(product.id)) continue;
    if (!referencedProductIds.has(product.id)) {
      addWarning(`Producto ${product.id} (${product.code ?? '¿?'}) no tiene hotspot asociado.`);
    }
  }

  // Cada página declarada debe tener imagen física existente + coincidencia de mayúsculas.
  if (pagesArr && imageFileSet) {
    for (const page of pagesArr) {
      if (!isPlainObject(page) || !isFiniteNumber(page.pageNumber)) continue;
      const expectedName = `page-${String(page.pageNumber).padStart(3, '0')}.jpg`;
      if (!imageFileSet.has(expectedName)) {
        // Detecta diferencias de mayúsculas/minúsculas (fallarían en Linux/Vercel).
        const ci = [...imageFileSet].find(
          (f) => f.toLowerCase() === expectedName.toLowerCase(),
        );
        if (ci) {
          addError(
            `Página ${page.pageNumber}: la imagen existe como "${ci}" pero se referencia como ` +
              `"${expectedName}" (diferencia de mayúsculas, falla en Linux/Vercel).`,
          );
        }
        // Si no existe en absoluto, ya lo reporta validateImages().
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Verificación informativa contra cifras históricas
// ---------------------------------------------------------------------------
function referenceCheck() {
  if (pagesArr && expectedPageCount && expectedPageCount !== EXPECTED_REFERENCE.pages) {
    addWarning(
      `Conteo de páginas (${expectedPageCount}) difiere de la referencia histórica (${EXPECTED_REFERENCE.pages}).`,
    );
  }
  if (productsArr && productsArr.length !== EXPECTED_REFERENCE.products) {
    addWarning(
      `Conteo de productos (${productsArr.length}) difiere de la referencia histórica (${EXPECTED_REFERENCE.products}).`,
    );
  }
  if (hotspotsArr && hotspotsArr.length !== EXPECTED_REFERENCE.hotspots) {
    addWarning(
      `Conteo de hotspots (${hotspotsArr.length}) difiere de la referencia histórica (${EXPECTED_REFERENCE.hotspots}).`,
    );
  }
}

// ---------------------------------------------------------------------------
// Ejecución
// ---------------------------------------------------------------------------
validatePages();
const imageFileSet = validateImages();
validateProducts();
validateHotspots();
validateCrossRelations(imageFileSet);
referenceCheck();

// ---------------------------------------------------------------------------
// Reporte
// ---------------------------------------------------------------------------
/** Agrupa mensajes por prefijo repetitivo y muestra ejemplos + total. */
function printGrouped(prefix, messages, exampleLimit = 10) {
  if (messages.length === 0) return;
  const shown = messages.slice(0, exampleLimit);
  for (const m of shown) {
    console.log(`${prefix} ${m}`);
  }
  if (messages.length > exampleLimit) {
    console.log(`${prefix} ... y ${messages.length - exampleLimit} más (${messages.length} en total).`);
  }
}

const pageCount = expectedPageCount || (pagesArr ? pagesArr.length : 0);
const imageCount = fs.existsSync(PATHS.pagesDir)
  ? fs.readdirSync(PATHS.pagesDir).filter((f) => /^page-\d{3}\.jpg$/.test(f)).length
  : 0;
const productCount = productsArr ? productsArr.length : 0;
const hotspotCount = hotspotsArr ? hotspotsArr.length : 0;
const productsWithoutHotspot = warnings.filter((w) => w.includes('no tiene hotspot asociado')).length;

console.log('');
console.log('CATÁLOGO INV 2026 — VALIDACIÓN DE DATOS');
console.log('');
console.log(`Páginas declaradas: ${pageCount}`);
console.log(`Imágenes encontradas: ${imageCount}`);
console.log(`Productos: ${productCount}`);
console.log(`Hotspots: ${hotspotCount}`);
console.log(`Productos sin hotspot: ${productsWithoutHotspot}`);
console.log('');
console.log(`ERRORES: ${errors.length}`);
console.log(`ADVERTENCIAS: ${warnings.length}`);
console.log('');

printGrouped('[ERROR]', errors);
if (errors.length && warnings.length) console.log('');
printGrouped('[WARN]', warnings);

console.log('');
if (errors.length === 0) {
  console.log('RESULTADO: VALIDACIÓN APROBADA');
  process.exit(0);
} else {
  console.log('RESULTADO: VALIDACIÓN RECHAZADA');
  process.exit(1);
}
