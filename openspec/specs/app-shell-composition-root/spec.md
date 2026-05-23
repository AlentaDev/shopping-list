# App Shell Composition Root Specification

## Purpose

Definir `apps/web/src/app-shell/*` como capa única de composición de aplicación, resolviendo el conflicto entre aislamiento de features y orquestación cross-feature sin cambiar comportamiento funcional observable.

## Requirements

### Requirement: Composition Root Ownership

The system MUST treat `apps/web/src/app-shell/*` as the canonical composition layer for web app assembly. `App.tsx` SHOULD compose `AppShell` and MUST NOT include feature business rules.

#### Scenario: Canonical composition entrypoint

- GIVEN the web runtime starts from `App.tsx`
- WHEN the shell composition is evaluated
- THEN `App.tsx` delegates composition to `AppShell`
- AND no duplicated composition root under `features/app-shell` is required for runtime behavior

#### Scenario: Backward-compatible behavior during migration

- GIVEN migration slices are applied incrementally
- WHEN imports/tests are moved to `@src/app-shell/*`
- THEN observable UX flows and API contracts remain equivalent
- AND temporary coexistence is allowed only as a migration fallback

### Requirement: Dependency Boundaries Enforcement

Feature isolation and composition permissions MUST follow explicit boundaries. `app-shell/*` MAY compose `features/*`, `context/*`, and `shared/*`. `features/*` MUST NOT import internals from other features and MUST NOT import `app-shell/*`.

#### Scenario: Allowed composition dependency

- GIVEN a module under `app-shell/*`
- WHEN it imports feature public modules for app assembly
- THEN the import is allowed
- AND the import path targets stable feature entrypoints, not cross-feature internals

#### Scenario: Forbidden cross-feature/internal dependency

- GIVEN a module under `features/<a>/*`
- WHEN it imports `features/<b>/*` internals or any `app-shell/*`
- THEN compliance validation fails
- AND the change is blocked until dependency direction is corrected

### Requirement: Data Transformation Placement

Data transformation from external DTOs MUST live in `features/*/services/adapters` (or feature services when orchestration-specific). Composition UI components in `app-shell/*` MUST NOT implement DTO normalization or feature business transformation logic.

#### Scenario: Adapter-owned transformation

- GIVEN external payload shape changes for a feature
- WHEN the frontend adapts data for UI/domain use
- THEN adaptation is implemented in that feature’s `services/adapters` (or service orchestration layer)
- AND `app-shell` composition components remain transformation-free

### Requirement: Migration and Review Compliance

Migration MUST preserve behavior while removing ambiguity. Reviews MUST verify boundary compliance and canonical path adoption.

#### Scenario: Migration compatibility guardrails

- GIVEN a PR that migrates shell imports/tests
- WHEN reviewers execute compliance checks
- THEN no active imports reference `apps/web/src/features/app-shell/*`
- AND composition tests reference `apps/web/src/app-shell/*`
- AND runtime behavior remains unchanged versus baseline flows

#### Scenario: Compliance checklist enforcement

- GIVEN an architecture review for this capability
- WHEN checklist is applied
- THEN it confirms: (1) no feature-to-feature internal imports, (2) no feature-to-app-shell imports, (3) no DTO transformation in app-shell UI composition, (4) provider boundaries remain unchanged


### Requirement: Provider-aware Shell Routing Composition

The app-shell composition layer MUST resolve `/`, `/catalog`, `/:provider/catalog`, and `/:provider/catalog/:category` without embedding feature business rules.

#### Scenario: App shell composes provider-aware routes

- GIVEN the web runtime initializes routing
- WHEN app-shell resolves route composition
- THEN `/` renders home, `/catalog` resolves alias redirect, and provider-aware catalog routes are mounted
- AND no provider business invariant is implemented inside app-shell components

### Requirement: Catalog Return Navigation Memory

The app-shell composition layer MUST integrate catalog return behavior so `/:provider/catalog` can reopen the user's last category for that provider, with fallback to the first category when no history exists.

#### Scenario: Reopen last category by user and provider

- GIVEN user `u1` has a stored last category for provider `mercadona`
- WHEN user `u1` navigates to `/mercadona/catalog`
- THEN the shell composition reopens that category route

#### Scenario: Fallback when no per-provider history exists

- GIVEN user `u1` has no stored category for provider `mercadona`
- WHEN user `u1` navigates to `/mercadona/catalog`
- THEN the shell composition opens the first category available

### Requirement: Handshake-gated List Actions in Shell UX

Before API/auth/draft handshake completion, the system MUST show list actions as visible but disabled, MUST keep a persistent non-technical banner visible, and MUST block list mutations. After handshake completion, the system MUST hide the banner and show a brief non-technical availability toast.

#### Scenario: Waiting state disables actions with persistent banner

- GIVEN API/auth/draft handshake is not complete
- WHEN the list-capable view is rendered
- THEN add/remove/increment/decrement actions are visible but disabled
- AND a persistent non-technical waiting banner is visible

#### Scenario: Ready transition hides banner and shows toast

- GIVEN the waiting state is active
- WHEN API/auth/draft handshake becomes complete
- THEN the waiting banner is hidden
- AND a brief non-technical toast indicates the list is ready
