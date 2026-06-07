# Provider Aware Catalog Routing Specification

## Purpose

Define deterministic catalog navigation by provider, including a home entrypoint and a compatibility alias.

## Requirements

### Requirement: Home Entry and Canonical Provider Routes

The system MUST render `/` as the canonical non-technical home page for provider entry. The home flow MUST avoid implicit default-provider ownership and MUST route provider navigation through explicit provider choice. The catalog MUST remain reachable through canonical routes `/:provider/catalog` and `/:provider/catalog/:category`.

#### Scenario: Home shows provider entry before catalog navigation

- GIVEN a user opens `/`
- WHEN the page is rendered
- THEN the user sees a non-technical home view with explicit provider entry
- AND no implicit provider is assigned only by rendering Home

#### Scenario: Catalog route requires provider segment

- GIVEN a user navigates to a catalog page
- WHEN the route is resolved
- THEN the resolved catalog route includes `:provider`
- AND category navigation uses `/:provider/catalog/:category`

### Requirement: Catalog route requires provider resolution

The system MUST resolve the `:provider` segment to a real provider strategy and SHALL reject unknown providers with a deterministic domain error mapped to HTTP 404.

#### Scenario: Known provider resolves provider strategy

- GIVEN a catalog request for `:provider = bonpreuesclat`
- WHEN the route is resolved
- THEN the catalog use case is executed using Bonpreu strategy

#### Scenario: Unknown provider is rejected deterministically

- GIVEN a catalog request for an unsupported provider slug
- WHEN the route is resolved
- THEN the API responds with HTTP 404 and stable provider-not-found error code

### Requirement: Provider Display Name Fallback

The system MUST expose provider display metadata and SHALL fallback `displayName` to provider `slug` when no display label is available.

#### Scenario: Display name fallback to slug

- GIVEN provider metadata is missing `displayName`
- WHEN catalog response includes provider information
- THEN provider `displayName` equals provider `slug`

### Requirement: `/catalog` Alias Redirect

The system MUST support `/catalog` as a compatibility alias and SHALL redirect to `/{lastProvider}/catalog` when a last provider exists. When no last provider exists, the system MUST redirect to `/` instead of assigning a hidden default provider.

#### Scenario: Redirect uses last provider

- GIVEN the user has `lastProvider = "bonpreuesclat"`
- WHEN the user navigates to `/catalog`
- THEN the response redirects to `/bonpreuesclat/catalog`

#### Scenario: Redirect falls back to Home without default provider

- GIVEN no last provider is stored
- WHEN the user navigates to `/catalog`
- THEN the response redirects to `/`

### Requirement: Return to Last Category per User and Provider

The system MUST remember the last visited category by key `user + provider` and SHALL reopen that category when the user returns to `/:provider/catalog`. If no history exists for that key, the system MUST open the first category.

#### Scenario: Return to previous category for same provider

- GIVEN user `u1` visited `/:provider/catalog/frescos` for provider `mercadona`
- WHEN user `u1` navigates again to `/mercadona/catalog`
- THEN the app redirects or opens `/mercadona/catalog/frescos`

#### Scenario: Fallback to first category when no history exists

- GIVEN user `u1` has no category history for provider `mercadona`
- WHEN user `u1` navigates to `/mercadona/catalog`
- THEN the app opens the first category returned by the catalog list

#### Scenario: Category history is isolated per provider

- GIVEN user `u1` last category is `frescos` in `mercadona` and `hogar` in `carrefour`
- WHEN user `u1` navigates to `/carrefour/catalog`
- THEN the app opens `/carrefour/catalog/hogar`
- AND does not reuse `mercadona` category history
