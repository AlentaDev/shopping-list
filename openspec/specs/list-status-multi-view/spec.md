# Especificación de list-status-multi-view

## Propósito
Asegurar comportamiento consistente cross-platform para listas `DRAFT`, `ACTIVE` y `COMPLETED` sin romper flujos legacy.

## Requisitos

### Requisito: Consistencia de recuperación por status
El sistema DEBE soportar recuperar listas por status `DRAFT`, `ACTIVE` y `COMPLETED` para web y Android, y DEBERÁ mantener el comportamiento legacy por defecto cuando no se provee filtro explícito de status.

#### Escenario: Solicitud explícita por status
- DADA una persona usuaria con listas en los tres status
- CUANDO el cliente solicita una vista de un status
- ENTONCES se devuelven solo listas del status solicitado

#### Escenario: Compatibilidad con solicitudes legacy
- DADA una solicitud de cliente legacy sin filtro de status
- CUANDO el backend resuelve la consulta de listas
- ENTONCES el comportamiento previo de respuesta por defecto permanece sin cambios

### Requisito: Paridad de comportamiento entre status
El sistema DEBE aplicar las mismas reglas de agrupación y fallback para clasificación de ítems en vistas `DRAFT`, `ACTIVE` y `COMPLETED`, tanto en web como en Android.

#### Escenario: Paridad entre plataformas y status
- DADOS datos equivalentes de listas en web y Android
- CUANDO las personas usuarias abren vistas de detalle draft, active y completed
- ENTONCES la salida de agrupación es semánticamente equivalente en todos los status y en ambos clientes
