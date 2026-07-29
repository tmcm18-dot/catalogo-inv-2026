# Informe — Aplicación redibujo Clase B página 198

## 1. Rama

`fix/catalog-batch-e-class-b-page-198`

## 2. Commit base

`4ff016be8a671b55546ba955705a6a5febaf9676` — Merge pull request #17 from tmcm18-dot/review/catalog-batch-e-class-b-redraw-plan

## 3. Fecha

2026-07-28 / 2026-07-29 (UTC), America/Argentina

## 4. Fuente del plan

- `reports/catalog-review/BATCH_E_CLASS_B_REDRAW_PLAN_REPORT.md`
- `reports/catalog-review/batch-e-class-b-redraw-plan/redraw-plan.json` (página 198: `confirmed-plan`, `confidence: high`)
- Overlays `p198-current-full-map.jpg`, `p198-proposed-full-map.jpg`, `p198-compare.jpg`

## 5. Estado inicial (antes de modificar)

| Métrica | Valor |
|---------|-------|
| Productos | 743 |
| Hotspots | 727 |
| Productos sin hotspot | 20 |
| Hash `products.json` | `af00a7b7e17cd13859e6920ed06b4d2ef0dcae483686940f2d4c3062dee4f854` |
| Hash `hotspots.json` | `0c41d711220a5815ffa6f63456b4f18f63ec916339bf767c2c466eab869f7d78` |
| Hash `catalog-pages.json` | `b0db84cad60d6e06d65392112935f208870be156c2f415105b443a93871fe34c` |

### Auditoría documental (live, pre-aplicación)

| Clasificación | Valor |
|---------------|------:|
| MATCH | 252 |
| MISMATCH_HIGH | 163 |
| MISMATCH_MEDIUM | 83 |
| AMBIGUOUS | 64 |
| NOT_FOUND | 164 |
| SHARED_CODE | 1 |
| MISSING_HOTSPOT | 20 |

## 6. Tabla anterior → nuevo

| hotspotId | Campo | Antes | Después |
|-----------|-------|-------|---------|
| hotspot-198 | productId | 198 | 198 |
| hotspot-198 | x,y,w,h | 3, 8, 94×30 | 2, 5, 48×42 |
| hotspot-198 | código tipográfico | 5123 (folio en name) | 5123 (folio en name) |
| hotspot-5131 | productId | 5086 | **5131** |
| hotspot-5131 | x,y,w,h | 3, 40, 46×50 | 52, 5, 46×42 |
| hotspot-5131 | código tipográfico | (región incorrecta) | 5131 |
| hotspot-5086 | productId | 5086 | 5086 |
| hotspot-5086 | x,y,w,h | 51, 40, 46×50 | 2, 50, 96×48 |
| hotspot-5086 | código tipográfico | 5086 (zona parcial) | 5086 (ficha completa) |

## 7. Dry-run

Ejecutado **sin escritura**. Resultado:

| Condición | Valor |
|-----------|-------|
| Errores | 0 |
| Hotspots creados | 0 |
| Hotspots eliminados | 0 |
| Cambios fuera de página 198 | 0 |
| Huérfanos nuevos | 0 |
| Duplicados inesperados | 0 |
| Solapamientos mayores | 0 |
| JSON intactos tras dry-run | sí |

- Cambios de `productId`: 1 (`hotspot-5131`: 5086 → 5131)
- Cambios de coordenadas: 3
- Productos afectados: 198, 5086, 5131
- Orphan resuelto previsto: 5131

## 8. Aplicación

Aplicación atómica de los tres hotspots. `unexpectedChanges: []`.

| Check | Resultado |
|-------|-----------|
| Hotspots p198 antes | 3 |
| Hotspots p198 después | 3 |
| Total global hotspots | 727 → 727 |
| IDs conservados | hotspot-198, hotspot-5131, hotspot-5086 |
| `page` = 198 | sí |
| Páginas 61 / 109 / 174 | intactas |
| `products.json` | intacto |
| `catalog-pages.json` | intacto |

## 9. Geometría final

| Verificación | Valor |
|--------------|-------|
| hotspot-198 termina en x | 50 |
| hotspot-5131 comienza en x | 52 |
| Separación horizontal superior | 2 % |
| Ambos superiores terminan en y | 47 |
| hotspot-5086 comienza en y | 50 |
| Separación vertical | 3 % |
| Solapamientos entre productos distintos | 0 |
| Coordenadas en 0–100 | sí |

## 10. Cobertura de productos (inventario página 198)

| | Antes | Después |
|--|-------|---------|
| Cubiertos | 198, 5086 | 198, 5086, 5131 |
| Sin hotspot (dentro del inventario 198) | 5131 | ninguno |
| Huérfanos nuevos | — | ninguno |
| Duplicados productId en p198 | 5086 (×2) | ninguno |

## 11. Auditoría antes → después (live)

| Clasificación | Antes | Después | Δ |
|---------------|------:|--------:|--:|
| MATCH | 252 | 252 | 0 |
| MISMATCH_HIGH | 163 | 161 | −2 |
| MISMATCH_MEDIUM | 83 | 84 | +1 |
| AMBIGUOUS | 64 | 65 | +1 |
| NOT_FOUND | 164 | 164 | 0 |
| SHARED_CODE | 1 | 1 | 0 |
| MISSING_HOTSPOT | 20 | 19 | −1 |
| Total hotspots | 727 | 727 | 0 |
| Productos sin hotspot | 20 | 19 | −1 |

### Transiciones de los tres hotspots

| hotspotId | Antes (estado / efecto) | Después (clasificación) | Explicación |
|-----------|-------------------------|-------------------------|-------------|
| hotspot-198 | Cubría todo el bloque superior (5123+5131); `productId` folio 198 | `MISMATCH_MEDIUM` (impreso 5123) | Geometría alineada a 5123; el folio 198 vs código tipográfico 5123 permanece como mismatch medio esperado (SKU en `name`). |
| hotspot-5131 | Apuntaba a 5086 en inferior-izquierda | `MATCH` (impreso 5131) | Reassign+move a TR; deja de ser huérfano. |
| hotspot-5086 | Zona inferior-derecha duplicada de 5086 | `AMBIGUOUS` (impreso 5086) | Consolidación full-width de la ficha 5086; el auditor marca ambigüedad tipográfica/geométrica residual, sin orphan. |

Confirmaciones:

- **5131** deja de estar sin hotspot.
- **198** sigue asociado a la ficha comercial 5123 (folio).
- **5086** conserva asociación correcta (una sola zona).
- No aparece huérfano nuevo.

## 12. Hashes finales

| Archivo | Inicial | Final | ¿Idéntico? |
|---------|---------|-------|------------|
| `products.json` | `af00a7b7e17cd13859e6920ed06b4d2ef0dcae483686940f2d4c3062dee4f854` | `af00a7b7e17cd13859e6920ed06b4d2ef0dcae483686940f2d4c3062dee4f854` | sí |
| `catalog-pages.json` | `b0db84cad60d6e06d65392112935f208870be156c2f415105b443a93871fe34c` | `b0db84cad60d6e06d65392112935f208870be156c2f415105b443a93871fe34c` | sí |
| `hotspots.json` | `0c41d711220a5815ffa6f63456b4f18f63ec916339bf767c2c466eab869f7d78` | `e6671f60b862bd203a9c2aada649cdc984c5833212b1c88897bcae38f139c058` | no (solo p198) |

## 13. Validaciones

| Comando | Resultado |
|---------|-----------|
| `npm run validate:data` | 0 errores (206 warnings; productos sin hotspot 19) |
| `npm run audit:catalog` | OK |
| `npm run lint` | 0 errores (warnings preexistentes `<img>`) |
| `npm run typecheck` | OK |
| `npm run test` | **89/89** |
| `npm run build` | OK |
| `review:apply --confirm` | **no ejecutado** |

## 14. Confirmaciones de alcance

- Solo se modificó la página **198**.
- Páginas **61, 109 y 174** intactas.
- No se crearon ni eliminaron hotspots (3 → 3).
- No se modificaron productos, nombres, precios, talles ni colores.
- `unexpectedChanges: []`
