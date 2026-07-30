# /sync-main

Actualizar `main` local de forma segura.

## Pasos

1. Habilitar Git en la sesión si hace falta (`. .\scripts\dev\cursor-github-env.ps1`)
2. Detenerse si hay cambios locales:
   - `git status --short` no vacío → no continuar
   - Pedir al usuario que confirme, stash o descarte
3. Ejecutar:
   - `git fetch origin`
   - `git switch main`
   - `git pull --ff-only origin main`
   - `git fetch origin --prune`
4. Informar:
   - rama actual (`main`)
   - HEAD (`git log -1 --oneline`)
   - confirmación de árbol limpio

## Restricciones

- No borrar ramas locales sin autorización
- No usar `git reset --hard`
- No force push
- No mezclar cambios locales durante el sync
