# Delta for shopping-list-item-identity

## MODIFIED Requirements

### Requirement: Complete y save sin colisiones

El sistema DEBE ejecutar operaciones save/complete sin colisiones causadas por identificadores mixtos cliente/servidor, manteniendo `item.id = listId:sourceProductId` como identidad técnica estable para draft/edit/autosave.
(Previously: Save/complete collision safety existed but stability of `listId:sourceProductId` across draft/edit/autosave was not explicit.)

#### Scenario: Complete usa IDs técnicos de forma segura

- DADOS ítems marcados, indexados canónicamente por `sourceProductId`
- CUANDO llamadas de complete/save requieren IDs técnicos
- ENTONCES la solicitud mapea determinísticamente a valores `serverItemId` correspondientes
- Y no se produce ningún ítem marcado duplicado o faltante por mismatch de IDs

#### Scenario: Draft/edit/autosave preserva id compuesto

- GIVEN un ítem de catálogo con `sourceProductId = 4706` en lista `L1`
- WHEN el ítem pasa por draft, edición y autosave
- THEN su identidad técnica se mantiene como `L1:4706`

## ADDED Requirements

### Requirement: Provider Payload Contract Error on Add

El sistema MUST reject add-to-list mutations when required provider payload fields are invalid, and SHALL avoid persistence side effects.

#### Scenario: Missing price amount blocks persistence

- GIVEN un payload de proveedor sin `price.amount`
- WHEN se intenta agregar el producto a una lista draft
- THEN la API responde error de contrato de provider
- AND no list item is persisted
