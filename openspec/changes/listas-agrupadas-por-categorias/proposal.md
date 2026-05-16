# Propuesta: Listas agrupadas por categorías

## Intención
Habilitar visualización y operación consistente de listas por estado (`DRAFT/ACTIVE/COMPLETED`) y detalle agrupado por **categoría nivel 1 por defecto** (sin usar subcategoría como eje), evitando dependencia on-demand del catálogo y manteniendo identidad canónica de ítems.

## Alcance

### Dentro del alcance
- Extender contrato de ítem de lista con `categorySnapshot`/`subcategorySnapshot` al alta desde catálogo y exposición en DTOs backend.
- Soportar consumo por estados en web y Android (incluyendo draft) sin romper default actual para clientes legacy.
- Implementar agrupación por categoría nivel 1 (fallback defensivo → “Sin categoría”) en detalle de listas web y Android.
- Mantener compatibilidad de lectura para datos legacy sin exigir backfill histórico.
- TDD por capa (backend application/api, web services/components, android data/domain/ui + migración Room).

### Fuera de alcance
- Rediseño de arquitectura (microservicios, CQRS, cambios de patrón global).
- Backfill/migración histórica compleja para completar snapshots antiguos.
- Nuevas integraciones externas o llamadas frontend directas a Mercadona.

## Capacidades

### Capacidades nuevas
- `list-category-grouping`: agrupación y orden cross-platform por categoría nivel 1 snapshot con fallback determinístico.
- `list-status-multi-view`: consulta y presentación de listas por `DRAFT/ACTIVE/COMPLETED` en clientes.

### Capacidades modificadas
- `shopping-list-item-identity`: extender identidad dual para convivir con snapshots de clasificación sin romper deduplicación ni mapeo `sourceProductId` ↔ `serverItemId`.

## Enfoque
Enfoque **híbrido**: conservar `sourceProductId` como identidad canónica, `serverItemId` como referencia técnica y agregar snapshot de clasificación en ítems al momento de alta. La UI agrupa por `categorySnapshot` por defecto; `subcategorySnapshot` queda como metadata opcional sin rol de agrupación.

## Áreas afectadas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/api/src/modules/lists/{domain,application,api}` | Modified | Snapshots de clasificación, DTOs y filtros/estrategia por status |
| `apps/web/src/features/lists/{services,components}` | Modified | Consulta multi-status + render agrupado por categoría nivel 1 |
| `apps/web/src/features/shopping-list/services/adapters` | Modified | Normalización identidad + snapshots en hidratación/reuse/edit |
| `apps/mobile-android/.../feature/{lists,listdetail}` | Modified | Modelo remoto/local, cache por status y UI agrupada |
| `apps/mobile-android/.../core/data/database` | Modified | Migración Room para snapshots de clasificación |

## Riesgos

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Room migration inconsistente | Med | Test de upgrade + fallback nullable |
| Regresión en reuse/edit/autosave | Med | TDD de identidad canónica y reconciliación técnica |
| Sobrecarga backend por filtros múltiples | Low/Med | Reusar caso de uso existente, evitar N+1 |
| Ambigüedad entre categoría y subcategoría en clientes | Low | Fijar regla única: agrupación L1 por `categorySnapshot`; `subcategorySnapshot` solo metadata |

## Plan de rollback
Rollback por slices: (1) desactivar agrupación UI y volver a lista plana, (2) mantener campos snapshot opcionales en API sin uso cliente, (3) en Android conservar migración forward-compatible nullable sin bloquear lecturas legacy.

## Dependencias
- Contrato catálogo con categoría nivel 1 disponible al agregar item.
- Alineación de naming cross-platform para snapshots.

## Criterios de éxito
- [ ] Detalle web y Android agrupa por categoría nivel 1 con fallback defensivo `Sin categoría` en datos nuevos e históricos.
- [ ] Web y Android muestran listas draft/active/completed según estrategia acordada, sin romper flujo legacy.
- [ ] Tests críticos TDD verdes en backend, web y Android; sin duplicados por identidad mixta.
- [ ] No se requiere backfill histórico para completar snapshots legacy; la estrategia es reset de BBDD de usuario cuando aplique.
