# /merge-approved-pr

Fusionar un PR **solo** con autorización literal del usuario.

## Entrada

- Número de PR (requerido)
- Autorización literal del usuario (requerida):

```text
AUTORIZO FUSIONAR PR #N
```

Donde `N` es el número exacto del PR.

## Sin la frase exacta

Detenerse inmediatamente. No:

- convertir el PR a Ready for review
- fusionar
- eliminar ramas
- actualizar `main`

## Con autorización válida

1. Confirmar Git y `gh` disponibles
2. Verificar el PR:
   - checks en verde / satisfactorios (`gh pr checks <N>`)
   - sin conflictos (`mergeable`)
   - base = `main`
   - head esperado
3. Si es Draft, convertirlo solo después de la autorización:
   - `gh pr ready <N>`
4. Fusionar mediante `gh` (sin force):
   - preferir `gh pr merge <N> --merge` (o el método del repo si ya hay convención)
   - no usar auto-merge salvo pedido explícito
5. Eliminar rama remota de la feature (si `gh` no lo hizo):
   - confirmar que el PR quedó `MERGED`
6. Actualizar local:
   - `git switch main`
   - `git fetch origin --prune`
   - `git pull --ff-only origin main`
7. Confirmar working tree limpio
8. Informar:
   - PR fusionado
   - HEAD de `main`
   - ramas eliminadas (si aplica)
   - estado final limpio

## Restricciones

- No fusionar sin la frase exacta `AUTORIZO FUSIONAR PR #N`
- No force push
- No `git reset --hard`
- No borrar ramas locales sin autorización adicional
