# Guía de revisión asistida del catálogo INV 2026

Herramienta **local** para revisar hallazgos de `npm run audit:catalog` y registrar decisiones humanas en `reports/catalog-review/`.  
No modifica `products.json` ni `hotspots.json` hasta que se ejecute `review:apply --confirm` de forma explícita.

## Flujo recomendado

1. **Sincronizar main**
   ```bash
   git checkout main
   git pull origin main
   ```
2. **Crear rama de revisión** (datos o solo decisiones)
   ```bash
   git checkout -b review/catalog-batch-A
   ```
3. **Ejecutar auditoría documental**
   ```bash
   npm run audit:catalog
   ```
4. **Generar pending-cases**
   ```bash
   npm run review:generate
   ```
5. **Iniciar la herramienta**
   ```bash
   npm run review:catalog
   ```
   Abrir `http://localhost:3000/catalog-review`  
   Requiere `NODE_ENV=development` y `CATALOG_REVIEW_MODE=1` (lo define el script).
6. **Revisar casos** con filtros/lotes A–E, búsqueda por código/productId y “solo pendientes”.
7. **Dibujar hotspots faltantes** (lote E) con el editor de coordenadas (porcentajes 0–100).
8. **Confirmar o rechazar** decisiones (no se escriben los JSON de catálogo todavía).
9. **Exportar decisiones** automáticamente a:
   - `reports/catalog-review/confirmed-decisions.json`
   - `reports/catalog-review/confirmed-decisions.csv`
10. **Verificar decisiones**
    ```bash
    npm run review:verify
    ```
11. **Dry-run de aplicación**
    ```bash
    npm run review:apply
    ```
12. **Revisar** `reports/catalog-review/applied-changes.json`.
13. **Aplicar solo con confirmación explícita**
    ```bash
    npm run review:apply -- --confirm
    ```
14. **Revisar diff** de `src/data/products.json` y `src/data/hotspots.json`.
15. `npm run validate:data`
16. `npm run audit:catalog`
17. `npm run test`
18. `npm run build`
19. Crear Pull Request (Draft si aún hay lotes abiertos).
20. Verificar Preview en Vercel (la ruta `/catalog-review` debe responder **404** en Preview/Production).
21. Fusionar solamente tras aprobación humana.

## Seguridad

- `CATALOG_REVIEW_MODE` debe ser `0` por defecto (ver `.env.example`).
- La UI y las APIs responden **404** si falta el modo, si `NODE_ENV !== development` o si corre en Vercel.
- Visitar la página **no** escribe archivos; solo lo hacen acciones explícitas de guardado de decisiones.
- Prohibido exponer la herramienta en producción.

## Lotes

| Lote | Contenido |
|------|-----------|
| A | `MISMATCH_HIGH` |
| B | `MISMATCH_MEDIUM` |
| C | `AMBIGUOUS`, `SHARED_CODE` |
| D | `NOT_FOUND` |
| E | `MISSING_HOTSPOT` |
| ATTR | talles/colores `MISMATCH_HIGH` / `MISSING_DATA` |

No resolver ambiguos automáticamente. No crear hotspots por grilla ni por cantidad.

## Reversión

Tras un `--confirm`, queda backup en `reports/catalog-review/backups/<timestamp>/` y un manifiesto inverso en `applied-changes.json`.

```bash
npm run review:apply -- --revert reports/catalog-review/applied-changes.json --confirm
```

También se puede restaurar copiando `products.json` / `hotspots.json` desde el backup.
