# Design: App Shell Composition Root

## Technical Approach

Consolidar `apps/web/src/app-shell/*` como composition root canónico y retirar `apps/web/src/features/app-shell/*` por slices pequeños, verificables y reversibles. El runtime ya entra por `App.tsx -> AppShell`, así que el foco es eliminar ambigüedad de paths, congelar dirección de dependencias y limpiar duplicados sin cambiar UX ni contratos API.

## Architecture Decisions

| Option | Tradeoff | Decision |
|---|---|---|
| Mantener dos árboles (`app-shell` + `features/app-shell`) | Menor trabajo inmediato; deuda y confusión permanente | ❌ Rechazado |
| Canonical en `app-shell` + deprecación gradual del duplicado | Requiere migración por etapas; elimina ambigüedad | ✅ Elegido |
| Mover shell dentro de `features/` | Rompe regla de aislamiento feature-first | ❌ Rechazado |

| Option | Tradeoff | Decision |
|---|---|---|
| Validar límites solo por convención en PR | Costo bajo; riesgo de regresión | ⚠️ Parcial |
| Convención + checks de imports en tests/grep de compliance | Más disciplina, menor riesgo | ✅ Elegido |

## Data Flow

`App.tsx` delega en `AppShell`. `AppShell` orquesta navegación y estado transversal; cada feature sigue dueña de su lógica/adaptación.

```text
App.tsx
  -> app-shell/AppShell
      -> app-shell/useAppShellNavigation
          -> features/auth, lists, catalog, mobile-app
      -> context/useAuth, context/useList
      -> shared/components/toast
      -> features/shopping-list (UI + behavior)
```

Regla crítica: transformaciones DTO permanecen en `features/*/services/adapters`; `app-shell` no normaliza payloads.

## File Changes

| File | Action | Description |
|---|---|---|
| `apps/web/src/App.tsx` | Keep/Guard | Mantener wrapper mínimo (`<AppShell />`). |
| `apps/web/src/app-shell/AppShell.tsx` | Modify | Mantener composición; extraer helpers si crece (>250 LOC). |
| `apps/web/src/app-shell/useAppShellNavigation.ts` | Modify | Única navegación shell; evitar lógica de negocio de features. |
| `apps/web/src/app-shell/components/AppHeader.tsx` | Modify | UI de composición global sin fetch/DTO logic. |
| `apps/web/src/features/app-shell/index.ts` | Modify (slice 1) | Re-export temporal desde `@src/app-shell/AppShell` para compatibilidad. |
| `apps/web/src/features/app-shell/*` | Delete (slice final) | Eliminar duplicados cuando imports/tests queden verdes. |
| `apps/web/src/features/app-shell/*.test.tsx` | Move/Modify | Reubicar a `apps/web/src/app-shell/*.test.tsx` o actualizar ruta/carpeta canónica. |
| `apps/web/src/App.test.tsx` | Keep | Ya mockea `@src/app-shell/AppShell`; usar como guard de entrypoint. |

## Dependency Direction (Allowed Imports Matrix)

| From \ To | app-shell | features | context | shared | providers | infrastructure |
|---|---:|---:|---:|---:|---:|---:|
| `app-shell/*` | ✅ | ✅ (solo APIs públicas) | ✅ | ✅ | ❌ | ❌ |
| `features/*` | ❌ | ⚠️ (solo propio módulo) | ✅ | ✅ | ❌ | ❌ |
| `context/*` | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| `providers/*` | ❌ | ❌ (sin internals) | ✅ | ✅ | ✅ | ✅ |
| `shared/*` | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

## Interfaces / Contracts

```ts
// Transitional compatibility (slice 1)
// apps/web/src/features/app-shell/index.ts
export { AppShell } from "@src/app-shell/AppShell";
```

No se cambian contratos de props públicos de `AppShell`, `AppHeader` ni `useAppShellNavigation` durante la migración.

## Testing Strategy (TDD-friendly)

| Slice | What to test first (RED) | Then (GREEN) |
|---|---|---|
| 1. Compatibilidad de import | Test de import canónico y re-export temporal | Implementar re-export + ajustar imports mínimos |
| 2. Navegación shell | `useAppShellNavigation` en `/`, `/lists`, `/auth/*`, `/app` | Ajustes de routing en archivo canónico |
| 3. Composición UI | `AppShell` + `AppHeader` (auth/menu/cart) sin cambios funcionales | Migrar/renombrar tests al árbol canónico |
| 4. Cleanup | Falla si existe referencia activa a `features/app-shell/*` | Borrar duplicados y dejar solo canónico |

Cobertura: `app-shell` entra en IMPORTANT (>=80%), `App.tsx` también IMPORTANT. No agregar E2E para esta migración (no cambia flujo crítico).

## Migration / Rollout

1. **Slice 1 (safe checkpoint):** crear puente de compatibilidad en `features/app-shell/index.ts` y congelar nuevos imports al path canónico.
2. **Slice 2:** mover/actualizar tests hacia `app-shell/*` conservando asserts actuales.
3. **Slice 3:** apuntar todos los imports restantes a `@src/app-shell/*`.
4. **Slice 4:** eliminar `features/app-shell/*` duplicado.

Cada slice debe quedar mergeable, con tests verdes y diff acotado.

## Rollback Strategy / Blast Radius

- Rollback por slice (revert del último commit) sin tocar features de negocio.
- Mantener fallback temporal (`features/app-shell` re-export) hasta completar Slice 3.
- Si falla cleanup final, restaurar solo carpeta duplicada; impacto limitado a composición web.

## Open Questions

- [ ] Confirmar si `apps/web/src/features/app-shell/*.test.tsx` se mueve físicamente a `apps/web/src/app-shell/*.test.tsx` en un único slice o en dos PRs para mantener review <400 líneas.
