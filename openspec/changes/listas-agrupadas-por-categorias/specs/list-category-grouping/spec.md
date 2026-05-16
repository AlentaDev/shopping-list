# list-category-grouping Specification

## Purpose
Definir agrupación y orden por categoría nivel 1 snapshot para detalle y confección de listas, con fallback defensivo para históricos y mínima dependencia del catálogo remoto.

## Requirements

### Requirement: Hybrid Category Snapshot Persistence
The system MUST persist `categorySnapshot` and `subcategorySnapshot` in each list item when the item is added from catalog, and SHALL expose both fields in backend DTOs consumed by web and Android.

#### Scenario: Snapshot persisted on add
- GIVEN a catalog product with category/subcategory metadata
- WHEN the user adds it to a list
- THEN the stored list item contains `categorySnapshot` and `subcategorySnapshot`

#### Scenario: Historical item without metadata remains valid
- GIVEN a historical item without snapshot fields
- WHEN it is loaded in detail or composition views
- THEN the item is accepted without migration failure

### Requirement: Default Grouping and Ordering by Level-1 Category
The system MUST group items by `categorySnapshot` by default in list detail and list composition views. `subcategorySnapshot` MAY be present as optional metadata but MUST NOT be the grouping axis. If `categorySnapshot` is missing, it MUST fallback to `Sin categoría`.

#### Scenario: Stable grouping fallback
- GIVEN mixed items with and without snapshot metadata
- WHEN the grouped view is rendered
- THEN every item belongs to exactly one deterministic group

#### Scenario: Optional subcategory metadata does not alter grouping axis
- GIVEN items with both `categorySnapshot` and `subcategorySnapshot`
- WHEN the grouped view is rendered
- THEN grouping is determined by `categorySnapshot`
- AND `subcategorySnapshot` remains optional metadata only

### Requirement: Mercadona Call Minimization for Grouping
The system MUST NOT require on-demand Mercadona classification calls during grouping/rendering when snapshot data is already persisted, and SHOULD use local fallback labels for historical data without snapshot.

#### Scenario: Render without provider lookup
- GIVEN a list already persisted with snapshot or historical fallback data
- WHEN web or Android renders grouped items
- THEN no extra Mercadona lookup is required to complete grouping
