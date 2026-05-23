# Provider Aware Catalog Routing Specification

## Purpose

Define deterministic catalog navigation by provider, including a home entrypoint and a compatibility alias.

## Requirements

### Requirement: Home Entry and Canonical Provider Routes

The system MUST render `/` as a non-technical home page with a visible CTA labeled `Ir al catálogo`. The catalog MUST be reachable only through canonical routes `/:provider/catalog` and `/:provider/catalog/:category`.

#### Scenario: Home shows CTA before catalog navigation

- GIVEN a user opens `/`
- WHEN the page is rendered
- THEN the user sees a non-technical home view with CTA `Ir al catálogo`
- AND no catalog data request is required to render the home view

#### Scenario: Catalog route requires provider segment

- GIVEN a user navigates to a catalog page
- WHEN the route is resolved
- THEN the resolved catalog route includes `:provider`
- AND category navigation uses `/:provider/catalog/:category`

### Requirement: `/catalog` Alias Redirect

The system MUST support `/catalog` as a compatibility alias and SHALL redirect to `/{lastProvider}/catalog` when a last provider exists, otherwise to `/mercadona/catalog`.

#### Scenario: Redirect uses last provider

- GIVEN the user has `lastProvider = "carrefour"`
- WHEN the user navigates to `/catalog`
- THEN the response redirects to `/carrefour/catalog`

#### Scenario: Redirect falls back to mercadona

- GIVEN no last provider is stored
- WHEN the user navigates to `/catalog`
- THEN the response redirects to `/mercadona/catalog`

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
