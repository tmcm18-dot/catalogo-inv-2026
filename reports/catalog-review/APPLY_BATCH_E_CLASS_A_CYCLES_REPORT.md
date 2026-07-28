# Informe â€” AplicaciÃ³n ciclos Clase A del Lote E

## 1. Rama

`fix/catalog-batch-e-class-a-cycles`

## 2. Commit base

`951c2bb8ff90424c4673dd106ecb67d300878d9a` â€” Merge pull request #15 from tmcm18-dot/review/catalog-batch-e-missing-hotspots

## 3. Commit de aplicaciÃ³n de datos

`60938a6f433f398ffbe2a6d914df1b71c8f5459d` — fix: aplicar ciclos confirmados del lote E clase A

## 4. Commit final del PR

*(se completa tras el commit documental)*

## 5. Fecha

2026-07-28 (America/Argentina)

## 6â€“8. PÃ¡ginas

| Tipo | PÃ¡ginas |
|------|---------|
| Permitidas / evaluadas | 8, 15, 38, 50, 81, 121, 152, 183 |
| **Aplicadas** | **8, 15, 38, 50, 81, 121, 152, 183** |
| Omitidas | *(ninguna)* |
| Prohibidas Clase B (intactas) | 61, 109, 174, 198 |

Fuente: `reports/catalog-review/batch-e-mapping/occupant-mapping.json` + `BATCH_E_OCCUPANT_MAPPING_REPORT.md` (fusionados vÃ­a PR #15).

## 9. Ciclos completos

**SÃ­.** Cada pÃ¡gina Clase A se aplicÃ³ como ciclo Ã­ntegro de `reassign` documentado (sin reassign aislado, sin create, sin cambio de coordenadas).

## 10. Tabla completa de cambios

| pÃ¡gina | hotspotId | productId anterior | productId nuevo | cÃ³digo comercial (products.code) | ciclo (movimientos) |
|-------:|-----------|--------------------|-----------------|----------------------------------|--------------------:|
| 8 | hotspot-8238 | 8238 | 8237 | 8237 | 2 |
| 8 | hotspot-8239 | 8239 | 8238 | 8238 | 2 |
| 15 | hotspot-15 | 15 | 152 | 152 | 3 |
| 15 | hotspot-116 | 116 | 117 | 117 | 3 |
| 15 | hotspot-117 | 117 | 15 | 15 *(name=114â€¦)* | 3 |
| 38 | hotspot-38 | 38 | 5836 | 5836 | 3 |
| 38 | hotspot-1738 | 1738 | 7905 | 7905 | 3 |
| 38 | hotspot-7905 | 7905 | 38 | 38 *(name=1730â€¦)* | 3 |
| 50 | hotspot-50 | 50 | 50-p50 | 50 *(name=4385â€¦)* | 3 |
| 50 | hotspot-4193 | 4193 | 50 | 50 *(name=4115â€¦)* | 3 |
| 50 | hotspot-50-p50 | 50-p50 | 4120 | 4120 | 3 |
| 81 | hotspot-81 | 81 | 81-p81 | 81 *(name=1076â€¦)* | 3 |
| 81 | hotspot-2055 | 2055 | 81 | 81 *(name=2092â€¦)* | 3 |
| 81 | hotspot-81-p81 | 81-p81 | 2053 | 2053 | 3 |
| 121 | hotspot-4079 | 4079 | 4078 | 4078 | 1 |
| 152 | hotspot-1053-p152 | 1053-p152 | 86-p152 | 86 | 3 |
| 152 | hotspot-76-p152 | 76-p152 | 1002-p152 | 152 *(name=1002â€¦)* | 3 |
| 152 | hotspot-1002-p152 | 1002-p152 | 1053-p152 | 1053 | 3 |
| 183 | hotspot-183-p183 | 183-p183 | 757 | 757 | 3 |
| 183 | hotspot-759 | 759 | 183-p183 | 183 *(name=700â€¦)* | 3 |
| 183 | hotspot-905 | 905 | 759 | 759 | 3 |

Keeps documentados (sin cambio de productId): p8 `hotspot-8236`/`hotspot-8237`; p15 `hotspot-152`; p38 `hotspot-5836`; p50 `hotspot-4120`; p81 `hotspot-2053`; p121 `hotspot-121`/`4014`/`4012`; p152 `hotspot-152-p152`; p183 `hotspot-183`.

## 11â€“14. Conteos

| MÃ©trica | Antes | DespuÃ©s |
|---------|------:|--------:|
| Hotspots modificados | â€” | **21** |
| Hotspots totales | 727 | 727 |
| Productos totales | 743 | 743 |
| Productos sin hotspot | 28 | **20** |
| Ciclos | â€” | **8** |

## 15â€“16. HuÃ©rfanos y duplicados

- **HuÃ©rfanos nuevos causados por este PR:** **ninguno** (`[]`).
- **HuÃ©rfanos resueltos (los 8 targets Clase A):** `8237`, `152`, `5836`, `4120`, `2053`, `4078`, `86-p152`, `757`.
- **Duplicados inesperados:** **ninguno**.

## 17. Dry-run

- Errores: **0**
- Ciclos incompletos: **0**
- Hotspots inexistentes: **0**
- productId nuevos inexistentes: **0**
- PÃ¡ginas prohibidas afectadas: **0**
- Cambios de coordenadas: **0**
- HuÃ©rfanos comerciales del ciclo: **0**
- Duplicados inesperados: **0**
- Escritura en dry-run: **no** (hashes de los 3 JSON intactos)

Artefacto: `reports/catalog-review/batch-e-class-a-dry-run.json` *(local; no versionado)*.

## 18â€“21. AplicaciÃ³n

- AplicaciÃ³n controlada con `--confirm` vÃ­a script temporal.
- `unexpectedChanges: []`
- Solo cambiÃ³ `productId` (diff de `hotspots.json`: 21 lÃ­neas âˆ’ / 21 +).
- Coordenadas / id / page / width / height: **intactos**.
- No se crearon ni eliminaron hotspots.

## 22â€“23. AuditorÃ­a documental

| ClasificaciÃ³n | Antes | DespuÃ©s | Î” |
|---------------|------:|--------:|--:|
| MATCH | 241 | 252 | +11 |
| MISMATCH_HIGH | 174 | 163 | âˆ’11 |
| MISMATCH_MEDIUM | 83 | 83 | 0 |
| AMBIGUOUS | 64 | 64 | 0 |
| NOT_FOUND | 164 | 164 | 0 |
| SHARED_CODE | 1 | 1 | 0 |
| MISSING_HOTSPOT | 28 | 20 | âˆ’8 |

### Transiciones HIGH â†’ MATCH (11)

Causa: el `productId` quedÃ³ alineado con el cÃ³digo tipogrÃ¡fico detectado en la regiÃ³n.

| pÃ¡gina | hotspotId | antes â†’ despuÃ©s |
|-------:|-----------|-----------------|
| 8 | hotspot-8238 | MISMATCH_HIGH â†’ MATCH |
| 15 | hotspot-15 | MISMATCH_HIGH â†’ MATCH |
| 15 | hotspot-116 | MISMATCH_HIGH â†’ MATCH |
| 38 | hotspot-38 | MISMATCH_HIGH â†’ MATCH |
| 38 | hotspot-1738 | MISMATCH_HIGH â†’ MATCH |
| 50 | hotspot-50-p50 | MISMATCH_HIGH â†’ MATCH |
| 81 | hotspot-81-p81 | MISMATCH_HIGH â†’ MATCH |
| 121 | hotspot-4079 | MISMATCH_HIGH â†’ MATCH |
| 152 | hotspot-1053-p152 | MISMATCH_HIGH â†’ MATCH |
| 152 | hotspot-1002-p152 | MISMATCH_HIGH â†’ MATCH |
| 183 | hotspot-183-p183 | MISMATCH_HIGH â†’ MATCH |

### Cambios de productId sin cambio de clase (esperable)

Varios eslabones del ciclo usan registros â€œfolioâ€ cuyo `products.code` aÃºn no coincide con el tipogrÃ¡fico (deuda de extracciÃ³n documentada en PR #15). El hotspot queda en el producto comercial correcto del mapeo, pero el auditor sigue viendo `code` â‰  impreso â†’ MEDIUM / AMBIGUOUS / NOT_FOUND sin empeorar conteos netos.

Ejemplos: `hotspot-117`â†’`15` (impreso 114), `hotspot-81`â†’`81-p81` (impreso 1076), `hotspot-76-p152`â†’`1002-p152` (code 152 / name 1002).

No hubo transiciones de clasificaciÃ³n en hotspots no tocados de las pÃ¡ginas Clase A.

## 24. Hashes SHA-256

| Archivo | Inicial | Final |
|---------|---------|-------|
| `products.json` | `AF00A7B7E17CD13859E6920ED06B4D2EF0DCAE483686940F2D4C3062DEE4F854` | **igual** |
| `catalog-pages.json` | `B0DB84CAD60D6E06D65392112935F208870BE156C2F415105B443A93871FE34C` | **igual** |
| `hotspots.json` | `FDBC9E656B2340466CDAE83DDDE248143C3434152676FFE099D9592345B9DD81` | `0C41D711220A5815FFA6F63456B4F18F63EC916339BF767C2C466EAB869F7D78` |

## 25â€“27. Validaciones

| Comando | Exit | Resultado |
|---------|-----:|-----------|
| validate:data | 0 | ERRORES 0; advertencias 208 (antes 224; bajan por menos productos sin hotspot) |
| audit:catalog | 0 | OK (conteos arriba) |
| lint | 0 | 0 errores; warnings preexistentes `@next/next/no-img-element` en CatalogApp |
| typecheck | 0 | OK |
| test | 0 | **89** passed |
| build | 0 | OK |

## 28â€“32. Confirmaciones

- `products.json` no cambiÃ³ (hash idÃ©ntico).
- `catalog-pages.json` no cambiÃ³ (hash idÃ©ntico).
- PÃ¡ginas **61, 109, 174, 198** no modificadas.
- No se crearon ni eliminaron hotspots (727 = 727).
- No se modificaron precios, talles, colores, WhatsApp, carrito, diseÃ±o, gestos, cachÃ©, precarga ni Vercel.
- PR en Draft; **no fusionado**.
