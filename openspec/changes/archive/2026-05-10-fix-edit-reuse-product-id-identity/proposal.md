# Proposal: Fix Edit/Reuse Product ID Identity

## Intent
Resolver inconsistencias de identidad de ítems entre catálogo, reuse, edición y autosave para evitar duplicados, referencias rotas y pérdida de relación con la lista origen, manteniendo el contrato actual backend de una sola draft por usuario.

## Scope

### In Scope
- Definir identidad canónica de cliente para ítems catálogo como `sourceProductId` y conservar `serverItemId` separado para operaciones API.
- Normalizar rehidratación (reuse/autosave) y deduplicación en frontend por `sourceProductId`.
- Preservar `editingTargetListId`, flujo de confirmación de reemplazo de draft en reuse y consistencia de autosave.
- Incorporar migración backward-compatible de drafts locales con IDs técnicos/mixtos.

### Out of Scope
- Cambiar formato canónico backend `item.id = {listId}:{productId}`.
- Reescribir arquitectura de listas, sincronización multi-dispositivo o política de conflictos multi-tab completa.

## Capabilities

### New Capabilities
- `shopping-list-item-identity`: modelo de identidad dual en web (`sourceProductId` dominio + `serverItemId` técnico) con dedup estable en edit/reuse/autosave.

### Modified Capabilities
- None.

## Approach
MVP mínimo: mantener backend intacto y corregir el modelo en web. `ListContext` y adapters operan con clave canónica `sourceProductId`; `serverItemId` se usa solo al invocar endpoints que requieren ID técnico (update/remove/check/complete). En lectura de drafts/autosave se normalizan IDs legacy y se colapsan duplicados por `sourceProductId`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/web/src/context/ListContext.tsx` | Modified | Merge/dedup por `sourceProductId` |
| `apps/web/src/features/shopping-list/services/adapters/ShoppingListItemAdapter.ts` | Modified | Separar `sourceProductId` y `serverItemId` |
| `apps/web/src/features/shopping-list/services/adapters/AutosaveAdapter.ts` | Modified | Normalización y dedup backward-compatible |
| `apps/web/src/features/shopping-list/services/useAutosaveDraft.ts` | Modified | Serialización consistente con identidad canónica |
| `apps/web/src/features/catalog/Catalog.tsx` | Modified | Alta de ítems con identidad de dominio coherente |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Ruptura en operaciones API por pérdida de ID técnico | Med | Mantener `serverItemId` explícito + tests de contrato |
| Drafts legacy duplicados en localStorage | High | Migración de lectura idempotente + dedup defensivo |
| Regresión en flujo edit/reuse con draft activa | Med | Tests RED-GREEN en reuse/edit/autosave y confirmación |

## Rollback Plan
Revertir cambios frontend de identidad, restaurar dedup por `item.id`, y mantener normalizadores previos. Si aparece regresión, desactivar migración de lectura y volver al comportamiento actual sin tocar persistencia backend.

## Dependencies
- `openspec/changes/fix-edit-reuse-product-id-identity/exploration.md`
- Engram `sdd/fix-edit-reuse-product-id-identity/explore`

## Success Criteria
- [ ] Reuse/edit/autosave no generan duplicados para un mismo `sourceProductId`.
- [ ] Se mantiene máximo una draft autosave por usuario y reuse respeta confirmación de reemplazo.
- [ ] `editingTargetListId` persiste sin pérdida durante editar/finalizar/cancelar.
- [ ] Operaciones API que usan ID técnico siguen funcionando con `serverItemId`.
