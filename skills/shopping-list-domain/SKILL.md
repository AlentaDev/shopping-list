---
name: shopping-list-domain
description: "Trigger: lista, shopping list, draft, active, completed, autosave, complete, reuse, edit session. Aplicar reglas de dominio de listas."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## Activation Contract

Usá esta skill cuando el cambio toque reglas de listas de compra: estados, edición, autosave, completar, reutilizar, borradores o detalle de lista.

## Hard Rules

- TDD obligatorio: primero el comportamiento de dominio, después UI o wiring.
- Tratar `draft`, `active` y `completed` como estados de dominio, no como flags sueltos de UI.
- Las transiciones de estado deben vivir en servicios/casos de uso, no dispersas en componentes.
- Autosave debe manejar conflicto, recuperación y sincronización entre pestañas sin corromper datos.
- Completar/reutilizar listas debe preservar ownership y autorización por usuario/lista.
- No duplicar reglas entre Web, API y Android; si cambia el contrato, documentarlo.
- Edge cases críticos: lista vacía, edición activa, datos stale, cambios offline o retry tras error.

## Decision Gates

| Situación | Acción |
|---|---|
| Nueva transición de estado | Modelar como caso de uso/servicio con tests |
| UI necesita regla de lista | Consumir servicio/modelo; no reimplementar lógica en componente |
| Conflicto de autosave | Resolver explícitamente: retry, recuperación o error estructurado |
| Cambio visible de feature | Documentar en `docs/features/web` o `docs/features/api` |

## Execution Steps

1. Identificar estado inicial, evento y estado esperado de la lista.
2. Escribir tests de dominio/servicio para transición y casos límite.
3. Implementar mínimo en la capa dueña y adaptar UI/red solo si hace falta.
4. Verificar sincronización Web/API/Android si el contrato cruza apps.
5. Actualizar docs de feature cuando cambie comportamiento usuario-visible.

## Output Contract

Devolver:
- Regla o transición modificada.
- Tests y edge cases cubiertos.
- Impacto en Web/API/Android y contrato compartido.
- Deuda o inconsistencias de dominio detectadas.

## References

- `AGENTS.md` (TDD, frontend/backend y documentación de features)
- `docs/features/web/` y `docs/features/api/` (documentación funcional)
