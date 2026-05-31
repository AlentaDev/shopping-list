# Proposal: BonpreuEsclat API-first Multi-provider

## Intent

Habilitar BonpreuEsclat en catálogo y listas sin romper Mercadona, manteniendo un contrato único backend para Web/Android y respetando draft/autosave.

## Scope

### In Scope
- API-first: routing por `:provider` real con strategy/adapters backend-only.
- Contrato canónico de catálogo (categorías, búsqueda, detalle, add-to-list input) con adaptación por provider.
- Reglas cerradas pre-SDD: snapshot mínimo, `id=listId:sourceProductId`, 409 `draft_provider_conflict`, carga de productos solo en hoja.

### Out of Scope
- Implementación Web y Android (se definen en fases posteriores).
- Limpieza definitiva de campos legacy de unidad/pack.

## Capabilities

### New Capabilities
- `bonpreuesclat-catalog-provider`: integración BonpreuEsclat (categorías profundas, búsqueda, detalle, normalización canónica).

### Modified Capabilities
- `provider-aware-catalog-routing`: enrutar internamente por provider, no solo validar path.
- `list-provider-ownership`: reforzar validación de mutaciones por `draft.provider.slug` + contrato 409 estable.
- `list-category-grouping`: alinear snapshot Bonpreu (`categoryPath`) con persistencia y fallbacks nulos.
- `shopping-list-item-identity`: conservar identidad `listId:sourceProductId` en draft/edit/autosave.

## Approach

Aplicar Provider Strategy incremental (API slices): introducir contrato canónico interno + resolver por slug; mantener compatibilidad temporal (`source` legacy) y fallback `provider.displayName -> slug`.

## Scope Boundaries, Non-goals y Acceptance Direction

- Límite: solo `apps/api` + docs SDD/API.
- Non-goal: big-bang cross-app o rediseño de persistencia.
- Dirección de aceptación: Gate 1 API verde con tests de compatibilidad Mercadona + nuevos tests Bonpreu en routing, adapters, errores y AddCatalogItem.

## Decision Log (for spec/design)

- Se adopta Approach 1 (Provider Strategy) sobre ramas ad-hoc.
- `price.amount` faltante => error de contrato provider (sin persistir).
- Regla de productos: cargar solo categoría hoja; `maxProductsToDecorate=productCount`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/api/src/modules/catalog/**` | Modified | Contrato canónico, resolver provider, routing real por slug |
| `apps/api/src/modules/lists/application/AddCatalogItem.ts` | Modified | Snapshot Bonpreu, identidad item, validación contrato |
| `apps/api/src/modules/lists/api/validation.ts` | Modified | Validación provider/source transición |
| `apps/api/src/modules/lists/application/errors.ts` | Modified | Errores dominio provider payload/conflict |
| `docs/features/api/**` | Modified | Contrato funcional API actualizado |

## Risks

| Risk | Mitigation | Validation evidence |
|------|------------|---------------------|
| Regresión Mercadona | Tests de compatibilidad en router/use-cases/adapters | Suite verde Mercadona + snapshots de respuesta sin delta funcional |
| Inconsistencia draft/autosave | Forzar `id=listId:sourceProductId` y validación por `draft.provider.slug` | Tests AddCatalogItem/edit/autosave con mixed provider y dedup estable |
| Sobrecarga por categorías profundas | Regla hoja obligatoria + `maxProductsToDecorate=productCount` | Tests de navegación + métricas de payload por categoría hoja |
| UX inconsistente en conflicto provider | Contrato 409 con `errorCode` + `allowedActions` estable | Contract tests HTTP 409 y fixtures consumibles por Web/Android |

## Rollback Plan

Revertir wiring multi-provider a resolver Mercadona-only, mantener DTO legacy y desactivar rutas Bonpreu por feature flag de provider.

## Dependencies

- Disponibilidad de endpoints Bonpreu referenciados y datos mínimos (`price.amount`, `categoryPath`, `imagePaths`).

## Success Criteria

- [ ] API soporta Bonpreu sin romper contratos activos de Mercadona.
- [ ] Add-to-list persiste snapshot mínimo y rechaza payload inválido del provider.
- [ ] Conflicto de provider en draft responde 409 estable consumible por clientes.
