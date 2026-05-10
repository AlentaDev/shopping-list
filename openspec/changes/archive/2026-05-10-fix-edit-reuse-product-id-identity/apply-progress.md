# Apply Progress — fix-edit-reuse-product-id-identity (Slices 1-3 + verify remediation)

## Scope applied
- Work-unit 1: dual identity base model in web (`sourceProductId` canonical + `serverItemId` technical optional).
- Work-unit 2: autosave/recovery canonical dedup + eventual `serverItemId` reconciliation sin duplicados.
- Work-unit 3: wiring UI/services para identidad canónica + mapeo técnico determinístico en complete/remove.
- Preservación de vínculo de edición (`editingTargetListId`) en payloads de draft cuando existe metadata de sesión.

## Tasks completed (cumulative)
- [x] 1.1 RED — tests for mixed identity + separated `serverItemId`.
- [x] 1.2 GREEN — adapter normalization and `serverItemId` mapping.
- [x] 1.3 RED — context tests for dedup by `sourceProductId` with merge (`qty=max`, `checked=OR`).
- [x] 1.4 GREEN/REFACTOR — context dual-contract adjustments.
- [x] 2.1 RED — tests en `AutosaveAdapter` para dedup legacy + edición activa.
- [x] 2.2 GREEN — dedup idempotente por clave canónica en `AutosaveAdapter`.
- [x] 2.3 RED — tests en `useAutosaveDraft` para serialización canónica sin duplicados.
- [x] 2.4 GREEN/REFACTOR — actualización de `useAutosaveDraft`, `useAutosaveRecovery` y `types` para identidad estable.
- [x] 3.1 RED — regresión en `ShoppingList.test.tsx` para borrado remoto con `serverItemId` técnico sin colisión canónica.
- [x] 3.2 GREEN — ajustes en `Catalog.tsx` + `ShoppingList.tsx` para mantener identidad canónica cliente y usar `serverItemId` en operaciones técnicas.
- [x] 3.3 RED/GREEN — tests de servicio `checkedItemIds` para mapeo determinístico y soporte `checkedItemIds=[]`.
- [x] R1 RED/GREEN — expected de `reuseList` actualizado para incluir `serverItemId` en `ListDetailActionsService.test.ts`.
- [x] R2 GREEN — fix de lint `no-unused-vars` en normalizadores de identidad (`ListContext`, `checkedItemIds`, `ShoppingListItemAdapter`).

## TDD Cycle Evidence
| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 | `apps/web/src/features/shopping-list/services/adapters/ShoppingListItemAdapter.test.ts` | Unit | ✅ baseline 10/10 | ✅ Written | ✅ Passed | ✅ 2+ casos (default + legacy mixed) | ✅ Clean |
| 1.2 | `apps/web/src/features/shopping-list/services/adapters/ShoppingListItemAdapter.test.ts` | Unit | ✅ baseline 10/10 | ✅ Covered by 1.1 RED | ✅ Passed | ✅ Covered by mixed + prefixed scenarios | ✅ Clean |
| 1.3 | `apps/web/src/context/ListContext.test.tsx` | Integration (provider+hook) | ✅ baseline 10/10 | ✅ Written | ✅ Passed | ✅ Caso mezclado + existing context paths | ✅ Clean |
| 1.4 | `apps/web/src/context/ListContext.test.tsx` | Integration (provider+hook) | ✅ baseline 10/10 | ✅ Covered by 1.3 RED | ✅ Passed | ✅ Dedup + merge assertions | ✅ Clean |
| 2.1 | `apps/web/src/features/shopping-list/services/adapters/AutosaveAdapter.test.ts` | Unit | ✅ baseline 24/24 | ✅ Written | ✅ Passed | ✅ mixed ids + editing metadata | ✅ Clean |
| 2.2 | `apps/web/src/features/shopping-list/services/adapters/AutosaveAdapter.test.ts` | Unit | ✅ baseline 24/24 | ✅ Covered by 2.1 RED | ✅ Passed | ✅ merge qty/checked + id técnico preferido | ✅ Clean |
| 2.3 | `apps/web/src/features/shopping-list/services/useAutosaveDraft.test.tsx` | Integration (hook+storage) | ✅ baseline 24/24 | ✅ Written | ✅ Passed | ✅ caso source limpio + mixed legacy | ✅ Clean |
| 2.4 | `apps/web/src/features/shopping-list/services/useAutosaveRecovery.test.tsx` | Integration (hook+service) | ✅ baseline 24/24 | ✅ Written | ✅ Passed | ✅ igualdad por sourceProductId (ignora id técnico) | ✅ Clean |
| 3.1 | `apps/web/src/features/shopping-list/ShoppingList.test.tsx` | Integration (component+remote delete) | ✅ baseline 33/33 | ✅ Written | ✅ Passed | ✅ caso canónico + server id técnico | ✅ Clean |
| 3.2 | `apps/web/src/features/catalog/Catalog.tsx`, `apps/web/src/features/shopping-list/ShoppingList.tsx` | UI wiring | ✅ baseline 33/33 | ✅ Covered by 3.1 RED | ✅ Passed | ✅ confirmación de operación técnica con identidad separada | ✅ Clean |
| 3.3 | `apps/web/src/features/lists/services/checkedItemIds.test.ts` | Unit (service) | ✅ baseline 10/10 (`ListsService`) | ✅ Written | ✅ Passed | ✅ mixed ids dedup + empty checked list | ✅ Clean |
| R1 | `apps/web/src/features/shopping-list/services/ListDetailActionsService.test.ts` | Unit (service) | ⚠️ baseline 9/10 + 1 falla esperada por verify finding | ✅ Written (expected con `serverItemId`) | ✅ Passed (10/10) | ✅ 2 casos en payload adaptado (`serverItemId` con valor y `null`) | ➖ None needed |
| R2 | `apps/web/src/context/ListContext.tsx`, `apps/web/src/features/lists/services/checkedItemIds.ts`, `apps/web/src/features/shopping-list/services/adapters/ShoppingListItemAdapter.ts` | Static/lint hygiene | ✅ baseline tests 24/24 en archivos impactados | ➖ N/A (sin cambio funcional) | ✅ `pnpm lint` sin errores | ➖ N/A | ✅ Renombre destructuring a `[, productId]` |

## Tests executed
```bash
pnpm test:run src/features/shopping-list/services/adapters/ShoppingListItemAdapter.test.ts src/context/ListContext.test.tsx
pnpm test:run src/features/shopping-list/services/adapters/AutosaveAdapter.test.ts src/features/shopping-list/services/useAutosaveDraft.test.tsx src/features/shopping-list/services/useAutosaveRecovery.test.tsx
pnpm test:run src/features/lists/services/checkedItemIds.test.ts src/features/shopping-list/ShoppingList.test.tsx src/features/lists/ListsContainer.test.tsx src/features/lists/services/ListsService.test.ts
pnpm test:run src/features/shopping-list/services/ListDetailActionsService.test.ts src/context/ListContext.test.tsx src/features/lists/services/checkedItemIds.test.ts src/features/shopping-list/services/adapters/ShoppingListItemAdapter.test.ts
pnpm lint
pnpm test:coverage
```

Result: ✅ remediación verify aplicada; tests focalizados verdes (24/24), lint web sin errores (warnings preexistentes), `test:coverage` verde (IMPORTANT 90.60% ≥ 80%; CORE warning preexistente).

## Remaining for verify
- Verify final puede usar este batch como evidencia de remediación mínima post-verify (sin cambios de scope).
- No mobile functional changes applied.
- No API contract change applied (`item.id={listId}:{productId}` untouched).
