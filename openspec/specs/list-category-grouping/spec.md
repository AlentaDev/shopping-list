# Especificación de list-category-grouping

## Propósito
Definir la agrupación por snapshot de categoría nivel 1 y la persistencia de snapshots de categoría/subcategoría para web y Android.

## Requisitos

### Requisito: Persistencia híbrida de category snapshots
El sistema DEBE persistir `categorySnapshot` y `subcategorySnapshot` en cada ítem de lista cuando se agrega desde catálogo, y DEBERÁ exponer ambos campos en los DTOs backend consumidos por web y Android. Para payloads Bonpreu, DEBE derivar snapshots desde `categoryPath[]` con fallback nulo estable.

#### Escenario: Snapshot persistido al agregar
- DADO un producto de catálogo con metadata de categoría/subcategoría
- CUANDO la persona usuaria lo agrega a una lista
- ENTONCES el ítem de lista almacenado contiene `categorySnapshot` y `subcategorySnapshot`

#### Escenario: Ítem histórico sin metadata sigue siendo válido
- DADO un ítem histórico sin campos snapshot
- CUANDO se carga en vistas de detalle o composición
- ENTONCES el ítem se acepta sin falla de migración

#### Escenario: Bonpreu con categoryPath de múltiples niveles
- DADO `categoryPath = ["alimentacion","lacteos","batidos"]`
- CUANDO se persiste el snapshot del ítem
- ENTONCES `categorySnapshot = "lacteos"` y `subcategorySnapshot = "batidos"`

#### Escenario: categoryPath inválido usa fallback nulo
- DADO `categoryPath` ausente o sin niveles válidos
- CUANDO se persiste el snapshot del ítem
- ENTONCES `categorySnapshot = null` y `subcategorySnapshot = null`

### Requisito: Agrupación y orden por categoría nivel 1 por defecto
El sistema DEBE agrupar ítems por `categorySnapshot` por defecto en vistas de detalle y composición de listas. `subcategorySnapshot` PUEDE estar presente como metadata opcional, pero NO DEBE ser el eje de agrupación. Si falta `categorySnapshot`, DEBE aplicar fallback a `Sin categoría`.

#### Escenario: Fallback de agrupación estable
- DADO un conjunto mixto de ítems con y sin metadata snapshot
- CUANDO se renderiza la vista agrupada
- ENTONCES cada ítem pertenece exactamente a un grupo determinístico

#### Escenario: Metadata opcional de subcategoría no altera el eje de agrupación
- DADO ítems con `categorySnapshot` y `subcategorySnapshot`
- CUANDO se renderiza la vista agrupada
- ENTONCES la agrupación se determina por `categorySnapshot`
- Y `subcategorySnapshot` permanece solo como metadata opcional

### Requisito: Minimización de llamadas a Mercadona para agrupar
El sistema NO DEBE requerir llamadas on-demand de clasificación a Mercadona durante agrupación/render cuando los snapshots ya están persistidos, y DEBERÍA usar etiquetas de fallback local para datos históricos sin snapshot.

#### Escenario: Render sin lookup al provider
- DADO una lista ya persistida con snapshot o datos históricos con fallback
- CUANDO web o Android renderiza ítems agrupados
- ENTONCES no se requiere lookup extra a Mercadona para completar la agrupación
