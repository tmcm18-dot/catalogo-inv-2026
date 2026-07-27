# Informe piloto — Lote A (15 casos MISMATCH_HIGH)

## 1. Rama

`review/catalog-batch-a-high-pilot`

## 2. Commit base

`74959c87a5d446caeaad4ae76bd8cba1adb5a4ea` — Merge pull request #11 from tmcm18-dot/feat/catalog-integrity-review-tool

PR #11 confirmado presente en `origin/main`.

## 3. Commit final

Ver HEAD de esta rama tras el commit del piloto (informe + decisiones + manifiesto).

## 4. Total de MISMATCH_HIGH

**184** (auditoría documental + cola `review:generate`, lote A).

Cola total generada: **632** casos.

## 5. 15 casos seleccionados

| # | caseId | página | zona | actual → propuesto |
|---|--------|--------|------|--------------------|
| 1 | `hs:hotspot-8237:MISMATCH_HIGH` | 8 | BR | 8237 → 8239 |
| 2 | `hs:hotspot-152:MISMATCH_HIGH` | 15 | TR | 152 → 116 |
| 3 | `hs:hotspot-5836:MISMATCH_HIGH` | 38 | BR | 5836 → 1738 |
| 4 | `hs:hotspot-4120:MISMATCH_HIGH` | 50 | BL | 4120 → 4193 |
| 5 | `hs:hotspot-1453:MISMATCH_HIGH` | 61 | TC | 1453 → 1142 |
| 6 | `hs:hotspot-2053:MISMATCH_HIGH` | 81 | TR | 2053 → 2055 |
| 7 | `hs:hotspot-93:MISMATCH_HIGH` | 93 | TC | 93 → (sin reasignar) |
| 8 | `hs:hotspot-107-p109:MISMATCH_HIGH` | 109 | BR | 107-p109 → 161-p109 |
| 9 | `hs:hotspot-121:MISMATCH_HIGH` | 121 | TL | 121 → 4079 |
| 10 | `hs:hotspot-103-p138:MISMATCH_HIGH` | 138 | MC | 103-p138 → (sin reasignar) |
| 11 | `hs:hotspot-152-p152:MISMATCH_HIGH` | 152 | TL | 152-p152 → 76-p152 |
| 12 | `hs:hotspot-3264:MISMATCH_HIGH` | 174 | TR | 3264 → 3263 |
| 13 | `hs:hotspot-183:MISMATCH_HIGH` | 183 | TL | 183 → 905 |
| 14 | `hs:hotspot-5131:MISMATCH_HIGH` | 198 | ML | 5131 → 5086 |
| 15 | `hs:hotspot-10100-p211:MISMATCH_HIGH` | 211 | BR | 10100-p211 → (sin reasignar) |

Criterios: páginas no consecutivas, zonas diversas (TL/TR/TC/ML/MC/BL/BR), evidencia visual en `reports/catalog-integrity-images/`, no por orden de array.

## 6. Páginas utilizadas

8, 15, 38, 50, 61, 81, 93, 109, 121, 138, 152, 174, 183, 198, 211

## 7–12. Resultado visual por caso

| caseId | producto actual | producto propuesto | decisión | confianza | evidencia |
|--------|-----------------|--------------------|----------|-----------|-----------|
| hs:hotspot-8237:MISMATCH_HIGH | 8237 | 8239 | reassign-product | high | código 8239 impreso en zona BR |
| hs:hotspot-152:MISMATCH_HIGH | 152 | 116 | reassign-product | high | código 116 bajo hotspot TR |
| hs:hotspot-5836:MISMATCH_HIGH | 5836 | 1738 | reassign-product | high | código 1738 en BR; 5836 en TL |
| hs:hotspot-4120:MISMATCH_HIGH | 4120 | 4193 | reassign-product | high | código 4193 en BL; 4120 en BR |
| hs:hotspot-1453:MISMATCH_HIGH | 1453 | 1142 | reassign-product | high | código 1142 bajo hotspot; 1453 fila superior |
| hs:hotspot-2053:MISMATCH_HIGH | 2053 | 2055 | reassign-product | high | código 2055 en TR; 2053 en BR |
| hs:hotspot-93:MISMATCH_HIGH | 93 | — | mark-ambiguous | medium | hotspot TC cubre **dos** códigos (466 y 368) |
| hs:hotspot-107-p109:MISMATCH_HIGH | 107-p109 | 161-p109 | reassign-product | high | código 161 en BR; 107 en BL |
| hs:hotspot-121:MISMATCH_HIGH | 121 | 4079 | reassign-product | high | código 4079 en TL; 121 ≈ nº página |
| hs:hotspot-103-p138:MISMATCH_HIGH | 103-p138 | — | mark-ambiguous | low | hotspot MC mal alineado visual vs textos 101/103 |
| hs:hotspot-152-p152:MISMATCH_HIGH | 152-p152 | 76-p152 | reassign-product | high | código 76 en TL; 152 ≈ nº página |
| hs:hotspot-3264:MISMATCH_HIGH | 3264 | 3263 | reassign-product | high | código 3263 en TR; 3264 zona inferior |
| hs:hotspot-183:MISMATCH_HIGH | 183 | 905 | reassign-product | high | código 905 en TL; 183 ≈ nº página |
| hs:hotspot-5131:MISMATCH_HIGH | 5131 | 5086 | reassign-product | high | visual principal = 5086; 5131 variante distinta |
| hs:hotspot-10100-p211:MISMATCH_HIGH | 10100-p211 | — | needs-manual-source | low | zona con varios SKU; impreso:101 no inequívoco |

Manifiesto: `reports/catalog-review/pilot-batch-a.json`.

## 13. Resultado del guardado

OK. 15 decisiones en `reports/catalog-review/confirmed-decisions.json`.

- save / edit / delete de decisión de prueba: OK (vía `validateDecision` + `upsertDecision` + `removeDecision`)
- sin `caseId` duplicados
- orden estable

## 14. Resultado de exportación

- JSON: `confirmed-decisions.json` — OK (15 decisiones)
- CSV: `confirmed-decisions.csv` — OK (16 líneas = header + 15)

## 15. Resultado de `review:verify`

```
Decisiones: 15
Errores: 0
Advertencias: 0
review:verify OK
```

## 16. Resultado del dry-run (`npm run review:apply` sin `--confirm`)

```
=== DRY-RUN (sin escritura) ===
Cambios: 12
Omitidos: 3
Errores: 0
```

Omitidos: 2× `mark-ambiguous`, 1× `needs-manual-source`.  
Resumen en `reports/catalog-review/applied-changes.json` (`dryRun: true`, `confirm: false`). Copia de evidencia: `pilot-evidence/dry-run-applied-changes.json`.

## 17. Confirmación: no se usó `--confirm`

**Confirmado.** Solo se ejecutó `npm run review:apply` (dry-run). No se ejecutó `npm run review:apply -- --confirm`.

## 18. Hashes iniciales y finales (SHA-256)

| Archivo | Inicial | Final | Igual |
|---------|---------|-------|-------|
| `src/data/products.json` | `6839D0FDF9ADFF88EF96DAF194CDE64A8E4FA4692F8CA1C9F5DE3C89AF6E2DB6` | `6839D0FDF9ADFF88EF96DAF194CDE64A8E4FA4692F8CA1C9F5DE3C89AF6E2DB6` | sí |
| `src/data/hotspots.json` | `8AA7C07F1F02B5828F55BAC82DC82D63B88B9A1B78A9C8FB25B605C0EAE51CAA` | `8AA7C07F1F02B5828F55BAC82DC82D63B88B9A1B78A9C8FB25B605C0EAE51CAA` | sí |
| `src/data/catalog-pages.json` | `B0DB84CAD60D6E06D65392112935F208870BE156C2F415105B443A93871FE34C` | `B0DB84CAD60D6E06D65392112935F208870BE156C2F415105B443A93871FE34C` | sí |

## 19. Diff de `products.json`

Vacío (`git diff -- src/data/products.json`).

## 20. Diff de `hotspots.json`

Vacío (`git diff -- src/data/hotspots.json`).

(`catalog-pages.json` también sin cambios.)

## 21. Resultado de validaciones

| Comando | Resultado |
|---------|-----------|
| `npm run validate:data` | ERRORES: 0 (APROBADA) |
| `npm run audit:catalog` | OK (MISMATCH_HIGH: 184) |
| `npm run lint` | 0 errores (2 warnings preexistentes `@next/next/no-img-element`) |
| `npm run typecheck` | OK |
| `npm run test` | **89** passed |
| `npm run build` | OK |

## 22. Problemas detectados en la herramienta

1. **Hotspots que abarcan varios productos** (p.ej. p93): el candidato único del audit puede ser engañoso; la UI debe destacar multi-código en la misma caja.
2. **Candidatos por proximidad tipográfica** (p.ej. p138, p211): `impreso` del audit no siempre coincide con la zona visual del hotspot → riesgo de reasignación incorrecta si se confía solo en el candidato.
3. **IDs enlazados = número de página** (121, 152, 183): patrón recurrente de error de carga; útil como señal de prioridad en lote A.
4. **Dos instancias `next dev` concurrentes** (puertos distintos) pueden corromper `.next` (ENOENT en route.js / fallos de build). Recomendación: un solo servidor de review a la vez.
5. **Lockfile padre** (`catalogo-inv-2026-vercel/package-lock.json`) hace que Next infiera mal el workspace root; ruido operativo, no bloqueante.
6. Tras corrupción de `.next`, `/api/catalog-review/cases` puede devolver 404/500 mientras la página aún responde 200; requiere reinicio limpio.

No se agregaron pruebas nuevas: los defectos observados son operativos / de datos, no regresiones de código en este piloto.

## 23. Recomendaciones antes de revisar los 184 casos

1. Mantener dry-run obligatorio; aplicar `--confirm` solo por sublotes pequeños tras verify.
2. Filtrar primero casos con código impreso ≠ número de página y un solo producto en el rectángulo.
3. Marcar automáticamente como sospechosos los hotspots cuyo `width`/`height` sugieren cobertura multi-producto (p.ej. width ≥ 90).
4. No auto-confirmar candidatos cuando la evidencia visual del crop no muestra el código impreso declarado.
5. Evitar dos `next` simultáneos sobre el mismo `.next`.
6. Continuar lotes de ~15–25 con manifiesto + informe por lote.
7. Separar en cola “page-number-as-productId” para resolución rápida.
8. Para casos `needs-manual-source`, exigir captura o nota de PDF texto seleccionable antes de reabrir.

## Resumen de conteos del piloto

| Tipo | Cantidad |
|------|----------|
| Revisados | 15 |
| Confirmados reasignación | 12 |
| Confirmados sin cambios | 0 |
| Ambiguous | 2 |
| Needs-manual-source | 1 |
| Rejected | 0 |

## Seguridad / gate de la herramienta (Fase 4)

| Escenario | Resultado |
|-----------|-----------|
| `npm run review:catalog` → `/catalog-review` | HTTP 200 (verificado en arranque inicial) |
| Sin `CATALOG_REVIEW_MODE=1` (dev :3001) | HTTP 404 |
| Producción simulada (`next start` :3010) | `/catalog-review` 404; `/` OK |
| Catálogo público con review activo | `/` HTTP 200 |

## Evidencia local

`reports/catalog-review/pilot-evidence/` (hashes, ui-tests, dry-run). Las capturas de página/hotspot se referencian desde `reports/catalog-integrity-images/` sin duplicar JPG originales en el PR.
