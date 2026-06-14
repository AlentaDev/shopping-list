# List Provider Ownership Specification

## Purpose

Guarantee provider ownership invariants for each shopping list and preserve legacy behavior via deterministic backfill.

## Requirements

### Requirement: Provider Persistence and Visibility

The system MUST persist provider ownership through a real FK (`lists.provider_id -> providers.id`) and MUST expose provider data in list summary and list detail DTOs using `slug` and `displayName`.

#### Scenario: New list stores provider

- GIVEN a user creates a draft from provider slug `mercadona`
- WHEN the list is persisted
- THEN the stored list contains `provider_id` referencing the `providers` row for slug `mercadona`

#### Scenario: List views expose provider

- GIVEN a stored list linked by FK to provider `mercadona`
- WHEN summary and detail endpoints are requested
- THEN both responses include provider `slug = "mercadona"`
- AND both responses include provider `displayName` resolved from `providers.display_name`

### Requirement: Provider Mutability by List State

The system MUST allow changing provider only when the list state is `DRAFT` and the draft is empty. The system MUST reject provider changes for `ACTIVE` and `COMPLETED` lists.

#### Scenario: Empty draft can change provider

- GIVEN a `DRAFT` list with zero items and provider `mercadona`
- WHEN the user selects provider `carrefour`
- THEN the provider change is accepted

#### Scenario: Non-empty or immutable state cannot change provider

- GIVEN a list that is non-empty `DRAFT`, `ACTIVE`, or `COMPLETED`
- WHEN a provider change is requested
- THEN the request is rejected with a domain validation error

### Requirement: Legacy Backfill Default Provider

The system MUST backfill legacy lists without provider linkage to `mercadona` before strict provider validation or provider-resolver wiring is deployed to production. Deployment compatibility MUST be achieved by persisting `provider_id = provider-mercadona` on existing lists, and MUST NOT rely on mutation-time fallback behavior.

#### Scenario: Legacy list receives mercadona backfill

- GIVEN an existing persisted list with missing `provider_id`
- WHEN the backfill migration runs
- THEN the list is updated with `provider_id` referencing provider slug `mercadona`

#### Scenario: Backfilled legacy list remains operable

- GIVEN a previously legacy list already backfilled to `mercadona`
- WHEN summary and detail flows are executed
- THEN list retrieval and mutations continue without compatibility errors

### Requirement: Draft Provider Source of Truth After Handshake

After API/auth/draft handshake completion, the system MUST resolve catalog-list mutations through the provider registry or resolver owned by API composition wiring, using `draft.provider.slug` as the source of truth. The composition layer MUST NOT inject a default singleton provider for list mutations. The system MUST reject cross-provider mutations with HTTP 409 `draft_provider_conflict` including stable `allowedActions`, and MUST fail deterministically before mutation execution when the draft provider cannot be resolved. Missing list provider ownership MUST be treated as a deployment or data-compatibility defect, not corrected by silently falling back to `mercadona` during mutation execution.

#### Scenario: Handshake-ready mutations use resolved draft provider

- GIVEN handshake is complete and `draft.provider.slug = "mercadona"`
- WHEN the user adds or mutates list items from catalog
- THEN the mutation resolves the `mercadona` provider through composition wiring

#### Scenario: Provider conflict returns actionable 409

- GIVEN an active draft bound to `mercadona`
- WHEN a mutation is requested from `bonpreuesclat`
- THEN the API responds HTTP 409 with `errorCode = "draft_provider_conflict"`
- AND `allowedActions` contains `switch_and_clear` and `keep_draft_provider`

#### Scenario: Unresolved draft provider fails deterministically

- GIVEN handshake is complete and `draft.provider.slug` has no registered provider
- WHEN a catalog-list mutation is requested
- THEN the mutation is rejected before provider execution
- AND the API returns a stable provider-resolution error

#### Scenario: Missing provider ownership does not trigger mutation fallback

- GIVEN a persisted list reaches strict provider wiring without a resolved provider
- WHEN a catalog-list mutation is requested
- THEN the API returns an explicit provider-resolution failure
- AND no implicit `mercadona` fallback is applied at mutation time
