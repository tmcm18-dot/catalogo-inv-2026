# /start-task

Preparar una rama limpia para una tarea nueva.

## Entrada

- Nombre de rama (requerido), por ejemplo: `fix/mi-cambio`
- Descripción breve opcional de la tarea

## Pasos

1. Localizar o habilitar Git en la sesión de PowerShell:
   - Preferir `. .\scripts\dev\cursor-github-env.ps1`
   - Si el helper no existe, localizar `git.exe` (Git for Windows o GitHub Desktop) y agregar su carpeta **solo** al PATH de la sesión actual
2. Verificar autenticación de GitHub CLI:
   - Ejecutar `gh auth status`
   - Si no hay sesión, detenerse y pedir al usuario que ejecute `gh auth login --web --git-protocol https`
   - No inventar credenciales ni guardar tokens
3. Actualizar `main`:
   - `git fetch origin`
   - `git switch main`
   - `git pull --ff-only origin main`
4. Exigir working tree limpio:
   - `git status --short` debe estar vacío
   - Si hay cambios, detenerse y pedir al usuario que confirme, stash o descarte
5. Verificar que la rama no exista:
   - Local: `git branch --list <rama>`
   - Remota: `git ls-remote --heads origin <rama>`
   - Si existe, detenerse y pedir otro nombre
6. Crear la rama:
   - `git switch -c <rama>`
7. Informar:
   - rama creada
   - commit base (`git log -1 --oneline`)
   - confirmación de árbol limpio

## Restricciones

- No trabajar sobre `main`
- No reutilizar ramas fusionadas
- No usar force push ni `reset --hard`
- No modificar archivos de datos del catálogo en este comando
