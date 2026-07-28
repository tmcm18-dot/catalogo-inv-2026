# Informe — Lote E: 12 productos sin hotspot

## 1. Rama

`review/catalog-batch-e-missing-hotspots`

## 2. Commit base

`369e7e9` — Merge pull request #14 from tmcm18-dot/fix/catalog-three-extraction-errors

PRs incorporados en `origin/main`: #11 (herramienta), #12 (piloto A), #13 (apply 12 reassign), #14 (4078 / 86-p152 / 757).

## 3. Commit final

`175ecfe` — review: preparar lote E de 12 hotspots faltantes (solo decisiones)

## 4. Estado base

| Métrica | Valor |
|---------|------:|
| Productos | 743 |
| Hotspots | 727 |
| Productos sin hotspot | 28 |
| MATCH | 241 |
| MISMATCH_HIGH | 174 |
| MISMATCH_MEDIUM | 83 |
| AMBIGUOUS | 64 |
| NOT_FOUND | 164 |
| SHARED_CODE | 1 |
| Pruebas | 89 passed |

## 5–14. Revisión de los 12 productos

### Hallazgo metodológico (crítico)

En **los 12 casos**, el código tipográfico del producto huérfano ya cae **dentro** de un hotspot existente cuyo `productId` apunta a **otro** producto (a menudo un id de folio o un SKU vecino mal enlazado tras el Lote A).

Por las reglas del lote E:

- no confirmar `create-hotspot` con **solapamiento mayor**;
- no marcar como confirmado un caso dudoso / inseguro para el visor.

Por eso **0** decisiones `confirmed-create-hotspot`. Las 12 quedaron `ambiguous` con:

- coordenadas comerciales **propuestas** (para un create futuro o para guiar un reassign);
- hotspot ocupante identificado;
- acción recomendada: **reassign / redibujar** el hotspot ocupante (no crear encima).

### Tabla resumen

| productId | página | hotspotId propuesto | x | y | width | height | estado | confianza |
|-----------|-------:|---------------------|--:|--:|------:|-------:|--------|-----------|
| 8237 | 8 | hotspot-8237-p8 | 51 | 8 | 47 | 38 | ambiguous | high |
| 152 | 15 | hotspot-152-p15 | 2 | 8 | 47 | 38 | ambiguous | high |
| 5836 | 38 | hotspot-5836-p38 | 2 | 8 | 47 | 38 | ambiguous | high |
| 4120 | 50 | hotspot-4120-p50 | 51 | 50 | 47 | 42 | ambiguous | high |
| 1453 | 61 | hotspot-1453-p61 | 74 | 8 | 24 | 28 | ambiguous | high |
| 2053 | 81 | hotspot-2053-p81 | 51 | 50 | 47 | 42 | ambiguous | high |
| 107-p109 | 109 | hotspot-107-p109-2 | 2 | 78 | 47 | 20 | ambiguous | high |
| 4078 | 121 | hotspot-4078-p121 | 51 | 8 | 47 | 38 | ambiguous | high |
| 86-p152 | 152 | hotspot-86-p152 | 51 | 8 | 47 | 38 | ambiguous | high |
| 3264 | 174 | hotspot-3264-p174 | 51 | 70 | 47 | 28 | ambiguous | high |
| 757 | 183 | hotspot-757-p183 | 51 | 8 | 47 | 38 | ambiguous | high |
| 5131 | 198 | hotspot-5131-p198 | 51 | 8 | 46 | 36 | ambiguous | high |

### Detalle por caso

| productId | code impreso | name | talles | colores | ocupante | solapamiento | evidencia |
|-----------|--------------|------|--------|---------|----------|--------------|-----------|
| 8237 | 8237 (TR) | Pack x 3 de cola less regulable de morley sin costura | S–XL | Blanco/Nude/Rosa/Gris/Negro/Verde | hotspot-8238→8238 | mayor (~celda TR completa) | `batch-e-evidence/p8-8237-proposed.jpg` |
| 152 | 152 (TL) | Pack x3 Cola less de morley… | Único | Blanco-Gris humo-Negro | hotspot-15→15 | mayor | `p15-152-proposed.jpg` |
| 5836 | 5836 (TL) | Conjunto de morley y puntilla | 85–100 | Blanco-celeste-negro | hotspot-38→38 | mayor | `p38-5836-proposed.jpg` |
| 4120 | 4120 (BR) | Conjunto de puntilla | 85–100 | Blanco-negro-nougat-rosa chicle | hotspot-50-p50→50-p50 | mayor | `p50-4120-proposed.jpg` |
| 1453 | 1453 (fila1 col4) | Pack x3 tangaless EVERYDAY | Único | Varios | hotspot-1042→1042 | mayor (grilla 3 vs 4 cols) | `p61-1453-proposed.jpg` |
| 2053 | 2053 (BR) | Body de algodón y lycra con puntilla | 85–100 | blanco-negro-nude | hotspot-81-p81→81-p81 | mayor | `p81-2053-proposed.jpg` |
| 107-p109 | 107 (BL inf.) | Pack x3 cola less supersoft… | S al XXL | Clásico B/N/Nude | hotspot-108-p109→108-p109 | mayor parcial; `hotspot-107-p109` ya existe (BR→161-p109) | `p109-107-p109-proposed.jpg` |
| 4078 | 4078/4078E (TR) | Pack x3 tangaless… bretel 20 mm | 1–4 | Varios | hotspot-4079→4079 | mayor | `p121-4078-proposed.jpg` |
| 86-p152 | 86 (TR) | Media pasión con liga… | Único | Blanco, Negro | hotspot-1053-p152→1053-p152 | mayor | `p152-86-p152-proposed.jpg` |
| 3264 | 3264 (BR inf.) | Pantalon jogging boyfriend de frisa | 1–3 | Vison-Negro | hotspot-3266→3266 (full-width) | mayor / bloque compartido 4288+3266+3264 | `p174-3264-proposed.jpg` |
| 757 | 757 (TR) | Conj. top alg y lycra est. c/bombacha | 12,18 | Rosa, Lila | hotspot-183-p183→183-p183 | mayor | `p183-757-proposed.jpg` |
| 5131 | 5131 (TR) | Bóxer algodón & lycra combinado | S–XXXL | Grey-Marino-Negro | hotspot-198→198 (+5086) | mayor; `hotspot-5131` ya existe (BL→5086) | `p198-5131-proposed.jpg` |

### Convenciones de hotspotId

- Patrón `hotspot-<productId>-p<page>` cuando el id simple ya existe apuntando a otro producto.
- `107-p109` → propuesto `hotspot-107-p109-2` (existe `hotspot-107-p109`; se evita `…-p109-p109`).
- `86-p152` → propuesto `hotspot-86-p152` (id libre; sin duplicar página).

### Verificación de productos

Los 12 existen en `products.json`, página = tabla esperada, `price: null`, **0** hotspots con ese `productId`.

## 15. Evidencia visual

Recortes anotados en `reports/catalog-review/batch-e-evidence/` (rectángulo propuesto + metadatos). Fuente primaria: JPG de página + capa de texto PDF.

## 16. Solapamientos

Todos los casos tienen **solapamiento mayor** con un hotspot vecino/ocupante. Ninguno se consideró “menor por imagen compartida” suficiente para confirmar create sin redibujar primero al ocupante.

## 17. `review:verify`

- Decisiones: 12  
- Errores: **0**  
- Advertencias: 0  

## 18. Dry-run `review:apply` (sin `--confirm`)

- Cambios: **0**  
- Omitidos: **12** (`mark-ambiguous` no aplicable)  
- Errores: **0**  
- Diff previsto de datos: vacío  

## 19. Hashes SHA-256

| Archivo | Inicial (= final) |
|---------|-------------------|
| `products.json` | `AF00A7B7E17CD13859E6920ED06B4D2EF0DCAE483686940F2D4C3062DEE4F854` |
| `hotspots.json` | `FDBC9E656B2340466CDAE83DDDE248143C3434152676FFE099D9592345B9DD81` |
| `catalog-pages.json` | `B0DB84CAD60D6E06D65392112935F208870BE156C2F415105B443A93871FE34C` |

## 20. Confirmación: datos no modificados

`git diff` vacío en `products.json`, `hotspots.json`, `catalog-pages.json`. No se ejecutó `--confirm`.

## 21–22. Casos no confirmados

**12/12** → `ambiguous`. Motivo exacto por caso: ver tabla “ocupante / solapamiento”. Siguiente lote recomendado: **reassign** de hotspots ocupantes (y redibujo de p61 / p174 / p198), no create apilado.

## Conteos de decisión

| Estado | Cantidad |
|--------|--------:|
| confirmed-create-hotspot | 0 |
| ambiguous | 12 |
| needs-manual-source | 0 |
| rejected | 0 |

## Archivos del PR

- `reports/catalog-review/confirmed-decisions.json`
- `reports/catalog-review/confirmed-decisions.csv`
- `reports/catalog-review/BATCH_E_MISSING_HOTSPOTS_REPORT.md`
- `reports/catalog-review/batch-e-evidence/*.jpg`
