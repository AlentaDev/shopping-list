# list-status-multi-view Specification

## Purpose
Asegurar comportamiento consistente cross-platform para listas `DRAFT`, `ACTIVE` y `COMPLETED` sin romper flujos legacy.

## Requirements

### Requirement: Status-Scoped Retrieval Consistency
The system MUST support retrieving lists by `DRAFT`, `ACTIVE`, and `COMPLETED` status for web and Android, and SHALL keep legacy default behavior when no explicit status filter is provided.

#### Scenario: Explicit status request
- GIVEN a user with lists in all three statuses
- WHEN the client requests one status view
- THEN only lists for that requested status are returned

#### Scenario: Legacy request compatibility
- GIVEN a legacy client request without status filter
- WHEN the backend resolves the list query
- THEN the previous default response behavior remains unchanged

### Requirement: Cross-Status Behavior Parity
The system MUST apply the same grouping and fallback rules for item classification in `DRAFT`, `ACTIVE`, and `COMPLETED` views on both web and Android.

#### Scenario: Parity across platforms and statuses
- GIVEN equivalent list data in web and Android
- WHEN users open draft, active, and completed detail views
- THEN grouping output is semantically equivalent in all statuses and both clients
