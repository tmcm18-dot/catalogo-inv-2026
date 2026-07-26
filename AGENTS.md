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
npm run validate:data # valida integridad de datos del catálogo (node:fs/path/url)
npm run lint        # ESLint flat config (eslint.config.mjs)
npm run typecheck   # tsc --noEmit
npm run build       # next build (ejecuta antes prebuild → validate:data)
npm start           # servir build de producción
```

No convertir `npm install` / `npm ci` en un paso automático al iniciar el servidor.

## Validación de datos del catálogo

- Comando: `npm run validate:data` (script `scripts/validate-catalog.mjs`, solo módulos nativos de Node).
- Se ejecuta automáticamente antes del build vía `prebuild`; un ERROR aborta `npm run build`.
- **Obligatorio** ejecutar `npm run validate:data` antes de modificar productos, páginas, hotspots o imágenes, y confirmar `ERRORES: 0` después.
- Qué valida: estructura de los JSON (`products.json`, `catalog-pages.json`, `hotspots.json`), secuencia de páginas, existencia/padding/tamaño de imágenes `page-NNN.jpg`, campos requeridos, coordenadas de hotspots (porcentajes 0..100), y relaciones cruzadas (hotspot→producto, página→imagen, rutas seguras dentro de `public`, sin `..`, sin diferencias de mayúsculas que fallen en Linux/Vercel).
- **ERRORES** (exit code 1): incoherencias que romperían el catálogo (JSON inválido, campos requeridos vacíos, hotspot que apunta a producto inexistente, imagen faltante o vacía, coordenadas fuera de escala, duplicados de ID, etc.).
- **ADVERTENCIAS** (exit code 0): situaciones tolerables (producto sin hotspot, producto sin talles/colores —la app usa fallbacks—, código compartido entre variantes con IDs distintos). No bloquean el build.
- Fuente de verdad de conteos: la secuencia de `catalog-pages.json` (páginas) y los propios JSON (productos/hotspots). Las cifras históricas (218 / 743 / 727) solo se usan como verificación informativa (`EXPECTED_REFERENCE`) y generan ADVERTENCIA si difieren.
- Reglas: **prohibido** ocultar o silenciar errores del validador; **prohibido** cambiar productos, hotspots, páginas o imágenes solo para hacer pasar el script; mantener siempre rutas de imágenes compatibles con Linux/Vercel (minúsculas, padding `page-NNN.jpg`, dentro de `public`).

## Calidad

- ESLint: `eslint.config.mjs` con `next/core-web-vitals` y `next/typescript` (incluye a11y vía `eslint-config-next`).
- TypeScript: `strict` ya activo en `tsconfig.json`; no desactivarlo.
- No usar `next lint` (deprecado); el script `lint` ejecuta `eslint .`.

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
npm run lint
npm run typecheck
npm run build
```

## Flujo de ramas

- Trabajar siempre desde `main` actualizado (`git pull origin main`) antes de crear una rama de feature.
- **No continuar** sobre ramas antiguas ya mergeadas (p. ej. `revista-pinch-zoom-movil-5ad4` tras su merge a `main`).
- Crear una rama nueva por cambio; no trabajar commits directos en `main`.
