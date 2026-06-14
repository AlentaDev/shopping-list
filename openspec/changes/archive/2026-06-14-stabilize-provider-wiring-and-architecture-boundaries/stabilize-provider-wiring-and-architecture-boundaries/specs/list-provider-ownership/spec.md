# Delta for List Provider Ownership

## MODIFIED Requirements

### Requirement: Legacy Backfill Default Provider

The system MUST backfill legacy lists without provider linkage to `mercadona` before strict provider validation or provider-resolver wiring is deployed to production. Deployment compatibility MUST be achieved by persisting `provider_id = provider-mercadona` on existing lists, and MUST NOT rely on mutation-time fallback behavior.
(Previously: legacy backfill was required before strict validation, but production rollout dependency and the prohibition on mutation-time fallback were not explicit.)

#### Scenario: Legacy list receives mercadona backfill before rollout

- GIVEN an existing persisted list with missing `provider_id`
- WHEN the production backfill runs before strict provider wiring deployment
- THEN the list is updated with `provider_id = provider-mercadona`

#### Scenario: Backfilled legacy list remains operable

- GIVEN a previously legacy list already backfilled to `provider-mercadona`
- WHEN summary, detail, or catalog mutation flows are executed
- THEN the list continues without compatibility errors caused by missing provider ownership

### Requirement: Draft Provider Source of Truth After Handshake

After API/auth/draft handshake completion, the system MUST resolve catalog-list mutations through the provider registry or resolver owned by API composition wiring, using `draft.provider.slug` as the source of truth. The composition layer MUST NOT inject a default singleton provider for list mutations. The system MUST reject cross-provider mutations with HTTP 409 `draft_provider_conflict` including stable `allowedActions`, and MUST fail deterministically before mutation execution when the draft provider cannot be resolved. Missing list provider ownership MUST be treated as a deployment or data-compatibility defect, not corrected by silently falling back to `mercadona` during mutation execution.
(Previously: mutations were validated against `draft.provider.slug`, but resolver-based wiring, deployment-time compatibility expectations, and prohibition of silent fallback were not explicit.)

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
