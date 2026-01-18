# ADR 005: Backends de persistencia (in-memory y Postgres)

## Estado
Aceptado.

## Contexto
La API ya cuenta con repositorios **in-memory** por defecto y existen implementaciones **Postgres** en el código. Necesitamos dejar explícito que ambos modos son válidos y cuándo usarlos.

## Decisión
- La API puede operar con **in-memory** o con **Postgres**.
- El selector de persistencia es explícito vía `DB_PROVIDER=postgres|inmemory`.
- **Postgres es el default** cuando no se define `DB_PROVIDER`.
- Los tests unitarios usan **in-memory** por defecto; Postgres solo se habilita si se solicita explícitamente en el entorno de tests.
- E2E usa **Postgres** con una base de datos separada (`DB_NAME` distinto) en la misma instancia.

## Consecuencias
- La documentación debe indicar qué modo está activo, cómo cambiarlo y qué variables requiere.
- El wiring de la app debe centralizar la elección de repositorios y stores según `DB_PROVIDER`.
- Los pipelines de tests deben forzar in-memory salvo que se habilite Postgres explícitamente.
- E2E requiere crear/migrar la base de datos específica antes de ejecutar Playwright.

## Referencias
- `docs/db/api-db-setup.md`
- `docs/api/design.md`
