# Progreso de apply: listas-agrupadas-por-categorias

## Modo
Strict TDD

## Carga de trabajo / Límite de PR
- Modo: slice de PR encadenada
- Estrategia de cadena: feature-branch-chain
- Slice actual: estabilización final — snapshots, agrupación cross-platform, 409 edit-lock, cierre de docs y verify
- Rama base objetivo para este slice: `main`
- Dependencia hija: todos los slices de implementación ya están mergeados; este pase solo sincroniza artefactos.
- Límite de rollback: revertir solo actualizaciones de documentación/OpenSpec para este change.

## Tareas completadas
- [x] 1.1 RED: Tests for optional `categorySnapshot` / `subcategorySnapshot` + defensive `Sin categoría` fallback.
- [x] 1.2 GREEN: Domain and AddCatalogItem extended to persist optional snapshots on catalog add.
- [x] 1.3 REFACTOR: DTO and reuse flow propagate snapshot metadata while preserving canonical `sourceProductId` identity.
- [x] 3.1 RED: Tests for `categorySnapshot` default axis with fallback `Sin categoría`, stable ordering, and no subcategory axis.
- [x] 3.2 GREEN: Added `groupItemsByCategory` and updated web adapters/services to propagate optional snapshots.
- [x] 3.3 RED/GREEN: Updated `ShoppingList` + `ItemList` and RTL/unit tests for sectioned render by category level 1.
- [x] 4.1 RED: Android tests added for nullable snapshots mapping and category L1 grouping behavior.
- [x] 4.2 GREEN: Android DTO/domain/local/remote now propagate `categorySnapshot` + `subcategorySnapshot` as nullable metadata.
- [x] 4.3 RED/GREEN: Room schema version bumped with migration `5→6` adding nullable snapshot columns, migration test added.
- [x] 4.4 GREEN: ListDetail UI now renders grouped sections by category level 1 with defensive `Sin categoría` fallback.
- [x] 2.1 RED: Added repository RED coverage for snapshot columns (`category_snapshot` / `subcategory_snapshot`) and legacy rows without snapshot columns.
- [x] 2.2 GREEN: `PostgresListRepository` now reads/writes nullable snapshot columns while preserving legacy null/default compatibility.
- [x] 2.3 REFACTOR: Extended status tests for explicit `DRAFT/ACTIVE/COMPLETED` filters and legacy default behavior when `status` is absent.
- [x] Fix final: el autosave web rehidrata metadata snapshot y mantiene agrupación estable después de recargar.
- [x] Fix final: las vistas web `DRAFT` / `ACTIVE` / `COMPLETED` agrupan por `categorySnapshot` L1.
- [x] Fix final: API `complete` devuelve `409 list_editing_locked` cuando una lista `ACTIVE` sigue en modo edición.
- [x] Fix final: Android maneja el mismo conflicto de edit-lock en complete y mantiene alineada la migración snapshot de Room.
- [x] Artefactos de docs y OpenSpec actualizados para reflejar el comportamiento final implementado.

## Tareas pendientes
Sin tareas pendientes.

## Evidencia del ciclo TDD
| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 | `apps/api/src/modules/lists/application/AddCatalogItem.test.ts` | Unit | ✅ `AddCatalogItem.test.ts` baseline green | ✅ Added failing behavior assertions first | ✅ `pnpm test ...AddCatalogItem.test.ts` passing | ✅ 2 cases (snapshots present / snapshots missing) | ✅ Shared draft fixture and deterministic expectations |
| 1.2 | `apps/api/src/modules/lists/application/AddCatalogItem.test.ts` | Unit | ✅ Same baseline | ✅ Existing tests drove production changes | ✅ Targeted suite green after implementation | ✅ Provider data with and without category metadata | ✅ Snapshot extraction helper isolated |
| 1.3 | `apps/api/src/modules/lists/application/ReuseList.test.ts` | Unit | ✅ Reuse/ListLists baseline green | ✅ Expectations updated for DTO contract extension | ✅ `pnpm test ...ReuseList.test.ts ...ListLists.test.ts` passing | ✅ Multiple catalog reuse scenarios covered | ✅ DTO propagation centralized in `toListItemDto` |
| 3.1 | `apps/web/src/features/shopping-list/services/groupItemsByCategory.test.ts` | Unit | ✅ Existing shopping-list adapter/list tests baseline green | ✅ Added failing assertions for category L1 + fallback + stable order + subcategory ignored | ✅ Group helper implemented and tests pass | ✅ Mixed snapshot/legacy items and repeated names | ✅ Grouping normalized into dedicated helper |
| 3.2 | `apps/web/src/features/shopping-list/services/adapters/ShoppingListItemAdapter.test.ts`, `apps/web/src/features/lists/services/adapters/ListAdapter.test.ts` | Unit | ✅ Adapter tests already in suite | ✅ Extended expectations for optional snapshot propagation | ✅ Adapter changes satisfy new assertions | ✅ DTO payloads with/without snapshots | ✅ Snapshot fields kept optional and backward compatible |
| 3.3 | `apps/web/src/features/shopping-list/components/ItemList.test.tsx`, `apps/web/src/features/shopping-list/ShoppingList.test.tsx` | Component/RTL | ✅ Existing ShoppingList suite baseline green | ✅ Added section-header assertions and fallback heading assertion first | ✅ Component updates pass all targeted suites | ✅ Covers grouped headings in detail modal states | ✅ Group rendering isolated in ItemList via groupedItems contract |
| 4.1 | `apps/mobile-android/app/src/test/java/com/alentadev/shopping/feature/listdetail/data/remote/ListDetailRemoteDataSourceTest.kt`, `.../data/local/ListDetailLocalDataSourceTest.kt`, `.../ui/detail/ListDetailGroupingTest.kt` | Unit | ✅ Existing listdetail tests baseline green | ✅ Added failing assertions first for nullable snapshots + grouping axis category L1 + fallback | ✅ DTO/domain/local/remote/group helper changes made tests pass | ✅ Mixed catalog/manual + missing category snapshot + subcategory variance | ✅ Grouping isolated in pure helper, keeping UI composable simple |
| 4.3 | `apps/mobile-android/app/src/test/java/com/alentadev/shopping/core/data/database/AppDatabaseMigrationTest.kt` | Unit | ✅ Existing migration tests baseline green | ✅ Added failing migration assertion for new nullable columns | ✅ Added migration `MIGRATION_5_6` and DB version wiring | ✅ Validated both `categorySnapshot` + `subcategorySnapshot` add statements | ✅ Migration added forward-only without backfill |
| 2.1 | `apps/api/src/modules/lists/infrastructure/PostgresListRepository.test.ts` | Unit | ✅ Baseline green (`PostgresListRepository.test.ts` + `ListLists.test.ts`) | ✅ Added failing assertions for snapshot columns in persisted/new rows and legacy rows without columns | ✅ Repository mapping+insert updated and tests passing | ✅ Cases for new rows with snapshots + legacy rows without snapshot fields | ✅ Mapping/query constants kept centralized in repository helpers |
| 2.3 | `apps/api/src/modules/lists/application/ListLists.test.ts` | Unit | ✅ Baseline green (`ListLists.test.ts`) | ✅ Added failing assertions for explicit `DRAFT`/`ACTIVE` and legacy missing-status behavior | ✅ `ListLists` normalization passes targeted suite | ✅ Covers explicit `DRAFT`, `ACTIVE`, `COMPLETED` and legacy no-status path | ✅ Legacy normalization extracted to dedicated helper |

## Evidencia de verificación
- Command: `pnpm test src/modules/lists/application/AddCatalogItem.test.ts src/modules/lists/application/ReuseList.test.ts src/modules/lists/application/ListLists.test.ts`
- Result: 3 files, 10 tests passing.
- Command: `pnpm test src/features/shopping-list/services/groupItemsByCategory.test.ts src/features/shopping-list/services/adapters/ShoppingListItemAdapter.test.ts src/features/shopping-list/components/ItemList.test.tsx src/features/shopping-list/ShoppingList.test.tsx src/features/lists/services/adapters/ListAdapter.test.ts`
- Result: 5 files, 51 tests passing.
- Command: `./gradlew testLocalDebugUnitTest --tests "*ListDetailRemoteDataSourceTest" --tests "*ListDetailLocalDataSourceTest" --tests "*ListDetailGroupingTest" --tests "*AppDatabaseMigrationTest"`
- Result: 4 targeted Android suites passing (localDebug).
- Command: `pnpm test src/modules/lists/infrastructure/PostgresListRepository.test.ts src/modules/lists/application/ListLists.test.ts`
- Result: 2 files, 13 tests passing.

## Sincronización final de artefactos
- `tasks.md`: phases 1-5 fully checked.
- `verify-report.md`: final PASS status with only real policy warnings.
- `openspec/specs/*`: synced source-of-truth specs for grouping, status parity, and item identity.
- `docs/features/*`: concise platform docs for web, API, and Android.

## Desvíos respecto del diseño
- Grouping default remains aligned to **category level 1** per updated task/user decision. `subcategorySnapshot` is preserved as optional metadata for compatibility, but not used as grouping axis in web PR2.

## Issues detectados
- `MercadonaProductDetail` does not guarantee explicit category/subcategory fields in its typed contract; implementation reads optional keys defensively and falls back to `Sin categoría` when absent.
- Existing OpenSpec docs/spec text still references subcategory as default in parts of proposal/spec; implementation follows the explicitly requested PR2 rule (category level 1 default).
- `testDebugUnitTest` task is flavor-ambiguous in this Android project; targeted verification must use `testLocalDebugUnitTest` (or `testProdDebugUnitTest`) explicitly.
