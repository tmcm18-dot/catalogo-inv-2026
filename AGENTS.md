# AGENTS.md — Catálogo INV 2026

## Raíz oficial

- Repositorio: `tmcm18-dot/catalogo-inv-2026`
- Raíz del proyecto = raíz del repositorio Git (donde están `package.json`, `next.config.js` y `src/`).
- Hay **una sola** raíz. No crear carpetas de proyecto anidadas (p. ej. `catalogo-inv-2026/catalogo-inv-2026/`).
- No crear archivos con doble extensión (p. ej. `CatalogApp.tsx.tsx`).

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript (`strict: true`)
- Datos estáticos en `src/data/`; assets en `public/assets/catalogo/`
- Sin backend, base de datos ni variables de entorno obligatorias
- Integración externa: deep link `wa.me` (WhatsApp) desde el carrito

## Comandos estándar

```bash
npm ci              # instalación limpia (usar en verificaciones / CI)
npm run dev         # http://localhost:3000
npm run validate:data # validación ESTRUCTURAL del catálogo (node:fs/path/url)
npm run audit:catalog # auditoría DOCUMENTAL vs PDF (no modifica datos; no está en prebuild)
npm run apply:catalog-fixes # aplica SOLO reports/confirmed-catalog-fixes.json
npm run test        # Vitest (funciones puras + integridad)
npm run lint        # ESLint flat config (eslint.config.mjs)
npm run typecheck   # tsc --noEmit
npm run build       # next build (ejecuta antes prebuild → validate:data)
npm start           # servir build de producción
```

No convertir `npm install` / `npm ci` en un paso automático al iniciar el servidor.

## Validación estructural vs auditoría documental

### `npm run validate:data` (estructural — bloquea build)

- Script: `scripts/validate-catalog.mjs` (solo módulos nativos de Node).
- Se ejecuta automáticamente antes del build vía `prebuild`; un ERROR aborta `npm run build`.
- **Obligatorio** ejecutar `npm run validate:data` antes de modificar productos, páginas, hotspots o imágenes, y confirmar `ERRORES: 0` después.
- Qué valida: estructura de los JSON (`products.json`, `catalog-pages.json`, `hotspots.json`), secuencia de páginas, existencia/padding/tamaño de imágenes `page-NNN.jpg`, campos requeridos, coordenadas de hotspots (porcentajes 0..100), y relaciones cruzadas (hotspot→producto, página→imagen, rutas seguras dentro de `public`, sin `..`, sin diferencias de mayúsculas que fallen en Linux/Vercel).
- **ERRORES** (exit code 1): incoherencias que romperían el catálogo.
- **ADVERTENCIAS** (exit code 0): tolerables (producto sin hotspot, talles/colores vacíos con fallback de UI, códigos compartidos).
- Fuente de verdad de conteos: `catalog-pages.json` y los JSON. Las cifras históricas (218 / 743 / 727) son informativas (`EXPECTED_REFERENCE`).
- Reglas: **prohibido** ocultar errores del validador; **prohibido** cambiar datos solo para hacer pasar el script; rutas Linux/Vercel (minúsculas, `page-NNN.jpg`).

### `npm run audit:catalog` (documental — no bloquea producción)

- Script: `scripts/audit-catalog-integrity.mjs`.
- Compara hotspots/productos contra la **capa de texto del PDF** (`public/assets/catalogo/pdf/inv-2026.pdf`).
- Genera `reports/catalog-integrity-audit.{json,csv,md}` y capturas en `reports/catalog-integrity-images/`.
- **No modifica** `products.json` ni `hotspots.json`.
- Exit 0 si el proceso corre; exit 1 solo por fallo técnico.
- **No** agregar `audit:catalog` a `prebuild` hasta validar su precisión en producción.

Orden de confianza documental: (1) texto/coords del PDF, (2) datos estructurados previos, (3) JPG de página, (4) inspección visual, (5) OCR sólo si no hay texto seleccionable.

## Reglas para hotspots, productId, talles y colores

- **Modificar `productId` de un hotspot**: permitido cuando el código tipográfico es inequívoco y el producto correcto existe. Conservar `page`, `x`, `y`, `width`, `height`. Guardar evidencia en `reports/`.
- **Crear hotspots nuevos**: sólo con código impreso claro, producto existente, página correcta, región visual delimitable con confianza alta, sin invadir otro producto, variante inequívoca. **Prohibido** generar por grilla, por cantidad o sólo por orden del array. Si las coords son ambiguas → pendiente manual (`MISSING_HOTSPOT`).
- **Talles / colores**: corregir automáticamente sólo `MISMATCH_HIGH` / `MISSING_DATA` de confianza alta con texto PDF legible. No inventar datos. No tratar fallbacks de UI (`Único`, `No especificado`) como dato real del PDF.
- **Prohibido** aplicar correcciones `MISMATCH_MEDIUM`, `AMBIGUOUS`, `NOT_FOUND` o `SHARED_CODE` de forma automática.
- Aplicación controlada: generar/editar `reports/confirmed-catalog-fixes.json` y correr `npm run apply:catalog-fixes` (determinista; soporta `--dry-run`).

## Interacción hotspot / swipe / pinch

- Causa raíz histórica de clic muerto: `setPointerCapture` en `.catalogScroll` robaba el `click` del `<button class="hotspot">`.
- Reglas vigentes:
  - toque/clic corto (≤ ~10px) → abre producto;
  - swipe horizontal → cambia página y **no** abre producto;
  - pinch → zoom y **no** abre producto;
  - arrastre con zoom → pan y **no** abre producto.
- CSS: `.hotspot` con `pointer-events: auto`, `z-index` suficiente, `cursor: pointer`; decoración interna (`.hotspot span`) con `pointer-events: none`.
- No romper pinch-to-zoom ni swipe al tocar la lógica de gestos (`src/lib/gestures.ts`, handlers del visor).

## Calidad

- ESLint: `eslint.config.mjs` con `next/core-web-vitals` y `next/typescript` (incluye a11y vía `eslint-config-next`).
- TypeScript: `strict` ya activo en `tsconfig.json`; no desactivarlo.
- No usar `next lint` (deprecado); el script `lint` ejecuta `eslint .`.
- Tests: Vitest (`npm run test`), entorno Node, alias `@/*`.

## Áreas sensibles (no tocar sin pruebas)

No modificar sin pruebas manuales explícitas:

- Pinch-to-zoom del visor
- Swipe de páginas
- Caché / precarga de páginas
- Carrito y pedido por WhatsApp
- Hotspots, productos y JSON de datos
- CSS visual / diseño / rutas / imágenes

## Procedimiento de build / verificación limpia

```bash
git checkout main
git pull origin main
npm ci
npm run validate:data
npm run audit:catalog
npm run lint
npm run typecheck
npm run test
npm run build
```

## Flujo de ramas

- Trabajar siempre desde `main` actualizado (`git pull origin main`) antes de crear una rama de feature.
- **No continuar** sobre ramas antiguas ya mergeadas (p. ej. `revista-pinch-zoom-movil-5ad4` tras su merge a `main`).
- Crear una rama nueva por cambio; no trabajar commits directos en `main`.
