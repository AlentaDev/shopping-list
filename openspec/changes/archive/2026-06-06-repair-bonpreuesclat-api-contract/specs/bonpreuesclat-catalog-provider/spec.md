# Delta for bonpreuesclat-catalog-provider

## ADDED Requirements

### Requirement: Rest Client Documentation Matches the Bonpreu Public Surface

The system MUST document Bonpreu catalog QA examples with the live provider-aware endpoints `GET /api/catalog/:provider/categories` and `GET /api/catalog/:provider/categories/:id`, and MUST NOT document Bonpreu search or a public single-product endpoint for this change.

#### Scenario: Rest Client examples stay within the shipped surface

- GIVEN QA follows the Bonpreu catalog documentation
- WHEN they copy the published Rest Client examples
- THEN every example targets `/api/catalog/bonpreuesclat/categories` or `/api/catalog/bonpreuesclat/categories/:id`
- AND no example references Bonpreu search or a public product-detail route

## MODIFIED Requirements

### Requirement: Canonical Bonpreu Product Normalization

The system MUST normalize BonpreuEsclat category, search, and product-detail responses into the canonical catalog contract before exposing data to clients. Bonpreu category identifiers returned by public category endpoints MUST remain the canonical upstream string values and MUST round-trip unchanged into later category-detail requests.

(Previously: Bonpreu normalization did not state that public category IDs must remain canonical upstream strings.)

#### Scenario: Category response maps to canonical product contract

- GIVEN a Bonpreu category-leaf response with products
- WHEN the API returns catalog products
- THEN each product includes canonical identity, name, price, image, and provider fields
- AND client consumers receive the same schema used by other providers

#### Scenario: Missing image paths keep product usable

- GIVEN a Bonpreu product without `imagePaths` or with an empty array
- WHEN the product is normalized
- THEN `thumbnail` is set to `null`

#### Scenario: Category ID round-trips without hashing

- GIVEN `GET /api/catalog/bonpreuesclat/categories` returns category ID `"08f4f6d0-..."`
- WHEN the client requests `GET /api/catalog/bonpreuesclat/categories/08f4f6d0-...`
- THEN the provider resolves that same canonical string ID
- AND no deterministic numeric hash is required or introduced

### Requirement: Leaf-Only Product Loading for Deep Trees

The system MUST load Bonpreu products only for the deepest reachable categories and SHALL keep parent or intermediate Bonpreu nodes as navigation-only. Bonpreu traversal MUST remain provider-specific and MUST NOT be changed to mirror Mercadona behavior. The deepest reachable Bonpreu category MAY occur at different depths across branches.

(Previously: The requirement stated leaf-only loading, but did not lock provider-specific traversal or variable-depth deepest-category behavior.)

#### Scenario: Intermediate category does not trigger product list

- GIVEN a selected Bonpreu category node with child categories
- WHEN catalog navigation resolves that node
- THEN the response contains child categories
- AND no product list is returned for that step

#### Scenario: Leaf category loads full declared volume

- GIVEN a selected deepest Bonpreu category with `productCount = N`
- WHEN requesting products for that category
- THEN the provider query uses `maxProductsToDecorate = N`

#### Scenario: Deeper child keeps parent navigation-only

- GIVEN a Bonpreu branch where the selected node still has a deeper reachable child
- WHEN the client requests that selected node detail
- THEN the selected node response exposes navigation children only
- AND products remain hidden until the deepest reachable category is requested
