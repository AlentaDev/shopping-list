---
name: react-web
description: "Trigger: react, vite, vitest, testing-library, frontend web, componente, hook, UI_TEXT. Aplicar contrato frontend del proyecto con TDD y arquitectura por features."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## Activation Contract

Usá esta skill cuando el trabajo toque `apps/web/**` con React/Vite/Vitest.

## Hard Rules

- TDD obligatorio: test primero, implementación mínima, refactor después de verde.
- Respetar arquitectura frontend:
  - `components/`: UI pura, sin `fetch`, sin orquestación.
  - `services/`: casos de uso, endpoints, retries.
  - `services/adapters/`: transformación DTO → modelo UI, funciones puras, sin React/window.
  - `shared/`: reusable puro, sin `fetch`, sin acoplar features.
  - `context/`: solo estado transversal UI, sin lógica de negocio de feature.
- Nunca importar internals de otra feature.
- Todo texto de UI nuevo debe ir en `UI_TEXT` por sub-objeto de componente/feature.
- Naming:
  - Componente React: `PascalCase.tsx`
  - Hook: `useX.ts`
  - Util pura: `camelCase.ts`
  - Clases service/adapter: `PascalCase.ts`

## Decision Gates

| Situación | Acción |
|---|---|
| Necesitás llamar API desde UI | Mover la llamada a `features/*/services/` |
| Necesitás normalizar respuesta externa | Crear/usar `features/*/services/adapters/` |
| Es estado global de UI | Resolver en `context/` |
| Es lógica reusable cross-feature | Evaluar `shared/` (si no conoce feature) |

## Execution Steps

1. Escribir/ajustar tests del comportamiento esperado.
2. Implementar mínimo cambio en la capa correcta.
3. Asegurar imports válidos según límites de dependencia.
4. Si hay copy nuevo, centralizar en `UI_TEXT`.
5. Verificar cobertura por estrategia 100/80/0:
   - CORE (`context/`, `services/`, `adapters/`, `shared/utils/`) objetivo 100%
   - IMPORTANT (`components/`, `App.tsx`) objetivo 80%

## Output Contract

Devolver:
- Qué cambió y en qué capa/feature.
- Tests agregados/actualizados y qué validan.
- Confirmación de cumplimiento de reglas (fetch boundaries, UI_TEXT, naming).

## References

- `AGENTS.md` (reglas de arquitectura frontend, TDD, 100/80/0)
- `apps/web/vite.config.ts` (configuración de tests y coverage)
