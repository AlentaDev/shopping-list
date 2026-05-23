## Verification Report

**Change**: provider-aware-catalog-routing  
**Version**: re-run post verify-gap mini-fix  
**Mode**: Standard

### Completeness
| Metric | Value |
|--------|-------|
| Tasks total | 16 (+ 1 out-of-scope) |
| Tasks complete | 16 |
| Tasks incomplete | 0 core / 1 out-of-scope |

### Build & Tests Execution
**Build**: ➖ No ejecutado (verify enfocado a evidencia runtime de escenarios spec)

**Tests (rerun evidence)**:
- ✅ `pnpm vitest run src/features/catalog/services/useCatalog.test.tsx src/app-shell/useAppShellNavigation.test.ts src/app-shell/AppShell.test.tsx` (apps/web) → **27 passed / 0 failed**
- ✅ `pnpm vitest run src/features/catalog/services/useCatalog.test.tsx src/features/catalog/services/CatalogService.test.ts src/app-shell/useAppShellNavigation.test.ts` (apps/web) → **21 passed / 0 failed**
- ✅ `pnpm vitest run test/lists.test.ts src/modules/catalog/api/catalogRouter.test.ts src/modules/lists/domain/list.test.ts src/modules/lists/application/GetList.test.ts src/modules/lists/application/AddCatalogItem.test.ts src/modules/lists/infrastructure/PostgresListRepository.test.ts` (apps/api) → **65 passed / 0 failed**
- ✅ `pnpm --dir apps/api database:test:prepare && pnpm playwright test e2e/shopping-journey.spec.ts --grep "/catalog redirige, espera handshake y luego permite añadir producto"` (repo root) → **1 passed / 0 failed**

**Coverage**: ➖ No ejecutado en este rerun (sin porcentaje nuevo).

### Re-evaluación de hallazgos previos
| Hallazgo previo | Estado anterior | Estado actual | Evidencia |
|---|---|---|---|
| CRITICAL: escenario UNTESTED “Category history is isolated per provider” | ❌ UNTESTED | ✅ CLOSED | `apps/web/src/features/catalog/services/useCatalog.test.tsx` caso `aísla historial por user+provider y no filtra mercadona hacia carrefour` (líneas 485-538), suite pasada en runtime. |
| WARNING: “Home shows CTA ... AND no catalog data request required” parcial | ⚠️ PARTIAL | ✅ CLOSED | `apps/web/src/app-shell/useAppShellNavigation.test.ts` caso `renderiza home en / sin requerir request de catálogo` con `expect(fetchMock).not.toHaveBeenCalled()` (líneas 45-53), suite pasada en runtime. |
| WARNING: coherencia diseño handshake `api+auth+draft` | ⚠️ WARNING | ⚠️ OPEN (no bloqueante) | Se mantiene evidencia de gate WAITING/READY y validación backend por provider; falta prueba explícita de consumo frontend de `draft.provider.slug` como source of truth post-handshake. |

### Spec Compliance Matrix
| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| provider-aware-catalog-routing | Home shows CTA before catalog navigation | `useAppShellNavigation.test.ts > renderiza home en / sin requerir request de catálogo` | ✅ COMPLIANT |
| provider-aware-catalog-routing | Catalog route requires provider segment | `useAppShellNavigation.test.ts > renderiza catálogo en /mercadona/catalog` | ✅ COMPLIANT |
| provider-aware-catalog-routing | Redirect uses last provider | `useAppShellNavigation.test.ts > redirige /catalog al lastProvider guardado` | ✅ COMPLIANT |
| provider-aware-catalog-routing | Redirect falls back to mercadona | `useAppShellNavigation.test.ts > redirige /catalog a /mercadona/catalog cuando no hay lastProvider` | ✅ COMPLIANT |
| provider-aware-catalog-routing | Return to previous category for same provider | `useCatalog.test.tsx > reabre la última categoría guardada por user+provider` | ✅ COMPLIANT |
| provider-aware-catalog-routing | Fallback to first category when no history exists | `useCatalog.test.tsx > si no hay historial abre la primera categoría...` | ✅ COMPLIANT |
| provider-aware-catalog-routing | Category history is isolated per provider | `useCatalog.test.tsx > aísla historial por user+provider y no filtra mercadona hacia carrefour` | ✅ COMPLIANT |
| list-provider-ownership | New list stores provider FK | `apps/api/test/lists.test.ts` + migration `011_add_lists_provider_fk.sql` | ✅ COMPLIANT |
| list-provider-ownership | List views expose provider | `apps/api/src/modules/lists/application/GetList.test.ts` | ✅ COMPLIANT |
| list-provider-ownership | Empty draft can change provider | `apps/api/src/modules/lists/domain/list.test.ts` | ✅ COMPLIANT |
| list-provider-ownership | Non-empty/ACTIVE/COMPLETED cannot change provider | `apps/api/src/modules/lists/domain/list.test.ts` | ✅ COMPLIANT |
| list-provider-ownership | Legacy list receives mercadona backfill | SQL migration + backfill script | ✅ COMPLIANT |
| list-provider-ownership | Backfilled legacy list remains operable | `lists.test.ts` + `GetList.test.ts` legacy fallback | ✅ COMPLIANT |
| list-provider-ownership | Handshake-ready mutations use draft provider | `apps/api/src/modules/lists/application/AddCatalogItem.test.ts` | ✅ COMPLIANT |
| app-shell-composition-root | App shell composes provider-aware routes | `apps/web/src/app-shell/useAppShellNavigation.test.ts` | ✅ COMPLIANT |
| app-shell-composition-root | Reopen last category by user/provider | `apps/web/src/features/catalog/services/useCatalog.test.tsx` | ✅ COMPLIANT |
| app-shell-composition-root | Fallback without history | `apps/web/src/features/catalog/services/useCatalog.test.tsx` | ✅ COMPLIANT |
| app-shell-composition-root | WAITING disables actions + banner | `apps/web/src/app-shell/AppShell.test.tsx` | ✅ COMPLIANT |
| app-shell-composition-root | READY hides banner + shows toast | `apps/web/src/app-shell/AppShell.test.tsx` | ✅ COMPLIANT |

**Compliance summary**: **19/19 scenarios COMPLIANT**.

### Issues Found
**CRITICAL**:
- None.

**WARNING**:
1. Coherencia de diseño handshake (`api+auth+draft`) todavía parcial a nivel evidencia frontend de source-of-truth (`draft.provider.slug`) post-READY.

**SUGGESTION**:
1. Agregar test de integración web explícito que demuestre uso de `draft.provider.slug` en navegación/mutación luego de READY (o documentar formalmente que ese enforcement se delega íntegramente al backend).

### Verdict
**PASS WITH WARNINGS**

Se cerraron los hallazgos CRITICAL/WARNING del mini-fix (UNTESTED + home no-request). El verify **pasa** porque no quedan CRITICAL ni escenarios sin cobertura runtime aprobada.
