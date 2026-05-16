# Tareas: Listas agrupadas por categorías

## Pronóstico de carga de revisión

| Campo | Valor |
|-------|-------|
| Líneas estimadas a cambiar | 900-1300 |
| Riesgo del presupuesto de 400 líneas | Alto |
| PRs encadenadas recomendadas | Sí |
| Split sugerido | PR1 contratos+tests API → PR2 agrupación Web L1+tests → PR3 migración/agrupación Android+tests |
| Estrategia de entrega | ask-on-risk |
| Estrategia de cadena | completed |

Decisión requerida antes de apply: No
PRs encadenadas recomendadas: Sí
Estrategia de cadena: completed
Riesgo del presupuesto de 400 líneas: Alto

### Unidades de trabajo sugeridas

| Unidad | Objetivo | PR probable | Notas |
|------|------|-----------|-------|
| 1 | Snapshots backend + contrato de paridad de status | PR 1 | Base main; incluye tests CORE API |
| 2 | Adapters web/agrupación por categoría nivel 1 | PR 2 | Depende PR1; sin fetch en components |
| 3 | Android Room + mappers + agrupación UI nivel 1 | PR 3 | Depende PR1; validar migración y paridad |

## Fase 1: Base (contratos e invariantes de API)

- [x] 1.1 RED: Agregar tests en `apps/api/src/modules/lists/application/__tests__/AddCatalogItem.test.ts` para persistir `categorySnapshot`/`subcategorySnapshot` opcionales y fallback técnico `Sin categoría` sin lookups remotos en render.
- [x] 1.2 GREEN: Extender `apps/api/src/modules/lists/domain/list.ts` y `.../application/AddCatalogItem.ts` para snapshot al alta; ajustar a eje default **categoría nivel 1** como regla de cliente.
- [x] 1.3 REFACTOR: Actualizar `.../application/listItemDto.ts`, `.../application/GetList.ts`, `.../application/ReuseList.ts` preservando identidad canónica `sourceProductId`.

## Fase 2: Persistencia y compatibilidad de API

- [x] 2.1 RED: Tests de repositorio en `apps/api/src/modules/lists/infrastructure/__tests__/PostgresListRepository.test.ts` para filas nuevas y legacy (null snapshots) sin backfill.
- [x] 2.2 GREEN: Modificar `apps/api/src/modules/lists/infrastructure/PostgresListRepository.ts` para leer/escribir columnas nullable; eliminar tareas de migración histórica compleja.
- [x] 2.3 REFACTOR: Ajustar tests de status en `.../application/__tests__/ListLists*.test.ts` para `DRAFT/ACTIVE/COMPLETED` y default legacy sin `status`.

## Fase 3: Implementación web (agrupación L1)

- [x] 3.1 RED: Crear tests en `apps/web/src/features/shopping-list/services/groupItemsByCategory.test.ts` para regla `categorySnapshot` → `Sin categoría` (defensivo), orden estable y sin `subcategory` como eje.
- [x] 3.2 GREEN: Crear `apps/web/src/features/shopping-list/services/groupItemsByCategory.ts`; actualizar `.../services/adapters/ShoppingListItemAdapter.ts` y `apps/web/src/features/lists/services/adapters/ListAdapter.ts` para snapshots opcionales.
- [x] 3.3 RED/GREEN: Actualizar tests/componentes `apps/web/src/features/shopping-list/ShoppingList.tsx` y `.../components/ItemList.tsx` para render seccionado por categoría nivel 1 en DRAFT/ACTIVE/COMPLETED.

## Fase 4: Implementación Android (agrupación L1 + migración)

- [x] 4.1 RED: Tests de mapper/entidades en `apps/mobile-android/.../feature/listdetail` para snapshots nullable, identidad estable y grouping por `categorySnapshot`.
- [x] 4.2 GREEN: Modificar `.../data/dto/ItemDtos.kt`, `.../domain/entity/ListDetailEntities.kt`, `.../data/local`, `.../data/remote` con snapshots opcionales.
- [x] 4.3 RED/GREEN: `AppDatabaseMigrationTest` y cambios en `.../core/data/database/entity/RoomEntities.kt` + `AppDatabase.kt` para nuevas columnas nullable sin backfill.
- [x] 4.4 GREEN: Actualizar `.../ui/detail/ListDetailScreen.kt` para secciones por categoría nivel 1 con fallback defensivo `Sin categoría`.

## Fase 5: Verificación y documentación

- [x] 5.1 Ejecutar suites objetivo: API (`pnpm test --filter lists`), Web (`pnpm --dir apps/web test`), Android (tests de módulo + migración) y registrar evidencia por escenario de spec.
- [x] 5.2 Actualizar docs de feature en `docs/features/{api,web,mobile-android}` aclarando snapshots persistidos, default L1, fallback defensivo y bloqueo `409` por edición activa.
