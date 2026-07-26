# Proposal: Draft Provider Conflict Modal Verification Fixes

## Intent

Make the prior `draft-provider-conflict-modal` change verifiable and archive-ready without changing its approved product behavior. Its focused flows pass, but the authoritative web suite, web build, and three required runtime proofs currently block verification.

## Scope

### In Scope
- Fix the three web build errors: unused AppShell state, `node:path` typing boundary, and Catalog provider-id mismatch.
- Make `pnpm --filter @app/web test:run` deterministic under the repository's Node 26 localStorage setup, while preserving explicit storage-error tests.
- Add runtime tests proving native `window.confirm` is unused, AppShell confirmation resolves `true`, and dismissal resolves `false` without changing the route.
- Re-run authoritative web tests and build, then regenerate evidence; reconcile the prior change's contradicted verification claims only after successful results.

### Out of Scope
- Any new user-visible modal behavior, E2E coverage, dependencies, or shared modal abstraction.
- Changes to active-edit conflict handling, edit-session behavior, autosave, APIs, Android, or provider ownership rules.
- Reopening the prior change's approved size exception; this remediation remains a separate, small review slice.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- None. This change repairs implementation and verification evidence; it does not alter specified behavior.

## Approach

Use narrow test-first fixes. Correct type/build defects in their existing owners, isolate web-test storage state without masking error paths, and add only the three missing integration assertions around the current async AppShell resolver. Establish a clean repeated full-suite and build baseline before updating prior-change evidence; keep the prior change blocked until that evidence exists.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `apps/web/src/app-shell/AppShell.tsx` | Modified | Remove build blocker; prove resolver outcomes and route preservation. |
| `apps/web/src/app-shell/appShellImportBoundary.ts` | Modified | Resolve existing Node typing boundary. |
| `apps/web/src/features/catalog/Catalog.tsx` | Modified | Correct provider-id type mismatch. |
| `apps/web/src/test/setup.ts` and affected tests | Modified | Deterministic localStorage isolation and bounded runtime proof. |
| `openspec/changes/draft-provider-conflict-modal/` | Modified | Regenerate verification evidence after remediation; remains blocked meanwhile. |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Storage isolation masks error handling | Med | Preserve and run explicit `deviceFingerprint` error-path tests. |
| Fix broadens product behavior | Low | Limit changes to listed blockers and existing outcomes. |

## Rollback Plan

Revert this remediation slice only. It has no migration or persisted-data change; the prior modal change remains blocked with its existing report.

## Dependencies

- Existing Node typings and the repository's Node 26 localStorage test setup.

## Success Criteria

- [ ] Web build passes with all three reported errors resolved.
- [ ] The authoritative web suite passes repeatedly with deterministic storage isolation.
- [ ] Tests prove no native confirm invocation and the specified AppShell Promise/route outcomes.
- [ ] Prior verification evidence is regenerated without changing active-edit behavior.

## Review Forecast

- 400-line budget risk: Low; maintainer-approved size exception applies only to the prior change.
