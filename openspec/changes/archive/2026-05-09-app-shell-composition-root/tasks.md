# Tasks: App Shell Composition Root

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 260-360 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR1 compat+tests -> PR2 import migration -> PR3 cleanup |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|---|---|---|---|
| 1 | Bridge + canonical tests | PR 1 | Base main; keeps fallback re-export |
| 2 | Migrate all imports to `@src/app-shell/*` | PR 2 | Depends PR1; no behavior change |
| 3 | Delete duplicate feature shell | PR 3 | Depends PR2; compliance guard |

## Phase 1: Foundation (compatibility + guardrails)

- [x] 1.1 **RED** Scope: proteger entrypoint canónico. Paths: `apps/web/src/App.test.tsx`, `apps/web/src/features/app-shell/index.ts`. Test-first: agregar/ajustar test que falle si `App` no usa `@src/app-shell/AppShell` y si el re-export temporal no existe. Verify: test rojo reproducible.
- [x] 1.2 **GREEN** Scope: puente de compatibilidad. Paths: `apps/web/src/features/app-shell/index.ts`. Test-first note: implementar solo `export { AppShell } from "@src/app-shell/AppShell";`. Verify: tests de 1.1 verdes sin tocar UX.
- [x] 1.3 **REFACTOR** Scope: regla de compliance anti-imports ambiguos. Paths: `apps/web/src/features/app-shell/*.test.tsx` (nuevo test de guard), o suite existente de arquitectura frontend. Test-first: agregar regex/check que falle con imports activos a `features/app-shell/*`. Verify: guard pasa con fallback permitido solo en `index.ts`.

## Phase 2: Core migration (canonical shell behavior)

- [x] 2.1 **RED** Scope: navegación shell en ruta canónica. Paths: `apps/web/src/app-shell/useAppShellNavigation.test.ts` (o mover desde feature shell). Test-first: cubrir `/`, `/lists`, `/auth/*`, `/app`; fallar si desvían. Verify: casos rojos iniciales.
- [x] 2.2 **GREEN** Scope: ajustar navegación sin lógica de negocio. Paths: `apps/web/src/app-shell/useAppShellNavigation.ts`. Test-first note: mínimo cambio para verde manteniendo contratos actuales. Verify: suite navegación verde.
- [x] 2.3 **RED->GREEN** Scope: composición UI canónica. Paths: `apps/web/src/app-shell/AppShell.tsx`, `apps/web/src/app-shell/components/AppHeader.tsx`, tests equivalentes canónicos. Test-first: asserts auth/menu/cart sin DTO transforms. Verify: UI tests verdes y snapshots/asserciones equivalentes.

## Phase 3: Integration and cleanup

- [x] 3.1 Scope: migrar imports restantes. Paths: archivos bajo `apps/web/src/**` que referencien `features/app-shell/*`. Test-first: activar guard de 1.3 antes de editar imports. Verify: cero referencias activas salvo fallback temporal.
- [x] 3.2 Scope: mover/actualizar tests legacy al árbol canónico. Paths: `apps/web/src/features/app-shell/*.test.tsx` -> `apps/web/src/app-shell/*.test.tsx` (o rename equivalente). Test-first: mantener mismas expectativas antes de borrar legacy. Verify: mismas coberturas IMPORTANT >=80% en shell.
- [x] 3.3 Scope: borrar duplicados feature shell. Paths: `apps/web/src/features/app-shell/AppShell.tsx`, `components/AppHeader.tsx`, `useAppShellNavigation.tsx`, tests legacy. Test-first: guard debe fallar si queda referencia al árbol borrado. Verify: tests verdes + guard de compliance verde.

## Phase 4: Verification checkpoint

- [x] 4.1 Scope: verificación final de no regresión funcional. Paths: `apps/web/src/App.tsx`, `apps/web/src/app-shell/*`, suites relacionadas. Test-first note: rerun unit/integration del área (sin E2E nuevo). Verify: comportamiento observable equivalente a baseline.
- [x] 4.2 Scope: documentación breve de feature. Paths: `docs/features/web/app-shell-composition-root.md` (nuevo o update). Test-first note: N/A (doc task). Verify: objetivos, límites de dependencia y rollback por slice documentados.

## Phase 5: Post-verify remediation

- [x] 5.1 Scope: corrección de findings del verify report (`CRITICAL` + `WARNING` acotado). Paths: `apps/web/src/app-shell/AppShell.tsx`, `apps/web/src/features/shopping-list/services/adapters/AppShellListAdapter.ts`, tests asociados. Test-first: agregar tests RED para adapter de transformación y delegación desde AppShell. Verify: tests verdes en slice + lint sin `no-empty` en `AppShell.tsx`.
