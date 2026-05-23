# Archive Report — provider-aware-catalog-routing

## Status
- Archive mode: **openspec**
- Verification gate: **PASS WITH WARNINGS**
- CRITICAL issues: **0**
- WARNING issues: **1**

## Evidence of Sources Read
- `openspec/config.yaml`: `defaults.artifact_store: openspec` y fases incluyen `archive`.
- `openspec/changes/archive/2026-05-23-provider-aware-catalog-routing/proposal.md`: define rutas canónicas `/:provider/catalog` y FK real `lists.provider_id`.
- `openspec/changes/archive/2026-05-23-provider-aware-catalog-routing/design.md`: confirma decisiones de arquitectura (`providers + lists.provider_id` FK, alias `/catalog`, handshake gate).
- `openspec/changes/archive/2026-05-23-provider-aware-catalog-routing/tasks.md`: 16/16 tareas in-scope completadas, 1 out-of-scope pendiente.
- `openspec/changes/archive/2026-05-23-provider-aware-catalog-routing/verify-report.md`: `CRITICAL: None` y `Verdict: PASS WITH WARNINGS`.
- Delta specs leídas desde:
  - `openspec/changes/archive/2026-05-23-provider-aware-catalog-routing/specs/provider-aware-catalog-routing/spec.md`
  - `openspec/changes/archive/2026-05-23-provider-aware-catalog-routing/specs/list-provider-ownership/spec.md`
  - `openspec/changes/archive/2026-05-23-provider-aware-catalog-routing/specs/list-status-multi-view/spec.md`
  - `openspec/changes/archive/2026-05-23-provider-aware-catalog-routing/specs/app-shell-composition-root/spec.md`

## Specs Synced
| Domain | Main Spec Target | Action | Added | Modified | Removed | Notes |
|---|---|---|---:|---:|---:|---|
| `provider-aware-catalog-routing` | `openspec/specs/provider-aware-catalog-routing/spec.md` | Created (full copy) | 3 | 0 | 0 | No existía spec principal; se copió spec completa desde change.
| `list-provider-ownership` | `openspec/specs/list-provider-ownership/spec.md` | Created (full copy) | 4 | 0 | 0 | No existía spec principal; se copió spec completa desde change.
| `list-status-multi-view` | `openspec/specs/list-status-multi-view/spec.md` | Updated | 0 | 1 | 0 | Se reemplazó `### Requisito: Consistencia de recuperación por status` por matching heading.
| `app-shell-composition-root` | `openspec/specs/app-shell-composition-root/spec.md` | Updated | 3 | 0 | 0 | Se anexaron 3 requirements ADDED al final de `## Requirements`.

## Delivered Scope Summary
- Home en `/` con CTA no técnico y catálogo en rutas provider-aware.
- Alias `/catalog` con redirect a último provider o `mercadona`.
- Ownership de provider en listas con FK real `lists.provider_id -> providers.id`.
- DTOs de listas con provider consistente (`slug`, `displayName`) y fallback legacy transicional.
- Gate de handshake WAITING/READY para bloquear mutaciones hasta source-of-truth de draft.
- Navegación de catálogo reabre última categoría por `user + provider` con fallback determinístico.

## Residual Warnings and Follow-ups
1. WARNING vigente en verify: falta evidencia frontend explícita de uso de `draft.provider.slug` como source-of-truth post-READY (no bloqueante).
2. Follow-up recomendado: agregar test de integración web que pruebe explícitamente `draft.provider.slug` después de READY o documentar formalmente la delegación total al backend.

## Verification Checklist
- [x] Se revisaron artifacts requeridos: proposal, specs delta, design, tasks, verify-report.
- [x] Verify gate validado: no existen issues CRITICAL en `verify-report.md`.
- [x] Delta specs sincronizadas en `openspec/specs/**` respetando reglas ADDED/MODIFIED/REMOVED.
- [x] Se preservaron requirements no relacionados en specs principales existentes.
- [x] Change movido a `openspec/changes/archive/2026-05-23-provider-aware-catalog-routing/`.
- [x] Carpeta activa `openspec/changes/provider-aware-catalog-routing/` ausente tras archive.

## Archive Move
- From: `openspec/changes/provider-aware-catalog-routing/`
- To: `openspec/changes/archive/2026-05-23-provider-aware-catalog-routing/`

## Notes on Archive Rules
- `openspec/config.yaml` presente y válido.
- No se encontró `rules.archive` adicional en `openspec/**`; no hubo reglas extra a aplicar.
