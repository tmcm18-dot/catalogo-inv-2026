# AGENTS.md

## Cursor Cloud specific instructions

### What this is
`Catálogo INV 2026` is a single, self-contained Next.js 15 / React 19 / TypeScript app (App Router, `src/app/`). It renders a static digital lingerie catalog (per-page images with clickable product "hotspots"), supports a product grid/search, and a localStorage-backed cart that generates a WhatsApp order deep link. There is no backend, database, API route, or environment variable — everything runs in the single web service.

### Services
- Web app (the only service). Dev: `npm run dev` (serves on `http://localhost:3000`). Build: `npm run build`. Prod start: `npm start`. Commands live in `package.json`.

### Non-obvious notes
- `npm run lint` (`next lint`) is NOT usable non-interactively: no ESLint config is committed, so it drops into an interactive "How would you like to configure ESLint?" prompt and hangs. Do not rely on it in automation. Type-checking still happens as part of `npm run build`.
- `next build` runs full TypeScript type-checking, so a green build is the primary correctness signal for this repo (there are no automated tests / test framework).
- The catalog reads static assets from `public/assets/catalogo/` (page images + `pdf/inv-2026.pdf`) and product data from `src/data/*.json`. These are committed; no generation step is needed.
- Core flow to smoke-test the app end-to-end: open `/` → "Productos" → "Seleccionar" on a card → set talle/color/cantidad → "Agregar al carrito" → "Ver carrito" (shows the item + generated WhatsApp message).
