# Delta for provider-aware-catalog-routing

## MODIFIED Requirements

### Requirement: Catalog route requires provider segment

The system MUST resolve the `:provider` segment to a real provider strategy and SHALL reject unknown providers with a deterministic domain error mapped to HTTP 404.
(Previously: Route required `:provider` segment but did not require strategy resolution semantics.)

#### Scenario: Known provider resolves provider strategy

- GIVEN a catalog request for `:provider = bonpreuesclat`
- WHEN the route is resolved
- THEN the catalog use case is executed using Bonpreu strategy

#### Scenario: Unknown provider is rejected deterministically

- GIVEN a catalog request for an unsupported provider slug
- WHEN the route is resolved
- THEN the API responds with HTTP 404 and stable provider-not-found error code

## ADDED Requirements

### Requirement: Provider Display Name Fallback

The system MUST expose provider display metadata and SHALL fallback `displayName` to provider `slug` when no display label is available.

#### Scenario: Display name fallback to slug

- GIVEN provider metadata is missing `displayName`
- WHEN catalog response includes provider information
- THEN provider `displayName` equals provider `slug`
