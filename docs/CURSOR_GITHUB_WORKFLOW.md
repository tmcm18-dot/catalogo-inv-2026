# Flujo Cursor ↔ GitHub (Catálogo INV 2026)

Guía permanente para gestionar sincronización, ramas, commits, Draft PRs, checks y fusiones autorizadas desde Cursor.

GitHub Desktop queda **opcional** (no se desinstala ni se modifica).

## Preparación inicial

### 1. Git en la sesión (Windows)

Preferido:

```powershell
. .\scripts\dev\cursor-github-env.ps1
```

El helper:

- localiza `git.exe` (Git for Windows o la copia interna de GitHub Desktop);
- agrega Git al **PATH solo de la sesión actual**;
- verifica `git --version`, `gh --version` y `gh auth status`;
- **no** inicia login;
- **no** guarda credenciales;
- **no** modifica el PATH permanente del usuario o del sistema.

Sin dot-sourcing (`. `) el PATH puede no persistir en tu shell.

### 2. Autenticación de GitHub CLI

```powershell
gh auth status
```

Si no hay sesión:

```powershell
gh auth login --web --git-protocol https
```

Completá el código de un solo uso en el navegador. No pegues tokens en el chat ni los guardes en el repo.

### 3. Verificación rápida

```powershell
git --version
git status --short
git remote -v
gh auth status
gh repo view tmcm18-dot/catalogo-inv-2026
```

## Comandos Cursor

### `/start-task`

Crea una rama nueva desde `main` actualizado y limpio.

- Actualiza `main` con `fetch` + `pull --ff-only`
- Exige working tree limpio
- Verifica que la rama no exista local ni remotamente
- Informa el commit base

### `/publish-pr`

Publica el trabajo de la rama actual:

- revisa status/diff y detecta temporales;
- corre validaciones del proyecto;
- commit + push;
- crea **Draft** PR con `gh`;
- no marca Ready for review;
- no fusiona.

### `/check-pr`

Solo lectura. Recibe el número de PR y muestra estado, Draft, base/head, mergeable, conflictos, commits, checks, archivos, additions/deletions y revisiones.

### `/merge-approved-pr`

Fusiona **solo** si el usuario escribe exactamente:

```text
AUTORIZO FUSIONAR PR #N
```

Sin esa frase: no convierte Draft, no fusiona, no elimina ramas.

Con autorización: verifica checks y conflictos, base `main`, fusiona con `gh`, limpia rama remota, vuelve a `main` y hace `pull --ff-only`.

### `/sync-main`

Actualiza `main` local. Se detiene si hay cambios locales. No borra ramas locales sin autorización.

## Qué sigue requiriendo aprobación humana

- Login de `gh` en el navegador
- Cualquier fusión (`AUTORIZO FUSIONAR PR #N`)
- `review:apply --confirm`
- Force push (prohibido por defecto)
- Borrado de ramas locales
- Cambios a datos del catálogo (`products.json`, `hotspots.json`, `catalog-pages.json`) fuera de una tarea explícita
- Ready for review (no automático)

## Recuperación de problemas

### Working tree sucio

1. `git status --short`
2. Decidir con el usuario: commit, stash o descartar
3. No continuar `/start-task` ni `/sync-main` hasta quedar limpio

### Rama ya existente

Elegir otro nombre. No reutilizar ramas fusionadas.

### Conflictos en un PR

Usar `/check-pr`. Resolver en la rama de la feature (nunca en `main` directo). Re-push y re-chequear.

### Checks fallidos

Corregir en la misma rama, push, y volver a `/check-pr`. No fusionar con checks rojos.

### Git fuera del PATH

```powershell
. .\scripts\dev\cursor-github-env.ps1
git --version
```

### `gh` sin autenticación

```powershell
gh auth login --web --git-protocol https
gh auth status
```

### Caída de conexión

Reintentar `git fetch` / `gh` cuando vuelva la red. No inventar estado remoto. Si un login web hace timeout, generar un código nuevo.

## QA Nivel 1 (Vercel Preview + Actions)

Documentado en `docs/VERCEL_QA_LEVEL_1.md`:

- GitHub Actions: validación estática + E2E Playwright (desktop/móvil) contra Preview
- Fixture declarativo página 198; artefactos (reporte, traces, capturas)
- Prueba manual: `workflow_dispatch` del workflow `E2E Preview (Nivel 1)`
- Prohibido apuntar E2E a Production

## Fuera de alcance (PRs posteriores)

- Playwright avanzado (pinch/swipe/gestos)
- Loops de QA de nivel superior / cobertura amplia de páginas

## Regla Cursor asociada

`.cursor/rules/catalog-github-workflow.mdc` (Always Apply) refuerza estas políticas en cada sesión del agente.
