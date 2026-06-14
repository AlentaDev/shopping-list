# Delta for shopping-list-item-identity

## ADDED Requirements

### Requirement: Bonpreu Add-to-List Resolves Internal Product Lookup

The system MUST accept Bonpreu add-to-list requests on `POST /api/lists/:id/items/from-catalog` with `provider = bonpreuesclat` and `productId = retailerProductId` obtained from Bonpreu category detail. The API MUST resolve that identifier through the internal Bonpreu product lookup before persisting the list-item snapshot, and MUST NOT require a public single-product endpoint.

#### Scenario: Bonpreu category detail product can be added to list

- GIVEN Bonpreu category detail returns a product with `retailerProductId = "8437012345678"`
- WHEN the client posts `{ "provider": "bonpreuesclat", "productId": "8437012345678", "qty": 1 }`
- THEN the API resolves the product through the internal Bonpreu lookup
- AND the persisted list item keeps `source = bonpreuesclat` and `sourceProductId = "8437012345678"`

#### Scenario: Failed Bonpreu lookup prevents persistence

- GIVEN a Bonpreu add-to-list request references a `retailerProductId` the internal lookup cannot resolve
- WHEN the mutation is executed
- THEN the API returns a controlled catalog-provider failure
- AND no list item is persisted

### Requirement: Rest Client Documentation Matches Bonpreu Add-to-List Contract

The system MUST document Bonpreu Rest Client examples for `POST /api/lists/:id/items/from-catalog` using `provider = bonpreuesclat` and `productId = retailerProductId` from category detail, and MUST describe that lookup as internal provider behavior.

#### Scenario: Rest Client body matches the live Bonpreu contract

- GIVEN QA follows the published list-mutation documentation
- WHEN they copy the Bonpreu add-to-list example
- THEN the request body uses `provider = bonpreuesclat` with `productId` set to the category-detail `retailerProductId`
- AND the documentation does not instruct QA to call a public Bonpreu product-detail endpoint first
