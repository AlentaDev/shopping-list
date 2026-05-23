# Design: Provider-aware Catalog Routing

## Technical Approach

Implementación incremental web+api, manteniendo compatibilidad legacy: (1) routing provider-aware en `app-shell`, (2) contrato API con `provider` explícito para catálogo, (3) ownership de provider en listas usando `lists.provider_id` FK hacia tabla `providers` con invariantes de dominio y backfill, (4) handshake gate (API+auth+draft) para bloquear mutaciones hasta tener source of truth (`draft.provider.slug`), (5) navegación de catálogo que recuerda última categoría por `user + provider`.

## Architecture Decisions

| Opción | Tradeoff | Decisión |
|---|---|---|
| Provider implícito por item | Menos cambios iniciales, invariantes frágiles | ❌ |
| `providerId` string suelto en entidad `List` | Menos cambios inmediatos, sin integridad referencial | ❌ |
| `providers` + `lists.provider_id` FK | Más migración y joins, integridad y extensibilidad reales | ✅ |
| Resolver reglas en UI | UX rápida pero insegura | ❌ |
| Enforce en `domain/application` + UI guía | Más trabajo inicial, consistencia fuerte | ✅ |
| Redirección `/catalog` hardcode a mercadona | Simple, ignora última preferencia | ❌ |
| Alias `/catalog` -> último provider/default | Compatibilidad + UX consistente | ✅ |
| Abrir siempre primera categoría al volver a catálogo | Determinista pero rompe continuidad del usuario | ❌ |
| Recordar última categoría por `user + provider` con fallback a primera | Mejor continuidad sin perder determinismo | ✅ |

## Data Flow

### Routing y resolución de provider

```text
GET /catalog (web)
  -> AppShellNavigation.resolveCatalogAlias()
  -> read lastProviderSlug (localStorage/session)
  -> redirect /{provider||mercadona}/catalog
  -> CatalogService usa provider param en endpoint API
```

### Navegación punto 3: volver donde estaba

```text
GET /:provider/catalog (web)
  -> CatalogNavigationState.getLastCategory(userId, providerSlug)
  -> if exists: redirect /:provider/catalog/:category
  -> else: resolve first category from categories response
  -> persist category on each category navigation (userId + providerSlug + categorySlug)
```

### Handshake y source of truth

```text
AppShell mount
  -> useHandshakeState() [api health + auth session + get autosave/draft]
  -> WAITING: banner visible, acciones listas deshabilitadas
  -> READY: ocultar banner + toast "ya podés seguir"
  -> set activeProvider = draft.provider.slug (source of truth)
  -> habilitar add/remove/increment/decrement
```

### Enforce backend

```text
Mutation (add item / change provider)
  -> Router (Zod params/body)
  -> Application use case
  -> Domain guard (status + empty draft + provider match)
  -> Repository save (`provider_id` persistido con FK)
```

## File Changes

| File | Action | Description |
|---|---|---|
| `apps/web/src/app-shell/useAppShellNavigation.ts` | Modify | Soportar `/`, `/catalog`, `/:provider/catalog`, `/:provider/catalog/:category` + alias redirect. |
| `apps/web/src/features/catalog/services/CatalogService.ts` | Modify | Endpoints provider-aware: `/api/catalog/:provider/categories` y detalle por provider. |
| `apps/web/src/features/catalog/services/useCatalog.ts` | Modify | Recibir provider/category desde ruta y no asumir categoría default global. |
| `apps/web/src/app-shell/AppShell.tsx` | Modify | Integrar estado de handshake y propagar `listMutationsEnabled`. |
| `apps/web/src/features/catalog/Catalog.tsx` | Modify | Mostrar skeleton + copy no técnico de espera API en cold start. |
| `apps/web/src/features/shopping-list/ShoppingList.tsx` | Modify | Deshabilitar mutaciones (add/remove/+/-) hasta handshake READY. |
| `apps/web/src/shared/constants/ui.ts` | Modify | Nuevos textos: home CTA, banner waiting, toast ready. |
| `apps/api/src/modules/catalog/api/catalogRouter.ts` | Modify | Rutas con `:provider` y validación Zod de provider soportado. |
| `apps/api/src/modules/catalog/api/schemas.ts` | Modify | `providerParamsSchema` + `categoryDetailParamsSchema` extendido. |
| `apps/api/src/modules/providers/*` | Create/Modify | Tabla/seed/casos de uso mínimos de resolución provider (`slug`, `display_name`, `id`). |
| `apps/api/src/modules/lists/domain/list.ts` | Modify | Reemplazar `providerId` string por referencia `providerId` FK + guard de mutabilidad por status/empty draft. |
| `apps/api/src/modules/lists/application/{CreateList,ListLists,GetList,AddCatalogItem}.ts` | Modify | Propagar provider en creación/lectura y validar matching en mutaciones. |
| `apps/api/src/modules/lists/application/ports.ts` | Modify | Extender contrato para backfill (`backfillMissingProvider`). |
| `apps/api/src/modules/lists/infrastructure/{InMemoryListRepository,PostgresListRepository}.ts` | Modify | Persistencia `provider_id` FK + resolución `provider.slug/display_name` + fallback transicional a `mercadona`. |
| `apps/api/src/modules/lists/api/{router.ts,validation.ts}` | Modify | Exponer/validar provider en payloads de creación/cambio. |
| `apps/api/src/modules/lists/infrastructure/migrations/*` | Create/Modify | Crear `providers`, seed, agregar FK `lists.provider_id`, backfill y endurecer constraints. |
| `apps/web/src/features/catalog/services/CatalogNavigationState.ts` | Create | Persistencia y recuperación de última categoría por `user + provider`. |
| `docs/features/web/provider-aware-catalog-routing.md` | Create | Objetivo, UX handshake, rutas canónicas y alias. |
| `docs/features/api/list-provider-ownership.md` | Create | Contrato REST, invariantes y transición legacy. |

## Interfaces / Contracts

```ts
// API catalog
GET /api/catalog/:provider/categories
GET /api/catalog/:provider/categories/:id

// API lists DTO
type ListSummaryDto = { id: string; status: ListStatus; provider: { slug: string; displayName: string }; ... }
type ListDetailDto  = { id: string; status: ListStatus; provider: { slug: string; displayName: string }; items: ListItemDto[]; ... }

// Domain
type List = { ...; providerId: string /* FK -> providers.id */ }
```

Reglas: provider mutable solo en `DRAFT` vacío; `ACTIVE`/`COMPLETED` inmutable. Add-item valida `item.source.providerSlug == list.provider.slug` (resuelto desde FK).

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit (CORE 100%) | Guards de dominio provider/FK, adapters/DTO fallback, alias resolver | Vitest/Jest test-first, casos éxito/error/legacy |
| Integration (CORE/IMPORTANT) | Router catálogo `:provider`, listas DTO con provider resuelto (`slug`/`displayName`), backfill repo | tests de router + repos in-memory/postgres mock |
| UI (IMPORTANT 80%) | Banner persistente, acciones deshabilitadas, toast READY, redirect `/catalog` | RTL sobre `AppShell`, `useAppShellNavigation`, `ShoppingList` |
| E2E (mínimo) | Happy path `/catalog` alias + handshake + add item habilitado | 1 test Playwright crítico (sin duplicar unit/integration) |

## Migration / Rollout

1. **DB (Postgres):** crear `providers` (`id`, `slug`, `display_name`), seed inicial (`mercadona`), agregar `lists.provider_id` nullable + FK, backfill listas legacy, luego `NOT NULL` + índice por owner/status/provider.
2. **Deploy seguro:** mantener alias `/catalog`; activar validación estricta luego de backfill verificado.
3. **Rollback:** revertir rutas provider-aware en web/api, mantener alias a `/mercadona/catalog`, desactivar guard estricto provider en use-cases (feature toggle/env).

## Risks & Mitigations

- Desalineación web/api de rutas provider -> contrato único + tests de router y service.
- Falsos READY en handshake -> estado explícito `WAITING|READY|ERROR` y transición única idempotente.
- Regresión listas legacy -> fallback temporal en repos/adapters + backfill verificable + monitoreo de nulls.

## Out of Scope / Next Step

- Evaluar cache de categorías en BBDD (tabla/snapshot por provider + TTL + fallback al provider externo) para resiliencia/performance. Este trabajo queda explícitamente fuera de este change y se propone como siguiente incremento.

## Open Questions

- [ ] Definir lista inicial de providers válidos además de `mercadona` (si no, empezar con enum single-value extensible).
