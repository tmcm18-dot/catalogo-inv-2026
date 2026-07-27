# Informe — Aplicación piloto Lote A (12 reasignaciones)

## 1. Rama

`fix/catalog-batch-a-high-pilot-apply`

## 2. Commit base

`0f4de82` — Merge pull request #12 from tmcm18-dot/review/catalog-batch-a-high-pilot

## 3. Commit final

Ver HEAD de esta rama tras el commit de aplicación.

## 4. Resultado del dry-run

```
=== DRY-RUN (sin escritura) ===
Cambios: 12
Omitidos: 3
Errores: 0
```

Tras el dry-run, `git diff` de `products.json`, `hotspots.json` y `catalog-pages.json` permaneció vacío.

## 5. Confirmación de `--confirm`

`--confirm` se ejecutó **únicamente después** del dry-run correcto (12/3/0).

```
=== APPLY --confirm ===
Cambios: 12
Omitidos: 3
Errores: 0
Backup: reports/catalog-review/backups/20260727T193755Z
```

## 6–7. Lista exacta de los 12 cambios aplicados

| # | hotspotId | productId anterior | productId nuevo |
|---|-----------|--------------------|-----------------|
| 1 | hotspot-8237 | 8237 | 8239 |
| 2 | hotspot-152 | 152 | 116 |
| 3 | hotspot-5836 | 5836 | 1738 |
| 4 | hotspot-4120 | 4120 | 4193 |
| 5 | hotspot-1453 | 1453 | 1142 |
| 6 | hotspot-2053 | 2053 | 2055 |
| 7 | hotspot-107-p109 | 107-p109 | 161-p109 |
| 8 | hotspot-121 | 121 | 4079 |
| 9 | hotspot-152-p152 | 152-p152 | 76-p152 |
| 10 | hotspot-3264 | 3264 | 3263 |
| 11 | hotspot-183 | 183 | 905 |
| 12 | hotspot-5131 | 5131 | 5086 |

## 8. Los 3 casos omitidos

| caseId | Motivo |
|--------|--------|
| `hs:hotspot-93:MISMATCH_HIGH` | mark-ambiguous |
| `hs:hotspot-103-p138:MISMATCH_HIGH` | mark-ambiguous |
| `hs:hotspot-10100-p211:MISMATCH_HIGH` | needs-manual-source |

## 9. Diff exacto de `hotspots.json`

12 líneas `-productId` / 12 líneas `+productId` (numstat `12 12`). Fragmento representativo:

```diff
-    "productId": "8237",
+    "productId": "8239",
...
-    "productId": "152",
+    "productId": "116",
...
-    "productId": "5836",
+    "productId": "1738",
...
-    "productId": "4120",
+    "productId": "4193",
...
-    "productId": "1453",
+    "productId": "1142",
...
-    "productId": "2053",
+    "productId": "2055",
...
-    "productId": "107-p109",
+    "productId": "161-p109",
...
-    "productId": "121",
+    "productId": "4079",
...
-    "productId": "152-p152",
+    "productId": "76-p152",
...
-    "productId": "3264",
+    "productId": "3263",
...
-    "productId": "183",
+    "productId": "905",
...
-    "productId": "5131",
+    "productId": "5086",
```

Copia local del diff: `reports/catalog-review/pilot-evidence/hotspots-apply.diff` (no versionada si es temporal; el cambio sustantivo está en `src/data/hotspots.json`).

## 10. Coordenadas intactas

Verificación programática: en los 12 hotspots, `page`, `x`, `y`, `width`, `height` e `id` idénticos. Campos distintos de `productId` sin cambios. Conteo de hotspots: 727 → 727. `unexpected: []`.

## 11. `products.json`

Sin cambios de contenido. Diff vacío. Hash final = hash inicial.

## 12. `catalog-pages.json`

Sin cambios. Diff vacío. Hash final = hash inicial.

## 13. Hashes SHA-256

| Archivo | Inicial | Final |
|---------|---------|-------|
| `products.json` | `6839D0FDF9ADFF88EF96DAF194CDE64A8E4FA4692F8CA1C9F5DE3C89AF6E2DB6` | `6839D0FDF9ADFF88EF96DAF194CDE64A8E4FA4692F8CA1C9F5DE3C89AF6E2DB6` |
| `hotspots.json` | `8AA7C07F1F02B5828F55BAC82DC82D63B88B9A1B78A9C8FB25B605C0EAE51CAA` | `AF8B131FF3AB52D2F82057447274C55867245A69C0827B5EE71380D622F4F6B0` |
| `catalog-pages.json` | `B0DB84CAD60D6E06D65392112935F208870BE156C2F415105B443A93871FE34C` | `B0DB84CAD60D6E06D65392112935F208870BE156C2F415105B443A93871FE34C` |

## 14. Audit antes / después

| Métrica | Antes | Después |
|---------|-------|---------|
| MATCH | 230 | 242 |
| MISMATCH_HIGH | 184 | 172 |
| MISMATCH_MEDIUM | 86 | 86 |
| AMBIGUOUS | 62 | 62 |
| NOT_FOUND | 164 | 164 |
| Productos sin hotspot (warn) | 16 | 28 |

Δ MISMATCH_HIGH: **−12**. Δ MATCH: **+12**. El aumento de productos sin hotspot es efecto esperado al reasignar hotspots que eran el único enlace de esos productId.

## 15. Validaciones

| Comando | Resultado |
|---------|-----------|
| `validate:data` | ERRORES: 0 |
| `audit:catalog` | OK |
| `lint` | 0 errores (2 warnings preexistentes `no-img-element`) |
| `typecheck` | OK |
| `test` | 89 passed |
| `build` | OK |

## 16. Total final de pruebas

**89** (sin reducción).

## Restricciones respetadas

No se modificaron precios, talles, colores, nombres, descripciones, marcas, categorías, WhatsApp, carrito, diseño, zoom, pinch, swipe, caché, precarga ni configuración de Vercel. Solo `productId` en 12 hotspots.
