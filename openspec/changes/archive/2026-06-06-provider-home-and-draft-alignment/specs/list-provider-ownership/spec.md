# Delta for list-provider-ownership

## ADDED Requirements

### Requirement: Provider Conflict Resolution for Reuse and Edit

The system MUST keep a single draft per account and MUST enforce provider conflicts differently for reuse versus active edit sessions.

#### Scenario: Reuse or draft mutation confirms reset across providers

- GIVEN a non-empty draft owned by provider `mercadona`
- WHEN the user reuses or mutates a list from provider `bonpreuesclat`
- THEN the system offers confirm-and-reset with explicit current and target provider information

#### Scenario: Active edit conflict uses dedicated branch

- GIVEN an active edit session owned by provider `mercadona`
- WHEN the user starts a new-provider mutation from `bonpreuesclat`
- THEN the system offers only `cancel_edit_and_start_new` or `return_to_original_provider`

## MODIFIED Requirements

### Requirement: Provider Mutability by List State

The system MUST allow changing provider only when the list state is `DRAFT` and the draft is empty. The system MUST persist the selected provider even when the empty draft has zero items, including Home-owned provider switches. The system MUST reject provider changes for non-empty `DRAFT`, `ACTIVE`, and `COMPLETED` lists.
(Previously: empty-draft provider changes were allowed, but empty-draft ownership persistence and Home-triggered switching were not explicit.)

#### Scenario: Empty draft can change provider

- GIVEN a `DRAFT` list with zero items and provider `mercadona`
- WHEN the user selects provider `bonpreuesclat`
- THEN the provider change is accepted
- AND the empty draft remains owned by `bonpreuesclat`

#### Scenario: Non-empty or immutable state cannot change provider

- GIVEN a list that is non-empty `DRAFT`, `ACTIVE`, or `COMPLETED`
- WHEN a provider change is requested
- THEN the request is rejected with a domain validation error

### Requirement: Draft Provider Source of Truth After Handshake

After API/auth/draft handshake completion, the system MUST use the draft provider resolved from persisted draft ownership as the source of truth for draft mutations, autosave recovery, and reuse guards. The system MUST carry explicit provider identity in local and remote draft handshakes, including empty drafts, and MUST reject cross-provider draft mutations with HTTP 409 `draft_provider_conflict` including stable `allowedActions`.
(Previously: handshake source of truth covered catalog-list mutations from `draft.provider.slug`, but explicit provider identity across recovery and empty drafts was not required.)

#### Scenario: Handshake-ready mutations use draft provider

- GIVEN handshake is complete and the persisted draft provider is `mercadona`
- WHEN the user adds or mutates list items from catalog
- THEN the mutation is validated against provider `mercadona`

#### Scenario: Provider conflict returns actionable 409

- GIVEN an active draft bound to `mercadona`
- WHEN a draft mutation is requested from `bonpreuesclat`
- THEN the API responds HTTP 409 with `errorCode = "draft_provider_conflict"`
- AND `allowedActions` contains stable choices for reset or keeping the current provider
