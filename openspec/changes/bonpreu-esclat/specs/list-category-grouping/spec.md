# Delta for list-category-grouping

## MODIFIED Requirements

### Requirement: Persistencia híbrida de category snapshots

El sistema DEBE persistir `categorySnapshot` y `subcategorySnapshot` en cada ítem de lista cuando se agrega desde catálogo, y DEBERÁ exponer ambos campos en los DTOs backend consumidos por web y Android. Para payloads Bonpreu, DEBE derivar snapshots desde `categoryPath[]` con fallback nulo estable.
(Previously: Snapshot persistence was required but derivation rules from Bonpreu `categoryPath[]` were not explicit.)

#### Scenario: Snapshot persistido al agregar

- GIVEN un producto de catálogo con metadata de categoría/subcategoría
- WHEN la persona usuaria lo agrega a una lista
- THEN el ítem de lista almacenado contiene `categorySnapshot` y `subcategorySnapshot`

#### Scenario: Ítem histórico sin metadata sigue siendo válido

- GIVEN un ítem histórico sin campos snapshot
- WHEN se carga en vistas de detalle o composición
- THEN el ítem se acepta sin falla de migración

#### Scenario: Bonpreu con categoryPath de múltiples niveles

- GIVEN `categoryPath = ["alimentacion","lacteos","batidos"]`
- WHEN se persiste el snapshot del ítem
- THEN `categorySnapshot = "lacteos"` y `subcategorySnapshot = "batidos"`

#### Scenario: categoryPath inválido usa fallback nulo

- GIVEN `categoryPath` ausente o sin niveles válidos
- WHEN se persiste el snapshot del ítem
- THEN `categorySnapshot = null` y `subcategorySnapshot = null`
