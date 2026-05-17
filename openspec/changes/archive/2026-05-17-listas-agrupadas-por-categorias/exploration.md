## Exploración: listas-agrupadas-por-categorias

> Nota histórica: este documento conserva hipótesis iniciales. La decisión final vigente del change es **agrupación por categoría nivel 1 (`categorySnapshot`) por defecto**. `subcategorySnapshot` queda como metadata opcional y **no** como eje de agrupación.

### Estado actual
- **Backend listas**: `GET /api/lists` ya soporta `status` (`DRAFT|ACTIVE|COMPLETED`) con validación Zod (`apps/api/src/modules/lists/api/validation.ts`) y `ListLists` hoy excluye drafts por defecto si no se envía filtro (`apps/api/src/modules/lists/application/ListLists.ts`).
- **Backend detalle/items**: `GetList` devuelve `items` con snapshot de display (name/thumbnail/price/unit) y `sourceProductId`; se extiende para snapshot de clasificación sin depender de lookups en render (`apps/api/src/modules/lists/application/listItemDto.ts`, `.../AddCatalogItem.ts`).
- **Web listas**: `Lists` consume `getLists()` sin filtro, por lo que solo ve activas+completadas; la UI tiene tabs ACTIVE/COMPLETED (`apps/web/src/features/lists/Lists.tsx`, `.../components/ListsScreen.tsx`).
- **Web detalle**: renderiza items en lista plana; no hay agrupación por categoría nivel 1 en detalle de listas (`apps/web/src/features/lists/components/ListsScreen.tsx`).
- **Web shopping-list draft/edit**: sí existe `category` en `ShoppingListItem` y ordenamiento por categoría+nombre, pero el adapter de detalle actualmente setea `category: ""` al hidratar desde API (`apps/web/src/features/shopping-list/ShoppingList.tsx`, `.../services/adapters/ShoppingListItemAdapter.ts`).
- **Android listas**: flujo y storage están centrados en ACTIVE; `ListsViewModel` y `ListsLocalDataSource` refrescan/guardan solo activas (`apps/mobile-android/.../ListsViewModel.kt`, `.../ListsRemoteDataSource.kt`, `.../ListsLocalDataSource.kt`).
- **Android detalle**: items se muestran planos y el modelo local/remoto no incluye snapshots de clasificación (`apps/mobile-android/.../ListDetailScreen.kt`, `.../ItemDtos.kt`, `.../ListDetailEntities.kt`, `.../RoomEntities.kt`).

### Áreas afectadas
- `apps/api/src/modules/lists/application/AddCatalogItem.ts` — agregar snapshot de clasificación (categoría nivel 1 + subcategoría opcional) al persistir item catálogo.
- `apps/api/src/modules/lists/domain/list.ts` + `.../application/listItemDto.ts` — extender modelo/DTO para exponer metadata de agrupación sin depender del catálogo en render.
- `apps/api/src/modules/lists/application/ListLists.ts` + `.../api/router.ts` — habilitar estrategia de listado para draft/active/completed sin romper comportamiento legacy por defecto.
- `apps/web/src/features/lists/services/{types.ts,adapters/ListAdapter.ts,ListsService.ts}` — mapear nueva metadata y soportar consultas por status múltiples.
- `apps/web/src/features/lists/components/ListsScreen.tsx` — nueva vista agrupada/ordenada por categoría nivel 1 para detalle y/o colecciones.
- `apps/web/src/features/shopping-list/services/adapters/ShoppingListItemAdapter.ts` — reconciliar `ids canónicos + snapshot display` con clasificación consistente en draft/edit/reuse.
- `apps/mobile-android/app/src/main/java/.../feature/lists/{data,domain,ui}` — extender fetch/cache para draft/active/completed y ajustar UI de listas.
- `apps/mobile-android/app/src/main/java/.../feature/listdetail/{data,domain,ui}` + `core/data/database/{entity,dao}` — snapshot de clasificación y agrupación por categoría nivel 1 en pantalla de detalle.

### Enfoques
1. **Resolver categoría on-demand contra catálogo (sin snapshot)**
   - Pros: no toca contrato de item de lista.
   - Cons: rompe offline-first, agrega ráfagas de llamadas a proveedor externo, mayor acoplamiento y latencia.
   - Effort: **Medium/High**.

2. **Snapshot-only de clasificación (sin identidad canónica explícita)**
   - Pros: habilita agrupación offline y estable.
   - Cons: no resuelve por completo colisiones de identidad en flujos draft/edit/reuse; riesgo de duplicados lógicos.
   - Effort: **Medium**.

3. **Híbrido recomendado: ids canónicos + snapshot display (categoría nivel 1 por defecto)**
   - Pros: mantiene consistencia de identidad (`sourceProductId` canónico + `serverItemId` técnico), render estable offline, evita consultas a catálogo para agrupar, y soporta orden determinístico cross-platform.
   - Cons: requiere migración de contratos DTO/storage y cobertura de regresión en web+android.
   - Effort: **High**.

### Decisión final (actualizada)
Adoptar el enfoque **híbrido** con estas reglas finales:
- Canonical identity: `sourceProductId` para semántica de producto + `serverItemId` para operaciones técnicas.
- Snapshot display: persistir en item de lista `categorySnapshot` y `subcategorySnapshot` opcional, derivados al agregar desde catálogo.
- Regla de presentación por defecto: **agrupar por categoría nivel 1 (`categorySnapshot`)**, luego ordenar por nombre de item; fallback defensivo a "Sin categoría" cuando falte metadata.
- Política histórica: **sin backfill/migración histórica compleja**; si el entorno lo requiere, el usuario resetea su BBDD.
- Listas por estado: exponer draft/active/completed en ambos clientes con orden estable por estado + `updatedAt`/`activatedAt` según negocio.

### Riesgos
- **Migración de datos**: snapshots históricos pueden faltar; se resuelve con fallback defensivo en adapters/UI, sin backfill obligatorio.
- **Compatibilidad API**: agregar campos a DTO debe ser backward-compatible para clientes existentes.
- **Android Room**: cambio de esquema en `ItemEntity` implica migración segura y tests de upgrade.
- **Carga de backend**: si se agrega endpoint agregado por estados múltiples, evitar N+1 y mantener simplicidad del módulo lists.
- **Cobertura TDD**: riesgo de regresión en flujos edit/reuse/complete si no se testea mapeo canónico↔técnico.

### Dependencias
- Contrato de catálogo debe proveer categoría nivel 1 al momento de alta de item.
- Alineación de naming cross-app para nuevos campos (`categorySnapshot`, `subcategorySnapshot`) y política de fallback.
- Definir estrategia de consulta para listas por estado en Android (hoy solo ACTIVE en repositorio/local cache).

### Preguntas abiertas
- ¿Draft debe mostrarse como sección/tab propia o mezclada en "Activas" con prioridad visual?
- ¿Orden global requerido entre estados: `DRAFT -> ACTIVE -> COMPLETED` o mantener `ACTIVE` primero por UX actual?
- ¿Agrupación por categoría nivel 1 aplica también en modal de detalle web actual y en detalle Android, o solo en pantallas de listas agrupadas?

### Listo para proposal
**Sí** — con estas decisiones base, el siguiente paso es `sdd-propose` definiendo contrato API/DTO, plan de migración (web storage + Room), y estrategia TDD por capa (backend application+api, web services+components, android data/domain/ui).
