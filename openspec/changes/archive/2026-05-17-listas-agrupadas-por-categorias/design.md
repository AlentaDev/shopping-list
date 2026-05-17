# Diseño: Listas agrupadas por categorías

## Enfoque técnico
Implementar un **snapshot híbrido de clasificación** en el item de lista (`categorySnapshot`, `subcategorySnapshot`) al momento de `AddCatalogItem`, propagarlo en DTOs, y resolver agrupación/ordenado en clientes con regla única: `categorySnapshot` como eje por defecto, `Sin categoría` como fallback defensivo y `subcategorySnapshot` como metadata opcional, sin lookups on-demand a Mercadona.

## Decisiones de arquitectura

| Decision | Option | Tradeoff | Final |
|---|---|---|---|
| Snapshot de clasificación | Resolver categoría en render consultando proveedor | Más acoplado, latencia, costo de red | Persistir snapshot al alta y reutilizarlo |
| Identidad de item catálogo | `serverItemId` como identidad cliente | Rompe dedupe cross-status/reuse | `sourceProductId` canónico; `serverItemId` técnico |
| Compatibilidad legacy | Backfill masivo histórico | Complejidad/migración riesgosa | Campos nullable + fallback local |
| Multi-status | Endpoint nuevo por status | Más superficie API | Reusar `GET /api/lists?status=` y default legacy |
| Agrupación UI | Agrupar en backend | Menos flexibilidad por cliente | Agrupar en servicios/adapters web/android |

## Flujo de datos

`Mercadona product` → `API AddCatalogItem` (snapshot persistido) → `ListRepository` (in-memory/Postgres) → `ListItemDto` (incluye snapshots) → `Web/Android adapters` (normalizan identidad + fallback label) → `UI grouped sections`.

Para históricos sin snapshot: `DTO` (nulls) → adapter aplica fallback local, **sin llamada a proveedor**.

## Cambios de archivos

| File | Action | Description |
|---|---|---|
| `apps/api/src/modules/lists/domain/list.ts` | Modify | Extender `CatalogListItem` con `categorySnapshot?` y `subcategorySnapshot?`. |
| `apps/api/src/modules/lists/application/AddCatalogItem.ts` | Modify | Poblar snapshots desde `MercadonaProductDetail` al alta. |
| `apps/api/src/modules/lists/application/listItemDto.ts` | Modify | Exponer snapshots opcionales en contrato API. |
| `apps/api/src/modules/lists/infrastructure/PostgresListRepository.ts` | Modify | Leer/escribir columnas snapshot; mapping nullable backward-compatible. |
| `apps/api/src/modules/lists/application/{GetList.ts,ReuseList.ts}` | Modify | Mantener snapshots en respuesta y en reuse sin afectar identidad. |
| `apps/web/src/features/lists/services/adapters/ListAdapter.ts` | Modify | Aceptar snapshots en `ListItem` DTO adaptado. |
| `apps/web/src/features/shopping-list/services/adapters/ShoppingListItemAdapter.ts` | Modify | Normalizar `sourceProductId` + mapear `category/subcategory` snapshot. |
| `apps/web/src/features/shopping-list/services/` (nuevo helper) | Create | `groupItemsByCategory.ts` con fallback defensivo y orden estable. |
| `apps/web/src/features/shopping-list/ShoppingList.tsx` | Modify | Reemplazar sort plano por secciones agrupadas por categoría nivel 1. |
| `apps/web/src/features/shopping-list/components/ItemList.tsx` | Modify | Render por grupos/subtítulos preservando acciones existentes. |
| `apps/mobile-android/.../feature/listdetail/data/dto/ItemDtos.kt` | Modify | DTO con `categorySnapshot`/`subcategorySnapshot` nullable. |
| `apps/mobile-android/.../feature/listdetail/domain/entity/ListDetailEntities.kt` | Modify | `CatalogItem` incluye snapshots de clasificación opcionales. |
| `apps/mobile-android/.../feature/listdetail/{data/local,data/remote}` | Modify | Persistir/leer snapshots en cache local y mapper remoto. |
| `apps/mobile-android/.../core/data/database/entity/RoomEntities.kt` | Modify | `ItemEntity` agrega columnas snapshot nullable. |
| `apps/mobile-android/.../core/data/database/AppDatabase.kt` | Modify | Versión + migración Room (add nullable columns). |
| `apps/mobile-android/.../feature/listdetail/ui/detail/ListDetailScreen.kt` | Modify | Secciones agrupadas por categoría nivel 1 con fallback local defensivo. |

## Interfaces / contratos

```ts
// API ListItemDto (catalog)
type ListItemDto = {
  id: string;
  sourceProductId?: string;
  categorySnapshot?: string | null;
  subcategorySnapshot?: string | null;
};

// Regla de agrupación cliente
groupKey = categorySnapshot?.trim()
  || "Sin categoría";
```

```kotlin
data class ListItemDto(
  val categorySnapshot: String? = null,
  val subcategorySnapshot: String? = null
)
```

## Estrategia de testing

| Capa | Qué testear | Enfoque |
|---|---|---|
| API domain/application (CORE 100%) | Snapshot persist en add/reuse, identidad canónica, filtros status + legacy default | TDD unitario en `AddCatalogItem`, `ListLists`, `ReuseList`, `listItemDto`; tests de repo mapping nullable |
| API infrastructure | Postgres read/write de nuevas columnas y compatibilidad con filas viejas | Tests repositorio con fixtures sin/cono snapshots |
| Web services/adapters (CORE/IMPORTANT) | Fallback `cat→Sin categoría`, dedupe por `sourceProductId` | Unit tests de adapter + helper grouping |
| Web components | Render agrupado en detalle/confección para DRAFT/ACTIVE/COMPLETED | RTL tests de `ShoppingList`/`ItemList` |
| Android data/domain (CORE) | Mapper remoto/local con nullable snapshots, Room migration V5→V6 | Unit tests mappers + `AppDatabaseMigrationTest` |
| Android UI (IMPORTANT) | Paridad de agrupación por estado | Tests ViewModel/UI state y composición de secciones |

## Migración / rollout

- **DB/API**: agregar columnas snapshot nullable en `list_items` (Postgres) y `ItemEntity` (Room). Sin backfill obligatorio.
- **Histórico**: no se implementa backfill/migración histórica compleja; para entorno de usuario se asume reset de BBDD cuando aplique.
- **Backward compatibility**: clientes viejos ignoran nuevos campos; requests sin `status` mantienen comportamiento actual.
- **Mercadona minimization**: clasificación solo al alta desde catálogo; render usa snapshots/cache/fallback local.
- **Rollout**: 1) backend contracts, 2) web grouping, 3) android migration+grouping, 4) verificación cross-platform.
- **Rollback**: desactivar grouping en UI (volver sort plano), conservar campos snapshot opcionales, mantener migraciones forward-compatible.

## Preguntas abiertas

- [x] Eje final de agrupación confirmado: categoría nivel 1 por `categorySnapshot`; `subcategorySnapshot` no define grupos.
