# /publish-pr

Publicar el trabajo de la rama actual como Draft Pull Request.

## Entrada

- Título del PR (requerido)
- Resumen opcional (bullets)
- Plan de prueba opcional

## Pasos

1. Confirmar Git y `gh` disponibles (usar `scripts/dev/cursor-github-env.ps1` en Windows si hace falta)
2. Revisar estado:
   - `git status --short`
   - `git diff` / `git diff --staged`
   - `git branch --show-current` (debe ser distinta de `main`)
3. Detectar temporales y detenerse si aparecen, por ejemplo:
   - `*.log`, `*.tmp`, `.env`, `*.bak`
   - `reports/catalog-review/backups/`
   - capturas o dumps no pedidos
4. Ejecutar validaciones del proyecto (detenerse ante el primer fallo bloqueante):
   - `npm run validate:data`
   - `npm run lint`
   - `npm run typecheck`
   - `npm run test`
   - `npm run build`
   - Si la tarea toca integridad documental: `npm run audit:catalog`
5. Crear commit (solo si el usuario lo pidió o este comando implica commit):
   - `git add` de archivos relevantes
   - `git commit` con mensaje claro (por qué, no solo qué)
6. Push:
   - `git push -u origin HEAD`
7. Crear Draft PR:
   - `gh pr create --draft --title "..." --body "..."`
   - No marcar Ready for review
   - No fusionar
   - No habilitar auto-merge
8. Informar:
   - URL del Draft PR
   - HEAD (`git log -1 --oneline`)
   - archivos incluidos
   - resultado de validaciones

## Restricciones

- No trabajar sobre `main`
- No force push
- No incluir secretos, tokens ni `.env`
- No modificar `products.json` / `hotspots.json` / `catalog-pages.json` salvo que la tarea lo autorice explícitamente
