# Informe — Aplicación redibujo Clase B página 109

## 1. Rama

`fix/catalog-batch-e-class-b-page-109`

## 2. Commit base

`cd4ded9d8c0e929d593e072dad27b407153302f1` — Merge pull request #20 from tmcm18-dot/chore/catalog-vercel-qa-level-1

## 3. Fecha

2026-07-30 (America/Argentina)

## 4. Fuente del plan

- `reports/catalog-review/BATCH_E_CLASS_B_REDRAW_PLAN_REPORT.md`
- `reports/catalog-review/batch-e-class-b-redraw-plan/redraw-plan.json` (página 109: `status: confirmed-plan`, `confidence: high`, `beforeHotspotCount: 4`, `afterHotspotCount: 4`, `blockingQuestions: []`)
- Overlays `p109-current-full-map.jpg`, `p109-proposed-full-map.jpg`, `p109-compare.jpg`

## 5. Estado inicial

| Métrica | Valor |
|---------|-------|
| Productos | 743 |
| Hotspots | 727 |
| Productos sin hotspot | 19 |
| Hash `products.json` | `af00a7b7e17cd13859ec0ed06b4d2ef0dcae483686940f2d4c3062dee4f854` |
| Hash `hotspots.json` | `8a56bfc1ccb564bedf0871ecdb403241f85d90cdbd8295603dc6772fca6c9a6d` |
| Hash `catalog-pages.json` | `b0db84cad60d6e06d65392112935f208870be156c2f415105b443a93871fe34c` |

Hotspots página 109 (antes):

| id | productId | x | y | w | h |
|----|-----------|---|---|---|---|
| hotspot-109 | 109 | 2 | 8 | 47 | 38 |
| hotspot-161-p109 | 161-p109 | 51 | 8 | 47 | 38 |
| hotspot-108-p109 | 108-p109 | 2 | 50 | 47 | 42 |
| hotspot-107-p109 | 161-p109 | 51 | 50 | 47 | 42 |

### Auditoría documental (live, pre-aplicación)

| Clasificación | Valor |
|---------------|------:|
| MATCH | 252 |
| MISMATCH_HIGH | 161 |
| MISMATCH_MEDIUM | 84 |
| AMBIGUOUS | 65 |
| NOT_FOUND | 164 |
| SHARED_CODE | 1 |
| MISSING_HOTSPOT | 19 |

## 6. Tabla anterior → final

| hotspotId | Operación | Antes | Después |
|-----------|-----------|-------|---------|
| hotspot-109 | resize | 109 @ 2,8,47×38 | 109 @ 2,5,96×42 (código comercial 101) |
| hotspot-161-p109 | **delete** | 161-p109 @ 51,8,47×38 | eliminado |
| hotspot-108-p109 | resize | 108-p109 @ 2,50,47×42 | 108-p109 @ 2,50,47×22 |
| hotspot-107-p109-2 | **create** | — | 107-p109 @ 2,74,47×24 |
| hotspot-107-p109 | resize | 161-p109 @ 51,50,47×42 | 161-p109 @ 51,50,47×48 |

## 7. Dry-run

Comando: `node reports/catalog-review/_apply-p109.mjs --dry-run` (sin escritura).

| Condición | Valor |
|-----------|-------|
| Errores | 0 |
| Hotspots antes / después | 4 → 4 |
| Creaciones | 1 |
| Eliminaciones | 1 |
| Cambios fuera de página 109 | 0 |
| Huérfanos nuevos | 0 |
| Huérfanos resueltos (previsto) | 107-p109 |
| Duplicados inesperados | 0 |
| Solapamientos mayores | 0 |
| JSON intactos tras dry-run | sí (`hashesUnchanged: true`) |

## 8. Método de aplicación

Los cambios en `src/data/hotspots.json` **no** se escribieron con `npm run review:apply -- --confirm`.

Método real:

1. Script temporal local `reports/catalog-review/_apply-p109.mjs` (no versionado; eliminado tras la aplicación).
2. `node reports/catalog-review/_apply-p109.mjs --dry-run` — validó estado anterior, final, geometría, huérfanos/duplicados/solapamientos; no escribió JSON.
3. `node reports/catalog-review/_apply-p109.mjs --apply` — reescribió `hotspots.json` con `fs.writeFileSync`, reemplazando atómicamente los hotspots de la página 109.
4. Verificación post-escritura: total global 727, páginas 61/174/198 intactas, `products.json`/`catalog-pages.json` sin cambio, `unexpectedChanges: []`.

Por qué no se usó `review:apply --confirm`: ese comando aplica `confirmed-decisions.json` del flujo `/catalog-review`, no el redibujo geométrico de `redraw-plan.json`.

Afirmación: **`review:apply --confirm` no fue ejecutado**.

## 9. Aplicación

| Check | Resultado |
|-------|-----------|
| Hotspots p109 antes | 4 |
| Hotspots p109 después | 4 |
| Creates / deletes | 1 / 1 |
| Total global hotspots | 727 → 727 |
| IDs finales | hotspot-109, hotspot-108-p109, hotspot-107-p109-2, hotspot-107-p109 |
| Páginas 61 / 174 / 198 | intactas |
| `products.json` | intacto |
| `catalog-pages.json` | intacto |
| `unexpectedChanges` | `[]` |

## 10. Geometría final

| Verificación | Valor |
|--------------|-------|
| 101 termina en y | 47 |
| Regiones inferiores comienzan en y | 50 |
| Separación vertical superior | 3 % |
| 108 termina en y | 72 |
| 107 comienza en y | 74 |
| Separación vertical 108/107 | 2 % |
| Columna izquierda termina en x | 49 |
| Columna derecha comienza en x | 51 |
| Separación horizontal | 2 % |
| Solapamientos mayores | 0 |
| Coordenadas en 0–100 | sí |

## 11. Cobertura

| | Antes | Después |
|--|-------|---------|
| Cubiertos | 109, 108-p109, 161-p109 | 109, 108-p109, 107-p109, 161-p109 |
| Sin hotspot (inventario p109) | 107-p109 | ninguno |
| Huérfanos nuevos | — | ninguno |
| Duplicados productId en p109 | 161-p109 (×2) | ninguno |

## 12. Auditoría antes → después

| Clasificación | Antes | Después | Δ |
|---------------|------:|--------:|--:|
| MATCH | 252 | 253 | +1 |
| MISMATCH_HIGH | 161 | 161 | 0 |
| MISMATCH_MEDIUM | 84 | 84 | 0 |
| AMBIGUOUS | 65 | 65 | 0 |
| NOT_FOUND | 164 | 163 | −1 |
| SHARED_CODE | 1 | 1 | 0 |
| MISSING_HOTSPOT | 19 | 18 | −1 |
| Total hotspots | 727 | 727 | 0 |
| Productos sin hotspot | 19 | 18 | −1 |

Transiciones por hotspot:

| hotspotId | Antes | Después | Explicación |
|-----------|-------|---------|-------------|
| hotspot-109 | MISMATCH_MEDIUM (impreso 101) | MISMATCH_MEDIUM (impreso 101) | Bloque superior consolidado; folio interno 109 vs tipográfico 101 permanece esperado. |
| hotspot-161-p109 | NOT_FOUND | eliminado | Región sobre foto de 101; no era zona válida de 161. |
| hotspot-108-p109 | AMBIGUOUS (107/108/161) | MATCH (impreso 108) | Altura reducida; deja de invadir 107. |
| hotspot-107-p109-2 | — (MISSING_HOTSPOT de 107-p109) | AMBIGUOUS (107/161/108) | Nuevo hotspot de 107; auditor marca ambigüedad tipográfica residual en la zona. |
| hotspot-107-p109 | MATCH (impreso 161) | MATCH (impreso 161) | Columna derecha conservada y ampliada; productId 161-p109 correcto. |

Confirmaciones:

- **107-p109** deja de ser huérfano.
- **161-p109** queda representado una sola vez.
- **101** sigue asociado internamente a productId **109**.
- Ningún producto nuevo queda sin hotspot.

## 13. Hashes

| Archivo | Inicial | Final | ¿Idéntico? |
|---------|---------|-------|------------|
| `products.json` | `af00a7b7e17cd13859ec0ed06b4d2ef0dcae483686940f2d4c3062dee4f854` | `af00a7b7e17cd13859ec0ed06b4d2ef0dcae483686940f2d4c3062dee4f854` | sí |
| `catalog-pages.json` | `b0db84cad60d6e06d65392112935f208870be156c2f415105b443a93871fe34c` | `b0db84cad60d6e06d65392112935f208870be156c2f415105b443a93871fe34c` | sí |
| `hotspots.json` | `8a56bfc1ccb564bedf0871ecdb403241f85d90cdbd8295603dc6772fca6c9a6d` | `08c7909154610fbe993da1f923b216d4f9cfa3eba3e1a178d5bd5fa70d4f78eb` | no (solo p109) |

## 14. Validaciones

| Comando | Resultado |
|---------|-----------|
| `npm run validate:data` | 0 errores (204 warnings; productos sin hotspot 18) |
| `npm run audit:catalog` | OK (post-aplicación) |
| `npm run lint` | 0 errores (warnings preexistentes `<img>`) |
| `npm run typecheck` | OK |
| `npm run test` | **91/91** |
| `npm run build` | OK |
| `review:apply --confirm` | **no ejecutado** |

## 15. E2E Nivel 1

| Artefacto | Detalle |
|-----------|---------|
| Fixture | `e2e/fixtures/page-109.json` |
| Spec | `e2e/page-109.spec.ts` |
| Helper | `e2e/helpers/catalog.ts` (reutiliza diseño declarativo; no debilita p198) |
| Integridad Vitest | `tests/page-109-fixture.test.ts` |
| Cobertura | desktop-chromium + mobile-chromium |
| Local (`PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000`) | **10/10 PASS** (p109 + p198, desktop y móvil) |
| Preview CI | pendiente tras push del Draft PR |
| Expectativas | 4 hotspots; 101/108/107/161; sin hotspot TR independiente de 161; carrito 0; sin JS/request críticos |

## 16. Confirmaciones de alcance

- Solo se modificó la página **109** en datos de hotspots.
- Páginas **61, 174 y 198** intactas.
- `products.json` y `catalog-pages.json` intactos.
- No se modificaron precios, nombres, talles, colores ni imágenes.
- No se modificaron componentes/estilos ni workflows del Nivel 1.
- PR Draft; sin Ready for review; sin auto-merge; sin fusión.
