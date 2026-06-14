# Proposal: Provider Home and Draft Alignment

## Intent

Align Home, draft ownership, and provider-aware mutations around one rule: each account has a single draft with an explicit `providerId`. This removes hidden Mercadona defaults, keeps current local-vs-remote recovery semantics, and makes provider conflicts understandable across Home, catalog, reuse, and edit flows.

## Scope

### In Scope
- Make web/local/remote draft contracts carry explicit `providerId`, including empty drafts.
- Update Home to manage provider entry, anonymous messaging, and immediate provider persistence for empty drafts.
- Apply provider-aware conflict UX to draft mutation, reuse, and edit-session flows using global confirm-and-reset rules plus a dedicated active-edit conflict path.

### Out of Scope
- Per-provider drafts or multi-draft ownership.
- Redesign of `DRAFT -> ACTIVE`, `finish-edit`, or list browsing aggregation beyond provider visibility.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `list-provider-ownership`: Draft provider becomes explicit in autosave/recovery handshakes, empty drafts may retain provider ownership, and mutation/reuse/edit conflicts must enforce single-draft provider rules.
- `provider-aware-catalog-routing`: Provider routes remain freely navigable, but Home becomes the canonical provider entry point and mutation guards must respect the current draft provider.
- `app-shell-composition-root`: Shell/Home composition must present anonymous-only draft context, mixed-provider authenticated list visibility, and dedicated UX for active edit-session conflicts.

## Approach

Adopt the exploration recommendation: make `providerId` the draft source of truth in web context, local persistence, autosave DTOs, and recovery UI. Reuse existing `draft_provider_conflict` semantics for non-edit mutations/reuse, add explicit provider labels in conflict UI, and keep active edit sessions on a stricter dedicated branch.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/web/src/context/ListContext*` | Modified | Draft provider state and actions |
| `apps/web/src/features/shopping-list/services/*` | Modified | Local/remote autosave and recovery contracts |
| `apps/web/src/app-shell/**` | Modified | Home provider entry, anonymous UX, edit conflict branching |
| `apps/web/src/features/lists/**` | Modified | Provider visibility and reuse/edit guard entry points |
| `apps/api/src/modules/lists/application/*` | Modified | Autosave/provider handshake alignment |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Draft provider drift between local and remote | Med | Specify provider in every autosave/recovery contract |
| Confusing edit vs reuse behavior | Med | Separate dedicated active-edit UX from global reset flow |

## Rollback Plan

Revert proposal follow-up changes by restoring provider-agnostic draft DTOs, Home CTA-only behavior, and previous conflict copy while keeping existing server `409 draft_provider_conflict` enforcement intact.

## Dependencies

- Existing `draft_provider_conflict` API contract and current `UpdateListStatus` / `finish-edit` behavior.

## Success Criteria

- [ ] Proposal specs require a single explicit `providerId` for draft context, autosave, recovery, and empty-draft persistence.
- [ ] Home, reuse, and edit flows define when provider navigation is allowed and when confirm/reset or dedicated edit conflict UX is required.
