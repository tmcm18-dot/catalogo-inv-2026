# /check-pr

Inspeccionar un Pull Request sin modificar nada.

## Entrada

- Número de PR (requerido), por ejemplo: `42`

## Pasos

1. Confirmar `gh auth status`
2. Obtener y mostrar:
   - estado general (`OPEN` / `MERGED` / `CLOSED`)
   - si es Draft
   - base y head
   - mergeable / mergeStateStatus
   - conflictos (si aplica)
   - commits
   - checks (`gh pr checks <N>`)
   - archivos cambiados
   - additions / deletions
   - revisiones
3. Comandos sugeridos (solo lectura):

```bash
gh pr view <N> --json number,title,state,isDraft,baseRefName,headRefName,mergeable,mergeStateStatus,commits,files,additions,deletions,reviews,url,statusCheckRollup
gh pr checks <N>
gh pr diff <N> --name-only
```

## Restricciones

- No modificar el PR
- No convertir Draft → Ready
- No fusionar
- No hacer push
- No cambiar archivos locales
