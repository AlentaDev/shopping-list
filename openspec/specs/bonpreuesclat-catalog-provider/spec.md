# BonpreuEsclat Catalog Provider Specification

## Purpose

Definir la integración API-first de BonpreuEsclat con contrato canónico de catálogo y compatibilidad de consumo para clientes.

## Requirements

### Requirement: Canonical Bonpreu Product Normalization

The system MUST normalize BonpreuEsclat category, search, and product-detail responses into the canonical catalog contract before exposing data to clients.

#### Scenario: Category response maps to canonical product contract

- GIVEN a Bonpreu category-leaf response with products
- WHEN the API returns catalog products
- THEN each product includes canonical identity, name, price, image, and provider fields
- AND client consumers receive the same schema used by other providers

#### Scenario: Missing image paths keep product usable

- GIVEN a Bonpreu product without `imagePaths` or with an empty array
- WHEN the product is normalized
- THEN `thumbnail` is set to `null`

### Requirement: Leaf-Only Product Loading for Deep Trees

The system MUST load products only for leaf categories and SHALL keep intermediate nodes as navigation-only.

#### Scenario: Intermediate category does not trigger product list

- GIVEN a selected category node with children
- WHEN catalog navigation resolves that node
- THEN the response contains child categories
- AND no product list is returned for that step

#### Scenario: Leaf category loads full declared volume

- GIVEN a selected leaf category with `productCount = N`
- WHEN requesting products for that category
- THEN the provider query uses `maxProductsToDecorate = N`

### Requirement: Bounded Search and Group Tolerance

The system MUST cap Bonpreu search results at 30 products and MUST ignore empty product groups without failing the request.

#### Scenario: Search cap is enforced

- GIVEN a search response with more than 30 eligible products
- WHEN the API normalizes search output
- THEN exactly 30 products maximum are returned

#### Scenario: Empty clusters do not break search

- GIVEN search `productGroups` includes empty cluster groups
- WHEN the API composes canonical search results
- THEN empty groups are ignored
- AND the endpoint returns success with available products

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
