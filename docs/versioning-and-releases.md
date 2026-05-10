# Versionado y releases

Este repo usa **Semantic Versioning** por app (independiente):

- `@app/web` inicia en `1.0.0`
- `@app/api` inicia en `1.0.0`
- `@app/mobile-android` inicia en `0.9.0`

## Reglas de bump

- `patch`: bugfix o ajuste compatible
- `minor`: feature nueva compatible
- `major`: breaking change

## Flujo diario

1. Hacer cambios.
2. Ejecutar `pnpm changeset`.
3. Elegir app(s) afectadas y tipo de bump.
4. Escribir resumen corto del cambio.
5. Commit incluyendo el archivo en `.changeset/*.md`.

## Aviso/guard en PR

Workflow: `.github/workflows/versioning-pr-check.yml`

Si un PR toca `apps/web`, `apps/api` o `apps/mobile-android` y no incluye changeset, falla con aviso.

## Release automático en main

Workflow: `.github/workflows/versioning-release.yml`

En cada push a `main`:

1. Aplica `changeset version`.
2. Sincroniza Android:
   - `apps/mobile-android/package.json` → `app/build.gradle.kts`
   - `versionName = semver`
   - `versionCode = MAJOR*10000 + MINOR*100 + PATCH`
3. Crea commit automático de versiones (si hubo cambios).
4. Crea tags por app:
   - `web-vX.Y.Z`
   - `api-vX.Y.Z`
   - `android-vX.Y.Z`

## Android: publicación manual

La publicación Android se mantiene manual (firma y upload). El pipeline solo versiona y deja recordatorio.
