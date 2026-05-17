# Archive Report — listas-agrupadas-por-categorias

## Status
- Archive mode: **hybrid**
- Verification gate: **PASS**
- CRITICAL issues: **0**
- WARNING issues: **1** (CORE coverage warning from repo policy; non-blocking)

## Final Delivered Scope
- Listas agrupadas por `categorySnapshot` nivel 1 por defecto.
- `subcategorySnapshot` queda como metadata opcional, sin rol de agrupación.
- Snapshots de categoría/subcategoría persistidos desde alta de catálogo y expuestos en DTOs backend.
- Recuperación cross-platform por `DRAFT/ACTIVE/COMPLETED` sin romper comportamiento legacy.
- Identidad canónica de ítems preservada con `sourceProductId` y `serverItemId` técnico.

## Specs Sync
| Domain | Action | Details |
|---|---|---|
| `list-category-grouping` | No-op / already aligned | El main spec ya reflejaba el eje `categorySnapshot` y el fallback `Sin categoría`; no se requirió merge destructivo. |
| `list-status-multi-view` | No-op / already aligned | El main spec ya cubría recuperación por status y paridad cross-platform. |
| `shopping-list-item-identity` | Updated | Se reforzó la cláusula de identidad canónica para explicitar snapshots como metadata no-identity. |

## Archive Move
- From: `openspec/changes/listas-agrupadas-por-categorias/`
- To: `openspec/changes/archive/2026-05-17-listas-agrupadas-por-categorias/`

## Verification Summary
- `verify-report.md` revisado: **PASS**, sin issues CRITICAL.
- No se detectó riesgo de merge destructivo al sincronizar specs.

## Risks
1. `openspec/config.yaml` no está presente en el repo, así que no hubo `rules.archive` específicas para aplicar.
2. La advertencia de cobertura CORE sigue siendo un warning de política del repo, no un bloqueo funcional.

## Closure
El cambio quedó archivado y el ciclo SDD está cerrado.
