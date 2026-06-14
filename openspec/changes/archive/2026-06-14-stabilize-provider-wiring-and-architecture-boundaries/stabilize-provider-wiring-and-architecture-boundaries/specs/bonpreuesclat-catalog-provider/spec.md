# Delta for BonpreuEsclat Catalog Provider

## ADDED Requirements

### Requirement: Provider-Compatible List Mutation Wiring

The system MUST allow `bonpreuesclat` catalog items to enter list mutations through the same provider resolver contract used for provider-aware catalog reads. Provider identity SHALL remain explicit across request validation, mutation execution, and error handling.

#### Scenario: Bonpreu draft accepts Bonpreu catalog mutation

- GIVEN an active draft bound to `bonpreuesclat`
- WHEN a Bonpreu catalog item is added to the list
- THEN the mutation executes with the `bonpreuesclat` provider implementation

#### Scenario: Bonpreu request respects draft-provider conflict rules

- GIVEN an active draft bound to `mercadona`
- WHEN a Bonpreu catalog item mutation is requested
- THEN the API rejects the mutation with the standard draft-provider conflict contract

### Requirement: Bonpreu Public Contract Documentation

The system MUST document BonpreuEsclat public API behavior, including canonical product normalization, leaf-only loading, bounded search behavior, and provider-aware list mutation expectations.

#### Scenario: Documentation covers public provider contract

- GIVEN Bonpreu API docs are reviewed
- WHEN a client or maintainer checks supported behavior
- THEN the docs describe request routes, response shape, and provider-aware mutation constraints

#### Scenario: Documentation stays aligned with wiring changes

- GIVEN provider-aware mutation wiring changes for Bonpreu
- WHEN the change is shipped
- THEN the public docs are updated in the same change set
