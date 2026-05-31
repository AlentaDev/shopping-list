# Especificación de shopping-list-item-identity

## Propósito
Definir identidad dual de ítems en web para eliminar colisiones entre `idProducto` y `idLista:idProducto` sin cambiar la persistencia backend.

## No objetivos
- No cambiar el formato backend `item.id = {listId}:{productId}`.
- No rediseñar sincronización multi-dispositivo ni resolver completamente conflictos multi-tab.
- No modificar la política de single-draft backend (solo preservarla).

## Requisitos

### Requisito: Identidad canónica del cliente
El sistema DEBE tratar `sourceProductId` como identidad canónica de cliente para ítems de catálogo, y DEBE tratar `serverItemId` solo como referencia técnica del servidor. Además, DEBE soportar `categorySnapshot` / `subcategorySnapshot` opcionales como metadata de clasificación que NO DEBE alterar la semántica de deduplicación.

#### Escenario: Identidad legacy mixta se normaliza
- DADO un ítem cargado con `sourceProductId = active-1:4706` o `idProducto = 4706`
- CUANDO el cliente hidrata ítems de lista
- ENTONCES la identidad canónica es `sourceProductId = 4706`
- Y cualquier identificador técnico se almacena solo como `serverItemId`

### Requisito: Reuse con resolución de draft
El sistema DEBE forzar una única ruta de reuse: crear draft cuando no existe ninguno, o pedir confirmación de reemplazo cuando ya existe un draft.

#### Escenario: Reuse sin draft existente
- DADO que no existe un draft de autosave para la persona usuaria
- CUANDO la persona usuaria dispara reuse desde una lista completed
- ENTONCES el sistema crea un nuevo draft con identidades canónicas `sourceProductId`

#### Escenario: Reuse con draft existente
- DADO que ya existe un draft de autosave
- CUANDO la persona usuaria dispara reuse desde una lista completed
- ENTONCES el sistema pide confirmación de reemplazo antes de sobrescribir

### Requisito: Un solo draft por usuario
El sistema DEBERÁ mantener como máximo un draft de autosave por usuario durante transiciones de reuse, edit, reset y autosave.

#### Escenario: Se eliminan drafts stale
- DADO que se detecta más de un draft por estado stale
- CUANDO se ejecuta una transición de draft
- ENTONCES se eliminan los drafts stale y queda solo un draft activo

### Requisito: Preservación del vínculo de edición activa
El sistema DEBE preservar el vínculo a la lista active de origen mediante `editingTargetListId` para inicio de edit, autosave, finish y cancel.

#### Escenario: El ciclo de edit mantiene el vínculo de origen
- DADO que la persona usuaria inicia edición de una lista active con `editingTargetListId = L1`
- CUANDO se producen snapshots de autosave y luego se ejecuta finish/cancel
- ENTONCES `editingTargetListId` permanece en `L1` hasta que termina el ciclo de edit

### Requisito: Reconciliación de Server ID en autosave
El sistema DEBE hacer autosave usando `sourceProductId` canónico y DEBERÍA reconciliar `serverItemId` cuando llegan respuestas del servidor.

#### Escenario: Reconciliación eventual de server ID
- DADO un ítem draft creado del lado cliente sin `serverItemId`
- CUANDO la persistencia de autosave devuelve IDs técnicos
- ENTONCES el ítem mantiene el mismo `sourceProductId`
- Y `serverItemId` se adjunta/actualiza sin crear duplicados

### Requisito: Deduplicación robusta
El sistema DEBE deduplicar ítems de catálogo por `sourceProductId` canónico, incluyendo entradas legacy mixtas (`idProducto` e `idLista:idProducto`).

#### Escenario: Entradas legacy mixtas colapsan a una
- DADOS dos ítems que representan el mismo producto (`4706` y `active-1:4706`)
- CUANDO corre merge/hydration
- ENTONCES el resultado contiene exactamente un ítem de catálogo para `sourceProductId = 4706`

### Requisito: Complete y save sin colisiones
El sistema DEBE ejecutar operaciones save/complete sin colisiones causadas por identificadores mixtos cliente/servidor, manteniendo `item.id = listId:sourceProductId` como identidad técnica estable para draft/edit/autosave.

#### Escenario: Complete usa IDs técnicos de forma segura
- DADOS ítems marcados, indexados canónicamente por `sourceProductId`
- CUANDO llamadas de complete/save requieren IDs técnicos
- ENTONCES la solicitud mapea determinísticamente a valores `serverItemId` correspondientes
- Y no se produce ningún ítem marcado duplicado o faltante por mismatch de IDs

#### Escenario: Draft/edit/autosave preserva id compuesto
- DADO un ítem de catálogo con `sourceProductId = 4706` en lista `L1`
- CUANDO el ítem pasa por draft, edición y autosave
- ENTONCES su identidad técnica se mantiene como `L1:4706`

### Requisito: Error de contrato del provider al agregar

El sistema DEBE rechazar mutaciones add-to-list cuando faltan campos obligatorios del payload del provider y DEBE evitar efectos secundarios de persistencia.

#### Escenario: Missing price amount blocks persistence
- DADO un payload de proveedor sin `price.amount`
- CUANDO se intenta agregar el producto a una lista draft
- ENTONCES la API responde error de contrato de provider
- Y no se persiste ningún item de lista

## Criterios de aceptación
- Reuse + edit + autosave flows produce 0 duplicate catalog items for a same `sourceProductId` in automated tests.
- Reuse enforces replace confirmation when a draft exists, and creates draft directly when none exists.
- A single draft per user is verifiable after each transition (reuse/edit/reset/autosave).
- `editingTargetListId` persists across edit lifecycle until finish/cancel.
- Complete/save requests are validated to map canonical selection to technical IDs with no collisions.

## Riesgos conocidos y mitigaciones
- Conflictos parciales multi-tab PUEDEN seguir ocurriendo; mitigar con last-write-wins + dedup determinística en lectura.
- Snapshots locales legacy PUEDEN traer IDs mixtos; mitigar con normalización idempotente durante hydration.
- Ausencia de `serverItemId` durante estados transitorios PUEDE bloquear operaciones técnicas; mitigar con reconciliación diferida y mapeo API protegido.
