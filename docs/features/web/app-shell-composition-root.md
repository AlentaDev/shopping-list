# App Shell Composition Root (web)

## Objetivo

Definir `apps/web/src/app-shell/*` como único composition root de la app web para evitar duplicación con `features/app-shell/*`, manteniendo el comportamiento observable sin cambios.

## Alcance

- El entrypoint `App.tsx` delega composición en `AppShell`.
- `app-shell/*` orquesta navegación y composición global.
- La lógica de negocio y adaptación de datos permanece en cada feature (`features/*/services` y `features/*/services/adapters`).

## Límites de dependencia

- `app-shell/*` **puede** importar `features/*` (solo entrypoints públicos), `context/*` y `shared/*`.
- `features/*` **no puede** importar `app-shell/*`.
- `features/*` **no puede** importar internals de otras features.
- `app-shell/*` **no debe** incluir transformaciones DTO ni lógica de negocio de feature.

## Guardrails de migración

- No se permiten imports activos a `features/app-shell/*` salvo fallback temporal explícito en `features/app-shell/index.ts`.
- Los tests de composición deben vivir en árbol canónico `apps/web/src/app-shell/*`.
- La verificación de no regresión se ejecuta con suites unit/integration del área shell.

## Rollback por slice

- **Slice 1 (compat bridge):** revertir re-export temporal en `features/app-shell/index.ts`.
- **Slice 2 (import migration):** revertir commits de migración de imports/tests al path canónico.
- **Slice 3 (cleanup):** restaurar archivos duplicados eliminados bajo `features/app-shell/*` si aparece regresión.
- **Slice 4 (verification/docs):** revertir cambios documentales/estado de tareas; no requiere rollback runtime.

## Notas de implementación

- Esta migración no introduce nuevos endpoints ni cambia contratos API.
- No agrega providers nuevos ni modifica boundaries de providers existentes.
