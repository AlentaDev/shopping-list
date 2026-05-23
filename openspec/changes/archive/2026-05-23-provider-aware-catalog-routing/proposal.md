# Proposal: provider-aware-catalog-routing

## Intent
Enrutar catálogo por provider y reemplazar el modelo string de `providerId` por referencia real a `providers` en BBDD (`lists.provider_id` FK), evitando mezcla de proveedores, mejorando UX inicial (`/`) y manteniendo compatibilidad legacy.

## Scope

### In Scope
- Home moderna en `/` con CTA visible “Ir al catálogo”, mensaje no técnico durante cold start y reutilización del skeleton existente al entrar al catálogo; rutas canónicas `/:provider/catalog` y `/:provider/catalog/:category`.
- Alias `/catalog` con redirect a último provider usado o `mercadona` por defecto.
- Introducir tabla `providers` en BBDD y persistir relación real (`lists.provider_id` FK); usar `providers.slug` (minúscula) para routing y `providers.display_name` para UI.
- Mostrar provider en listados/DTOs usando slug y display name resuelto desde FK.
- Reglas de dominio: `DRAFT` cambia provider solo si está vacía; `ACTIVE` y `COMPLETED` con provider inmutable (referenciando FK/slug resuelto).
- Flujo UX: mismo provider no abre modal; switch incompatible exige confirmación.
- Backfill DB: listas legacy sin provider se migran a `mercadona`.
- Navegación catálogo punto 3: recordar última categoría visitada por `user + provider`; al volver a `/:provider/catalog`, reabrir categoría previa y usar primera categoría como fallback si no hay historial.
- Regla de bootstrap: hasta completar handshake API (API levantada + auth + draft cargado), las acciones de lista se muestran pero quedan deshabilitadas; no se permiten mutaciones (no agregar, no borrar, no incrementar/decrementar) y se mantiene un mensaje no técnico visible para el usuario.

### Out of Scope (Non-Goals)
- Multi-provider real más allá de `mercadona` (solo contrato extensible).
- Cambios de arquitectura fuera de app-shell/features y capas API actuales.
- Llamadas a providers externos desde frontend (se mantiene backend-only).

## Capabilities

### New Capabilities
- `provider-aware-catalog-routing`: navegación y resolución de rutas de catálogo por provider con alias compatible.
- `list-provider-ownership`: ownership de provider por lista y reglas de mutabilidad/inmutabilidad por estado.

### Modified Capabilities
- `list-status-multi-view`: incorpora provider resuelto por FK (`slug`/`displayName`) en summaries/details y respeta invariantes por status.
- `app-shell-composition-root`: agrega composición de rutas provider-aware sin mover lógica de negocio a app-shell.

## Decisions (confirmadas)
- `/` como home/index con botón “Ir al catálogo” para cubrir cold start API con copy no técnica.
- Si la API se está despertando al entrar a catálogo, informar al usuario sin lenguaje técnico y mantener skeleton existente hasta respuesta.
- Durante espera por API: mostrar banner persistente no técnico. Al quedar disponible: ocultar banner y mostrar toast breve no técnico de disponibilidad.
- Rutas reales: `/:provider/catalog` y `/:provider/catalog/:category`.
- `/catalog` redirige a último provider o `mercadona`.
- Selección del mismo provider: sin modal.
- Switch incompatible: flujo de confirmación.
- Modelo de provider en datos: tabla `providers` + `lists.provider_id` como FK real (no string suelto); routing por `providers.slug`, UI por `providers.display_name`.
- Persistencia de relación provider en listas + backfill legacy a `mercadona` resolviendo contra tabla `providers`.
- Navegación punto 3: persistir/reutilizar última categoría por `user + provider` para volver a contexto de navegación.
- Durante cold start/handshake API, mostrar acciones deshabilitadas + mensaje no técnico activo; al resolver handshake, aplicar `draft.provider.slug` (resuelto desde FK) como source of truth y recién ahí habilitar acciones.

## Approach
Entrega incremental por capas (web app-shell + services + API domain/application/infrastructure), con TDD en lógica CORE y compatibilidad hacia atrás mediante alias y backfill.

## Affected Areas
| Area | Impact | Description |
|---|---|---|
| `apps/web/src/app-shell/*` | Modified | Resolución `/`, `/catalog`, `/:provider/catalog` y redirects |
| `apps/web/src/features/catalog/services/*` | Modified | Endpoints provider-aware |
| `apps/web/src/features/lists/*` | Modified | Mapping/render de provider en listas |
| `apps/api/src/modules/catalog/api/*` | Modified | Rutas/schemas provider-aware |
| `apps/api/src/modules/lists/{domain,application,infrastructure,api}/*` | Modified | FK de provider, invariantes y persistencia |
| `docs/features/{web,api}/*` | Modified | Documentación de feature |

## Acceptance Criteria
- [ ] Navegar a `/` muestra home no técnica con botón “Ir al catálogo”; catálogo solo en rutas provider-aware.
- [ ] Si la API está en cold start al entrar al catálogo, se informa al usuario con copy no técnica y se mantiene skeleton existente durante la espera.
- [ ] `/catalog` redirige correctamente (último provider o `mercadona`).
- [ ] `/:provider/catalog` reabre la última categoría visitada para ese `user + provider`; si no hay historial, abre primera categoría.
- [ ] API rechaza mezcla de providers y bloquea cambio en `ACTIVE`/`COMPLETED`.
- [ ] `DRAFT` permite cambio de provider solo si vacía; con contexto incompatible exige confirmación (sobre FK/slug resuelto).
- [ ] Listados/detalle exponen provider consistente con `providers.slug` y `providers.display_name` resueltos desde FK.
- [ ] Datos legacy funcionan tras backfill a `mercadona` sin romper flujos existentes, con `lists.provider_id` apuntando a `providers.id`.
- [ ] Antes de completar handshake API (API+auth+draft), la lista queda en solo lectura: acciones visibles pero deshabilitadas (sin add/remove/+/-), con banner no técnico persistente durante la espera.
- [ ] Al completarse el handshake, el banner desaparece y se muestra un toast breve no técnico indicando disponibilidad.
- [ ] Tras handshake, `draft.provider.slug` (resuelto desde FK) se toma como source of truth y se habilitan mutaciones.

## Risks
| Risk | Likelihood | Mitigation |
|---|---|---|
| Desalineación redirect web/api | Med | Validar provider en frontend y Zod en API |
| Regla de switch aplicada solo en UI | Med | Enforce también en casos de uso backend |
| Regresión sobre listas legacy | Med | Backfill + tests de repositorio/DTO con fallback |
| Integridad referencial providers/lists | Med | Migración en fases (tabla providers, seed, FK, backfill, constraint) + checks previos |
| Historial de categoría desalineado por provider | Med | Clave de persistencia compuesta `userId:providerSlug` y fallback determinístico |

## Rollout & Backward Compatibility
- Migración DB: crear `providers`, seed inicial, agregar `lists.provider_id` (FK), backfill de listas legacy a provider `mercadona`, y recién luego habilitar validaciones estrictas.
- Mantener alias `/catalog` durante transición para enlaces viejos.
- Rollback: revertir routing provider-aware, mantener alias, y desactivar validación estricta de provider en API.

## Next Step (out of scope de este change)
- Evaluar persistencia de categorías de catálogo en BBDD como cache de backend (con fallback al provider externo). Esta línea se documenta como dirección arquitectónica siguiente y NO bloquea el alcance principal de routing + provider ownership.

## Alternatives & Tradeoffs
- Provider implícito por ítems: menos cambios iniciales, pero mayor ambigüedad en drafts vacíos y reglas frágiles.
- Provider como atributo de lista (elegida): más impacto inicial, pero invariantes claras, validación centralizada y mejor extensibilidad.

## Dependencies
- Migración/backfill en repositorio Postgres.
- Alineación contrato web↔api para provider route params.
