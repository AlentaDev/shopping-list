## Exploration: fix-edit-reuse-product-id-identity

### Current State
- **Backend canonicaliza identidad de catálogo por persistencia** con `item.id = {listId}:{sourceProductId}` y `sourceProductId` normalizado al último segmento (`apps/api/src/modules/lists/application/itemIdNormalization.ts`).
- **Reuse/edit/autosave backend** mantienen una sola draft autosave por usuario (selecciona latest + limpia stale) y reconstruyen IDs técnicos en transición draft↔active (`ReuseList.ts`, `StartListEditing.ts`, `FinishListEdit.ts`, `ResetAutosaveDraft.ts`, `UpsertAutosaveDraft.ts`).
- **Frontend usa doble identidad simultánea**:
  - `ListContext` deduplica por `item.id` (no por `sourceProductId`) (`apps/web/src/context/ListContext.tsx`).
  - Catálogo agrega items con `id = product.id` (`apps/web/src/features/catalog/Catalog.tsx`).
  - Reuse/autosave rehidratan items con `id` técnico proveniente de API (`.../ShoppingListItemAdapter.ts`, `.../AutosaveAdapter.ts`).
- **Normalización web actual es frágil**: intenta remover prefijo usando `sourceProductId.startsWith("${item.id}:")`; esto solo funciona para casos tipo `active-1:4706:4706`, pero no para `sourceProductId = active-1:4706` cuando `item.id = active-1:4706` (caso real de persistencia). Resultado: `sourceProductId` puede quedar técnico en cliente.

### Affected Areas
- `apps/web/src/features/shopping-list/services/adapters/ShoppingListItemAdapter.ts` — normalización `sourceProductId` incorrecta para formato canónico `{listId}:{productId}`.
- `apps/web/src/features/shopping-list/services/adapters/AutosaveAdapter.ts` — misma lógica frágil en recuperación de autosave.
- `apps/web/src/features/shopping-list/services/useAutosaveDraft.ts` — serializa autosave desde estado cliente mezclando ids técnicos/no técnicos.
- `apps/web/src/context/ListContext.tsx` — merge/dedup por `id`, causa coexistencia de `productId` y `listId:productId`.
- `apps/web/src/features/catalog/Catalog.tsx` — alta de item usa `product.id` como identidad UI.
- `apps/api/src/modules/lists/application/{UpsertAutosaveDraft,StartListEditing,FinishListEdit,ReuseList}.ts` — backend asume y reconstruye identidad técnica; hoy compensa parcialmente pero no corrige el estado cliente inconsistente.
- `apps/web/src/features/lists/ListsContainer.tsx` + `apps/api/src/modules/lists/application/CompleteList.ts` — complete usa `checkedItemIds` exactos; si en cliente se pierde referencia o se muta identidad antes de persistir, aparecen inconsistencias aguas abajo.

### Approaches
1. **Canonical UI Identity = `sourceProductId` (recomendado)**
   - Descripción: introducir identidad de cliente explícita para catálogo (ej. `clientKey = sourceProductId`), mantener `id` técnico solo como referencia de servidor (`serverItemId`). Dedup/merge/autosave en web por `sourceProductId`; API sigue persistiendo `{listId}:{sourceProductId}`.
   - Pros:
     - Elimina colisiones `productId` vs `listId:productId` en origen.
     - Compatible con regla de “draft web maneja items con `idProducto`”.
     - Mantiene invariante de una sola draft por usuario sin cambiar modelo backend.
   - Cons:
     - Requiere ajustar tipos/mappers web (ListContext + adapters + autosave mapping).
     - Debe preservarse `serverItemId` para operaciones API que hoy usan `item.id` (remove/update/check).
   - Effort: **Medium**.

2. **Canonical UI Identity = `id` técnico (`listId:productId`) en todos los flujos autenticados**
   - Descripción: al agregar desde catálogo en contexto de lista remota, generar `id` técnico temprano y usarlo en todo el cliente.
   - Pros:
     - Alineación 1:1 con persistencia backend.
     - Menos traducciones en requests de update/remove/complete.
   - Cons:
     - Rompe expectativa explicitada de draft web basada en `idProducto`.
     - Complejiza flujos local-draft/offline y UX antes de tener `listId` estable.
   - Effort: **High**.

3. **Parche incremental de normalizadores actuales**
   - Descripción: mejorar funciones `normalizeSourceProductId` para extraer último segmento por `:` y agregar dedup puntual al rehidratar/autosave.
   - Pros:
     - Cambio pequeño y rápido.
   - Cons:
     - Mitiga síntomas pero deja ambigüedad de identidad en modelo cliente.
     - Riesgo alto de regresiones futuras al seguir mezclando semánticas de `id`.
   - Effort: **Low**.

### Recommendation
Adoptar **Approach 1**. Separar explícitamente en cliente:
- `sourceProductId` = identidad canónica de dominio UI (dedup, merge, autosave input).
- `serverItemId` = identidad técnica para endpoints que lo necesiten.

Con esto, reuse/edit/autosave/complete operan sobre UNA sola identidad de negocio en web, mientras backend conserva su identidad de persistencia `{listId}:{productId}`.

### Domain Invariants (propuestos)
1. **Cliente (catálogo)**: identidad canónica MUST ser `sourceProductId` (`idProducto`) en draft local y autosave UI.
2. **Persistencia backend**: `item.id` MUST ser `{listId}:{normalize(sourceProductId)}` para items catálogo; `sourceProductId` MUST guardarse sin prefijo de lista.
3. **Merge/Dedup**: al fusionar drafts o rehidratar, items catálogo con mismo `sourceProductId` MUST colapsar en un único item (resolver qty según regla vigente).
4. **Edición activa**: autosave draft de edición MUST mantener `editingTargetListId` y esa relación MUST ser la fuente de verdad para finish/cancel edit.
5. **Single Draft**: por usuario MUST existir a lo sumo una autosave draft activa; drafts stale MUST eliminarse en cada transición edit/reuse/reset.

### Risks
- **Migración de storage web**: `lists.localDraft` y snapshots antiguos pueden contener `sourceProductId` técnico y/o ids duplicados; se necesita normalización de lectura backward-compatible.
- **Operaciones por id técnico**: remove/update/check podrían romperse si se pierde `serverItemId`; hay que mapear correctamente al invocar API.
- **Conflictos multi-tab**: cambios de identidad en cliente impactan comparación de borradores (`areDraftsEqual`) y flujo de conflictos.
- **Datos mixtos existentes en DB**: aunque backend normaliza, puede haber registros históricos inconsistentes que requieran dedup defensivo en adapters.

### Ready for Proposal
**Yes** — listo para pasar a `sdd-propose` con foco en: (a) modelo de identidad cliente dual (`sourceProductId` + `serverItemId`), (b) plan de migración localStorage sin ruptura, (c) pruebas RED-GREEN en adapters/context/autosave/editing flows.
