# ADR-0003: API REST feature-first (Node + Express)

## Estado

Aceptado (en transición).

## Contexto

La API actual funciona pero su estructura no es plenamente coherente con el patrón REST
feature-first compartido como referencia. Necesitamos una guía explícita para:

- Clarificar el patrón de rutas y responsabilidades
- Evitar inconsistencias entre módulos
- Migrar de forma incremental sin reestructuras masivas

## Decisión

Adoptamos el patrón REST feature-first como referencia oficial para la API:

### Principios

- **Router central** que monta los routers de cada feature bajo `/api`.
- **Módulos por feature** con capas claras:
  - `api/` (Express, validación, status codes, middlewares)
  - `application/` (casos de uso)
  - `domain/` (reglas y entidades)
  - `infrastructure/` (repositorios/servicios externos)
- **Shared** solo para utilidades técnicas, nunca lógica de negocio.
- **Importaciones** solo hacia dentro del módulo o vía `shared/`.

### Estructura objetivo (backend)

```
apps/api/src/
  app/
    router.ts
    errors/
      errorMiddleware.ts
    middleware/
      ...
  modules/
    <feature>/
      api/
      application/
      domain/
      infrastructure/
      index.ts
  shared/
    ...
```

## Consecuencias

- Las nuevas features deben seguir esta estructura desde el primer commit.
- El refactor del API existente será **gradual** y sin grandes movimientos.
- Cada cambio debe acercar el código a esta estructura, no alejarlo.

## Plan de migración (alto nivel)

1. Consolidar el **router central** y middleware de errores.
2. Migrar módulos actuales desde `web/` hacia `api/` (sin romper rutas).
3. Unificar el estilo REST de endpoints (evitar duplicidades en auth).
4. Alinear middlewares de auth con el mecanismo real de autenticación.
5. Documentar cada cambio significativo en un ADR o nota técnica breve.
