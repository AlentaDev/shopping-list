# Delta for App Shell Composition Root

## ADDED Requirements

### Requirement: Provider Composition Evidence

The web composition root MUST make provider ownership and ordering explicit. It SHALL keep a provider only when a shell or descendant consumer dependency is proven by automated tests.

#### Scenario: Proven dependency keeps provider in stack

- GIVEN a provider is consumed by shell behavior or a descendant context
- WHEN provider-composition tests run
- THEN the provider remains in `AppProviders`
- AND its required order is asserted explicitly

#### Scenario: Unproven dependency cannot stay implicitly

- GIVEN a provider has no proven consumer dependency
- WHEN provider composition is reviewed for this capability
- THEN the provider is removed or justified with a failing-then-passing test

## MODIFIED Requirements

### Requirement: Dependency Boundaries Enforcement

Feature isolation and composition permissions MUST follow explicit boundaries. `app-shell/*` MAY compose `features/*`, `context/*`, `providers/*`, and `shared/*` only through stable public entrypoints or documented facades. `app-shell/*` MUST NOT import feature service or component internals directly. `features/*` MUST NOT import internals from other features and MUST NOT import `app-shell/*`.
(Previously: app-shell could compose feature public modules, but stable facades and provider-composition ownership were not explicit.)

#### Scenario: Allowed shell-to-feature facade dependency

- GIVEN a module under `app-shell/*`
- WHEN it imports a feature-owned public entrypoint or facade
- THEN the import is allowed
- AND shell behavior stays outside feature internals

#### Scenario: Forbidden shell-to-feature internal dependency

- GIVEN a module under `app-shell/*`
- WHEN it imports `features/*/services/*` or other undocumented internals directly
- THEN compliance validation fails
- AND the change is blocked until a stable facade exists

#### Scenario: Forbidden cross-feature/internal dependency

- GIVEN a module under `features/<a>/*`
- WHEN it imports `features/<b>/*` internals or any `app-shell/*`
- THEN compliance validation fails
- AND the change is blocked until dependency direction is corrected
