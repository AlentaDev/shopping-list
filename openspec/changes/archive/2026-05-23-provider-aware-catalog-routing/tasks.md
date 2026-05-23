# Tasks: Provider-aware Catalog Routing

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 650-900 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR1 (routing+catalog API) → PR2 (providers table + FK + list ownership) → PR3 (handshake UX + last-category navigation + docs+e2e) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|---|---|---|---|
| 1 | Rutas canónicas + alias + catálogo provider-aware | PR 1 | Tests unit/integration incluidos; base main |
| 2 | `providers` table + FK real en listas + invariantes + backfill | PR 2 | Depende PR1; incluye migración estructural + dominio/app/repos |
| 3 | Handshake UX + navegación última categoría + docs + 1 E2E | PR 3 | Depende PR2; cierra escenarios UX y contrato |

## Phase 1: Foundation Routing & Contract

- [x] 1.1 **Objetivo**: definir providers válidos y schemas de ruta; **Archivos**: `apps/api/src/modules/catalog/api/schemas.ts`, `apps/api/src/modules/catalog/api/catalogRouter.ts`; **Test first (RED)**: invalid provider/categoría retorna 400; **Acceptance**: rutas `/api/catalog/:provider/...` validadas por Zod.
- [x] 1.2 **Objetivo**: alias `/catalog` y rutas `/:provider/catalog`; **Archivos**: `apps/web/src/app-shell/useAppShellNavigation.ts`; **Test first (RED)**: redirect a `lastProvider` o `mercadona`; **Acceptance**: `/` home, `/catalog` alias, rutas canónicas resueltas.
- [x] 1.3 **Objetivo**: consumo frontend provider-aware; **Archivos**: `apps/web/src/features/catalog/services/CatalogService.ts`, `apps/web/src/features/catalog/services/useCatalog.ts`; **Test first (RED)**: endpoint incluye `provider`; **Acceptance**: no requests a rutas legacy sin `:provider`.

## Phase 2: Providers Table + List Ownership (CORE)

- [x] 2.1 **Objetivo**: crear modelo persistente `providers`; **Archivos**: `apps/api/src/modules/providers/*`, `apps/api/src/modules/lists/infrastructure/migrations/*`; **Test first (RED)**: seed inicial incluye `mercadona` con `slug` minúscula y `display_name` capitalizado; **Acceptance**: tabla `providers` disponible con constraints de unicidad por `slug`.
- [x] 2.2 **Objetivo**: migrar listas a FK real; **Archivos**: `apps/api/src/modules/lists/infrastructure/migrations/*`; **Test first (RED)**: migración crea `lists.provider_id` FK y rechaza ids inexistentes; **Acceptance**: FK efectiva (`lists.provider_id -> providers.id`) aplicada sin romper datos.
- [x] 2.3 **Objetivo**: backfill y endurecimiento; **Archivos**: `apps/api/src/modules/lists/infrastructure/{PostgresListRepository.ts,InMemoryListRepository.ts}`, migraciones; **Test first (RED)**: listas legacy sin provider se mapean a provider `mercadona`; **Acceptance**: `provider_id` backfilleado y listo para `NOT NULL`.
- [x] 2.4 **Objetivo**: invariantes de dominio por estado con provider resuelto; **Archivos**: `apps/api/src/modules/lists/domain/list.ts`, `apps/api/src/modules/lists/application/{CreateList,ListLists,GetList,AddCatalogItem,ports.ts}`; **Test first (RED)**: `DRAFT` vacío cambia provider, no-vacío/`ACTIVE`/`COMPLETED` rechazan; **Acceptance**: validación contra `provider.slug` resuelto desde FK.
- [x] 2.5 **Objetivo**: contrato DTO provider-friendly; **Archivos**: capa API/application de listas; **Test first (RED)**: summary/detail devuelven provider consistente (`slug`, `displayName`); **Acceptance**: frontend no depende de string ambiguo sin contexto.

## Phase 3: Handshake UX, Last-Category Navigation & Integration

- [x] 3.1 **Objetivo**: gate WAITING/READY y source-of-truth `draft.provider.slug` (resuelto desde FK); **Archivos**: `apps/web/src/app-shell/AppShell.tsx`; **Test first (RED)**: WAITING bloquea mutaciones, READY habilita; **Acceptance**: transición idempotente con estado explícito.
- [x] 3.2 **Objetivo**: acciones visibles pero deshabilitadas + skeleton/copy; **Archivos**: `apps/web/src/features/shopping-list/ShoppingList.tsx`, `apps/web/src/features/catalog/Catalog.tsx`, `apps/web/src/shared/constants/ui.ts`; **Test first (RED)**: banner persistente + toast breve al READY; **Acceptance**: UX no técnica conforme spec.
- [x] 3.3 **Objetivo**: wiring API listas con provider en validación y payload; **Archivos**: `apps/api/src/modules/lists/api/{router.ts,validation.ts}`; **Test first (RED)**: request inválida/provider mismatch rechazada; **Acceptance**: autorización/validación explícita por recurso.
- [x] 3.4 **Objetivo**: recordar última categoría por `user + provider`; **Archivos**: `apps/web/src/features/catalog/services/*`, `apps/web/src/app-shell/useAppShellNavigation.ts`; **Test first (RED)**: volver a `/:provider/catalog` reabre categoría previa; **Acceptance**: clave compuesta por usuario+provider.
- [x] 3.5 **Objetivo**: fallback determinístico sin historial; **Archivos**: `apps/web/src/features/catalog/services/useCatalog.ts`; **Test first (RED)**: si no existe historial, abre primera categoría; **Acceptance**: criterio de apertura inicial estable y testeado.

## Phase 4: Verification & Documentation

- [x] 4.1 **Objetivo**: integrar cobertura de escenarios SDD; **Archivos**: tests web/api tocados en fases 1-3; **Test first (RED)**: escenarios `/catalog` alias, handshake READY, fallback legacy; **Acceptance**: CORE 100% en servicios/adapters/context relevantes e IMPORTANT ≥80%.
- [x] 4.2 **Objetivo**: E2E crítico único; **Archivos**: `e2e/*catalog*` (nuevo o ajuste); **Test first (RED)**: `/catalog` redirige, espera handshake, luego add item habilitado; **Acceptance**: 1 happy path estable sin duplicación de unitarias.
- [x] 4.3 **Objetivo**: documentar contratos finales; **Archivos**: `docs/features/web/provider-aware-catalog-routing.md`, `docs/features/api/list-provider-ownership.md`; **Test first**: N/A (doc); **Acceptance**: objetivo/endpoints/reglas/notas y transición legacy explícitos.

## Out of Scope / Next Step

- [ ] Evaluar persistencia de categorías en BBDD como cache con fallback al provider externo (nuevo change). No bloquear este change por esta evaluación.
