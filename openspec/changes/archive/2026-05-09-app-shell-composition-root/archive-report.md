# Archive Report — app-shell-composition-root

## Metadata

- Change: `app-shell-composition-root`
- Project: `shopping-list`
- Archive date: `2026-05-09`
- Artifact mode: `hybrid`
- Final verify verdict: **PASS WITH WARNINGS**
- Release readiness: **Ready for release** (non-blocking warnings only)

## Traceability (Engram Observation IDs)

- Proposal: `sdd/app-shell-composition-root/proposal` → Observation **#40**
- Spec: `sdd/app-shell-composition-root/spec` → Observation **#41**
- Design: `sdd/app-shell-composition-root/design` → Observation **#42**
- Tasks: `sdd/app-shell-composition-root/tasks` → Observation **#43**
- Apply Progress: `sdd/app-shell-composition-root/apply-progress` → Observation **#44**
- Verify Report: `sdd/app-shell-composition-root/verify-report` → Observation **#48**

## Closure Summary

This change is archived after full SDD cycle completion (proposal → spec → design → tasks → apply → verify → archive). The canonical app shell composition root is now specified under `apps/web/src/app-shell/*`, with migration complete and legacy duplicate implementation removed (fallback compatibility index retained by design).

Main spec source of truth has been synced to:

- `openspec/specs/app-shell-composition-root/spec.md`

Change folder archived to:

- `openspec/changes/archive/2026-05-09-app-shell-composition-root/`

## Implemented vs Planned

### Planned

- Define explicit dependency boundaries for `app-shell`, `features`, `context`, `providers`, `shared`.
- Canonicalize runtime/imports/tests to `@src/app-shell/*`.
- Remove duplicate `features/app-shell/*` implementation tree.
- Preserve functional behavior and API contract equivalence.

### Implemented

- Boundary rules documented and verified through compliance checks and tests.
- Canonical app-shell path adopted in runtime and test suites.
- Legacy duplicate shell implementation removed; compatibility bridge reduced to fallback re-export (`index.ts` + `index.test.ts`).
- Data transformation moved out of `AppShell` into feature adapter (`AppShellListAdapter`) per spec/design rule.
- All tasks marked complete (12/12), including remediation task 5.1.

## Work Units Completed

1. **Foundation**: canonical entrypoint guard + compatibility re-export + ambiguous import compliance guard.
2. **Core migration**: canonical navigation and shell/header composition tests + implementation alignment.
3. **Integration/cleanup**: migrate remaining imports, move/update legacy tests, remove duplicate feature-shell files.
4. **Verification checkpoint**: no-regression confirmation + feature documentation.
5. **Post-verify remediation**: fix DTO transformation placement and lint no-empty issue in `AppShell.tsx`.

## Verification Outcome and Accepted Warnings

### Blocking issues

- **CRITICAL**: None.

### Accepted warnings (non-blocking)

- TDD evidence consistency note for task 1.3 safety-net annotation (`N/A (new guard)` despite file reuse).
- `AppHeader.tsx` full-change line coverage below IMPORTANT target in report context (66.66%).
- `AppHeader.test.tsx` contains implementation-coupled call-count assertions.
- Compliance checklist point (provider-boundary invariance) remains partially enforced via static review, not explicit automated architecture check.

Rationale: verify report declares release readiness with warnings only; no failing requirement scenarios and no unresolved critical risk.

## Archive Verification Checklist

- [x] Main spec synced from delta into `openspec/specs/app-shell-composition-root/spec.md`
- [x] Change folder moved to dated archive path
- [x] Archived folder contains required artifacts (proposal/specs/design/tasks/verify)
- [x] Active `openspec/changes/` no longer contains `app-shell-composition-root`
- [x] Hybrid persistence complete (OpenSpec artifact + Engram archive-report upsert)

## Notes for Future Work

- Optional follow-up quality slice can address warning-level `AppHeader` assertions/coverage and automate provider-boundary invariance check.
