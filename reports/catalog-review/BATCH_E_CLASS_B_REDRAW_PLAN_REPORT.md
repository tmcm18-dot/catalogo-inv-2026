# Informe — Plan de redibujo Batch E Clase B

## 1. Rama

`review/catalog-batch-e-class-b-redraw-plan`

## 2. Commit base

`5caa1edada2282ff78192750dcd353a0e83dbd19`

## 3. Fecha

2026-07-29T00:09:24.781Z (UTC)

## 4. Hashes SHA-256 iniciales y finales

| Archivo | Inicial | Final | ¿Idéntico? |
|---------|---------|-------|------------|
| `src/data/products.json` | `af00a7b7e17cd13859e6920ed06b4d2ef0dcae483686940f2d4c3062dee4f854` | `af00a7b7e17cd13859e6920ed06b4d2ef0dcae483686940f2d4c3062dee4f854` | sí |
| `src/data/hotspots.json` | `0c41d711220a5815ffa6f63456b4f18f63ec916339bf767c2c466eab869f7d78` | `0c41d711220a5815ffa6f63456b4f18f63ec916339bf767c2c466eab869f7d78` | sí |
| `src/data/catalog-pages.json` | `b0db84cad60d6e06d65392112935f208870be156c2f415105b443a93871fe34c` | `b0db84cad60d6e06d65392112935f208870be156c2f415105b443a93871fe34c` | sí |

## 5. Confirmación de datos intactos

No se modificó `products.json`, `hotspots.json` ni `catalog-pages.json`. No se ejecutó `review:apply --confirm`.

## 6. Resumen ejecutivo

Plan documental atómico para páginas **61, 109, 174, 198**. Las propuestas previas del PR #15 se re-verificaron contra `main` (post PR #16) y la tipografía PDF; se corrigieron omisiones (p. ej. filas inferiores de p61) y se rechazó la división 30/22/43 de p174.

| Página | Status | Confianza | HS antes → después | Creates | Deletes | Reassign/move/resize |
|--------|--------|-----------|--------------------|---------|---------|----------------------|
| 61 | confirmed-plan | high | 6 → 13 | 7 | 0 | 6 |
| 109 | confirmed-plan | high | 4 → 4 | 1 | 1 | 3 |
| 174 | confirmed-plan | medium | 5 → 5 | 1 | 1 | 4 |
| 198 | confirmed-plan | high | 3 → 3 | 0 | 0 | 3 |

## Página 61

### Inventario / matriz

| código | región | productId | code | SKU name | HS actual | productId actual | coords act. | refs | situación | acción | HS final | productId final | coords finales | confianza |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1053 | fila-sup-col1 | 1053 | 1053 | — | hotspot-61 | 61 | 2,8,31,28 | 0 | hotspot-en-region-con-productId-ajeno | reassign-product+resize | hotspot-61 | 1053 | 2,5,23,26 | high |
| 1153 | fila-sup-col2 | 1153 | 1153 | — | hotspot-1453 | 1142 | 35,8,31,28 | 0 | hotspot-en-region-con-productId-ajeno | reassign-product+resize | hotspot-1453 | 1153 | 26,5,23,26 | high |
| 1253 | fila-sup-col3 | 61 | 61 | 1253 | hotspot-61 | 61 | 2,8,31,28 | 1 | tiene-hotspot-posiblemente-mal-ubicado | create-hotspot | hotspot-1253-p61 | 61 | 50,5,23,26 | high |
| 1453 | fila-sup-col4 | 1453 | 1453 | — | hotspot-1042 | 1042 | 68,8,30,28 | 0 | hotspot-en-region-con-productId-ajeno | create-hotspot | hotspot-1453-p61 | 1453 | 74,5,24,26 | high |
| 1042 | fila-mid-col1 | 1042 | 1042 | — | hotspot-1142 | 1142 | 2,39,31,28 | 1 | hotspot-en-region-con-productId-ajeno | move+resize | hotspot-1042 | 1042 | 2,32,31,20 | high |
| 1142 | fila-mid-col2 | 1142 | 1142 | — | hotspot-1242 | 1242 | 35,39,31,28 | 2 | hotspot-en-region-con-productId-ajeno | move+resize | hotspot-1142 | 1142 | 35,32,31,20 | high |
| 1242 | fila-mid-col3 | 1242 | 1242 | — | hotspot-10137 | 10137 | 68,39,30,28 | 1 | hotspot-en-region-con-productId-ajeno | move+resize | hotspot-1242 | 1242 | 68,32,30,20 | high |
| 10137 | fila-power-col1 | 10137 | 10137 | — | hotspot-10137 | 10137 | 68,39,30,28 | 1 | tiene-hotspot-posiblemente-mal-ubicado | move+resize | hotspot-10137 | 10137 | 2,53,31,22 | high |
| 11137 | fila-power-col2 | 11137 | 11137 | — | — | — | — | 0 | sin-hotspot | create-hotspot | hotspot-11137-p61 | 11137 | 35,53,31,22 | high |
| 12137 | fila-power-col3 | 12137 | 12137 | — | — | — | — | 0 | sin-hotspot | create-hotspot | hotspot-12137-p61 | 12137 | 68,53,30,22 | high |
| 10138 | fila-cotton-col1 | 10138 | 10138 | — | — | — | — | 0 | sin-hotspot | create-hotspot | hotspot-10138-p61 | 10138 | 2,76,31,22 | high |
| 11138 | fila-cotton-col2 | 11138 | 11138 | — | — | — | — | 0 | sin-hotspot | create-hotspot | hotspot-11138-p61 | 11138 | 35,76,31,22 | high |
| 12138 | fila-cotton-col3 | 12138 | 12138 | — | — | — | — | 0 | sin-hotspot | create-hotspot | hotspot-12138-p61 | 12138 | 68,76,30,22 | high |

### Hotspots actuales

Ver overlay `p61-current-full-map.jpg`.

### Problemas encontrados

- 13 fichas comerciales distintas (no fotos del mismo código).
- productId 61 representa SKU tipográfico 1253 (name prefix).
- Propuesta anterior incompleta: omitía 11137/12137/10138/11138/12138 — corregida aquí.

### Operaciones propuestas (secuencia atómica)

1. **reassign-product** `hotspot-61` — Cubre ficha 1053; el productId folio 61 debe migrar a la ficha 1253 vía create. (riesgo: low; reversible: true)
2. **reassign-product** `hotspot-1453` — Región visual de 1153 en fila superior col2. (riesgo: low; reversible: true)
3. **create-hotspot** `hotspot-1253-p61` — Ficha impresa 1253; productId comercial = 61 (SKU en name). (riesgo: low; reversible: true)
4. **create-hotspot** `hotspot-1453-p61` — Cuarta columna superior sin cobertura correcta (huérfano Batch E). (riesgo: low; reversible: true)
5. **move** `hotspot-1042` — Tras redibujo 4-col, 1042 ocupa fila intermedia col1. (riesgo: low; reversible: true)
6. **move** `hotspot-1142` — Alinear a ficha 1142 intermedia. (riesgo: low; reversible: true)
7. **move** `hotspot-1242` — Alinear a ficha 1242 intermedia. (riesgo: low; reversible: true)
8. **move** `hotspot-10137` — Fila POWER COLOR col1 según tipografía PDF y=70.9%. (riesgo: low; reversible: true)
9. **create-hotspot** `hotspot-11137-p61` — Ficha 11137 sin hotspot. (riesgo: low; reversible: true)
10. **create-hotspot** `hotspot-12137-p61` — Ficha 12137 sin hotspot. (riesgo: low; reversible: true)
11. **create-hotspot** `hotspot-10138-p61` — Ficha 10138 EVERYDAY COTTON sin hotspot. (riesgo: low; reversible: true)
12. **create-hotspot** `hotspot-11138-p61` — Ficha 11138 sin hotspot. (riesgo: low; reversible: true)
13. **create-hotspot** `hotspot-12138-p61` — Ficha 12138 sin hotspot. (riesgo: low; reversible: true)

### Coordenadas finales

| hotspotId | productId | printed | x | y | w | h | acción |
|---|---|---|--:|--:|--:|--:|---|
| hotspot-61 | 1053 | 1053 | 2 | 5 | 23 | 26 | reassign-product+resize |
| hotspot-1453 | 1153 | 1153 | 26 | 5 | 23 | 26 | reassign-product+resize |
| hotspot-1253-p61 | 61 | 1253 | 50 | 5 | 23 | 26 | create-hotspot |
| hotspot-1453-p61 | 1453 | 1453 | 74 | 5 | 24 | 26 | create-hotspot |
| hotspot-1042 | 1042 | 1042 | 2 | 32 | 31 | 20 | move+resize |
| hotspot-1142 | 1142 | 1142 | 35 | 32 | 31 | 20 | move+resize |
| hotspot-1242 | 1242 | 1242 | 68 | 32 | 30 | 20 | move+resize |
| hotspot-10137 | 10137 | 10137 | 2 | 53 | 31 | 22 | move+resize |
| hotspot-11137-p61 | 11137 | 11137 | 35 | 53 | 31 | 22 | create-hotspot |
| hotspot-12137-p61 | 12137 | 12137 | 68 | 53 | 30 | 22 | create-hotspot |
| hotspot-10138-p61 | 10138 | 10138 | 2 | 76 | 31 | 22 | create-hotspot |
| hotspot-11138-p61 | 11138 | 11138 | 35 | 76 | 31 | 22 | create-hotspot |
| hotspot-12138-p61 | 12138 | 12138 | 68 | 76 | 30 | 22 | create-hotspot |

### Totales

- Hotspots antes/después: **6 → 13**
- Productos cubiertos antes: 10137, 1042, 1142, 1242, 61
- Productos cubiertos después: 10137, 10138, 1042, 1053, 11137, 11138, 1142, 1153, 12137, 12138, 1242, 1453, 61
- Sin hotspot antes (dentro del inventario): 11137, 12137, 10138, 11138, 12138
- Sin hotspot después: ninguno
- Duplicados antes: 1142
- Duplicados después: ninguno
- Solapamientos antes: 0
- Solapamientos después: 0
- Preguntas bloqueantes: ninguna
- Confianza: **high** — status **confirmed-plan**

### Evidencia visual

- `batch-e-class-b-redraw-plan/p61-current-full-map.jpg`
- `batch-e-class-b-redraw-plan/p61-proposed-full-map.jpg`
- `batch-e-class-b-redraw-plan/p61-compare.jpg`

## Página 109

### Inventario / matriz

| código | región | productId | code | SKU name | HS actual | productId actual | coords act. | refs | situación | acción | HS final | productId final | coords finales | confianza |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 101 | bloque-superior-completo | 109 | 109 | 101 | hotspot-109 | 109 | 2,8,47,38 | 1 | 109 correcto en TL; TR (hotspot-161-p109) invade foto de 101 | resize+consolidate | hotspot-109 | 109 | 2,5,96,42 | high |
| 108 | bloque-izq-medio | 108-p109 | 108 | — | hotspot-108-p109 | 108-p109 | 2,50,47,42 | 1 | hotspot demasiado alto invade 107 | resize | hotspot-108-p109 | 108-p109 | 2,50,47,22 | high |
| 107 | bloque-izq-inferior | 107-p109 | 107 | — | — | — | — | 0 | sin hotspot propio; región cubierta por 108 | create-hotspot | hotspot-107-p109-2 | 107-p109 | 2,74,47,24 | high |
| 161 | columna-derecha | 161-p109 | 161 | — | hotspot-161-p109, hotspot-107-p109 | 161-p109 | 51,8,47,38 | 2 | dos hotspots con productId 161-p109; solo BR es válido | resize | hotspot-107-p109 | 161-p109 | 51,50,47,48 | high |

### Hotspots actuales

Ver overlay `p109-current-full-map.jpg`.

### Problemas encontrados

- hotspot-161-p109 y hotspot-107-p109 NO son dos zonas válidas de 161: el primero está sobre 101.
- Se elimina hotspot-161-p109; se conserva hotspot-107-p109 → 161-p109.
- Se crea hotspot-107-p109-2 (no reutilizar id ocupado).
- Solapamiento menor 101/161 en esquina superior-derecha de columna: frontera y=50 alineada al inicio visual de 161; revisar overlay.

### Operaciones propuestas (secuencia atómica)

1. **resize** `hotspot-109` — 101 es una sola ficha comercial con varias fotografías (negro/nude/blanco). Un hotspot cubre el bloque superior completo (regla A). (riesgo: medium; reversible: true)
2. **delete-redundant-hotspot** `hotspot-161-p109` — NO es una segunda zona válida de 161: cubre la foto nude del corpiño 101. Duplicación incorrecta respecto de hotspot-107-p109 (que sí es 161). (riesgo: low; reversible: true)
3. **resize** `hotspot-108-p109` — Reducir altura para no invadir ficha 107 (texto PDF 108@y72 / 107@y97). (riesgo: low; reversible: true)
4. **create-hotspot** `hotspot-107-p109-2` — ID hotspot-107-p109 ya existe apuntando a 161-p109; se crea sufijo -2 para 107 sin colisión. (riesgo: low; reversible: true)
5. **resize** `hotspot-107-p109` — Conservar columna derecha de 161 (foto principal + insets); productId ya correcto. (riesgo: low; reversible: true)

### Coordenadas finales

| hotspotId | productId | printed | x | y | w | h | acción |
|---|---|---|--:|--:|--:|--:|---|
| hotspot-109 | 109 | 101 | 2 | 5 | 96 | 42 | resize+consolidate |
| hotspot-108-p109 | 108-p109 | 108 | 2 | 50 | 47 | 22 | resize |
| hotspot-107-p109-2 | 107-p109 | 107 | 2 | 74 | 47 | 24 | create-hotspot |
| hotspot-107-p109 | 161-p109 | 161 | 51 | 50 | 47 | 48 | resize |

### Totales

- Hotspots antes/después: **4 → 4**
- Productos cubiertos antes: 108-p109, 109, 161-p109
- Productos cubiertos después: 107-p109, 108-p109, 109, 161-p109
- Sin hotspot antes (dentro del inventario): 107-p109
- Sin hotspot después: ninguno
- Duplicados antes: 161-p109
- Duplicados después: ninguno
- Solapamientos antes: 0
- Solapamientos después: 0
- Preguntas bloqueantes: ninguna
- Confianza: **high** — status **confirmed-plan**

### Evidencia visual

- `batch-e-class-b-redraw-plan/p109-current-full-map.jpg`
- `batch-e-class-b-redraw-plan/p109-proposed-full-map.jpg`
- `batch-e-class-b-redraw-plan/p109-compare.jpg`

## Página 174

### Inventario / matriz

| código | región | productId | code | SKU name | HS actual | productId actual | coords act. | refs | situación | acción | HS final | productId final | coords finales | confianza |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5245 | superior-izquierda | 174 | 174 | 5245 | hotspot-174 | 174 | 2,8,47,28 | 1 | presente | resize | hotspot-174 | 174 | 2,5,48,44 | medium |
| 3263 | superior-derecha | 3263 | 3263 | — | hotspot-3264, hotspot-3263 | 3263 | 51,8,47,28 | 2 | dos hotspots→3263; TR válido, mid-R incorrecto (buzo) | keep+resize | hotspot-3264 | 3263 | 52,5,46,44 | medium |
| 4288 | inferior-izquierda | 4288 | 4288 | — | hotspot-4288 | 4288 | 2,39,47,28 | 1 | presente | move+resize | hotspot-4288 | 4288 | 2,52,30,46 | high |
| 3266 | inferior-centro | 3266 | 3266 | — | hotspot-3266 | 3266 | 2,70,96,22 | 1 | hotspot full-width inferior invade 4288/3264 | move+resize | hotspot-3266 | 3266 | 33,52,34,46 | medium |
| 3264 | inferior-derecha | 3264 | 3264 | — | — | — | — | 0 | sin hotspot; absorbido por franja 3266 | create-hotspot | hotspot-3264-p174 | 3264 | 68,52,30,46 | medium |

### Hotspots actuales

Ver overlay `p174-current-full-map.jpg`.

### Problemas encontrados

- No se aprueba 30/22/43: tipografía fija anclas ≈30/34/30.
- hotspot-3263 (mid-right) no es zona válida de 3263 → delete.
- Outfit compartido superior/inferior: frontera por tipografía; riesgo de clic ambiguo documentado.

### Operaciones propuestas (secuencia atómica)

1. **resize** `hotspot-174` — Bloque superior izquierdo de ficha 5245 (productId folio 174). (riesgo: medium; reversible: true)
2. **fix-coordinates** `hotspot-3264` — Conservar id histórico hotspot-3264 con productId 3263 sobre bloque superior derecho + insets de palazzo. (riesgo: medium; reversible: true)
3. **delete-redundant-hotspot** `hotspot-3263` — Segundo hotspot con productId 3263 está sobre fotografías de buzo 3266 (no es zona válida de 3263). No consolidar: eliminar como incorrecto. (riesgo: low; reversible: true)
4. **move** `hotspot-4288` — Ficha inferior 4288 (camiseta 68); ancla tipográfica x≈1.2%. (riesgo: low; reversible: true)
5. **move** `hotspot-3266` — Dejar de cubrir franja completa; centrar en ficha 3266 (texto x≈33.5%). (riesgo: medium; reversible: true)
6. **create-hotspot** `hotspot-3264-p174` — Huérfano 3264; no reutilizar hotspot-3264 (ya es contenedor de 3263). (riesgo: low; reversible: true)

### Coordenadas finales

| hotspotId | productId | printed | x | y | w | h | acción |
|---|---|---|--:|--:|--:|--:|---|
| hotspot-174 | 174 | 5245 | 2 | 5 | 48 | 44 | resize |
| hotspot-3264 | 3263 | 3263 | 52 | 5 | 46 | 44 | keep+resize |
| hotspot-4288 | 4288 | 4288 | 2 | 52 | 30 | 46 | move+resize |
| hotspot-3266 | 3266 | 3266 | 33 | 52 | 34 | 46 | move+resize |
| hotspot-3264-p174 | 3264 | 3264 | 68 | 52 | 30 | 46 | create-hotspot |

### Totales

- Hotspots antes/después: **5 → 5**
- Productos cubiertos antes: 174, 3263, 3266, 4288
- Productos cubiertos después: 174, 3263, 3264, 3266, 4288
- Sin hotspot antes (dentro del inventario): 3264
- Sin hotspot después: ninguno
- Duplicados antes: 3263
- Duplicados después: ninguno
- Solapamientos antes: 0
- Solapamientos después: 0
- Preguntas bloqueantes: ninguna
- Confianza: **medium** — status **confirmed-plan**

### Evidencia visual

- `batch-e-class-b-redraw-plan/p174-current-full-map.jpg`
- `batch-e-class-b-redraw-plan/p174-proposed-full-map.jpg`
- `batch-e-class-b-redraw-plan/p174-compare.jpg`

## Página 198

### Inventario / matriz

| código | región | productId | code | SKU name | HS actual | productId actual | coords act. | refs | situación | acción | HS final | productId final | coords finales | confianza |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5123 | superior-izquierda | 198 | 198 | 5123 | hotspot-198 | 198 | 3,8,94,30 | 1 | hotspot full-width superior invade 5131 | resize | hotspot-198 | 198 | 2,5,48,42 | high |
| 5131 | superior-derecha | 5131 | 5131 | — | — | — | — | 0 | sin hotspot; id hotspot-5131 ocupado por 5086 | reassign-product+move | hotspot-5131 | 5131 | 52,5,46,42 | high |
| 5086 | franja-inferior-completa | 5086 | 5086 | — | hotspot-5131, hotspot-5086 | 5086 | 3,40,46,50 | 2 | dos zonas inferiores válidas del mismo producto | resize+consolidate | hotspot-5086 | 5086 | 2,50,96,48 | high |

### Hotspots actuales

Ver overlay `p198-current-full-map.jpg`.

### Problemas encontrados

- No crear hotspot-5131-p198: reutilizar hotspot-5131.
- Duplicado 5086 inferior = dos fotos de la misma ficha → consolidar (regla A), no eliminar por duplicar productId sin análisis.

### Operaciones propuestas (secuencia atómica)

1. **resize** `hotspot-198` — Dividir bloque superior: 5123 (productId 198) solo mitad izquierda (texto@x5.4). (riesgo: low; reversible: true)
2. **reassign-product** `hotspot-5131` — Reutilizar ID existente hotspot-5131 (hoy apunta a 5086 en inferior-izq). Mover a TR para 5131. No crear hotspot-5131-p198. (riesgo: low; reversible: true)
3. **consolidate-hotspots** `hotspot-5086` — Los dos hotspots inferiores actuales (hotspot-5131 y hotspot-5086) eran dos poses válidas de la MISMA ficha 5086 (regla A). Tras liberar hotspot-5131, se consolida en una zona inferior de ancho completo — técnicamente correcta para una ficha única. (riesgo: low; reversible: true)

### Coordenadas finales

| hotspotId | productId | printed | x | y | w | h | acción |
|---|---|---|--:|--:|--:|--:|---|
| hotspot-198 | 198 | 5123 | 2 | 5 | 48 | 42 | resize |
| hotspot-5131 | 5131 | 5131 | 52 | 5 | 46 | 42 | reassign-product+move |
| hotspot-5086 | 5086 | 5086 | 2 | 50 | 96 | 48 | resize+consolidate |

### Totales

- Hotspots antes/después: **3 → 3**
- Productos cubiertos antes: 198, 5086
- Productos cubiertos después: 198, 5086, 5131
- Sin hotspot antes (dentro del inventario): 5131
- Sin hotspot después: ninguno
- Duplicados antes: 5086
- Duplicados después: ninguno
- Solapamientos antes: 0
- Solapamientos después: 0
- Preguntas bloqueantes: ninguna
- Confianza: **high** — status **confirmed-plan**

### Evidencia visual

- `batch-e-class-b-redraw-plan/p198-current-full-map.jpg`
- `batch-e-class-b-redraw-plan/p198-proposed-full-map.jpg`
- `batch-e-class-b-redraw-plan/p198-compare.jpg`

## Riesgos globales

- p174/p198: outfits compartidos en una misma fotografía → fronteras por tipografía.
- p109: borde superior de columna 161 vs bloque 101 debe validarse visualmente en overlay.
- p61: grilla densa; verificar márgenes entre columnas en móvil.

## Validaciones

Ejecutar en el PR: `review:verify`, `review:apply` (sin `--confirm`), `validate:data`, `audit:catalog`, `lint`, `typecheck`, `test`, `build`.

## Confirmaciones

- No se ejecutó `--confirm`.
- No se modificaron JSON de datos.
- Este PR es solo documental; la aplicación requiere PR futuro tras aprobación visual humana por página.

## Recomendación para el futuro PR de aplicación

1. Aprobar o rechazar cada página de forma independiente mediante overlays.
2. Aplicar **una página completa por commit/PR atómico** usando exactamente `finalHotspots` de `redraw-plan.json`.
3. Orden sugerido: 198 → 109 → 61 → 174 (menor ambigüedad de outfit compartido al final).
4. Tras cada página: `validate:data`, `audit:catalog`, tests, revisión visual.
5. No mezclar con otras correcciones de hotspots.
