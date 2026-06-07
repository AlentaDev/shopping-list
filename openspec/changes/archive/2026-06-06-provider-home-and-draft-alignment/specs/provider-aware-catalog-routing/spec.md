# Delta for provider-aware-catalog-routing

## ADDED Requirements

### Requirement: Cross-Provider Browsing Without Mutation Lock

The system MUST allow browsing any provider catalog regardless of the current draft provider. The system MUST block only draft mutations that violate single-draft provider ownership.

#### Scenario: Browsing another provider remains allowed

- GIVEN the current draft is owned by `mercadona`
- WHEN the user navigates to `/bonpreuesclat/catalog`
- THEN the catalog is rendered normally

#### Scenario: Blocking happens only on mutation

- GIVEN the current draft is owned by `mercadona`
- WHEN the user attempts to add an item from `bonpreuesclat`
- THEN the system blocks the mutation with the provider-conflict flow

## MODIFIED Requirements

### Requirement: Home Entry and Canonical Provider Routes

The system MUST render `/` as the canonical non-technical home page for provider entry. The home flow MUST avoid implicit default-provider ownership and MUST route provider navigation through explicit provider choice. The catalog MUST remain reachable through canonical routes `/:provider/catalog` and `/:provider/catalog/:category`.
(Previously: `/` was only a non-technical home with CTA `Ir al catálogo`, and canonical provider routes existed without explicit no-default-provider behavior.)

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

### Requirement: `/catalog` Alias Redirect

The system MUST support `/catalog` as a compatibility alias and SHALL redirect to `/{lastProvider}/catalog` when a last provider exists. When no last provider exists, the system MUST redirect to `/` instead of assigning a hidden default provider.
(Previously: `/catalog` redirected to `/{lastProvider}/catalog` or `/mercadona/catalog`.)

#### Scenario: Redirect uses last provider

- GIVEN the user has `lastProvider = "bonpreuesclat"`
- WHEN the user navigates to `/catalog`
- THEN the response redirects to `/bonpreuesclat/catalog`

#### Scenario: Redirect falls back to Home without default provider

- GIVEN no last provider is stored
- WHEN the user navigates to `/catalog`
- THEN the response redirects to `/`
