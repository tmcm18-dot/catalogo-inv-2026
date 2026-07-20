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
npm run lint        # ESLint flat config (eslint.config.mjs)
npm run typecheck   # tsc --noEmit
npm run build       # next build (incluye chequeo de tipos)
npm start           # servir build de producción
```

No convertir `npm install` / `npm ci` en un paso automático al iniciar el servidor.

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
