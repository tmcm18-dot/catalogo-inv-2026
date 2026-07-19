# AGENTS.md

## Cursor Cloud specific instructions

This is a single, self-contained **Next.js 15 / React 19 / TypeScript** web app ("Catálogo INV 2026"). There is no backend, database, or external service — all data is static JSON in `src/data/` and static assets (PDF + page images) live in `public/assets/catalogo/`. The only external integration is a `wa.me` (WhatsApp) deep link, which needs nothing to run locally.

Standard commands are defined in `package.json` (`dev`, `build`, `start`, `lint`). Run the dev server with `npm run dev` (serves on `http://localhost:3000`).

Non-obvious notes:
- **Lint is not runnable non-interactively out of the box.** No ESLint config is committed, so `npm run lint` (`next lint`) drops into an interactive "How would you like to configure ESLint?" prompt and never exits in a headless shell. For static verification, use `npx tsc --noEmit` (passes clean), or set up an ESLint config before relying on `next lint`.
- `next lint` is also deprecated (removed in Next.js 16); prefer `tsc --noEmit` for type checking.
- `public/assets/catalogo/` is large (~98 MB, committed). Dependency install is just `npm install`; no asset generation step is needed.
