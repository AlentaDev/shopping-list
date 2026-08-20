# Quality gates de desarrollo

Esta guía es la referencia canónica de las verificaciones locales de Husky, la validación de pull requests y el workflow de release. Describe las automatizaciones que ejecuta el repositorio; la protección de ramas se configura en GitHub y determina qué verificaciones exitosas son obligatorias antes de hacer merge.

## Verificaciones locales de Husky

### Pre-commit

El hook `pre-commit` es deliberadamente rápido. Muestra un recordatorio de que la validación se ejecuta durante el desarrollo y en CI, pero no ejecuta suites automatizadas de tests, calidad, build ni E2E.

### Pre-push

El hook `pre-push` delega en `.husky/run-checks.sh` y selecciona las suites según los paths de aplicación modificados:

| Paths modificados | Suite predeterminada |
| --- | --- |
| `apps/mobile-android/**` only | `pnpm test:android` |
| `apps/web/**` and/or `apps/api/**` | `pnpm quality` |
| Android and Web/API | `pnpm test:android` and `pnpm quality` |
| Sin paths de aplicación | Sin suite de validación |

Para una rama con upstream, el hook compara `@{u}...HEAD`. En el primer push, cuando no existe upstream, prueba estas bases en orden: `origin/HEAD`, `origin/main` y `origin/master`. Si ninguna se resuelve, utiliza un conjunto sintético conservador de paths de Android, Web y API para que se ejecuten ambas rutas predeterminadas.

### Modos bajo demanda y de diagnóstico

- `HUSKY_FULL_CHECKS=1 git push` utiliza la ruta local completa. Los cambios solo de Android ejecutan `pnpm test:android`; cualquier cambio fuera de Android ejecuta `pnpm quality`, `pnpm test:e2e` y `pnpm -r build`.
- `HUSKY_GGA=1 git push` ejecuta `gga run` antes de la ruta local seleccionada. Es opcional y puede combinarse con `HUSKY_FULL_CHECKS=1`.
- `HUSKY_DRY_RUN=1 git push` muestra los comandos que ejecutaría el hook sin ejecutarlos.
- `HUSKY_CHANGED_FILES` proporciona una lista de paths modificados separada por saltos de línea para diagnosticar o probar de forma determinista la lógica de selección. Por ejemplo: `HUSKY_DRY_RUN=1 HUSKY_CHANGED_FILES=$'apps/web/src/App.tsx\napps/mobile-android/app/build.gradle.kts' git push`.

## Validación de pull requests

Los pull requests ejecutan las siguientes verificaciones de workflow:

- `Technical CI` ejecuta `pnpm quality` y `pnpm -r build`, un job E2E con PostgreSQL y los tests unitarios de Android mediante `pnpm test:android`.
- `Versioning PR Check` requiere un Changeset cuando se modifican paths de Web, API o Android.
- `GGA Review` ejecuta `gga run --pr-mode` solo para pull requests que coinciden con sus paths configurados: `apps/**`, `AGENTS.md`, `.gga` o su archivo de workflow.

Estas verificaciones están disponibles para la protección de ramas. Las definiciones de workflows del repositorio no pueden hacerlas obligatorias por sí solas; la configuración de protección de ramas define los quality gates obligatorios para hacer merge.

## Release en `main`

`Versioning Release` se ejecuta en los pushes a `main` y también puede iniciarse manualmente. Aplica versiones de Changeset, sincroniza la versión de Android en Gradle, hace commit de los cambios de archivos de versión cuando es necesario, crea y publica tags por aplicación, y crea releases de GitHub para esos tags.

El workflow de release no vuelve a ejecutar las suites de calidad, build, E2E ni tests de Android. Asume que los cambios llegaron a `main` mediante la validación de pull requests definida antes; la protección de ramas es responsable de exigir esos quality gates para hacer merge.

## Guías relacionadas

- [Versionado y releases](versioning-and-releases.md)
- [Gobernanza de documentación](008-documentation-governance.md)
