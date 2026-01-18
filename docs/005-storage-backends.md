# ADR 005: Backends de persistencia (in-memory y Postgres)

## Estado
Aceptado.

## Contexto
La API ya cuenta con repositorios **in-memory** por defecto y existen implementaciones **Postgres** en el código. Necesitamos dejar explícito que ambos modos son válidos y cuándo usarlos.

## Decisión
- La API puede operar con **in-memory** (por defecto) o con **Postgres**.
- El wiring por defecto mantiene **in-memory** para entornos locales/rápidos.
- Postgres se usa cuando se requiere persistencia real y migraciones.

## Consecuencias
- La documentación debe indicar qué modo está activo y cómo habilitar Postgres.
- Las implementaciones Postgres deben mantenerse alineadas con las interfaces actuales.

## Referencias
- `docs/db/api-db-setup.md`
- `docs/api/design.md`
