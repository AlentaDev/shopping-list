# Especificación de list-status-multi-view

## Propósito
Asegurar comportamiento consistente cross-platform para listas `DRAFT`, `ACTIVE` y `COMPLETED` sin romper flujos legacy.

## Requisitos

### Requisito: Consistencia de recuperación por status
El sistema DEBE soportar recuperar listas por status `DRAFT`, `ACTIVE` y `COMPLETED` para web y Android, y DEBERÁ mantener el comportamiento legacy por defecto cuando no se provee filtro explícito de status. Además, cada lista devuelta DEBE incluir provider resuelto (`slug`, `displayName`) desde `lists.provider_id`; si un registro legacy no tiene FK durante la transición, DEBERÁ resolverse como `mercadona` hasta completar backfill.

#### Escenario: Solicitud explícita por status
- DADA una persona usuaria con listas en los tres status
- CUANDO el cliente solicita una vista de un status
- ENTONCES se devuelven solo listas del status solicitado

#### Escenario: Compatibilidad con solicitudes legacy
- DADA una solicitud de cliente legacy sin filtro de status
- CUANDO el backend resuelve la consulta de listas
- ENTONCES el comportamiento previo de respuesta por defecto permanece sin cambios

#### Escenario: Provider obligatorio en vistas por status
- DADA una respuesta de listas para cualquier status
- CUANDO el cliente recibe summaries o details
- ENTONCES cada lista incluye provider `slug` y `displayName`

#### Escenario: Fallback transicional para lista legacy
- DADA una lista legacy sin `provider_id` aún no backfilleada
- CUANDO se consulta por status durante transición
- ENTONCES la respuesta expone provider `slug = "mercadona"` sin romper el contrato

### Requisito: Paridad de comportamiento entre status
El sistema DEBE aplicar las mismas reglas de agrupación y fallback para clasificación de ítems en vistas `DRAFT`, `ACTIVE` y `COMPLETED`, tanto en web como en Android.

#### Escenario: Paridad entre plataformas y status
- DADOS datos equivalentes de listas en web y Android
- CUANDO las personas usuarias abren vistas de detalle draft, active y completed
- ENTONCES la salida de agrupación es semánticamente equivalente en todos los status y en ambos clientes
