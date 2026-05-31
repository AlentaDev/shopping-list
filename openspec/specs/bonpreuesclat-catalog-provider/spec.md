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
