# Informe — Tres errores de extracción de productos

## Commit base

`1aed820` — Merge pull request #13 from tmcm18-dot/fix/catalog-batch-a-high-pilot-apply

## Commit final

`2239483c877f9049c3be9c3b872988928c9f5b04` — fix: corregir tres errores de extraccion de productos

Rama: `fix/catalog-three-extraction-errors`

## Conteos base (antes de modificar)

| Métrica | Valor |
|---------|-------|
| Productos | 743 |
| Hotspots | 727 |
| Productos sin hotspot | 28 |
| Pruebas | 89 |

## Hashes SHA-256

| Archivo | Inicial (HEAD) | Final |
|---------|----------------|-------|
| `products.json` | `6839D0FDF9ADFF88EF96DAF194CDE64A8E4FA4692F8CA1C9F5DE3C89AF6E2DB6` | `AF00A7B7E17CD13859E6920ED06B4D2EF0DCAE483686940F2D4C3062DEE4F854` |
| `hotspots.json` | `FDBC9E656B2340466CDAE83DDDE248143C3434152676FFE099D9592345B9DD81` | `FDBC9E656B2340466CDAE83DDDE248143C3434152676FFE099D9592345B9DD81` |
| `catalog-pages.json` | `B0DB84CAD60D6E06D65392112935F208870BE156C2F415105B443A93871FE34C` | `B0DB84CAD60D6E06D65392112935F208870BE156C2F415105B443A93871FE34C` |

## Caso 121 → 4078

1. **Original:** id/code `121`; name/description `4078 Pack x 3 tangaless regulable de algodón y lycra bretel de 20 mm`; page 121; brand Takki; category Corsetería; sizes `1,2,3,4`; colors `Varios`; price `null`.
2. **Página:** 121 (`public/assets/catalogo/pages/page-121.jpg`).
3. **Referencia visual:** cuadrante superior derecho de page-121.jpg.
4. **Código impreso:** **4078** (y variante tipográfica 4078E). El número 121 es solo el folio.
5. **Descripción observada:** Pack x 3 tangaless regulable de algodón y lycra bretel de 20 mm.
6. **Talle:** T: 1-2, 3-4 (conservado como array `1..4` alineado al registro previo / vecinos).
7. **Colores:** Varios.
8. **Coincidencias:** no existía productId/code `4078`. Vecinos: 4079, 4014, 4012.
9. **Decisión:** corregir id/code a `4078`; limpiar name/description quitando el prefijo numérico duplicado.
10. **Confianza:** alta (texto tipográfico legible en JPG).
11. **Valor final:** id `4078`, code `4078`, name/description sin prefijo `4078`, resto igual, price intacto.
12. **N/A** — modificado.

Hotspots que referenciaban `121`: **0** (tras PR #13, `hotspot-121` → `4079`).

## Caso 152-p152 → 86-p152

1. **Original:** id `152-p152`; code `152`; name/description `86 Media pasión con liga de puntilla siliconada con Lycra`; page 152; brand Cocot; sizes `Único`; colors `Blanco, Negro`; price `null`.
2. **Página:** 152 (`page-152.jpg`).
3. **Referencia visual:** cuadrante superior derecho.
4. **Código impreso:** **86**. El 152 es el número de página.
5. **Descripción:** Media pasión con liga de puntilla siliconada con Lycra.
6. **Talle:** único.
7. **Colores:** Blanco y Negro.
8. **Coincidencias:** ya existen `86` y `86-p86` en página 86 (otros productos). Por convención: id `86-p152`.
9. **Decisión:** corregir a id `86-p152`, code `86`, name/description sin prefijo `86`.
10. **Confianza:** alta.
11. **Valor final:** id `86-p152`, code `86`, name limpio; price intacto.
12. **N/A**.

Hotspots que referenciaban `152-p152`: **0** (`hotspot-152-p152` → `76-p152` tras PR #13).

## Caso 183 → 757

1. **Original:** id/code `183`; name `757 Conj`; description `757 Conj. top alg y lycra est. c/bombacha`; page 183; brand Lencatex; sizes `12,18`; colors `Rosa, Lila R`; price `null`.
2. **Página:** 183 (`page-183.jpg`).
3. **Referencia visual:** cuadrante superior derecho.
4. **Código impreso:** **757**. El 183 es el folio.
5. **Descripción:** Conj. top alg y lycra est. c/bombacha.
6. **Talle:** 12 - 18 (conservado `["12","18"]` como vecinos de la página).
7. **Colores:** Rosa y Lila (se corrigió `Lila R` → `Lila`).
8. **Coincidencias:** no existía productId/code `757`.
9. **Decisión:** corregir id/code a `757`; name/description tipográficos; colors limpios.
10. **Confianza:** alta.
11. **Valor final:** id/code `757`; name/description sin prefijo; colors `Rosa`,`Lila`; price intacto.
12. **N/A**.

Hotspots que referenciaban `183`: **0** (`hotspot-183` → `905` tras PR #13).

Nota (fuera de alcance): `183-p183` sigue con code `183` y nombre “700 Conj” — candidato a limpieza posterior, no tocado aquí.

## Diff exacto (`products.json`)

Solo 3 registros (13 líneas − / 13 +):

- `121` → `4078` (+ name/description limpios)
- `152-p152` → `86-p152` (+ name/description limpios)
- `183` → `757` (+ name/description limpios; `Lila R` → `Lila`)

## Archivos modificados

- `src/data/products.json`
- `reports/catalog-review/THREE_EXTRACTION_ERRORS_REPORT.md`

## Confirmaciones

- No se crearon hotspots.
- `hotspots.json` diff vacío.
- `catalog-pages.json` diff vacío.
- No se eliminaron productos (743 → 743).
- Precios sin cambio (`null` = `null`).
- IDs únicos; todos los `productId` de hotspots existen.

## Validaciones

| Comando | Resultado |
|---------|-----------|
| validate:data | 0 errores |
| audit:catalog | OK |
| lint | 0 errores |
| typecheck | OK |
| test | 89 passed |
| build | OK |

## Audit antes / después (aprox. post-PR#13 → este fix)

| Métrica | Antes (post #13) | Después |
|---------|------------------|---------|
| Productos | 743 | 743 |
| Hotspots | 727 | 727 |
| Sin hotspot | 28 | 28 |
| MATCH | 242 | 241 |
| MISMATCH_HIGH | 172 | 174 |
| MISMATCH_MEDIUM | 86 | 83 |
| AMBIGUOUS | 62 | 64 |
| NOT_FOUND | 164 | 164 |

Los tres siguen sin hotspot (esperado: este PR no crea hotspots). El siguiente paso natural es Lote E / MISSING_HOTSPOT para `4078`, `86-p152` y `757` en sus zonas TR.

## Casos pendientes

Ninguno de los tres quedó `needs-manual-source`: los tres se corrigieron con evidencia visual inequívoca.
