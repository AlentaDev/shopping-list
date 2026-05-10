# Archive Report: fix-edit-reuse-product-id-identity

## Status
- Archive mode: **hybrid**
- Verification gate: **PASS WITH WARNINGS**
- CRITICAL issues: **0**
- WARNING issues: **1** (evidencia parcial en confirmación de overwrite en reuse con draft existente)

## Final Delivered Scope
- Identidad dual de ítems en frontend (`sourceProductId` canónico + `serverItemId` técnico opcional).
- Normalización/deduplicación robusta para entradas legacy mixtas (`idProducto` vs `idLista:idProducto`).
- Reconciliación de `serverItemId` en autosave sin duplicados.
- Preservación de `editingTargetListId` en ciclo de edición.
- Mapeo determinístico a IDs técnicos para operaciones save/complete.
- Sin cambios de contrato backend (`item.id={listId}:{productId}`) ni cambios funcionales en Android.

## Specs Sync
| Domain | Action | Details |
|---|---|---|
| `shopping-list-item-identity` | Created | Se promovió el spec delta completo a `openspec/specs/shopping-list-item-identity/spec.md` (nuevo dominio; sin merge destructivo). |

## Archive Move
- From: `openspec/changes/fix-edit-reuse-product-id-identity/`
- To: `openspec/changes/archive/2026-05-10-fix-edit-reuse-product-id-identity/`

## Traceability (Engram Observation IDs)
- explore: **#72** (`sdd/fix-edit-reuse-product-id-identity/explore`)
- proposal: **#73** (`sdd/fix-edit-reuse-product-id-identity/proposal`)
- spec: **#75** (`sdd/fix-edit-reuse-product-id-identity/spec`)
- design: **#76** (`sdd/fix-edit-reuse-product-id-identity/design`)
- tasks: **#78** (`sdd/fix-edit-reuse-product-id-identity/tasks`)
- apply-progress: **#79** (`sdd/fix-edit-reuse-product-id-identity/apply-progress`)
- verify-report: **#82** (`sdd/fix-edit-reuse-product-id-identity/verify-report`)

## Residual Risks
1. Cobertura de evidencia parcial para el escenario "reuse con draft existente" (falta test dedicado de confirmación explícita antes de overwrite).

## Optional Next Actions
1. Agregar test dedicado en boundary service/UI para confirmar prompt de reemplazo cuando existe draft autosave.
2. Agregar aserción E2E/contract del payload `completeList(..., { checkedItemIds: [] })` para trazabilidad de contrato extremo a extremo.

## Closure
Cambio archivado formalmente. El ciclo SDD queda completo (explore → propose → spec → design → tasks → apply → verify → archive).
