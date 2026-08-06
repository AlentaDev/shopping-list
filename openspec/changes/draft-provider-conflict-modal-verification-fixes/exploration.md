## Exploration: draft-provider-conflict-modal verification fixes

### Current State
The existing `draft-provider-conflict-modal` implementation is functionally close: focused modal, hook, Catalog, navigation, and isolated list-conflict tests pass, and the callback flow is present from feature components through `AppShell`. Its verification report is nevertheless **FAIL** because the authoritative web suite exits non-zero, the web build exits non-zero, and three required scenarios have incomplete runtime assertions.

The current full web run reproduced seven failures in four files (491 passed, 7 failed): an active-edit label assertion, a legacy Catalog category-control assertion, three `ListsContainer` data/action assertions, and a `deviceFingerprint` localStorage error-path assertion. The report also identifies order-dependent localStorage behavior under the Node 26 workaround. The current build fails before Vite bundling with: unused `isLandingPage`, unresolved `node:path` types in `appShellImportBoundary.ts`, and a Catalog provider-id type mismatch.

The missing runtime proof is precise and bounded: assert that the draft flow does not invoke `window.confirm`; assert the AppShell resolver Promise resolves `true` after confirm; and assert the dismiss path resolves `false` while preserving the exact current route. The prior change's approximately 851-line delivery size is explicitly approved and must not be reopened as scope.

### Affected Areas
- `openspec/changes/draft-provider-conflict-modal/verify-report.md` — authoritative blocker list and partial scenario matrix to remediate.
- `openspec/changes/draft-provider-conflict-modal/tasks.md` — tasks 9.1 and 9.2 claim green verification and must be reconciled after evidence is regenerated; do not broaden the original feature.
- `apps/web/src/app-shell/AppShell.tsx` — current build blocker (`isLandingPage`) and AppShell resolver behavior needing Promise/route assertions.
- `apps/web/src/app-shell/appShellImportBoundary.ts` and `apps/web/tsconfig.app.json` — build-time `node:path` typing boundary; use the smallest compatible correction without changing architectural ownership.
- `apps/web/src/features/catalog/Catalog.tsx` — current provider-id type error surfaced by the web build.
- `apps/web/src/test/setup.ts` and affected Vitest suites — deterministic localStorage isolation is needed for the authoritative suite and its error-path tests.
- `apps/web/src/app-shell/AppShell.test.tsx`, `apps/web/src/features/catalog/Catalog.test.tsx`, and relevant Lists/navigation tests — add only the missing runtime assertions and repair assertions/fixtures that block the authoritative runner.
- `apps/web/src/shared/utils/deviceFingerprint.test.ts` and existing legacy suites — current full-suite failures must be classified against a clean baseline before changing them; they are verification blockers, not new product scope.

### Approaches
1. **Narrow verification-remediation work units** — fix the three build errors, make the existing web test environment deterministic, add the three missing behavioral assertions, then rerun the authoritative suite and build.
   - Pros: Directly addresses every selected blocking issue; preserves the original feature scope and active-edit behavior; produces archive-ready evidence without adding E2E coverage unnecessarily.
   - Cons: May require small corrections in existing test fixtures or shared test setup in addition to the modal tests; the full suite is slow and must be repeated to demonstrate stability.
   - Effort: Medium

2. **Formalize current failures as pre-existing and verify only focused suites** — document the aggregate failures as baseline exceptions and retain the existing focused evidence.
   - Pros: Minimal code churn and faster focused feedback.
   - Cons: Does not satisfy the selected “authoritative web test-suite failure/flakiness” blocker; strict verification still has a non-zero authoritative command and cannot archive safely.
   - Effort: Low, but insufficient

### Recommendation
Use Approach 1. Treat this as a verification-only remediation change: preserve the existing modal design and domain behavior, correct only build blockers, stabilize the test harness/fixtures that make the authoritative command fail or fluctuate, and add the three narrowly targeted runtime assertions. Do not add product behavior, an E2E suite, a shared modal abstraction, or reopen the approved delivery-size decision. Re-run the full web suite more than once with the repository's Node 26 localStorage setup, then run typecheck/build and regenerate verification evidence; only then reconcile the prior tasks' false green claims.

### Risks
- Some aggregate failures may be pre-existing or caused by test-order/shared-storage leakage; changing production behavior to satisfy them would broaden scope, so baseline each failure first.
- A global localStorage shim can hide genuine storage error handling; isolation must preserve explicit error-path tests such as `deviceFingerprint`.
- Build fixes must not weaken the AppShell import-boundary checks or introduce a new dependency; the existing Node typings are already present in the workspace.
- The approved size exception belongs to the prior change; verification-fix work should remain a small, reviewable remediation slice.

### Ready for Proposal
Yes. The orchestrator should propose a verification-remediation change with three bounded work units: build/type corrections, deterministic authoritative web-suite execution, and missing runtime proof. The proposal must explicitly exclude feature expansion and retain the already-approved size exception for `draft-provider-conflict-modal`.
