# Tasks: Draft Provider Conflict Modal Verification Fixes

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 180–320 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR containing tests, minimal build fixes, and evidence |
| Delivery strategy | exception-ok |
| Chain strategy | size-exception (maintainer-approved) |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

Maintainer-approved `size:exception` is recorded for delivery; do not recommend chaining based on the prior feature’s already-approved test-heavy diff.

## Phase 1: RED — Runtime Proof and Isolation

- [x] 1.1 In `apps/web/src/app-shell/AppShell.test.tsx`, add failing integration assertions that spy on `window.confirm`, capture the existing draft-conflict callback, and prove confirm resolves `true` with the requested catalog route.
- [x] 1.2 Add the failing dismiss assertion in `AppShell.test.tsx`: the callback Promise resolves `false`, the exact current route remains unchanged, and no native confirm is invoked.
- [x] 1.3 In `apps/web/src/shared/utils/deviceFingerprint.test.ts`, preserve/add the failing throwing-`localStorage.getItem` case and warning/fallback assertions; keep restoration explicit.

## Phase 2: GREEN — Minimal Remediation

- [x] 2.1 In `apps/web/src/test/setup.ts`, reset canonical in-memory `localStorage` before each test and restore test-local replacements after each test without masking the fingerprint error path.
- [x] 2.2 Remove only the unused `isLandingPage` declaration in `apps/web/src/app-shell/AppShell.tsx`; do not alter resolver, modal, or active-edit handlers.
- [x] 2.3 Add the existing Node typings to `apps/web/tsconfig.app.json` so `apps/web/src/app-shell/appShellImportBoundary.ts` compiles unchanged.
- [x] 2.4 Type `ListItem.source` with the existing `SupportedProviderId` contract at construction in `apps/web/src/features/catalog/Catalog.tsx`; do not widen domain data or routing.
- [x] 2.5 If the isolated storage baseline exposes failures, stabilize only fixtures/assertions in `Catalog.test.tsx` and `ListsContainer.test.tsx`, retaining active-edit delegation behavior.

## Phase 3: REFACTOR — Verification and Evidence

- [x] 3.1 Run focused AppShell, fingerprint, Catalog, Lists, and related conflict tests; then run `pnpm --filter @app/web test:run` at least twice and retain deterministic results.
- [x] 3.2 Run `pnpm --filter @app/web build` and `pnpm typecheck`; record the three resolved build errors and any bounded non-blocking lint context without changing product behavior.
- [x] 3.3 After repeated green tests and build, update `openspec/changes/draft-provider-conflict-modal/verify-report.md` to reconcile only contradicted evidence and the three runtime-proof clauses; do not archive or add a delta spec.
