# Archive Report — bonpreu-esclat

## Status
- Archive mode: **openspec**
- Verification gate: **PASS**
- CRITICAL issues: **0**
- WARNING issues: **0**

## Executive Summary
- Change `bonpreu-esclat` is fully merged and archived after the chained PR sequence: **#265** → **#269** (replacement for **#266**) → **#267** → tracker **#268**.
- Issue reference: **#264**.
- Final outcome: API-first BonpreuEsclat integration shipped with canonical provider routing, provider-owned lists, deterministic conflict handling, Bonpreu catalog normalization, and final docs aligned.
- Residual follow-ups: **none blocking**; any remaining product/UX tweaks are outside this change scope.

## Evidence of Sources Read
- `openspec/changes/bonpreu-esclat/proposal.md`: API-first scope, contract decisions, and success criteria.
- `openspec/changes/bonpreu-esclat/design.md`: Provider strategy, adapter boundaries, and rollout decisions.
- `openspec/changes/bonpreu-esclat/tasks.md`: implementation slices and completion status.
- `openspec/changes/bonpreu-esclat/verify-report.md`: strict TDD verification and final **PASS**.
- `docs/features/api/bonpreu-esclat-pre-sdd.md`: pre-SDD functional contract and closed decisions.
- `docs/features/api/bonpreu-esclat.md`: final API feature doc aligned with shipped behavior.
- `docs/features/api/bonpreu-esclat-chain-tracker.md`: tracker context, issue **#264**, and chain branch references.
- `openspec/specs/provider-aware-catalog-routing/spec.md`
- `openspec/specs/list-provider-ownership/spec.md`
- `openspec/specs/list-category-grouping/spec.md`
- `openspec/specs/shopping-list-item-identity/spec.md`
- `openspec/specs/bonpreuesclat-catalog-provider/spec.md`
- `apply-progress`: no standalone file was present in the source bundle; final progress traceability came from branch/commit history and the verify report.

## Specs Synced
| Domain | Main Spec Target | Action | Added | Modified | Removed | Notes |
|---|---|---|---:|---:|---:|---|
| `provider-aware-catalog-routing` | `openspec/specs/provider-aware-catalog-routing/spec.md` | Updated | 1 | 1 | 0 | Added provider resolution semantics and display-name fallback.
| `list-provider-ownership` | `openspec/specs/list-provider-ownership/spec.md` | Updated | 0 | 1 | 0 | Added explicit 409 `draft_provider_conflict` contract.
| `list-category-grouping` | `openspec/specs/list-category-grouping/spec.md` | Updated | 2 | 1 | 0 | Added Bonpreu `categoryPath[]` derivation and null fallback.
| `shopping-list-item-identity` | `openspec/specs/shopping-list-item-identity/spec.md` | Updated | 1 | 1 | 0 | Added stable `listId:sourceProductId` contract and provider payload error gate.
| `bonpreuesclat-catalog-provider` | `openspec/specs/bonpreuesclat-catalog-provider/spec.md` | Created | 3 | 0 | 0 | New source-of-truth spec for Bonpreu normalization rules.

## Archive Contents
- proposal.md ✅
- specs/ ✅
- design.md ✅
- tasks.md ✅
- verify-report.md ✅
- final docs ✅

## Source of Truth Updated
The following specs now reflect the shipped behavior:
- `openspec/specs/provider-aware-catalog-routing/spec.md`
- `openspec/specs/list-provider-ownership/spec.md`
- `openspec/specs/list-category-grouping/spec.md`
- `openspec/specs/shopping-list-item-identity/spec.md`
- `openspec/specs/bonpreuesclat-catalog-provider/spec.md`

## Risks
- None open in archive scope.

## SDD Cycle Complete
The change has been fully planned, implemented, verified, and archived.
