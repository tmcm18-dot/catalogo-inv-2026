# Informe — Lote E: mapeo de hotspots ocupantes y permutaciones

## Meta

- Rama: `review/catalog-batch-e-missing-hotspots`
- PR: #15 (Draft)
- Generado: 2026-07-28T15:11:22.314Z
- Datos: **sin modificar** (`products.json` / `hotspots.json` / `catalog-pages.json`)
- `review:apply --confirm`: **no ejecutado**
- Evidencia nueva: `reports/catalog-review/batch-e-mapping/` + `occupant-mapping.json`
- Evidencia previa del PR (recortes por caso): `reports/catalog-review/batch-e-evidence/` (**conservada**)

## Resumen ejecutivo

| Clase | Páginas | Confirmable ahora |
|---|---|---|
| A — ciclo/reassign completo sin huérfanos comerciales | 8, 15, 38, 50, 81, 121, 152, 183 | **Sí** (futuro PR de apply) |
| B — redibujo obligatorio | 61, 109, 174, 198 | **No** |

**Clave:** varios `productId` iguales al número de página **no están vacíos**: el SKU real está en el prefijo del `name` (p. ej. producto `15` = comercial **114**, `38` = **1730**, `50` = **4115**, `50-p50` = **4385**, `81` = **2092**, `81-p81` = **1076**, `183-p183` = **700**, `198` = **5123**, `61` = **1253**, `109` = **101**, `174` = **5245**). Por eso un reassign aislado suele ser incorrecto: hay que cerrar el ciclo usando esos registros.

## Tabla maestra (12 páginas)

| pág | huérfano | patrón | confirmable | confianza | huérfanos tras plan | evidencia |
|---:|---|---|---|---|---|---|
| 8 | 8237 | cycle-2 on TR/BL + BR keep (no folio debt) | sí | high | — | `p8-*.jpg` |
| 15 | 152 | cycle-3 + folio-id product 15 represents printed 114 | sí | high | — | `p15-*.jpg` |
| 38 | 5836 | cycle-3; product 38 represents printed 1730 | sí | high | — | `p38-*.jpg` |
| 50 | 4120 | cycle-3; 50=4115, 50-p50=4385 | sí | high | — | `p50-*.jpg` |
| 61 | 1453 | top row 4 SKUs / 3 hotspots; product 61 = printed 1253 | no | high | — | `p61-*.jpg` |
| 81 | 2053 | cycle-3; 81=2092, 81-p81=1076 | sí | high | — | `p81-*.jpg` |
| 109 | 107-p109 | split BL 108/107; product 109=101; hotspot-107-p109 id occupied by 161 | no | high | — | `p109-*.jpg` |
| 121 | 4078 | single reassign TR; displaced 4079 remains on TL | sí | high | — | `p121-*.jpg` |
| 152 | 86-p152 | cycle-3 clockwise; 1002-p152 is BL SKU despite code=152 | sí | high | — | `p152-*.jpg` |
| 174 | 3264 | split full-width bottom; product 174=5245; top also mismatched | no | high | — | `p174-*.jpg` |
| 183 | 757 | cycle-3; 183-p183 represents printed 700 | sí | high | — | `p183-*.jpg` |
| 198 | 5131 | split full-width top; product 198=5123; duplicate 5086 bottom | no | high | — | `p198-*.jpg` |

---

## Página 8 — target `8237`

- Clasificación: **A-cycle**
- Confirmable: **sí** (confianza high)
- Patrón: cycle-2 on TR/BL + BR keep (no folio debt)
- Mapa impreso: `{"TL":"8236","TR":"8237","BL":"8238","BR":"8239"}`
- Nota: Isolated TR→8237 alone would orphan 8238; full cycle required and available.
- Current: `reports/catalog-review/batch-e-mapping/p8-current-hotspots.jpg`
- Proposed: `reports/catalog-review/batch-e-mapping/p8-proposed-hotspots.jpg`

### Productos en products.json (página 8)

| id | code | inferred | name | sizes | colors | refs |
|---|---|---|---|---|---|---:|
| 8236 | 8236 | 8236 | Pack x 3 de cola less en V de morley sin costura | ["S","M","L","XL"] | ["Blanco","Nude","Rosa","Gris","Negro","Verde"] | 1 |
| 8238 | 8238 | 8238 | Pack x 3 de cola less en V de microfibra sin costura | ["S","M","L","XL"] | ["Blanco","Nude","Rosa","Gris","Negro","Verde"] | 1 |
| 8239 | 8239 | 8239 | Pack x 3 de cola less regulable de microfibra sin costura | ["S","M","L","XL"] | ["Blanco","Nude","Rosa","Gris","Negro","Verde"] | 2 |
| 8237 | 8237 | 8237 | Pack x 3 de cola less regulable de morley sin costura | ["S","M","L","XL"] | ["Blanco","Nude","Rosa","Gris","Negro","Verde PACK X3 MORLEY PACK X3 MICROFIBRA SEAMLESS PACK X3 MICROFIBRA SEAMLESS"] | 0 |

### Códigos impresos (PDF)

| code | región | x | y | description |
|---|---|---:|---:|---|
| 8236 | TL | 2.9 | 47.77 |  |
| 8237 | TR | 52.52 | 47.77 |  |
| 8238 | BL | 2.16 | 97.72 |  |
| 8239 | BR | 50.61 | 97.72 |  |

### Hotspots actuales

| hotspotId | productId | x | y | w | h | refs(productId) |
|---|---|---:|---:|---:|---:|---:|
| hotspot-8236 | 8236 | 2 | 8 | 47 | 38 | 1 |
| hotspot-8238 | 8238 | 51 | 8 | 47 | 38 | 1 |
| hotspot-8239 | 8239 | 2 | 50 | 47 | 42 | 2 |
| hotspot-8237 | 8239 | 51 | 50 | 47 | 42 | 2 |

### Matriz código → acción

| código | región | hotspot actual | productId actual | productId correcto | acción | coords actuales | coords propuestas | desplazado | destino |
|---|---|---|---|---|---|---|---|---|---|
| 8236 | TL | hotspot-8236 | 8236 | 8236 | keep | 2,8,47,38 | 2,8,47,38 | — | — |
| 8237 | TR | hotspot-8238 | 8238 | 8237 | reassign | 51,8,47,38 | 51,8,47,38 | 8238 | hotspot-8239 BL |
| 8238 | BL | hotspot-8239 | 8239 | 8238 | reassign | 2,50,47,42 | 2,50,47,42 | 8239 | hotspot-8237 BR (already) |
| 8239 | BR | hotspot-8239|hotspot-8237 | 8239|8239 | 8239 | keep | 2,50,47,42 | 51,50,47,42 | 8239|8239 | hotspot-8237 BR (already) |

### Permutación / acciones

```json
[
  {
    "type": "reassign",
    "hotspotId": "hotspot-8238",
    "from": "8238",
    "to": "8237",
    "coords": {
      "x": 51,
      "y": 8,
      "width": 47,
      "height": 38
    }
  },
  {
    "type": "reassign",
    "hotspotId": "hotspot-8239",
    "from": "8239",
    "to": "8238",
    "coords": {
      "x": 2,
      "y": 50,
      "width": 47,
      "height": 42
    }
  },
  {
    "type": "keep",
    "hotspotId": "hotspot-8237",
    "productId": "8239"
  },
  {
    "type": "keep",
    "hotspotId": "hotspot-8236",
    "productId": "8236"
  }
]
```

### Productos desplazados

- `8238` → hotspot-8239 BL
- `8239` → hotspot-8237 BR (already)

### Quedarían sin hotspot

- **Ninguno**

### Hotspots finales propuestos

| hotspotId | productId | x | y | w | h |
|---|---|---:|---:|---:|---:|
| hotspot-8236 | 8236 | 2 | 8 | 47 | 38 |
| hotspot-8238 | 8237 | 51 | 8 | 47 | 38 |
| hotspot-8239 | 8238 | 2 | 50 | 47 | 42 |
| hotspot-8237 | 8239 | 51 | 50 | 47 | 42 |

### Solapamientos

- Antes: 0
- Después (propuesta): 0

---

## Página 15 — target `152`

- Clasificación: **A-cycle**
- Confirmable: **sí** (confianza high)
- Patrón: cycle-3 + folio-id product 15 represents printed 114
- Mapa impreso: `{"TL":"152","TR":"116","BL":"117","BR":"114→product 15"}`
- Nota: Do NOT orphan 15: it is the 114 commercial record (extraction id=page). Later extraction fix 15→114-p15 optional.
- Current: `reports/catalog-review/batch-e-mapping/p15-current-hotspots.jpg`
- Proposed: `reports/catalog-review/batch-e-mapping/p15-proposed-hotspots.jpg`

### Productos en products.json (página 15)

| id | code | inferred | name | sizes | colors | refs |
|---|---|---|---|---|---|---:|
| 15 | 15 | 114 | 114 Pack x3 Cola less de morley, con elástico personalizado | ["Único"] | ["Blanco - Negro - Rosa vintage"] | 1 |
| 152 | 152 | 152 | Pack x3 Cola less de morley, con elástico personalizado | ["Único"] | ["Blanco - Gris humo - Negro"] | 0 |
| 116 | 116 | 116 | Micro cola less de morley, con elástico personalizado | ["Único"] | ["Blanco - Negro - Rosa vintage"] | 2 |
| 117 | 117 | 117 | Pack x3 Cola less tiro alto de morley, con elástico personal | ["Único"] | ["Blanco - Negro - Rosa vintage"] | 1 |

### Códigos impresos (PDF)

| code | región | x | y | description |
|---|---|---:|---:|---|
| 152 | TL | 2.64 | 47.78 |  |
| 116 | TR | 53.57 | 47.78 |  |
| 117 | BL | 5.29 | 97.28 |  |
| 114 | BR | 53.06 | 97.78 |  |

### Hotspots actuales

| hotspotId | productId | x | y | w | h | refs(productId) |
|---|---|---:|---:|---:|---:|---:|
| hotspot-15 | 15 | 2 | 8 | 47 | 38 | 1 |
| hotspot-152 | 116 | 51 | 8 | 47 | 38 | 2 |
| hotspot-116 | 116 | 2 | 50 | 47 | 42 | 2 |
| hotspot-117 | 117 | 51 | 50 | 47 | 42 | 1 |

### Matriz código → acción

| código | región | hotspot actual | productId actual | productId correcto | acción | coords actuales | coords propuestas | desplazado | destino |
|---|---|---|---|---|---|---|---|---|---|
| 152 | TL | hotspot-15 | 15 | 152 | reassign | 2,8,47,38 | 2,8,47,38 | 15 | hotspot-117 BR |
| 116 | TR | hotspot-152 | 116 | 116 | keep | 51,8,47,38 | 51,8,47,38 | — | hotspot-152 TR (keep) |
| 117 | BL | hotspot-116 | 116 | 117 | reassign | 2,50,47,42 | 2,50,47,42 | 116 | hotspot-152 TR (keep) |
| 114 | BR | hotspot-117 | 117 | 15 | reassign | 51,50,47,42 | 51,50,47,42 | 117 | hotspot-116 BL |

### Permutación / acciones

```json
[
  {
    "type": "reassign",
    "hotspotId": "hotspot-15",
    "from": "15",
    "to": "152",
    "coords": {
      "x": 2,
      "y": 8,
      "width": 47,
      "height": 38
    }
  },
  {
    "type": "keep",
    "hotspotId": "hotspot-152",
    "productId": "116"
  },
  {
    "type": "reassign",
    "hotspotId": "hotspot-116",
    "from": "116",
    "to": "117",
    "coords": {
      "x": 2,
      "y": 50,
      "width": 47,
      "height": 42
    }
  },
  {
    "type": "reassign",
    "hotspotId": "hotspot-117",
    "from": "117",
    "to": "15",
    "coords": {
      "x": 51,
      "y": 50,
      "width": 47,
      "height": 42
    },
    "note": "15 holds 114 data"
  }
]
```

### Productos desplazados

- `15` → hotspot-117 BR
- `116` → hotspot-152 TR (keep)
- `117` → hotspot-116 BL

### Quedarían sin hotspot

- **Ninguno**

### Hotspots finales propuestos

| hotspotId | productId | x | y | w | h |
|---|---|---:|---:|---:|---:|
| hotspot-15 | 152 | 2 | 8 | 47 | 38 |
| hotspot-152 | 116 | 51 | 8 | 47 | 38 |
| hotspot-116 | 117 | 2 | 50 | 47 | 42 |
| hotspot-117 | 15 | 51 | 50 | 47 | 42 |

### Solapamientos

- Antes: 0
- Después (propuesta): 0

---

## Página 38 — target `5836`

- Clasificación: **A-cycle**
- Confirmable: **sí** (confianza high)
- Patrón: cycle-3; product 38 represents printed 1730
- Mapa impreso: `{"TL":"5836","TR":"7905","BL":"1730→product 38","BR":"1738"}`
- Current: `reports/catalog-review/batch-e-mapping/p38-current-hotspots.jpg`
- Proposed: `reports/catalog-review/batch-e-mapping/p38-proposed-hotspots.jpg`

### Productos en products.json (página 38)

| id | code | inferred | name | sizes | colors | refs |
|---|---|---|---|---|---|---:|
| 38 | 38 | 1730 | 1730 Conjunto de microfibra fantasía | ["90","95","100"] | ["Blanco - negro - rojo"] | 1 |
| 1738 | 1738 | 1738 | Conjunto de microfibra fantasía | ["85","90","95"] | ["Blanco - negro - rojo"] | 2 |
| 7905 | 7905 | 7905 | Pack x 3 | ["Único"] | ["Varios"] | 1 |
| 5836 | 5836 | 5836 | Conjunto de morley y puntilla | ["85","90","95","100"] | ["Blanco - celeste - negro"] | 0 |

### Códigos impresos (PDF)

| code | región | x | y | description |
|---|---|---:|---:|---|
| 5836 | TL | 2.9 | 47.28 |  |
| 7905 | TR | 61.88 | 47.28 |  |
| 1730 | BL | 1.69 | 97.28 |  |
| 1738 | BR | 52.23 | 97.28 |  |

### Hotspots actuales

| hotspotId | productId | x | y | w | h | refs(productId) |
|---|---|---:|---:|---:|---:|---:|
| hotspot-38 | 38 | 2 | 8 | 47 | 38 | 1 |
| hotspot-1738 | 1738 | 51 | 8 | 47 | 38 | 2 |
| hotspot-7905 | 7905 | 2 | 50 | 47 | 42 | 1 |
| hotspot-5836 | 1738 | 51 | 50 | 47 | 42 | 2 |

### Matriz código → acción

| código | región | hotspot actual | productId actual | productId correcto | acción | coords actuales | coords propuestas | desplazado | destino |
|---|---|---|---|---|---|---|---|---|---|
| 5836 | TL | hotspot-38 | 38 | 5836 | reassign | 2,8,47,38 | 2,8,47,38 | 38 | hotspot-7905 BL |
| 7905 | TR | hotspot-1738 | 1738 | 7905 | reassign | 51,8,47,38 | 51,8,47,38 | 1738 | hotspot-7905 BL |
| 1730 | BL | hotspot-7905 | 7905 | 38 | reassign | 2,50,47,42 | 2,50,47,42 | 7905 | hotspot-1738 TR |
| 1738 | BR | hotspot-5836 | 1738 | 1738 | keep | 51,50,47,42 | 51,50,47,42 | — | hotspot-7905 BL |

### Permutación / acciones

```json
[
  {
    "type": "reassign",
    "hotspotId": "hotspot-38",
    "from": "38",
    "to": "5836",
    "coords": {
      "x": 2,
      "y": 8,
      "width": 47,
      "height": 38
    }
  },
  {
    "type": "reassign",
    "hotspotId": "hotspot-1738",
    "from": "1738",
    "to": "7905",
    "coords": {
      "x": 51,
      "y": 8,
      "width": 47,
      "height": 38
    }
  },
  {
    "type": "reassign",
    "hotspotId": "hotspot-7905",
    "from": "7905",
    "to": "38",
    "coords": {
      "x": 2,
      "y": 50,
      "width": 47,
      "height": 42
    }
  },
  {
    "type": "keep",
    "hotspotId": "hotspot-5836",
    "productId": "1738"
  }
]
```

### Productos desplazados

- `38` → hotspot-7905 BL
- `7905` → hotspot-1738 TR
- `1738` → hotspot-5836 BR (keep)

### Quedarían sin hotspot

- **Ninguno**

### Hotspots finales propuestos

| hotspotId | productId | x | y | w | h |
|---|---|---:|---:|---:|---:|
| hotspot-38 | 5836 | 2 | 8 | 47 | 38 |
| hotspot-1738 | 7905 | 51 | 8 | 47 | 38 |
| hotspot-7905 | 38 | 2 | 50 | 47 | 42 |
| hotspot-5836 | 1738 | 51 | 50 | 47 | 42 |

### Solapamientos

- Antes: 0
- Después (propuesta): 0

---

## Página 50 — target `4120`

- Clasificación: **A-cycle**
- Confirmable: **sí** (confianza high)
- Patrón: cycle-3; 50=4115, 50-p50=4385
- Mapa impreso: `{"TL":"4385→50-p50","TR":"4115→50","BL":"4193","BR":"4120"}`
- Nota: Isolated BR→4120 alone orphans 50-p50; full cycle keeps all 4 records covered.
- Current: `reports/catalog-review/batch-e-mapping/p50-current-hotspots.jpg`
- Proposed: `reports/catalog-review/batch-e-mapping/p50-proposed-hotspots.jpg`

### Productos en products.json (página 50)

| id | code | inferred | name | sizes | colors | refs |
|---|---|---|---|---|---|---:|
| 50 | 50 | 4115 | 4115 Conjunto de microfibra y puntilla | ["85","90","95","100"] | ["Blanco - negro - rojo"] | 1 |
| 4193 | 4193 | 4193 | Conjunto de microfibra | ["85","90","95","100"] | ["Blanco - negro - rojo"] | 2 |
| 4120 | 4120 | 4120 | Conjunto de puntilla | ["85","90","95","100"] | ["Blanco - negro - nougat - rosa chicle"] | 0 |
| 50-p50 | 50 | 4385 | 4385 Conjunto de microfibra y puntilla | ["85","90","95","100"] | ["Blanco - negro"] | 1 |

### Códigos impresos (PDF)

| code | región | x | y | description |
|---|---|---:|---:|---|
| 4115 | TR | 53.01 | 47.27 |  |
| 4385 | TL | 2.94 | 47.3 |  |
| 4193 | BL | 5.43 | 97.28 |  |
| 4120 | BR | 55.3 | 97.28 |  |

### Hotspots actuales

| hotspotId | productId | x | y | w | h | refs(productId) |
|---|---|---:|---:|---:|---:|---:|
| hotspot-50 | 50 | 2 | 8 | 47 | 38 | 1 |
| hotspot-4193 | 4193 | 51 | 8 | 47 | 38 | 2 |
| hotspot-4120 | 4193 | 2 | 50 | 47 | 42 | 2 |
| hotspot-50-p50 | 50-p50 | 51 | 50 | 47 | 42 | 1 |

### Matriz código → acción

| código | región | hotspot actual | productId actual | productId correcto | acción | coords actuales | coords propuestas | desplazado | destino |
|---|---|---|---|---|---|---|---|---|---|
| 4115 | TR | hotspot-4193 | 4193 | 50 | reassign | 51,8,47,38 | 51,8,47,38 | 4193 | hotspot-4120 BL (keep) |
| 4385 | TL | hotspot-50 | 50 | 50-p50 | reassign | 2,8,47,38 | 2,8,47,38 | 50 | hotspot-4193 TR |
| 4193 | BL | hotspot-4120 | 4193 | 4193 | keep | 2,50,47,42 | 2,50,47,42 | — | hotspot-4120 BL (keep) |
| 4120 | BR | hotspot-50-p50 | 50-p50 | 4120 | reassign | 51,50,47,42 | 51,50,47,42 | 50-p50 | hotspot-50 TL |

### Permutación / acciones

```json
[
  {
    "type": "reassign",
    "hotspotId": "hotspot-50",
    "from": "50",
    "to": "50-p50",
    "coords": {
      "x": 2,
      "y": 8,
      "width": 47,
      "height": 38
    }
  },
  {
    "type": "reassign",
    "hotspotId": "hotspot-4193",
    "from": "4193",
    "to": "50",
    "coords": {
      "x": 51,
      "y": 8,
      "width": 47,
      "height": 38
    }
  },
  {
    "type": "keep",
    "hotspotId": "hotspot-4120",
    "productId": "4193"
  },
  {
    "type": "reassign",
    "hotspotId": "hotspot-50-p50",
    "from": "50-p50",
    "to": "4120",
    "coords": {
      "x": 51,
      "y": 50,
      "width": 47,
      "height": 42
    }
  }
]
```

### Productos desplazados

- `50-p50` → hotspot-50 TL
- `50` → hotspot-4193 TR
- `4193` → hotspot-4120 BL (keep)

### Quedarían sin hotspot

- **Ninguno**

### Hotspots finales propuestos

| hotspotId | productId | x | y | w | h |
|---|---|---:|---:|---:|---:|
| hotspot-50 | 50-p50 | 2 | 8 | 47 | 38 |
| hotspot-4193 | 50 | 51 | 8 | 47 | 38 |
| hotspot-4120 | 4193 | 2 | 50 | 47 | 42 |
| hotspot-50-p50 | 4120 | 51 | 50 | 47 | 42 |

### Solapamientos

- Antes: 0
- Después (propuesta): 0

---

## Página 61 — target `1453`

- Clasificación: **B-redraw**
- Confirmable: **no** (confianza high)
- Patrón: top row 4 SKUs / 3 hotspots; product 61 = printed 1253
- Mapa impreso: `{"top":"1053|1153|1253(=61)|1453","mid":"1042|1142|1242","lower":"10137|…"}`
- Nota: Not confirmable until top-row redraw is designed as one atomic apply; missing separate id 1253 is OK via product 61.
- Current: `reports/catalog-review/batch-e-mapping/p61-current-hotspots.jpg`
- Proposed: `reports/catalog-review/batch-e-mapping/p61-proposed-hotspots.jpg`

### Productos en products.json (página 61)

| id | code | inferred | name | sizes | colors | refs |
|---|---|---|---|---|---|---:|
| 61 | 61 | 1253 | 1253 Pack x 3 culoteless en microfibra lisa “EVERYDAY” | ["Único"] | ["Varios"] | 1 |
| 1453 | 1453 | 1453 | Pack x 3 tangaless en microfibra lisa “EVERYDAY” | ["Único"] | ["Varios"] | 0 |
| 1042 | 1042 | 1042 | Pack x 3 colaless en microfibra lisa “EVERYDAY” | ["Único"] | ["Varios"] | 1 |
| 1142 | 1142 | 1142 | Pack x 3 vedetina en microfibra lisa “EVERYDAY” | ["Único"] | ["Varios"] | 2 |
| 1242 | 1242 | 1242 | Pack x 3 culoteless en microfibra lisa “EVERYDAY” | ["Único"] | ["Varios"] | 1 |
| 10137 | 10137 | 10137 | Pack x 3 colaless en microfibra lisa “POWER COLOR” | ["Único"] | ["Varios"] | 1 |
| 11137 | 11137 | 11137 | Pack x 3 vedetina en microfibra lisa “POWER COLOR” | ["Único"] | ["Varios"] | 0 |
| 12137 | 12137 | 12137 | Pack x 3 culoteless en microfibra lisa “POWER COLOR” | ["Único"] | ["Varios"] | 0 |
| 10138 | 10138 | 10138 | Colaless en algodón y lycra lisa “EVERYDAY COTTON” | ["Único"] | ["Varios"] | 0 |
| 12138 | 12138 | 12138 | Pack x 3 culoteless en algodón y lycra lisa “EVERYDAY COTTON | ["Único"] | ["Varios"] | 0 |
| 1053 | 1053 | 1053 | Pack x 3 colaless en microfibra lisa “EVERYDAY” | ["Único"] | ["Varios"] | 0 |
| 1153 | 1153 | 1153 | Pack x 3 vedetina en microfibra lisa “EVERYDAY” | ["Único"] | ["Varios"] | 0 |
| 11138 | 11138 | 11138 | Vedetina en algodón y lycra lisa “EVERYDAY COTTON” | ["Único"] | ["Varios"] | 0 |

### Códigos impresos (PDF)

| code | región | x | y | description |
|---|---|---:|---:|---|
| 1053 | TL | 1.42 | 21.08 |  |
| 1153 | TL | 26.62 | 21.08 |  |
| 1253 | TR | 50.76 | 21.08 |  |
| 1453 | TR | 75.87 | 21.08 |  |
| 1042 | TL | 2.9 | 46.04 |  |
| 1242 | TR | 71.98 | 46.04 |  |
| 1142 | TL | 38.41 | 46.06 |  |
| 10137 | ML | 2.9 | 70.93 |  |
| 11137 | ML | 35.74 | 71.05 |  |
| 12137 | MR | 69.64 | 71.05 |  |
| 10138 | BL | 2.34 | 96.06 |  |
| 11138 | BL | 36.8 | 96.06 |  |
| 12138 | BR | 69.64 | 96.06 |  |

### Hotspots actuales

| hotspotId | productId | x | y | w | h | refs(productId) |
|---|---|---:|---:|---:|---:|---:|
| hotspot-61 | 61 | 2 | 8 | 31 | 28 | 1 |
| hotspot-1453 | 1142 | 35 | 8 | 31 | 28 | 2 |
| hotspot-1042 | 1042 | 68 | 8 | 30 | 28 | 1 |
| hotspot-1142 | 1142 | 2 | 39 | 31 | 28 | 2 |
| hotspot-1242 | 1242 | 35 | 39 | 31 | 28 | 1 |
| hotspot-10137 | 10137 | 68 | 39 | 30 | 28 | 1 |

### Matriz código → acción

| código | región | hotspot actual | productId actual | productId correcto | acción | coords actuales | coords propuestas | desplazado | destino |
|---|---|---|---|---|---|---|---|---|---|
| 1053 | TL | hotspot-61 | 61 | 1053 | mapped | 2,8,31,28 | 2,8,23,28 | 61 | — |
| 1153 | TL | hotspot-61 | 61 | 1153 | mapped | 2,8,31,28 | 26,8,23,28 | 61 | — |
| 1253 | TR | hotspot-1453 | 1142 | 61 | mapped | 35,8,31,28 | 50,8,23,28 | 1142 | — |
| 1453 | TR | hotspot-1042 | 1042 | 1453 | mapped | 68,8,30,28 | 74,8,24,28 | 1042 | mid-row after redraw |
| 1042 | TL | hotspot-61|hotspot-1142 | 61|1142 | 1042 | mapped | 2,8,31,28 | 2,39,31,28 | 61|1142 | — |
| 1242 | TR | hotspot-1042|hotspot-10137 | 1042|10137 | 1242 | mapped | 68,8,30,28 | 68,39,30,28 | 1042|10137 | mid-row after redraw |
| 1142 | TL | hotspot-1453|hotspot-1242 | 1142|1242 | 1142 | mapped | 35,8,31,28 | 35,39,31,28 | 1142|1242 | — |
| 10137 | ML | hotspot-1142 | 1142 | 10137 | mapped | 2,39,31,28 | 2,70,31,22 | 1142 | — |
| 11137 | ML | hotspot-1242 | 1242 | 11137 | unmapped/needs-redraw | 35,39,31,28 | — | 1242 | — |
| 12137 | MR | hotspot-10137 | 10137 | 12137 | unmapped/needs-redraw | 68,39,30,28 | — | 10137 | — |
| 10138 | BL | — | — | 10138 | unmapped/needs-redraw | — | — | — | — |
| 11138 | BL | — | — | 11138 | unmapped/needs-redraw | — | — | — | — |
| 12138 | BR | — | — | 12138 | unmapped/needs-redraw | — | — | — | — |

### Permutación / acciones

```json
[
  {
    "type": "redraw-top-4col",
    "coords": [
      {
        "hotspotId": "hotspot-61",
        "productId": "1053",
        "coords": {
          "x": 2,
          "y": 8,
          "width": 23,
          "height": 28
        }
      },
      {
        "hotspotId": "hotspot-1453",
        "productId": "1153",
        "coords": {
          "x": 26,
          "y": 8,
          "width": 23,
          "height": 28
        }
      },
      {
        "hotspotId": "NEW-or-reassign-for-1253",
        "productId": "61",
        "coords": {
          "x": 50,
          "y": 8,
          "width": 23,
          "height": 28
        },
        "note": "61 holds 1253 data"
      },
      {
        "hotspotId": "hotspot-1453-p61",
        "productId": "1453",
        "coords": {
          "x": 74,
          "y": 8,
          "width": 24,
          "height": 28
        }
      }
    ]
  },
  {
    "type": "fix-lower-rows",
    "note": "Also realign mid row 1042/1142/1242 after top split"
  }
]
```

### Productos desplazados

- `1042` → mid-row after redraw

### Quedarían sin hotspot

- **Ninguno**

### Hotspots finales propuestos

| hotspotId | productId | x | y | w | h |
|---|---|---:|---:|---:|---:|
| hotspot-61 | 1053 | 2 | 8 | 23 | 28 |
| hotspot-1453 | 1153 | 26 | 8 | 23 | 28 |
| hotspot-1253-via-61 | 61 | 50 | 8 | 23 | 28 |
| hotspot-1453-p61 | 1453 | 74 | 8 | 24 | 28 |
| hotspot-1042 | 1042 | 2 | 39 | 31 | 28 |
| hotspot-1142 | 1142 | 35 | 39 | 31 | 28 |
| hotspot-1242 | 1242 | 68 | 39 | 30 | 28 |
| hotspot-10137 | 10137 | 2 | 70 | 31 | 22 |

### Solapamientos

- Antes: 0
- Después (propuesta): 0

---

## Página 81 — target `2053`

- Clasificación: **A-cycle**
- Confirmable: **sí** (confianza high)
- Patrón: cycle-3; 81=2092, 81-p81=1076
- Mapa impreso: `{"TL":"1076→81-p81","TR":"2055","BL":"2092→81","BR":"2053"}`
- Current: `reports/catalog-review/batch-e-mapping/p81-current-hotspots.jpg`
- Proposed: `reports/catalog-review/batch-e-mapping/p81-proposed-hotspots.jpg`

### Productos en products.json (página 81)

| id | code | inferred | name | sizes | colors | refs |
|---|---|---|---|---|---|---:|
| 81 | 81 | 2092 | 2092 Conjunto de tul y encaje con arco sin taza con cola les | ["90","95","100","105"] | ["blanco - negro"] | 1 |
| 2053 | 2053 | 2053 | Body de algodón y lycra con puntilla | ["85","90","95","100"] | ["blanco - negro - nude"] | 0 |
| 2055 | 2055 | 2055 | Body less con taza triángulo de tul y puntilla | ["85","90","95","100"] | ["negro"] | 2 |
| 81-p81 | 81 | 1076 | 1076 Conjunto taza soft triángulo de morley con less | ["85","90","95","100"] | ["negro","negro - negro","dorado"] | 1 |

### Códigos impresos (PDF)

| code | región | x | y | description |
|---|---|---:|---:|---|
| 1076 | TL | 3.38 | 47.78 |  |
| 2055 | TR | 54.51 | 47.78 |  |
| 2092 | BL | 2.9 | 97.77 |  |
| 2053 | BR | 53.95 | 97.78 |  |

### Hotspots actuales

| hotspotId | productId | x | y | w | h | refs(productId) |
|---|---|---:|---:|---:|---:|---:|
| hotspot-81 | 81 | 2 | 8 | 47 | 38 | 1 |
| hotspot-2053 | 2055 | 51 | 8 | 47 | 38 | 2 |
| hotspot-2055 | 2055 | 2 | 50 | 47 | 42 | 2 |
| hotspot-81-p81 | 81-p81 | 51 | 50 | 47 | 42 | 1 |

### Matriz código → acción

| código | región | hotspot actual | productId actual | productId correcto | acción | coords actuales | coords propuestas | desplazado | destino |
|---|---|---|---|---|---|---|---|---|---|
| 1076 | TL | hotspot-81 | 81 | 81-p81 | reassign | 2,8,47,38 | 2,8,47,38 | 81 | hotspot-2055 BL |
| 2055 | TR | hotspot-2053 | 2055 | 2055 | keep | 51,8,47,38 | 51,8,47,38 | — | hotspot-2053 TR (keep) |
| 2092 | BL | hotspot-2055 | 2055 | 81 | reassign | 2,50,47,42 | 2,50,47,42 | 2055 | hotspot-2053 TR (keep) |
| 2053 | BR | hotspot-81-p81 | 81-p81 | 2053 | reassign | 51,50,47,42 | 51,50,47,42 | 81-p81 | hotspot-81 TL |

### Permutación / acciones

```json
[
  {
    "type": "reassign",
    "hotspotId": "hotspot-81",
    "from": "81",
    "to": "81-p81",
    "coords": {
      "x": 2,
      "y": 8,
      "width": 47,
      "height": 38
    }
  },
  {
    "type": "keep",
    "hotspotId": "hotspot-2053",
    "productId": "2055"
  },
  {
    "type": "reassign",
    "hotspotId": "hotspot-2055",
    "from": "2055",
    "to": "81",
    "coords": {
      "x": 2,
      "y": 50,
      "width": 47,
      "height": 42
    }
  },
  {
    "type": "reassign",
    "hotspotId": "hotspot-81-p81",
    "from": "81-p81",
    "to": "2053",
    "coords": {
      "x": 51,
      "y": 50,
      "width": 47,
      "height": 42
    }
  }
]
```

### Productos desplazados

- `81-p81` → hotspot-81 TL
- `2055` → hotspot-2053 TR (keep)
- `81` → hotspot-2055 BL

### Quedarían sin hotspot

- **Ninguno**

### Hotspots finales propuestos

| hotspotId | productId | x | y | w | h |
|---|---|---:|---:|---:|---:|
| hotspot-81 | 81-p81 | 2 | 8 | 47 | 38 |
| hotspot-2053 | 2055 | 51 | 8 | 47 | 38 |
| hotspot-2055 | 81 | 2 | 50 | 47 | 42 |
| hotspot-81-p81 | 2053 | 51 | 50 | 47 | 42 |

### Solapamientos

- Antes: 0
- Después (propuesta): 0

---

## Página 109 — target `107-p109`

- Clasificación: **B-redraw**
- Confirmable: **no** (confianza high)
- Patrón: split BL 108/107; product 109=101; hotspot-107-p109 id occupied by 161
- Mapa impreso: `{"top":"101→109","midL":"108","botL":"107","right":"161"}`
- Nota: Before create, resolve possible double hotspot for 161 (hotspot-161-p109 vs hotspot-107-p109).
- Current: `reports/catalog-review/batch-e-mapping/p109-current-hotspots.jpg`
- Proposed: `reports/catalog-review/batch-e-mapping/p109-proposed-hotspots.jpg`

### Productos en products.json (página 109)

| id | code | inferred | name | sizes | colors | refs |
|---|---|---|---|---|---|---:|
| 109 | 109 | 101 | 101 Corpiño seamless triángulo con taza soft y gancho | ["S","M","L","XL"] | ["Blanco, Negro","Nude LÍNEA PREMIUM CALCE PERFECTO SEAMLESS CON TAZA"] | 1 |
| 161-p109 | 161 | 161 | Trusa Cola less con cintura alta y control abdominal modelan | ["S","M","L","XL","XXL"] | ["Negro","Nude"] | 2 |
| 108-p109 | 108 | 108 | Pack x3 vedetina de microfibra supersoft con elásticos termo | ["S AL XXL"] | ["Cásico (Blanco, Negro","Nude)"] | 1 |
| 107-p109 | 107 | 107 | Pack x3 cola less de microfibra supersoft con elásticos term | ["S AL XXL"] | ["Cásico (Blanco, Negro","Nude) PACK X 3 PACK X"] | 0 |

### Códigos impresos (PDF)

| code | región | x | y | description |
|---|---|---:|---:|---|
| 101 | TL | 29.07 | 47.33 |  |
| 108 | BL | 2.9 | 72.34 |  |
| 161 | BR | 50.07 | 97.28 |  |
| 107 | BL | 2.62 | 97.3 |  |

### Hotspots actuales

| hotspotId | productId | x | y | w | h | refs(productId) |
|---|---|---:|---:|---:|---:|---:|
| hotspot-109 | 109 | 2 | 8 | 47 | 38 | 1 |
| hotspot-161-p109 | 161-p109 | 51 | 8 | 47 | 38 | 2 |
| hotspot-108-p109 | 108-p109 | 2 | 50 | 47 | 42 | 1 |
| hotspot-107-p109 | 161-p109 | 51 | 50 | 47 | 42 | 2 |

### Matriz código → acción

| código | región | hotspot actual | productId actual | productId correcto | acción | coords actuales | coords propuestas | desplazado | destino |
|---|---|---|---|---|---|---|---|---|---|
| 101 | TL | hotspot-109 | 109 | 109 | reassign | 2,8,47,38 | 2,8,47,38 | — | — |
| 108 | BL | hotspot-108-p109 | 108-p109 | 108-p109 | mapped | 2,50,47,42 | 2,50,47,24 | — | — |
| 161 | BR | hotspot-108-p109|hotspot-107-p109 | 108-p109|161-p109 | 161-p109 | keep | 2,50,47,42 | 51,50,47,42 | 108-p109|161-p109 | — |
| 107 | BL | hotspot-108-p109 | 108-p109 | 107-p109 | create | 2,50,47,42 | 2,76,47,22 | 108-p109 | — |

### Permutación / acciones

```json
[
  {
    "type": "reassign",
    "hotspotId": "hotspot-109",
    "from": "109",
    "to": "109",
    "note": "already holds 101 data — verify geometry covers 101 only"
  },
  {
    "type": "fix-coordinates",
    "hotspotId": "hotspot-108-p109",
    "fromCoords": {
      "x": 2,
      "y": 50,
      "width": 47,
      "height": 42
    },
    "toCoords": {
      "x": 2,
      "y": 50,
      "width": 47,
      "height": 24
    }
  },
  {
    "type": "create",
    "hotspotId": "hotspot-107-p109-2",
    "productId": "107-p109",
    "coords": {
      "x": 2,
      "y": 76,
      "width": 47,
      "height": 22
    }
  },
  {
    "type": "keep",
    "hotspotId": "hotspot-107-p109",
    "productId": "161-p109",
    "note": "id collision: keep for 161 on BR after visual verify"
  },
  {
    "type": "keep",
    "hotspotId": "hotspot-161-p109",
    "productId": "161-p109?",
    "note": "possible duplicate coverage of 161 — inspect"
  }
]
```

### Productos desplazados

- (ninguno / solo redibujo)

### Quedarían sin hotspot

- **Ninguno**

### Hotspots finales propuestos

| hotspotId | productId | x | y | w | h |
|---|---|---:|---:|---:|---:|
| hotspot-109 | 109 | 2 | 8 | 47 | 38 |
| hotspot-108-p109 | 108-p109 | 2 | 50 | 47 | 24 |
| hotspot-107-p109-2 | 107-p109 | 2 | 76 | 47 | 22 |
| hotspot-107-p109 | 161-p109 | 51 | 50 | 47 | 42 |

### Solapamientos

- Antes: 0
- Después (propuesta): 0

---

## Página 121 — target `4078`

- Clasificación: **A-simple**
- Confirmable: **sí** (confianza high)
- Patrón: single reassign TR; displaced 4079 remains on TL
- Mapa impreso: `{"TL":"4079","TR":"4078","BL":"4014","BR":"4012"}`
- Current: `reports/catalog-review/batch-e-mapping/p121-current-hotspots.jpg`
- Proposed: `reports/catalog-review/batch-e-mapping/p121-proposed-hotspots.jpg`

### Productos en products.json (página 121)

| id | code | inferred | name | sizes | colors | refs |
|---|---|---|---|---|---|---:|
| 4078 | 4078 | 4078 | Pack x 3 tangaless regulable de algodón y lycra bretel de 20 | ["1","2","3","4"] | ["Varios"] | 0 |
| 4079 | 4079 | 4079 | Pack x 3 tangaless regulable de microfibra bretel de 20 mm | ["Único"] | ["Varios"] | 2 |
| 4014 | 4014 | 4014 | Pack x 3 tangaless de algodón y lycra elástico ancho de 15 m | ["1","2","3","4"] | ["Varios"] | 1 |
| 4012 | 4012 | 4012 | Pack tangaless de algodón y lycra y puntilla | ["Único"] | ["Varios"] | 1 |

### Códigos impresos (PDF)

| code | región | x | y | description |
|---|---|---:|---:|---|
| 4079 | TL | 2.9 | 46.96 |  |
| 4078 | TR | 51.69 | 46.96 |  |
| 4014 | BL | 2.92 | 96.96 |  |
| 4012 | BR | 52.92 | 97.78 |  |

### Hotspots actuales

| hotspotId | productId | x | y | w | h | refs(productId) |
|---|---|---:|---:|---:|---:|---:|
| hotspot-121 | 4079 | 2 | 8 | 47 | 38 | 2 |
| hotspot-4079 | 4079 | 51 | 8 | 47 | 38 | 2 |
| hotspot-4014 | 4014 | 2 | 50 | 47 | 42 | 1 |
| hotspot-4012 | 4012 | 51 | 50 | 47 | 42 | 1 |

### Matriz código → acción

| código | región | hotspot actual | productId actual | productId correcto | acción | coords actuales | coords propuestas | desplazado | destino |
|---|---|---|---|---|---|---|---|---|---|
| 4079 | TL | hotspot-121 | 4079 | 4079 | keep | 2,8,47,38 | 2,8,47,38 | — | hotspot-121 TL (still covered) |
| 4078 | TR | hotspot-4079 | 4079 | 4078 | reassign | 51,8,47,38 | 51,8,47,38 | 4079 | hotspot-121 TL (still covered) |
| 4014 | BL | hotspot-4014 | 4014 | 4014 | keep | 2,50,47,42 | 2,50,47,42 | — | — |
| 4012 | BR | hotspot-4012 | 4012 | 4012 | keep | 51,50,47,42 | 51,50,47,42 | — | — |

### Permutación / acciones

```json
[
  {
    "type": "reassign",
    "hotspotId": "hotspot-4079",
    "from": "4079",
    "to": "4078",
    "coords": {
      "x": 51,
      "y": 8,
      "width": 47,
      "height": 38
    }
  },
  {
    "type": "keep",
    "hotspotId": "hotspot-121",
    "productId": "4079",
    "note": "hotspot id is folio-like but product 4079 correct"
  },
  {
    "type": "keep",
    "hotspotId": "hotspot-4014",
    "productId": "4014"
  },
  {
    "type": "keep",
    "hotspotId": "hotspot-4012",
    "productId": "4012"
  }
]
```

### Productos desplazados

- `4079` → hotspot-121 TL (still covered)

### Quedarían sin hotspot

- **Ninguno**

### Hotspots finales propuestos

| hotspotId | productId | x | y | w | h |
|---|---|---:|---:|---:|---:|
| hotspot-121 | 4079 | 2 | 8 | 47 | 38 |
| hotspot-4079 | 4078 | 51 | 8 | 47 | 38 |
| hotspot-4014 | 4014 | 2 | 50 | 47 | 42 |
| hotspot-4012 | 4012 | 51 | 50 | 47 | 42 |

### Solapamientos

- Antes: 0
- Después (propuesta): 0

---

## Página 152 — target `86-p152`

- Clasificación: **A-cycle**
- Confirmable: **sí** (confianza high)
- Patrón: cycle-3 clockwise; 1002-p152 is BL SKU despite code=152
- Mapa impreso: `{"TL":"76","TR":"86","BL":"1002→1002-p152","BR":"1053"}`
- Nota: Isolated TR→86-p152 orphans 1053-p152; full cycle required. Optional later: fix code of 1002-p152 from 152→1002.
- Current: `reports/catalog-review/batch-e-mapping/p152-current-hotspots.jpg`
- Proposed: `reports/catalog-review/batch-e-mapping/p152-proposed-hotspots.jpg`

### Productos en products.json (página 152)

| id | code | inferred | name | sizes | colors | refs |
|---|---|---|---|---|---|---:|
| 86-p152 | 86 | 86 | Media pasión con liga de puntilla siliconada con Lycra | ["Único"] | ["Blanco","Negro"] | 0 |
| 1053-p152 | 1053 | 1053 | Panty multifilamento | ["5"] | ["Negro, Piel","Tostado"] | 1 |
| 76-p152 | 76 | 76 | Panty semiopaca c/puntera c/bombacha lycra | ["2","3","4","5"] | ["Negro, Piel","Tostado"] | 2 |
| 1002-p152 | 152 | 1002 | 1002 Panty multifilamento | ["2","3","4"] | ["Negro, Piel","Tostado"] | 1 |

### Códigos impresos (PDF)

| code | región | x | y | description |
|---|---|---:|---:|---|
| 76 | TL | 3.36 | 47.77 |  |
| 86 | TR | 54.07 | 47.77 |  |
| 1002 | BL | 6.84 | 97.77 |  |
| 1053 | BR | 58.45 | 97.78 |  |

### Hotspots actuales

| hotspotId | productId | x | y | w | h | refs(productId) |
|---|---|---:|---:|---:|---:|---:|
| hotspot-152-p152 | 76-p152 | 2 | 8 | 47 | 38 | 2 |
| hotspot-1053-p152 | 1053-p152 | 51 | 8 | 47 | 38 | 1 |
| hotspot-76-p152 | 76-p152 | 2 | 50 | 47 | 42 | 2 |
| hotspot-1002-p152 | 1002-p152 | 51 | 50 | 47 | 42 | 1 |

### Matriz código → acción

| código | región | hotspot actual | productId actual | productId correcto | acción | coords actuales | coords propuestas | desplazado | destino |
|---|---|---|---|---|---|---|---|---|---|
| 76 | TL | hotspot-152-p152 | 76-p152 | 76-p152 | keep | 2,8,47,38 | 2,8,47,38 | — | hotspot-152-p152 TL (keep) |
| 86 | TR | hotspot-1053-p152 | 1053-p152 | 86-p152 | reassign | 51,8,47,38 | 51,8,47,38 | 1053-p152 | hotspot-1002-p152 BR |
| 1002 | BL | hotspot-76-p152 | 76-p152 | 1002-p152 | reassign | 2,50,47,42 | 2,50,47,42 | 76-p152 | hotspot-152-p152 TL (keep) |
| 1053 | BR | hotspot-1002-p152 | 1002-p152 | 1053-p152 | reassign | 51,50,47,42 | 51,50,47,42 | 1002-p152 | hotspot-76-p152 BL |

### Permutación / acciones

```json
[
  {
    "type": "keep",
    "hotspotId": "hotspot-152-p152",
    "productId": "76-p152"
  },
  {
    "type": "reassign",
    "hotspotId": "hotspot-1053-p152",
    "from": "1053-p152",
    "to": "86-p152",
    "coords": {
      "x": 51,
      "y": 8,
      "width": 47,
      "height": 38
    }
  },
  {
    "type": "reassign",
    "hotspotId": "hotspot-76-p152",
    "from": "76-p152",
    "to": "1002-p152",
    "coords": {
      "x": 2,
      "y": 50,
      "width": 47,
      "height": 42
    }
  },
  {
    "type": "reassign",
    "hotspotId": "hotspot-1002-p152",
    "from": "1002-p152",
    "to": "1053-p152",
    "coords": {
      "x": 51,
      "y": 50,
      "width": 47,
      "height": 42
    }
  }
]
```

### Productos desplazados

- `1053-p152` → hotspot-1002-p152 BR
- `1002-p152` → hotspot-76-p152 BL
- `76-p152` → hotspot-152-p152 TL (keep)

### Quedarían sin hotspot

- **Ninguno**

### Hotspots finales propuestos

| hotspotId | productId | x | y | w | h |
|---|---|---:|---:|---:|---:|
| hotspot-152-p152 | 76-p152 | 2 | 8 | 47 | 38 |
| hotspot-1053-p152 | 86-p152 | 51 | 8 | 47 | 38 |
| hotspot-76-p152 | 1002-p152 | 2 | 50 | 47 | 42 |
| hotspot-1002-p152 | 1053-p152 | 51 | 50 | 47 | 42 |

### Solapamientos

- Antes: 0
- Después (propuesta): 0

---

## Página 174 — target `3264`

- Clasificación: **B-redraw**
- Confirmable: **no** (confianza high)
- Patrón: split full-width bottom; product 174=5245; top also mismatched
- Mapa impreso: `{"topL":"5245→174","topR":"3263","botL":"4288","botC":"3266","botR":"3264"}`
- Current: `reports/catalog-review/batch-e-mapping/p174-current-hotspots.jpg`
- Proposed: `reports/catalog-review/batch-e-mapping/p174-proposed-hotspots.jpg`

### Productos en products.json (página 174)

| id | code | inferred | name | sizes | colors | refs |
|---|---|---|---|---|---|---:|
| 174 | 174 | 5245 | 5245 Remera de jersey college | ["1","2","3"] | ["Gris Melange- Azul Marino"] | 1 |
| 3264 | 3264 | 3264 | Pantalon jogging boyfriend de frisa | ["1","2","3"] | ["Vison - Negro"] | 0 |
| 4288 | 4288 | 4288 | Camiseta american de set calado | ["1","2"] | ["Blanco-Negro"] | 1 |
| 3263 | 3263 | 3263 | Pantalón palazzo de frisa con alforzas | ["1","2","3"] | ["Azul - Gris Melange- Negro"] | 2 |
| 3266 | 3266 | 3266 | Buzo canguro oversize de frisa college | ["1","2","3","4"] | ["Off White - Negro"] | 1 |

### Códigos impresos (PDF)

| code | región | x | y | description |
|---|---|---:|---:|---|
| 5245 | ML | 8.57 | 48.1 |  |
| 3263 | MR | 55.71 | 48.41 |  |
| 4288 | BL | 1.19 | 97.78 |  |
| 3266 | BL | 33.49 | 97.78 |  |
| 3264 | BR | 68.2 | 97.78 |  |

### Hotspots actuales

| hotspotId | productId | x | y | w | h | refs(productId) |
|---|---|---:|---:|---:|---:|---:|
| hotspot-174 | 174 | 2 | 8 | 47 | 28 | 1 |
| hotspot-3264 | 3263 | 51 | 8 | 47 | 28 | 2 |
| hotspot-4288 | 4288 | 2 | 39 | 47 | 28 | 1 |
| hotspot-3263 | 3263 | 51 | 39 | 47 | 28 | 2 |
| hotspot-3266 | 3266 | 2 | 70 | 96 | 22 | 1 |

### Matriz código → acción

| código | región | hotspot actual | productId actual | productId correcto | acción | coords actuales | coords propuestas | desplazado | destino |
|---|---|---|---|---|---|---|---|---|---|
| 5245 | ML | hotspot-174|hotspot-4288 | 174|4288 | 174 | reassign | 2,8,47,28 | 2,8,47,28 | 174|4288 | — |
| 3263 | MR | hotspot-3264|hotspot-3263 | 3263|3263 | 3263 | mapped | 51,8,47,28 | 51,8,47,28 | 3263|3263 | — |
| 4288 | BL | hotspot-3266 | 3266 | 4288 | fix-coordinates | 2,70,96,22 | 2,70,30,28 | 3266 | — |
| 3266 | BL | hotspot-3266 | 3266 | 3266 | fix-coordinates | 2,70,96,22 | 33,70,22,28 | — | — |
| 3264 | BR | hotspot-3266 | 3266 | 3264 | create | 2,70,96,22 | 55,70,43,28 | 3266 | — |

### Permutación / acciones

```json
[
  {
    "type": "reassign",
    "hotspotId": "hotspot-174",
    "from": "174",
    "to": "174",
    "note": "holds 5245 — verify TL geometry"
  },
  {
    "type": "fix-coordinates",
    "hotspotId": "hotspot-3266",
    "toCoords": {
      "x": 33,
      "y": 70,
      "width": 22,
      "height": 28
    },
    "productId": "3266"
  },
  {
    "type": "fix-coordinates",
    "hotspotId": "hotspot-4288",
    "toCoords": {
      "x": 2,
      "y": 70,
      "width": 30,
      "height": 28
    },
    "productId": "4288"
  },
  {
    "type": "create",
    "hotspotId": "hotspot-3264-p174",
    "productId": "3264",
    "coords": {
      "x": 55,
      "y": 70,
      "width": 43,
      "height": 28
    }
  },
  {
    "type": "audit-top",
    "note": "hotspot-3264 and hotspot-3263 currently both→3263; align to printed 3263 zones"
  }
]
```

### Productos desplazados

- (ninguno / solo redibujo)

### Quedarían sin hotspot

- **Ninguno**

### Hotspots finales propuestos

| hotspotId | productId | x | y | w | h |
|---|---|---:|---:|---:|---:|
| hotspot-174 | 174 | 2 | 8 | 47 | 28 |
| hotspot-3264 | 3263 | 51 | 8 | 47 | 28 |
| hotspot-3263 | 3263 | 51 | 39 | 47 | 28 |
| hotspot-4288 | 4288 | 2 | 70 | 30 | 28 |
| hotspot-3266 | 3266 | 33 | 70 | 22 | 28 |
| hotspot-3264-p174 | 3264 | 55 | 70 | 43 | 28 |

### Solapamientos

- Antes: 0
- Después (propuesta): 0

---

## Página 183 — target `757`

- Clasificación: **A-cycle**
- Confirmable: **sí** (confianza high)
- Patrón: cycle-3; 183-p183 represents printed 700
- Mapa impreso: `{"TL":"905","TR":"757","BL":"700→183-p183","BR":"759"}`
- Current: `reports/catalog-review/batch-e-mapping/p183-current-hotspots.jpg`
- Proposed: `reports/catalog-review/batch-e-mapping/p183-proposed-hotspots.jpg`

### Productos en products.json (página 183)

| id | code | inferred | name | sizes | colors | refs |
|---|---|---|---|---|---|---:|
| 757 | 757 | 757 | Conj. top alg y lycra est. c/bombacha | ["12","18"] | ["Rosa","Lila"] | 0 |
| 183-p183 | 183 | 700 | 700 Conj | ["8","18"] | ["blanco","hueso"] | 1 |
| 759 | 759 | 759 | Conj | ["12","18"] | ["Azul","Fucsia"] | 1 |
| 905 | 905 | 905 | Conj | ["8","18"] | ["blanco, melange","negro"] | 2 |

### Códigos impresos (PDF)

| code | región | x | y | description |
|---|---|---:|---:|---|
| 905 | ML | 2.9 | 48.41 |  |
| 757 | MR | 55.8 | 48.41 |  |
| 700 | BL | 6.86 | 97.78 |  |
| 759 | BR | 53.51 | 97.78 |  |

### Hotspots actuales

| hotspotId | productId | x | y | w | h | refs(productId) |
|---|---|---:|---:|---:|---:|---:|
| hotspot-183 | 905 | 2 | 8 | 47 | 38 | 2 |
| hotspot-183-p183 | 183-p183 | 51 | 8 | 47 | 38 | 1 |
| hotspot-759 | 759 | 2 | 50 | 47 | 42 | 1 |
| hotspot-905 | 905 | 51 | 50 | 47 | 42 | 2 |

### Matriz código → acción

| código | región | hotspot actual | productId actual | productId correcto | acción | coords actuales | coords propuestas | desplazado | destino |
|---|---|---|---|---|---|---|---|---|---|
| 905 | ML | hotspot-183|hotspot-759 | 905|759 | 905 | keep | 2,8,47,38 | 2,8,47,38 | 905|759 | hotspot-905 BR |
| 757 | MR | hotspot-183-p183|hotspot-905 | 183-p183|905 | 757 | reassign | 51,8,47,38 | 51,8,47,38 | 183-p183|905 | hotspot-759 BL |
| 700 | BL | hotspot-759 | 759 | 183-p183 | reassign | 2,50,47,42 | 2,50,47,42 | 759 | hotspot-905 BR |
| 759 | BR | hotspot-905 | 905 | 759 | reassign | 51,50,47,42 | 51,50,47,42 | 905 | hotspot-183 TL (keep) |

### Permutación / acciones

```json
[
  {
    "type": "keep",
    "hotspotId": "hotspot-183",
    "productId": "905"
  },
  {
    "type": "reassign",
    "hotspotId": "hotspot-183-p183",
    "from": "183-p183",
    "to": "757",
    "coords": {
      "x": 51,
      "y": 8,
      "width": 47,
      "height": 38
    }
  },
  {
    "type": "reassign",
    "hotspotId": "hotspot-759",
    "from": "759",
    "to": "183-p183",
    "coords": {
      "x": 2,
      "y": 50,
      "width": 47,
      "height": 42
    }
  },
  {
    "type": "reassign",
    "hotspotId": "hotspot-905",
    "from": "905",
    "to": "759",
    "coords": {
      "x": 51,
      "y": 50,
      "width": 47,
      "height": 42
    }
  }
]
```

### Productos desplazados

- `183-p183` → hotspot-759 BL
- `759` → hotspot-905 BR
- `905` → hotspot-183 TL (keep)

### Quedarían sin hotspot

- **Ninguno**

### Hotspots finales propuestos

| hotspotId | productId | x | y | w | h |
|---|---|---:|---:|---:|---:|
| hotspot-183 | 905 | 2 | 8 | 47 | 38 |
| hotspot-183-p183 | 757 | 51 | 8 | 47 | 38 |
| hotspot-759 | 183-p183 | 2 | 50 | 47 | 42 |
| hotspot-905 | 759 | 51 | 50 | 47 | 42 |

### Solapamientos

- Antes: 0
- Después (propuesta): 0

---

## Página 198 — target `5131`

- Clasificación: **B-redraw**
- Confirmable: **no** (confianza high)
- Patrón: split full-width top; product 198=5123; duplicate 5086 bottom
- Mapa impreso: `{"TL":"5123→198","TR":"5131","bottom":"5086"}`
- Nota: Removing/repurposing hotspot-5131 avoids duplicate 5086 after top split.
- Current: `reports/catalog-review/batch-e-mapping/p198-current-hotspots.jpg`
- Proposed: `reports/catalog-review/batch-e-mapping/p198-proposed-hotspots.jpg`

### Productos en products.json (página 198)

| id | code | inferred | name | sizes | colors | refs |
|---|---|---|---|---|---|---:|
| 198 | 198 | 5123 | 5123 Bóxer con bragueta algodón & lycra monocromo | ["S . M . L . XL . XXL . XXXL"] | ["Cofee - Negro - Army"] | 1 |
| 5131 | 5131 | 5131 | Bóxer algodón & lycra combinado | ["S . M . L . XL . XXL . XXXL"] | ["Grey - Marino - Negro"] | 0 |
| 5086 | 5086 | 5086 | Bóxer algodón & lycra monocromo classic | ["S . M . L . XL . XXL . XXXL"] | ["Coffee - Marino - Melange - Negro - Topo"] | 2 |

### Códigos impresos (PDF)

| code | región | x | y | description |
|---|---|---:|---:|---|
| 5131 | MR | 53.06 | 48.09 |  |
| 5123 | ML | 5.39 | 48.1 |  |
| 5086 | BL | 26.1 | 97.78 |  |

### Hotspots actuales

| hotspotId | productId | x | y | w | h | refs(productId) |
|---|---|---:|---:|---:|---:|---:|
| hotspot-198 | 198 | 3 | 8 | 94 | 30 | 1 |
| hotspot-5131 | 5086 | 3 | 40 | 46 | 50 | 2 |
| hotspot-5086 | 5086 | 51 | 40 | 46 | 50 | 2 |

### Matriz código → acción

| código | región | hotspot actual | productId actual | productId correcto | acción | coords actuales | coords propuestas | desplazado | destino |
|---|---|---|---|---|---|---|---|---|---|
| 5131 | MR | hotspot-198|hotspot-5086 | 198|5086 | 5131 | create | 3,8,94,30 | 51,8,46,32 | 198|5086 | — |
| 5123 | ML | hotspot-198|hotspot-5131 | 198|5086 | 198 | fix-coordinates | 3,8,94,30 | 3,8,46,32 | 198|5086 | — |
| 5086 | BL | hotspot-5131 | 5086 | 5086 | mapped | 3,40,46,50 | 3,42,94,50 | — | — |

### Permutación / acciones

```json
[
  {
    "type": "fix-coordinates",
    "hotspotId": "hotspot-198",
    "toCoords": {
      "x": 3,
      "y": 8,
      "width": 46,
      "height": 32
    },
    "productId": "198"
  },
  {
    "type": "create",
    "hotspotId": "hotspot-5131-p198",
    "productId": "5131",
    "coords": {
      "x": 51,
      "y": 8,
      "width": 46,
      "height": 32
    }
  },
  {
    "type": "merge-or-keep-one",
    "note": "hotspot-5131 and hotspot-5086 both→5086; keep one bottom region spanning commercial 5086"
  }
]
```

### Productos desplazados

- (ninguno / solo redibujo)

### Quedarían sin hotspot

- **Ninguno**

### Hotspots finales propuestos

| hotspotId | productId | x | y | w | h |
|---|---|---:|---:|---:|---:|
| hotspot-198 | 198 | 3 | 8 | 46 | 32 |
| hotspot-5131-p198 | 5131 | 51 | 8 | 46 | 32 |
| hotspot-5086 | 5086 | 3 | 42 | 94 | 50 |

### Solapamientos

- Antes: 0
- Después (propuesta): 0

---

## Casos confirmables (futuro PR de aplicación)

Páginas **8, 15, 38, 50, 81, 121, 152, 183**.

Cada una cierra un ciclo completo de `reassign-product` (sin create apilado) y deja **0** productos comerciales sin hotspot. Los ids de folio se reutilizan como el SKU tipográfico real contenido en su `name`.

| Página | Ciclo resumido |
|---:|---|
| 8 | 8238→8237; 8239→8238; BR keep 8239 |
| 15 | 15→152; 116→117; 117→15(114); TR keep 116 |
| 38 | 38→5836; 1738→7905; 7905→38(1730); BR keep 1738 |
| 50 | 50→50-p50(4385); 4193→50(4115); 50-p50→4120; BL keep 4193 |
| 81 | 81→81-p81(1076); 2055→81(2092); 81-p81→2053; TR keep 2055 |
| 121 | 4079→4078; TL keep 4079 |
| 152 | 1053-p152→86-p152; 76-p152→1002-p152; 1002-p152→1053-p152; TL keep 76 |
| 183 | 183-p183→757; 759→183-p183(700); 905→759; TL keep 905 |

## Casos que siguen ambiguos / no confirmables

Páginas **61, 109, 174, 198** — requieren redibujo / create coordinado:

- **61**: 4 columnas arriba (1053 / 1153 / 1253-via-61 / 1453) + realinear fila media.
- **109**: encoger `hotspot-108-p109`, create `hotspot-107-p109-2`, resolver duplicado 161.
- **174**: partir franja inferior 4288 / 3266 / 3264; auditar top 5245 / 3263.
- **198**: partir top 198 / 5131; consolidar bottom 5086 (hoy duplicado).

## Cambios que requeriría un futuro PR de aplicación

1. **PR A′ (reassign cycles)** — solo swaps de `productId` en `hotspots.json` en págs 8, 15, 38, 50, 81, 121, 152, 183.
2. **PR B′ (redraw)** — `fix-coordinates` + `create-hotspot` en págs 61, 109, 174, 198.
3. Opcional posterior: corregir extracción de ids folio (`15`→`114-p15`, etc.) **después** de estabilizar hotspots.
4. Nunca create encima del ocupante actual sin el ciclo/redibujo.
5. No confirmar reassign aislado si el desplazado queda sin destino.

## Validaciones de este análisis

Ver checklist actualizado en `BATCH_E_MISSING_HOTSPOTS_REPORT.md` (verify, dry-run, validate, audit, lint, typecheck, test, build). Diff de datos debe permanecer vacío.

