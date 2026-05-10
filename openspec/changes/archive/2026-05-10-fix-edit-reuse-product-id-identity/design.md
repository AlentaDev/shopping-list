# Design: Fix Edit/Reuse Product ID Identity

## Technical Approach

Implementar un modelo dual de identidad **solo en frontend**: `sourceProductId` (identidad de negocio canónica) y `serverItemId` (referencia técnica para endpoints). El backend queda intacto (`item.id = {listId}:{productId}`), y la corrección se concentra en normalización/hidratación, dedup determinístico y reconciliación post-autosave.

## Architecture Decisions

| Option | Tradeoff | Decision |
|---|---|---|
| Mantener `id` como clave única en UI | Rompe con snapshots mixtos (`4706` vs `list:4706`) y duplica ítems | ❌ |
| Separar `sourceProductId`/`serverItemId` en draft item | Requiere adaptación en servicios y context | ✅ |
| Cambiar contrato backend ahora | Alto riesgo cross-app, fuera de scope | ❌ |

| Option | Tradeoff | Decision |
|---|---|---|
| Dedup “last write wins” ciego | Puede perder `checked/qty` útil | ❌ |
| Dedup por clave canónica con merge explícito | Lógica adicional, pero predecible y testeable | ✅ |

## Data Flow

```text
Catalog/Add → ListContext(add/merge por sourceProductId)
          → useAutosaveDraft(serialize canónico)
          → PUT /api/lists/autosave
          → AutosaveAdapter(normaliza + reconcilia serverItemId)
          → rehydrate ListContext(sin duplicar)

Edit active list:
start editing (listId origen) → autosave draft conserva editingTargetListId
finish/cancel → usa listId origen + limpia draft/session marker
```

## File Changes

| File | Action | Description |
|---|---|---|
| `apps/web/src/context/ListContextValue.ts` | Modify | Formalizar shape item UI con `sourceProductId` requerido y `serverItemId` opcional. |
| `apps/web/src/context/ListContext.tsx` | Modify | Reducer por clave canónica `sourceProductId`; `update/remove` resuelven por `serverItemId ?? sourceProductId`. |
| `apps/web/src/features/catalog/Catalog.tsx` | Modify | Alta desde catálogo creando item con `sourceProductId=product.id` y `serverItemId` vacío. |
| `apps/web/src/features/shopping-list/services/adapters/ShoppingListItemAdapter.ts` | Modify | Hidratación: `sourceProductId` normalizado; `serverItemId` desde payload `id`. |
| `apps/web/src/features/shopping-list/services/adapters/AutosaveAdapter.ts` | Modify | Normalización legacy mixta + dedup + conservación de `editingTargetListId`. |
| `apps/web/src/features/shopping-list/services/useAutosaveDraft.ts` | Modify | Serialización canónica y reconciliación eventual de `serverItemId`. |
| `apps/web/src/features/shopping-list/ShoppingList.tsx` | Modify | Operaciones remove/increment/decrement por identidad canónica; edición activa preserva lista origen. |
| `apps/web/src/features/shopping-list/services/types.ts` | Modify | Nuevo draft item shape exacto para autosave input/output. |
| `apps/web/src/features/shopping-list/services/useAutosaveRecovery.ts` | Modify | Comparación/merge por clave canónica (no por `id` técnico). |
| `apps/web/src/features/shopping-list/services/adapters/*.test.ts` + `context/ListContext.test.tsx` + `ShoppingList.test.tsx` | Modify | Cobertura RED-GREEN de normalización, dedup, reconciliación y edit/reuse. |

## Interfaces / Contracts

```ts
type DraftItem = {
  sourceProductId: string;          // REQUIRED, canonical, no prefix listId:
  name: string;                     // REQUIRED
  qty: number;                      // REQUIRED, >=1
  checked: boolean;                 // REQUIRED
  kind: "catalog";                 // REQUIRED
  source: "mercadona";             // REQUIRED
  serverItemId?: string | null;     // OPTIONAL, technical server id
  thumbnail?: string | null;
  price?: number | null;
  unitSize?: number | null;
  unitFormat?: string | null;
  unitPrice?: number | null;
  isApproxSize?: boolean;
};
```

Invariantes:
1) `sourceProductId` trim no vacío y nunca `"{listId}:{productId}"`.
2) `serverItemId` MAY faltar en creación local; MUST poblarse al reconciliar.
3) Un solo ítem por `sourceProductId` en memoria/draft.

Normalización/hidratación legacy:
- Si entra `sourceProductId` vacío: derivar desde `id` (`list:x` → `x`, si no `id`).
- Si entra `sourceProductId` prefijado por `id + ':'`: remover prefijo.
- Guardar `serverItemId = payload.id` cuando exista.
- Ejecutar dedup idempotente post-normalización.

Autosave reconciliation (sin duplicar):
1) Indexar estado local por `sourceProductId`.
2) Adaptar respuesta server y normalizar.
3) Para cada item server: merge en la misma clave; completar `serverItemId` faltante.
4) Si hay dos entradas misma clave, mantener una: `qty=max`, `checked=OR`, `serverItemId` no nulo priorizado.
5) Preservar orden local estable.

Dedup canónica:
- Key: `canonicalKey = sourceProductId.trim()`.
- Merge: `qty = max(a.qty,b.qty)`, `checked = a.checked || b.checked`, metadata preferir valor no nulo más reciente.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit (CORE) | Normalización legacy, dedup, reconciliación de `serverItemId` | Tests en `ShoppingListItemAdapter.test.ts` y `AutosaveAdapter.test.ts` (100%). |
| Unit (CORE) | Reducer ListContext por `sourceProductId` | `ListContext.test.tsx` con casos mixtos `4706`/`list:4706`. |
| Integration (IMPORTANT) | Reuse/edit/autosave/finish sin colisiones | `ShoppingList.test.tsx` con mocks de `/reuse`, `/autosave`, `/finish-edit`. |
| Integration (IMPORTANT) | Complete/save mapean a IDs técnicos | Tests en servicios de listas verificando `checkedItemIds` determinísticos. |

## Migration / Rollout

Rollout seguro:
1) Activar normalización de lectura (backward-compatible, idempotente).
2) Activar escritura canónica en autosave/catalog.
3) Activar reconciliación `serverItemId` y dedup defensivo.

Rollback:
- Revertir adapters + reducer a comportamiento por `id`.
- Mantener snapshots existentes (la migración es de lectura, no destructiva).
- Validar que `/reuse`, `/autosave`, `/finish-edit` sigan operativos sin cambios backend.

## Open Questions

- [ ] Confirmar si `complete` desde vistas de listas necesita exponer `sourceProductId` explícito o alcanza con `item.id` técnico actual.
