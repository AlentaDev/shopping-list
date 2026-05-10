# shopping-list-item-identity Specification

## Purpose
Definir identidad dual de ítems en web para eliminar colisiones entre `idProducto` y `idLista:idProducto` sin cambiar la persistencia backend.

## Non-Goals
- No cambiar el formato backend `item.id = {listId}:{productId}`.
- No rediseñar sincronización multi-dispositivo ni resolver completamente conflictos multi-tab.
- No modificar la política de single-draft backend (solo preservarla).

## Requirements

### Requirement: Canonical Client Identity
The system MUST treat `sourceProductId` as the canonical client identity for catalog items, and MUST treat `serverItemId` as a technical server reference only.

#### Scenario: Legacy mixed identity is normalized
- GIVEN an item loaded with `sourceProductId = active-1:4706` or `idProducto = 4706`
- WHEN the client hydrates list items
- THEN the canonical identity is `sourceProductId = 4706`
- AND any technical identifier is stored only as `serverItemId`

### Requirement: Reuse with Draft Resolution
The system MUST enforce a single reuse path: create draft when none exists, or request replacement confirmation when a draft already exists.

#### Scenario: Reuse without existing draft
- GIVEN no autosave draft exists for the user
- WHEN the user triggers reuse from a completed list
- THEN the system creates a new draft with canonical `sourceProductId` identities

#### Scenario: Reuse with existing draft
- GIVEN an autosave draft already exists
- WHEN the user triggers reuse from a completed list
- THEN the system asks for replacement confirmation before overwriting

### Requirement: Single Draft per User
The system SHALL keep at most one autosave draft per user during reuse, edit, reset, and autosave transitions.

#### Scenario: Stale drafts are removed
- GIVEN more than one draft is discoverable due to stale state
- WHEN a draft transition is executed
- THEN stale drafts are removed and only one active draft remains

### Requirement: Active Edit Link Preservation
The system MUST preserve the link to the origin active list through `editingTargetListId` for edit start, autosave, finish, and cancel.

#### Scenario: Edit lifecycle keeps origin link
- GIVEN the user starts editing an active list with `editingTargetListId = L1`
- WHEN autosave snapshots are produced and later finish/cancel is executed
- THEN `editingTargetListId` remains `L1` until the edit lifecycle ends

### Requirement: Autosave Server ID Reconciliation
The system MUST autosave using canonical `sourceProductId` and SHOULD reconcile `serverItemId` when server responses arrive.

#### Scenario: Eventual server ID reconciliation
- GIVEN a draft item created client-side without `serverItemId`
- WHEN autosave persistence returns technical IDs
- THEN the item keeps the same `sourceProductId`
- AND `serverItemId` is attached/updated without creating duplicates

### Requirement: Robust Deduplication
The system MUST deduplicate catalog items by canonical `sourceProductId`, including legacy mixed inputs (`idProducto` and `idLista:idProducto`).

#### Scenario: Mixed legacy entries collapse to one
- GIVEN two items representing the same product (`4706` and `active-1:4706`)
- WHEN merge/hydration runs
- THEN the result contains exactly one catalog item for `sourceProductId = 4706`

### Requirement: Collision-Free Complete and Save
The system MUST execute save/complete operations without collisions caused by mixed client/server identifiers.

#### Scenario: Complete uses technical IDs safely
- GIVEN checked items keyed canonically by `sourceProductId`
- WHEN complete/save calls require technical IDs
- THEN the request maps to corresponding `serverItemId` values deterministically
- AND no duplicate or missing checked item is produced by ID mismatch

## Acceptance Criteria
- Reuse + edit + autosave flows produce 0 duplicate catalog items for a same `sourceProductId` in automated tests.
- Reuse enforces replace confirmation when a draft exists, and creates draft directly when none exists.
- A single draft per user is verifiable after each transition (reuse/edit/reset/autosave).
- `editingTargetListId` persists across edit lifecycle until finish/cancel.
- Complete/save requests are validated to map canonical selection to technical IDs with no collisions.

## Known Risks and Mitigations
- Partial multi-tab conflicts MAY still occur; mitigate with last-write-wins + deterministic dedup on read.
- Legacy local snapshots MAY carry mixed IDs; mitigate with idempotent normalization during hydration.
- Missing `serverItemId` during transient states MAY block technical operations; mitigate with deferred reconciliation and guarded API mapping.
