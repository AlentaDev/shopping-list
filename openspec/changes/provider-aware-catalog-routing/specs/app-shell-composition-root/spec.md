# Delta for app-shell-composition-root

## ADDED Requirements

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
