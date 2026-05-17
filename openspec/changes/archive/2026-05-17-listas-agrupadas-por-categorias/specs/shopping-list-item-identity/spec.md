# Delta for shopping-list-item-identity

## MODIFIED Requirements

### Requirement: Canonical Client Identity
The system MUST treat `sourceProductId` as the canonical client identity for catalog items, MUST treat `serverItemId` as a technical server reference only, and SHALL support optional `categorySnapshot`/`subcategorySnapshot` as non-identity metadata that never changes deduplication semantics.
(Previously: Canonical identity covered only `sourceProductId` and `serverItemId`, without explicit snapshot coexistence rules.)

#### Scenario: Legacy mixed identity is normalized
- GIVEN an item loaded with `sourceProductId = active-1:4706` or `idProducto = 4706`
- WHEN the client hydrates list items
- THEN the canonical identity is `sourceProductId = 4706`
- AND any technical identifier is stored only as `serverItemId`

#### Scenario: Snapshot metadata does not alter identity
- GIVEN two entries with the same canonical `sourceProductId` and different snapshot completeness
- WHEN hydration or merge runs
- THEN deduplication keeps one canonical item
- AND snapshot fields are treated as optional classification metadata
