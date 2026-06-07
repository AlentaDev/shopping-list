# Delta for app-shell-composition-root

## ADDED Requirements

### Requirement: Provider-Aware Home Context by Auth State

The app-shell composition layer MUST show draft-provider guidance only for anonymous Home flows and MUST allow authenticated Home views to present list visibility across multiple providers.

#### Scenario: Anonymous Home shows draft-aware provider context

- GIVEN an anonymous user opens Home with a provider-owned draft context
- WHEN Home is rendered
- THEN the shell shows provider-aware draft guidance for continuing or changing entry

#### Scenario: Authenticated Home shows mixed-provider lists

- GIVEN an authenticated user owns lists from `mercadona` and `bonpreuesclat`
- WHEN Home is rendered
- THEN the shell presents both lists without filtering Home to a single provider

### Requirement: Active Edit Provider Conflict UX

The app-shell composition layer MUST present a dedicated active-edit conflict UX that is stricter than the generic confirm-and-reset flow.

#### Scenario: Active edit conflict offers only two actions

- GIVEN the user is editing a list owned by `mercadona`
- WHEN the user attempts a new-provider mutation from `bonpreuesclat`
- THEN the shell offers only `cancel editing and start a new list` or `return to mercadona catalog`

## MODIFIED Requirements

### Requirement: Provider-aware Shell Routing Composition

The app-shell composition layer MUST resolve `/`, `/catalog`, `/:provider/catalog`, and `/:provider/catalog/:category` without embedding feature business rules. The shell MUST treat `/` as the canonical provider-entry Home and MUST preserve free provider navigation while delegating mutation conflicts to provider-aware draft flows.
(Previously: app-shell resolved Home, alias redirect, and provider-aware routes without explicitly defining canonical provider entry or free cross-provider browsing.)

#### Scenario: App shell composes provider-aware routes

- GIVEN the web runtime initializes routing
- WHEN app-shell resolves route composition
- THEN `/` renders canonical Home, `/catalog` resolves alias redirect, and provider-aware catalog routes are mounted
- AND no provider business invariant is implemented inside app-shell components
