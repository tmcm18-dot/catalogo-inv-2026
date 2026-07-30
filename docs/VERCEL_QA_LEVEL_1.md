# Vercel QA — Nivel 1

Automatización mínima de calidad contra **Vercel Preview** (nunca Production).

## Alcance

| Pieza | Ubicación |
|-------|-----------|
| Validación estática (CI) | `.github/workflows/static-validation.yml` |
| E2E Preview (Playwright) | `.github/workflows/e2e-preview.yml` |
| Specs desktop + móvil | `e2e/*.spec.ts` + `playwright.config.ts` |
| Fixture declarativo p.198 | `e2e/fixtures/page-198.json` |
| Integridad fixture↔datos | `tests/page-198-fixture.test.ts` |
| Resolver URL Preview | `scripts/e2e/resolve-preview-url.mjs` |

**Incluye:** `validate:data`, lint, typecheck, Vitest, build; smoke Preview; `/catalog-review` → 404; hotspots de página 198; capturas, traces y reporte HTML como artefactos.

**No incluye:** pruebas contra Production, modificación de `products.json` / `hotspots.json` / `catalog-pages.json`, Playwright pinch/swipe avanzado, fusión automática.

## Secretos requeridos

En GitHub → Settings → Secrets and variables → Actions:

| Secret | Uso |
|--------|-----|
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Bypass de Vercel Authentication / SSO en Preview (`x-vercel-protection-bypass`) |

Cómo obtenerlo: Vercel → Project `catalogo-inv-2026` → Settings → Deployment Protection → **Protection Bypass for Automation** → generar secret y copiarlo al repo.

Sin este secret el workflow E2E falla a propósito (Preview tiene SSO).

## Workflows

### Static validation

- Triggers: `pull_request`, `push` a `main`, `workflow_dispatch`
- Pasos: `npm ci` → `validate:data` → `lint` → `typecheck` → `test` → `build`

### E2E Preview (Nivel 1)

- Triggers: `pull_request` (opened/synchronize/reopened/ready_for_review), **`workflow_dispatch`**
- Resuelve URL Preview (input manual o deployments del SHA)
- **Rechaza** hosts de Production / `*-git-main-*`
- Corre Playwright en `desktop-chromium` y `mobile-chromium` (Pixel 7)
- Sube artefactos: `playwright-report-*`, `playwright-test-results-*` (HTML, traces, screenshots, video on failure, junit)

## Prueba manual (`workflow_dispatch`)

1. Abrí **Actions** → **E2E Preview (Nivel 1)** → **Run workflow**
2. Opciones:
   - `preview_url`: URL HTTPS del deployment Preview (recomendado), **o**
   - `pr_number`: número de PR con Preview Vercel listo
3. No uses `https://catalogo-inv-2026.vercel.app` ni aliases de `main`
4. Al terminar, descargá los artefactos del run

Ejemplo con `gh`:

```bash
gh workflow run e2e-preview.yml \
  -f preview_url='https://catalogo-inv-2026-xxxx-maxi20.vercel.app'
```

## Fixture página 198

`e2e/fixtures/page-198.json` declara:

- página, título, imagen
- navegación vía UI: Productos → buscar `5131` → **Ver en revista**
- 3 hotspots (`198`, `5131`, `5086`) con geometría y `ariaLabel`

La prueba Vitest `tests/page-198-fixture.test.ts` falla si el fixture se desincroniza de los JSON del catálogo (sin modificarlos).

## Comandos locales

```bash
npm ci
npx playwright install chromium

# Contra un Preview (obligatorio). Nunca Production.
export PLAYWRIGHT_BASE_URL='https://<preview>.vercel.app'
export VERCEL_AUTOMATION_BYPASS_SECRET='...'   # si el Preview tiene SSO

npm run test:e2e
```

Windows (PowerShell):

```powershell
$env:PLAYWRIGHT_BASE_URL = 'https://<preview>.vercel.app'
$env:VERCEL_AUTOMATION_BYPASS_SECRET = '...'
npm run test:e2e
```

## Criterios de aceptación Nivel 1

- [ ] Static validation verde en el PR
- [ ] E2E Preview verde (desktop + móvil) o corrido vía `workflow_dispatch`
- [ ] Artefactos con reporte HTML + traces/capturas disponibles
- [ ] `/catalog-review` → 404 en Preview
- [ ] Página 198: 3 hotspots y apertura de modal
- [ ] Ningún job apunta a Production
- [ ] Draft PR sin auto-merge

## Selectores E2E (notas de robustez)

Hallazgos del DOM real del Preview (sin cambiar la app):

1. **Home / brand** — el texto `Catálogo INV 2026` está en un `<strong>` dentro de `<header>` anidado en `<main>`. Por HTML-AAM **no** expone rol `banner`; los tests no deben usar `getByRole('banner')`.
2. **Metadatos compactados** — con alto de viewport ≤ 760px (p. ej. Desktop Chrome de Playwright, 720px), `.viewerMeta` y `.topbarMeta` quedan `display: none`. Una coincidencia global de `Acróbata · Hombres` puede tomar el meta oculto y fallar. La página activa se afirma con el `<h1>` visible `Página N de 218` y, si existe, la miniatura `selectedThumb` visible.
3. **Página 198** — se abre cada hotspot (`198`→nombre comercial `5123`, `5131`, `5086`) y se verifica que el modal no muestre un código vecino.

## Relación con el flujo Cursor/GitHub

Ver `docs/CURSOR_GITHUB_WORKFLOW.md`. Nivel 1 cubre la franja “Vercel / Playwright / GitHub Actions” que quedó fuera del PR de integración Cursor↔GitHub.
