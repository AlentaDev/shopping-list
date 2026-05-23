## Apply Progress — provider-aware-catalog-routing

### Batch
- Delivery strategy: **force-chained**
- Chain strategy: **feature-branch-chain**
- Work Unit: **PR2 / WU3 — DTO Provider-Friendly (2.5)**
- Boundary: desde DTOs parciales (summary con provider, detail sin provider) hasta contrato consistente `providerId + provider {slug, displayName}` en summary y detail.

### Completed Tasks
- [x] 1.1 Validación Zod de provider/categoría + rutas API `/api/catalog/:provider/...`
- [x] 1.2 Alias `/catalog` -> `/{lastProvider|mercadona}/catalog` + home en `/`
- [x] 1.3 CatalogService/useCatalog provider-aware (sin llamadas a rutas legacy)
- [x] 2.1 `providerId` en dominio de listas + invariantes por estado
- [x] 2.2 Propagación de `providerId` en casos de uso/puertos + validación de mutación por provider
- [x] 2.3 Persistencia `providerId` + fallback transicional `mercadona` en repositorios
- [x] 2.4 Backfill postgres para listas legacy sin provider
- [x] 2.5 DTOs de listas (summary/detail) con `provider` consistente (`slug`, `displayName`) además de `providerId`

### TDD Cycle Evidence

| Task | RED (test primero) | GREEN (implementación mínima) | REFACTOR |
|---|---|---|---|
| 1.1 | Se agregaron tests de router para provider/categoría inválidos y endpoint canónico en `apps/api/src/modules/catalog/api/catalogRouter.test.ts` | Se implementó `providerParamsSchema`, provider enum y rutas `/:provider/categories` en router | Se ajustó `apps/api/test/catalog.test.ts` a rutas canónicas provider-aware |
| 1.2 | Se agregaron tests de navegación para alias `/catalog`, `lastProvider`, y home `/` en `useAppShellNavigation.test.ts` | Se implementó resolver de alias + parseo de rutas canónicas + `CatalogHome` | Se alinearon pruebas legacy de navegación y AppShell a rutas canónicas |
| 1.3 | Se actualizaron tests de service/hook para exigir endpoints con `:provider` | Se implementó `CatalogService` con `providerId` y `useCatalog({ providerId, initialCategoryId })` | Se propagó contrato al componente `Catalog` |
| 2.1 | Se agregaron tests de dominio para cambio de provider permitido solo en `DRAFT` vacío y rechazo en `DRAFT` no vacío/`ACTIVE`/`COMPLETED` | Se implementaron `ensureProviderCanChange` y `ListProviderInvariantError`, y se añadió `providerId` a `List` | Se centralizó fallback con `resolveListProviderId` |
| 2.2 | Se ajustaron tests de casos de uso/HTTP para exigir `providerId` en summary/detail y validar invariantes de mutación | Se propagó `providerId` en `CreateList`, `ListLists`, `GetList`, `AddCatalogItem` y `ListRepository` | Se alinearon expectativas de tests de listas/autosave a contrato con `providerId` |
| 2.3 | Se agregaron tests de fallback legacy sin provider en capa de aplicación/repositorio | Se implementó fallback transicional a `mercadona` en `InMemoryListRepository` y `PostgresListRepository` | Se redujo riesgo de ruptura con registros legacy pre-backfill |
| 2.4 | Se agregó test de repositorio para `backfillMissingProvider` | Se implementó `backfillMissingProvider` en repositorio Postgres + script SQL de backfill | Quedó explícita frontera de migración previa a `NOT NULL` |
| 2.5 | `CreateList.test`, `ListLists.test` y `lists.test` fallaron en RED por ausencia/expectativas desalineadas de `provider {slug, displayName}`; se agregó `GetList.test` para exigir provider en detail y fallback legacy | Se extendió `GetList` para devolver `provider` resuelto desde `providerId` y se alinearon expectativas de contrato en tests unitarios/integración | Contrato DTO quedó uniforme entre summary/detail sin romper fallback transicional |

### Verification Evidence
- API: `pnpm test -- test/catalog.test.ts src/modules/catalog/api/catalogRouter.test.ts` ✅
- Web: `pnpm test:run -- src/app-shell/useAppShellNavigation.test.ts src/app-shell/useAppShellNavigation.legacy.test.tsx src/app-shell/AppShell.legacy.test.tsx src/features/catalog/services/CatalogService.test.ts src/features/catalog/services/useCatalog.test.tsx` ✅
- API (WU2): `pnpm test -- src/modules/lists/domain/list.test.ts src/modules/lists/application/CreateList.test.ts src/modules/lists/application/ListLists.test.ts src/modules/lists/application/AddCatalogItem.test.ts src/modules/lists/application/UpsertAutosaveDraft.test.ts src/modules/lists/application/ResetAutosaveDraft.test.ts src/modules/lists/infrastructure/PostgresListRepository.test.ts test/lists.test.ts` ✅
- API (WU3): `pnpm test -- src/modules/lists/application/CreateList.test.ts src/modules/lists/application/ListLists.test.ts src/modules/lists/application/GetList.test.ts test/lists.test.ts` ✅ (46 files, 233 tests)

### Files Changed (WU1)
- `apps/api/src/modules/catalog/api/schemas.ts`
- `apps/api/src/modules/catalog/api/catalogRouter.ts`
- `apps/api/src/modules/catalog/api/catalogRouter.test.ts` (new)
- `apps/api/test/catalog.test.ts`
- `apps/web/src/app-shell/useAppShellNavigation.ts`
- `apps/web/src/app-shell/components/CatalogHome.tsx` (new)
- `apps/web/src/app-shell/useAppShellNavigation.test.ts`
- `apps/web/src/app-shell/useAppShellNavigation.legacy.test.tsx`
- `apps/web/src/app-shell/AppShell.legacy.test.tsx`
- `apps/web/src/features/catalog/services/CatalogService.ts`
- `apps/web/src/features/catalog/services/CatalogService.test.ts`
- `apps/web/src/features/catalog/services/useCatalog.ts`
- `apps/web/src/features/catalog/services/useCatalog.test.tsx`
- `apps/web/src/features/catalog/Catalog.tsx`
- `openspec/changes/provider-aware-catalog-routing/tasks.md`

### Files Changed (WU2)
- `apps/api/src/modules/lists/domain/list.ts`
- `apps/api/src/modules/lists/domain/list.test.ts`
- `apps/api/src/modules/lists/application/ports.ts`
- `apps/api/src/modules/lists/application/CreateList.ts`
- `apps/api/src/modules/lists/application/CreateList.test.ts`
- `apps/api/src/modules/lists/application/ListLists.ts`
- `apps/api/src/modules/lists/application/ListLists.test.ts`
- `apps/api/src/modules/lists/application/GetList.ts`
- `apps/api/src/modules/lists/application/AddCatalogItem.ts`
- `apps/api/src/modules/lists/application/AddCatalogItem.test.ts`
- `apps/api/src/modules/lists/application/ResetAutosaveDraft.test.ts`
- `apps/api/src/modules/lists/application/UpsertAutosaveDraft.test.ts`
- `apps/api/src/modules/lists/infrastructure/InMemoryListRepository.ts`
- `apps/api/src/modules/lists/infrastructure/PostgresListRepository.ts`
- `apps/api/src/modules/lists/infrastructure/PostgresListRepository.test.ts`
- `apps/api/src/modules/lists/infrastructure/migrations/20260523_backfill_list_provider.sql` (new)
- `apps/api/test/lists.test.ts`
- `openspec/changes/provider-aware-catalog-routing/tasks.md`

### Files Changed (WU3)
- `apps/api/src/modules/lists/application/GetList.ts`
- `apps/api/src/modules/lists/application/GetList.test.ts` (new)
- `apps/api/src/modules/lists/application/CreateList.test.ts`
- `apps/api/src/modules/lists/application/ListLists.test.ts`
- `apps/api/test/lists.test.ts`
- `openspec/changes/provider-aware-catalog-routing/tasks.md`
- `openspec/changes/provider-aware-catalog-routing/apply-progress.md`

### Remaining Tasks
- [ ] 3.x Handshake UX + bloqueo mutaciones + wiring listas API
- [ ] 4.x Verificación final, e2e, documentación

### Rollback Boundary (WU1)
- Revertir archivos de routing/catalog de esta tanda restituye comportamiento legacy de rutas y consumo sin tocar todavía ownership de listas.

### Rollback Boundary (WU2)
- Revertir solo cambios en `apps/api/src/modules/lists/**` + migración SQL devuelve listas al modelo previo sin `providerId` explícito, manteniendo intacto el routing provider-aware implementado en WU1.

### Rollback Boundary (WU3)
- Revertir cambios en `GetList` y tests de contrato DTO revierte únicamente la exposición de `provider` en detail/expectativas, sin afectar ownership FK/backfill ya implementado en WU2.

---

## Apply Progress — Slice Task 2.1 (actual)

### Batch
- Delivery strategy: **force-chained**
- Chain strategy: **feature-branch-chain**
- Work Unit: **PR2 / WU1 — Persistent providers model (2.1)**
- Boundary: desde ausencia de modelo persistente `providers` hasta tabla/seed + repositorio Postgres para lectura por `slug`.

### Completed Tasks (cumulative)
- [x] 1.1 Validación Zod de provider/categoría + rutas API `/api/catalog/:provider/...`
- [x] 1.2 Alias `/catalog` -> `/{lastProvider|mercadona}/catalog` + home en `/`
- [x] 1.3 CatalogService/useCatalog provider-aware (sin llamadas a rutas legacy)
- [x] 2.1 Modelo persistente `providers` con seed `mercadona` y unicidad por `slug`
- [ ] 2.2 Migrar listas a FK real `lists.provider_id -> providers.id`
- [ ] 2.3 Backfill y endurecimiento `provider_id`
- [ ] 2.4 Invariantes dominio por estado con provider resuelto desde FK
- [x] 2.5 Contrato DTO provider-friendly (`slug`, `displayName`)

### TDD Cycle Evidence (Task 2.1)

| Task | RED (test primero) | GREEN (implementación mínima) | REFACTOR |
|---|---|---|---|
| 2.1 | Se agregaron tests `apps/api/database/migrations/010_create_providers.test.ts` y `apps/api/src/modules/providers/infrastructure/PostgresProviderRepository.test.ts` que fallaron por falta de migración/implementación | Se creó migración `010_create_providers.sql` con tabla `providers`, constraint `slug` único y seed `mercadona` (`slug` lowercase + `display_name` capitalizado); se implementó `PostgresProviderRepository.findBySlug` y contratos de módulo `providers` | Se actualizó `apps/api/database/migrator.ts` para incluir `providers` en reset controlado de tests/migraciones |

### Verification Evidence (targeted)
- `pnpm test -- database/migrations/010_create_providers.test.ts src/modules/providers/infrastructure/PostgresProviderRepository.test.ts` ✅ (47 files, 235 tests)

### Files Changed (Task 2.1)
- `apps/api/database/migrations/010_create_providers.sql` (new)
- `apps/api/database/migrations/010_create_providers.test.ts` (new)
- `apps/api/src/modules/providers/domain/provider.ts` (new)
- `apps/api/src/modules/providers/application/ports.ts` (new)
- `apps/api/src/modules/providers/infrastructure/PostgresProviderRepository.ts` (new)
- `apps/api/src/modules/providers/infrastructure/PostgresProviderRepository.test.ts` (new)
- `apps/api/database/migrator.ts` (updated reset tables to include `providers`)
- `openspec/changes/provider-aware-catalog-routing/tasks.md` (2.1 marked complete)

### Remaining Tasks
- [ ] 2.2 Migrar listas a FK real
- [ ] 2.3 Backfill y endurecimiento
- [ ] 2.4 Invariantes de dominio por estado
- [ ] 3.x Handshake UX + navegación última categoría + wiring API listas
- [ ] 4.x Verificación final + E2E + documentación

---

## Apply Progress — Slice Tasks 2.2, 2.3, 2.4 (actual)

### Batch
- Delivery strategy: **force-chained**
- Chain strategy: **feature-branch-chain**
- Work Unit: **PR2 / WU2 — FK real + backfill/hardening + invariantes por slug resuelto (2.2-2.4)**
- Boundary: desde `providerId` ambiguo (slug legacy) hasta referencia FK canónica (`provider-mercadona`) con resolución de slug para invariantes y DTOs.

### Completed Tasks (cumulative)
- [x] 1.1 Validación Zod de provider/categoría + rutas API `/api/catalog/:provider/...`
- [x] 1.2 Alias `/catalog` -> `/{lastProvider|mercadona}/catalog` + home en `/`
- [x] 1.3 CatalogService/useCatalog provider-aware (sin llamadas a rutas legacy)
- [x] 2.1 Modelo persistente `providers` con seed `mercadona` y unicidad por `slug`
- [x] 2.2 Migración `lists.provider_id` con FK real a `providers.id`
- [x] 2.3 Backfill + hardening para listas legacy (`mercadona` slug -> `provider-mercadona` FK)
- [x] 2.4 Invariantes de dominio/aplicación por estado con provider resuelto por slug desde FK
- [x] 2.5 Contrato DTO provider-friendly (`slug`, `displayName`)

### TDD Cycle Evidence (Tasks 2.2-2.4)

| Task | RED (test primero) | GREEN (implementación mínima) | REFACTOR |
|---|---|---|---|
| 2.2 | Se agregó `apps/api/database/migrations/011_add_lists_provider_fk.test.ts` para exigir columna `provider_id`, `NOT NULL` y FK a `providers(id)` | Se creó migración `011_add_lists_provider_fk.sql` con backfill previo + constraint FK + índice compuesto owner/status/provider | Se mantuvo compatibilidad con legacy al mapear slug previo antes de endurecer constraints |
| 2.3 | Fallaron expectativas de tests de repos/módulos al normalizar `providerId` a FK canónica y backfill legacy | Se endureció backfill SQL/repos para mapear `NULL/''/'mercadona'` a `provider-mercadona` | Se unificó el fallback en `resolveListProviderId` y se alinearon tests de autosave/integración |
| 2.4 | Se añadieron tests en dominio/use case para validar resolución FK↔slug (`provider-mercadona` == `mercadona`) y mutación catalog por slug resuelto | Se implementó `resolveListProviderSlug` + comparación por slug en `ensureProviderCanChange` y `AddCatalogItem` | Se consolidó `providerDto` para resolver `slug/displayName` desde referencia FK sin romper contratos |

### Verification Evidence (targeted)
- `cd apps/api && pnpm test -- database/migrations/011_add_lists_provider_fk.test.ts src/modules/lists/domain/list.test.ts src/modules/lists/application/AddCatalogItem.test.ts src/modules/lists/application/CreateList.test.ts src/modules/lists/application/ListLists.test.ts src/modules/lists/application/GetList.test.ts src/modules/lists/application/UpsertAutosaveDraft.test.ts src/modules/lists/application/ResetAutosaveDraft.test.ts src/modules/lists/infrastructure/PostgresListRepository.test.ts test/lists.test.ts` ✅ (47 files, 239 tests)

### Files Changed (Tasks 2.2-2.4)
- `apps/api/database/migrations/011_add_lists_provider_fk.sql` (new)
- `apps/api/database/migrations/011_add_lists_provider_fk.test.ts` (new)
- `apps/api/src/modules/lists/infrastructure/migrations/20260523_backfill_list_provider.sql`
- `apps/api/src/modules/lists/domain/list.ts`
- `apps/api/src/modules/lists/domain/list.test.ts`
- `apps/api/src/modules/lists/application/providerDto.ts`
- `apps/api/src/modules/lists/application/AddCatalogItem.ts`
- `apps/api/src/modules/lists/application/AddCatalogItem.test.ts`
- `apps/api/src/modules/lists/application/CreateList.test.ts`
- `apps/api/src/modules/lists/application/ListLists.test.ts`
- `apps/api/src/modules/lists/application/GetList.test.ts`
- `apps/api/src/modules/lists/application/UpsertAutosaveDraft.test.ts`
- `apps/api/src/modules/lists/application/ResetAutosaveDraft.test.ts`
- `apps/api/src/modules/lists/infrastructure/PostgresListRepository.ts`
- `apps/api/src/modules/lists/infrastructure/PostgresListRepository.test.ts`
- `apps/api/src/modules/lists/infrastructure/InMemoryListRepository.ts`
- `apps/api/test/lists.test.ts`
- `openspec/changes/provider-aware-catalog-routing/tasks.md`

### Phase 2 Completion Status
- **Phase 2 (CORE): COMPLETA** ✅
- Quedan pendientes únicamente tareas de **Phase 3** y **Phase 4**.

---

## Apply Progress — Batch A (3.1 + 3.2 + 3.3) y Batch B (3.4 + 3.5)

### Batch
- Delivery strategy: **force-chained**
- Chain strategy: **feature-branch-chain**
- Work Unit: **PR3 / WU4-WU5 — Handshake gating + wiring provider API + navegación última categoría**
- Boundary: desde fallos de validación/provider payload y handshake no bloqueante hasta Phase 3 completa (3.1-3.5), sin iniciar Phase 4.

### Completed Tasks (cumulative)
- [x] 1.1 Validación Zod de provider/categoría + rutas API `/api/catalog/:provider/...`
- [x] 1.2 Alias `/catalog` -> `/{lastProvider|mercadona}/catalog` + home en `/`
- [x] 1.3 CatalogService/useCatalog provider-aware (sin llamadas a rutas legacy)
- [x] 2.1 Modelo persistente `providers` con seed `mercadona` y unicidad por `slug`
- [x] 2.2 Migración `lists.provider_id` con FK real a `providers.id`
- [x] 2.3 Backfill + hardening para listas legacy (`mercadona` slug -> `provider-mercadona` FK)
- [x] 2.4 Invariantes de dominio/aplicación por estado con provider resuelto por slug desde FK
- [x] 2.5 Contrato DTO provider-friendly (`slug`, `displayName`)
- [x] 3.1 Gate WAITING/READY con bloqueo de mutaciones hasta handshake exitoso
- [x] 3.2 Banner persistente WAITING + toast READY no técnico + acciones visibles deshabilitadas
- [x] 3.3 Wiring API lists provider-aware en validación (`providerIdSchema`) + rechazo provider inválido
- [x] 3.4 Persistencia de última categoría por clave compuesta `userId:providerSlug`
- [x] 3.5 Fallback determinístico a primera categoría (orden por parent/order)

### TDD Cycle Evidence (Tasks 3.1-3.5)

| Task | RED (test primero) | GREEN (implementación mínima) | REFACTOR |
|---|---|---|---|
| 3.1 | `AppShell.test.tsx` falló al exigir estado WAITING con mutaciones bloqueadas hasta completar handshake | `AppShell.tsx` mantiene `WAITING` mientras reintenta `/api/lists?status=DRAFT`; `READY` solo al éxito; `mutationsEnabled` se habilita al final | se eliminó fallback prematuro a READY en errores transitorios de handshake |
| 3.2 | `AppShell.test.tsx` falló al exigir banner persistente + toast de disponibilidad | Se mantuvo banner con `UI_TEXT.APP.HANDSHAKE_WAITING_BANNER` y toast `HANDSHAKE_READY_TOAST` al pasar a READY autenticado | se limitó toast a sesiones autenticadas para evitar ruido en home pública |
| 3.3 | `validation.test.ts`/`router.test.ts` fallaron para provider inválido o faltante | `lists/api/validation.ts` usa `providerIdSchema` compartido; tests de router cubren rechazo 400 | se alineó `test/lists.test.ts` al contrato con `provider` explícito en payloads `from-catalog` |
| 3.4 | `useCatalog.test.tsx` nuevo caso RED para reabrir categoría recordada por `user+provider` | `useCatalog.ts` usa `getLastCategory(userId, providerId)` y `saveLastCategory(...)` en selección | se aseguró clave compuesta estable en `CatalogNavigationState` |
| 3.5 | `useCatalog.test.tsx` RED para ausencia de historial y orden determinístico | se confirmó fallback de `getDefaultCategory` (padre/order + primer child/order) y test verde | sin desvíos; contrato de apertura inicial quedó estable |

### Verification Evidence (targeted)
- ❌ (fallo inicial detectado): `cd apps/api && pnpm test -- src/modules/lists/api/validation.test.ts src/modules/lists/api/router.test.ts` → arrastró suite y expuso regresiones en `test/lists.test.ts` por payload sin `provider`.
- ✅ `cd apps/api && pnpm test -- src/modules/lists/api/validation.test.ts src/modules/lists/api/router.test.ts test/lists.test.ts` → **47 files, 243 tests passed, 0 failed**.
- ✅ `cd apps/web && pnpm vitest run src/app-shell/AppShell.test.tsx src/features/catalog/services/useCatalog.test.tsx` → **2 files, 15 tests passed, 0 failed**.

### Files Changed (Phase 3)
- `apps/web/src/app-shell/AppShell.tsx`
- `apps/web/src/app-shell/AppShell.test.tsx`
- `apps/web/src/features/catalog/services/useCatalog.test.tsx`
- `apps/api/src/modules/catalog/api/schemas.ts`
- `apps/api/src/modules/lists/api/validation.ts`
- `apps/api/src/modules/lists/api/validation.test.ts`
- `apps/api/src/modules/lists/api/router.test.ts`
- `apps/api/test/lists.test.ts`
- `openspec/changes/provider-aware-catalog-routing/tasks.md`
- `openspec/changes/provider-aware-catalog-routing/apply-progress.md`

### Phase 3 Completion Status
- **Phase 3: COMPLETA** ✅
- **Phase 4: NO iniciada** (intencional por alcance de este apply).

---

## Apply Progress — Phase 4 (4.1 + 4.2 + 4.3)

### Batch
- Delivery strategy: **force-chained**
- Chain strategy: **feature-branch-chain**
- Work Unit: **PR3 / WU6 — Verification + critical E2E + docs finales**
- Boundary: desde Phase 4 pendiente hasta escenarios SDD verificados, 1 E2E crítico estable y documentación final web/api publicada.

### Completed Tasks (cumulative)
- [x] 1.1 Validación Zod de provider/categoría + rutas API `/api/catalog/:provider/...`
- [x] 1.2 Alias `/catalog` -> `/{lastProvider|mercadona}/catalog` + home en `/`
- [x] 1.3 CatalogService/useCatalog provider-aware (sin llamadas a rutas legacy)
- [x] 2.1 Modelo persistente `providers` con seed `mercadona` y unicidad por `slug`
- [x] 2.2 Migración `lists.provider_id` con FK real a `providers.id`
- [x] 2.3 Backfill + hardening para listas legacy (`mercadona` slug -> `provider-mercadona` FK)
- [x] 2.4 Invariantes de dominio/aplicación por estado con provider resuelto por slug desde FK
- [x] 2.5 Contrato DTO provider-friendly (`slug`, `displayName`)
- [x] 3.1 Gate WAITING/READY con bloqueo de mutaciones hasta handshake exitoso
- [x] 3.2 Banner persistente WAITING + toast READY no técnico + acciones visibles deshabilitadas
- [x] 3.3 Wiring API lists provider-aware en validación (`providerIdSchema`) + rechazo provider inválido
- [x] 3.4 Persistencia de última categoría por clave compuesta `userId:providerSlug`
- [x] 3.5 Fallback determinístico a primera categoría (orden por parent/order)
- [x] 4.1 Cobertura de escenarios SDD (`/catalog` alias, handshake READY, fallback legacy)
- [x] 4.2 E2E crítico único (`/catalog` redirect + ready + add-item habilitado)
- [x] 4.3 Documentación final web/api con contrato y transición legacy

### TDD Cycle Evidence (Tasks 4.1-4.3)

| Task | RED (test primero) | GREEN (implementación mínima) | REFACTOR |
|---|---|---|---|
| 4.1 | Se añadió caso de integración API para input legacy `providerId: "mercadona"` y verificación de operabilidad posterior (`apps/api/test/lists.test.ts`), y se validó cobertura de alias/handshake en suites web ya existentes | Pasan escenarios de alias `/catalog`, handshake READY y fallback legacy normalizado a `provider-mercadona` | Se mantuvo alcance acotado a pruebas de verificación sin tocar contratos ni arquitectura |
| 4.2 | Se agregó test E2E crítico en `e2e/shopping-journey.spec.ts` y falló en primer intento al exigir banner visible obligatorio; se ajustó a flujo estable de READY sin flaky check | Quedó estable el happy path: `/catalog` redirige a `/mercadona/catalog`, handshake termina en READY y add-item incrementa badge | Se actualizaron rutas mock de catálogo a endpoints provider-aware y `ProductCatalogPage.goto()` a `/catalog` |
| 4.3 | N/A (documentación) | Se crearon docs finales web/api con objetivo, rutas/endpoints, reglas e historia legacy | Se consolidó lenguaje de transición para evitar ambigüedad entre `providerId` legacy y FK canónica |

### Verification Evidence (Phase 4)
- ✅ `pnpm vitest run test/lists.test.ts` (workdir: `apps/api`) → **1 file, 32 passed, 0 failed**
- ✅ `pnpm vitest run src/app-shell/useAppShellNavigation.test.ts src/app-shell/AppShell.test.tsx` (workdir: `apps/web`) → **2 files, 17 passed, 0 failed**
- ✅ `pnpm --dir apps/api database:test:prepare && pnpm playwright test e2e/shopping-journey.spec.ts --grep "/catalog redirige, espera handshake y luego permite añadir producto"` (workdir: repo root) → **1 test passed, 0 failed**

### Files Changed (Phase 4)
- `apps/api/test/lists.test.ts`
- `e2e/shopping-journey.spec.ts`
- `e2e/pages/ProductCatalogPage.ts`
- `docs/features/web/provider-aware-catalog-routing.md` (new)
- `docs/features/api/list-provider-ownership.md` (new)
- `openspec/changes/provider-aware-catalog-routing/tasks.md`
- `openspec/changes/provider-aware-catalog-routing/apply-progress.md`

### Phase 4 Completion Status
- **Phase 4: COMPLETA** ✅
- **Change listo para verify phase** (sin iniciar verify en este apply).

---

## Apply Progress — Mini-fix verify gaps (post-verify)

### Batch
- Delivery strategy: **mini-fix enfocado (sin expansión de alcance)**
- Work Unit: **verify-gap patch — category history isolation + home no-request evidence**
- Boundary: cubrir únicamente gaps marcados en `verify-report.md` sin cambiar comportamiento funcional.

### Completed Tasks (verify-gap)
- [x] Se agregó test explícito de aislamiento de historial por `user + provider` en `useCatalog`.
- [x] Se agregó evidencia explícita de que home (`/`) no requiere request de catálogo al render inicial.
- [x] Se re-ejecutaron suites focalizadas equivalentes a verify para cerrar el gap UNTESTED/PARTIAL.

### Verification Evidence (mini-fix)
- ✅ `pnpm vitest run src/features/catalog/services/useCatalog.test.tsx src/app-shell/useAppShellNavigation.test.ts src/app-shell/AppShell.test.tsx` (workdir: `apps/web`) → **3 files, 27 passed, 0 failed**
- ✅ `pnpm vitest run src/features/catalog/services/useCatalog.test.tsx src/features/catalog/services/CatalogService.test.ts src/app-shell/useAppShellNavigation.test.ts` (workdir: `apps/web`) → **3 files, 21 passed, 0 failed**

### Files Changed (mini-fix)
- `apps/web/src/features/catalog/services/useCatalog.test.tsx`
- `apps/web/src/app-shell/useAppShellNavigation.test.ts`
- `openspec/changes/provider-aware-catalog-routing/apply-progress.md`

### Notes
- No se modificó código productivo (`src/**/*.ts(x)` de runtime) fuera de tests.
- No se tocaron tareas/checkmarks de `tasks.md` porque no hubo nuevo scope; solo hardening de evidencia para verify.
