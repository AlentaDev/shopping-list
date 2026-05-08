---
name: express-api
description: "Trigger: express, api, rest, zod, endpoint, router, middleware, authorization. Aplicar reglas backend del proyecto con capas claras, validación y TDD."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## Activation Contract

Usá esta skill cuando el cambio toque `apps/api/**` (Express + TypeScript).

## Hard Rules

- TDD obligatorio: test primero, implementación mínima, refactor después de verde.
- Respetar capas backend permitidas: `domain`, `application`, `infrastructure`, `web`.
- Dependencias siempre hacia adentro; prohibido importar internals de otros módulos.
- Validar inputs de endpoints con Zod (fail fast por request inválida).
- Validar variables de entorno al iniciar la API (fail fast de configuración).
- Autorización explícita por lista/recurso; nunca implícita.
- Manejo de errores centralizado (sin lógica de error duplicada en handlers).
- Integraciones externas siempre detrás de interfaces/providers.
- Persistencia por defecto in-memory; si se usa Postgres, documentar modo y wiring.
- Nunca meter lógica de negocio en `shared` (solo utilidades técnicas).

## Decision Gates

| Situación | Acción |
|---|---|
| Nueva regla de negocio | Implementar en `domain`/`application`, no en `web` |
| Nuevo endpoint REST | Router/controlador en `web` + caso de uso en `application` |
| Entrada externa sin tipado confiable | Validar con Zod antes de orquestar |
| Integración con tercero (ej. Mercadona) | Provider en `infrastructure` con cache y fallback |
| Estado de error repetido | Unificar en middleware/handler central |

## Execution Steps

1. Definir test(s) del caso de uso o endpoint.
2. Implementar mínimo en la capa correcta (web/application/domain/infrastructure).
3. Agregar/ajustar validación Zod y autorización explícita.
4. Verificar que no haya lógica de negocio en `shared` ni acoplamiento cruzado.
5. Documentar feature API nueva en `docs/features/api/*.md` (objetivo, endpoint, reglas, notas).

## Output Contract

Devolver:
- Qué endpoint/caso de uso cambió y en qué capa.
- Tests agregados/actualizados y qué validan.
- Confirmación de validación (Zod), autorización y manejo de errores centralizado.
- Si hubo integración externa/persistencia, aclarar provider y modo de wiring.

## References

- `AGENTS.md` (reglas backend, arquitectura y metodología)
- `docs/003-rest-api-feature-first.md` (dirección REST feature-first en transición)
