# Tasks: Fix Edit/Reuse Product ID Identity

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 420-560 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR1 identidad+adapters → PR2 autosave+recovery → PR3 UI integración+tests |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Modelo dual y normalización base | PR 1 | base=feature branch; incluye tests RED/GREEN adapters+context |
| 2 | Autosave y reconciliación `serverItemId` | PR 2 | base=PR1 branch; preserva single-draft + `editingTargetListId` |
| 3 | Wiring UI/API + regresiones de complete/reuse | PR 3 | base=PR2 branch; mantiene compat Android por `serverItemId` |

## Phase 1: Foundation (Identity Contract)

- [x] 1.1 **RED**: actualizar `apps/web/src/features/shopping-list/services/adapters/ShoppingListItemAdapter.test.ts` con casos `4706` vs `active-1:4706` y `serverItemId` separado.
- [x] 1.2 **GREEN**: modificar `.../ShoppingListItemAdapter.ts` para normalizar `sourceProductId` y mapear `payload.id` a `serverItemId`.
- [x] 1.3 **RED**: agregar tests en `apps/web/src/context/ListContext.test.tsx` para dedup por `sourceProductId` y merge (`qty=max`, `checked=OR`).
- [x] 1.4 **GREEN/REFACTOR**: ajustar `apps/web/src/context/ListContextValue.ts` y `ListContext.tsx` al contrato dual sin usar `id` técnico como clave canónica.

## Phase 2: Core Implementation (Autosave + Recovery)

- [x] 2.1 **RED**: extender `apps/web/src/features/shopping-list/services/adapters/AutosaveAdapter.test.ts` con migración legacy, dedup idempotente y conservación `editingTargetListId`.
- [x] 2.2 **GREEN**: implementar en `.../AutosaveAdapter.ts` normalización backward-compatible y reconciliación de `serverItemId` sin duplicados.
- [x] 2.3 **RED**: agregar tests en `apps/web/src/features/shopping-list/services/useAutosaveDraft.test.ts` para serialización canónica y single-draft por transición.
- [x] 2.4 **GREEN/REFACTOR**: actualizar `.../useAutosaveDraft.ts`, `.../useAutosaveRecovery.ts` y `.../services/types.ts` para identidad canónica estable.

## Phase 3: Integration (UI + API Mapping)

- [x] 3.1 **RED**: ampliar `apps/web/src/features/shopping-list/ShoppingList.test.tsx` con escenarios reuse/edit/autosave/finish sin colisiones de identidad.
- [x] 3.2 **GREEN**: ajustar `apps/web/src/features/catalog/Catalog.tsx` y `apps/web/src/features/shopping-list/ShoppingList.tsx` para operar por `sourceProductId` y resolver técnico por `serverItemId`.
- [x] 3.3 **RED/GREEN**: tests de servicios de complete/save verificando mapeo determinístico a `checkedItemIds` técnicos; permitir `checkedItemIds=[]`.

## Phase 4: Verification & Scope Guard

- [x] 4.1 Ejecutar suite objetivo (`adapters`, `ListContext`, `ShoppingList`, servicios complete/save) y confirmar 0 duplicados por `sourceProductId`.
- [x] 4.2 Verificar explícitamente que API mantiene `item.id={listId}:{productId}` y compatibilidad mobile (sin cambios funcionales Android).
- [x] 4.3 Documentar en `openspec/changes/fix-edit-reuse-product-id-identity/tasks.md` cualquier ajuste menor de orden de tareas durante apply. (Sin cambios de orden adicionales post-remediación.)
