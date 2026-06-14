# Proposal: Stabilize Provider Wiring and Architecture Boundaries

## Intent

Stabilize boundary and wiring drift that already contradicts repo architecture: Bonpreu list mutations can bypass provider-aware wiring, `app-shell` and `features/*` cross internal boundaries, provider composition is implicit, and Android logging needs release-safe hardening.

## Scope

### In Scope
- Slice 1 (first, mandatory): API Bonpreu provider wiring with TDD for provider-aware list mutations.
- Slice 2: web boundary refactor so `app-shell` composes stable feature entrypoints only and features stop importing other feature internals.
- Slice 3: evaluate `ApiAwakeContext` ownership and remove or keep it only with explicit provider-composition evidence.
- Slice 4: harden Android logging for safe environment/release behavior.
- Slice 5: document Bonpreu API/provider contract and wiring expectations.

### Out of Scope
- New end-user features, provider expansion, or list lifecycle changes.
- Large unrelated cleanup outside the approved slices.

## Capabilities

### New Capabilities
- `android-network-logging-safety`: release-safe Android logging boundaries and environment-aware logging behavior.

### Modified Capabilities
- `app-shell-composition-root`: enforce stable shell/feature boundaries and explicit provider composition ownership.
- `list-provider-ownership`: require provider-aware list mutations to use resolver-based wiring, not a default provider singleton.
- `bonpreuesclat-catalog-provider`: clarify Bonpreu compatibility through list-mutation wiring and public API documentation.

## Approach

Use chained slices under the 400-line review budget. Start with failing API composition tests, inject a provider resolver/registry into lists wiring, then refactor web boundaries behind stable facades, decide `ApiAwakeContext` from test-backed evidence, harden Android logging without relaxing release safety, and finish with Bonpreu docs.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/api/src/app/router.ts` | Modified | Lists wiring uses provider resolver for mutations |
| `apps/api/src/modules/catalog/` | Modified | Expose reusable provider registry/resolver |
| `apps/api/src/modules/lists/` | Modified | Consume provider-aware mutation dependency |
| `apps/web/src/app-shell/`, `features/`, `providers/` | Modified | Remove internal cross-feature coupling; clarify provider composition |
| `apps/mobile-android/` | Modified | Harden logging behavior for safe builds |
| `docs/features/api/` | Modified | Add/update Bonpreu API integration docs |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Slice coupling creates oversized review | High | Deliver in approved chained slices |
| Boundary refactor breaks behavior | Med | Preserve behavior with TDD guard tests first |
| `ApiAwakeContext` decision is ambiguous | Med | Keep/remove only with explicit evidence |

## Rollback Plan

Revert by slice: restore previous router/module wiring, keep existing web composition paths, retain current provider stack if evidence is inconclusive, and disable Android logging hardening changes independently.

## Dependencies

- Existing API/web/Android test suites and current OpenSpec capabilities.

## Success Criteria

- [ ] Bonpreu and other provider-backed list mutations resolve through tested provider-aware wiring.
- [ ] Web composition respects `app-shell`/feature boundaries without cross-feature internal imports.
- [ ] `ApiAwakeContext` outcome is evidence-based and documented.
- [ ] Android release-oriented logging is hardened without weakening safety rules.
- [ ] Bonpreu API docs match the stabilized wiring and public contract.
