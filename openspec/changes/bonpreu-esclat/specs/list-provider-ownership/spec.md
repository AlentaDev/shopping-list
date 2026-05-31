# Delta for list-provider-ownership

## MODIFIED Requirements

### Requirement: Draft Provider Source of Truth After Handshake

After API/auth/draft handshake completion, the system MUST use `draft.provider.slug` as the source of truth for catalog-list mutations, and MUST reject cross-provider mutations with HTTP 409 `draft_provider_conflict` including stable `allowedActions`.
(Previously: Mutations were validated against `draft.provider.slug` without explicit 409 payload contract requirements.)

#### Scenario: Handshake-ready mutations use draft provider

- GIVEN handshake is complete and `draft.provider.slug = "mercadona"`
- WHEN the user adds or mutates list items from catalog
- THEN the mutation is validated against `draft.provider.slug`

#### Scenario: Provider conflict returns actionable 409

- GIVEN an active draft bound to `mercadona`
- WHEN a mutation is requested from `bonpreuesclat`
- THEN the API responds HTTP 409 with `errorCode = "draft_provider_conflict"`
- AND `allowedActions` contains `switch_and_clear` and `keep_draft_provider`
