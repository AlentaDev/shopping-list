## Exploration: provider-aware-catalog-routing

### Current State
- Web hoy renderiza `Catalog` como fallback por defecto en `"/"` desde `useAppShellNavigation`, sin home informativa (`apps/web/src/app-shell/useAppShellNavigation.ts`).
- No existe ruta canónica por provider en frontend (`/:provider/catalog`) ni alias de `/catalog`; el shell usa navegación manual con `window.history`.
- El catálogo web consume endpoints fijos sin provider (`/api/catalog/categories` y `/api/catalog/categories/:id`) desde `CatalogService`.
- Backend expone catálogo sin segmentación por provider en router (`apps/api/src/modules/catalog/api/catalogRouter.ts`).
- El dominio de listas no persiste `provider` a nivel lista; solo cada item de catálogo tiene `source: "mercadona"`.
- La regla de single-draft ya existe (CreateList/ReuseList/UpsertAutosaveDraft reutilizan o actualizan un único draft), pero no contempla inmutabilidad/cambio de provider.
- El listado de listas (`ListLists`) no devuelve provider en summary; UI (`ListsScreen`) no muestra ese dato.

### Affected Areas
- `apps/web/src/app-shell/useAppShellNavigation.ts` — parsing/resolución de rutas (`/`, `/catalog`, `/:provider/catalog`) y redirect rules.
- `apps/web/src/app-shell/AppShell.tsx` — navegación al catálogo desde header/carrito usando ruta provider-aware.
- `apps/web/src/features/catalog/services/CatalogService.ts` — endpoints con provider en path o query.
- `apps/web/src/features/catalog/services/useCatalog.ts` — carga inicial/reload dependiente del provider de ruta.
- `apps/web/src/features/catalog/Catalog.tsx` — potencial uso de copy informativa/estado home y contexto de provider.
- `apps/web/src/shared/constants/ui.ts` — nuevo `UI_TEXT` para home no técnica, selector/confirmación de provider y mensajes de impacto.
- `apps/web/src/features/lists/services/types.ts` — extender `ListSummary`/`ListDetail` con `provider`.
- `apps/web/src/features/lists/services/adapters/ListAdapter.ts` — mapear `provider` desde API.
- `apps/web/src/features/lists/components/ListsScreen.tsx` — mostrar provider asociado por lista.
- `apps/api/src/modules/catalog/api/catalogRouter.ts` + `schemas.ts` — rutas provider-aware (`/:provider/categories`, `/:provider/categories/:id`) y validación Zod.
- `apps/api/src/modules/lists/domain/list.ts` — agregar ownership de provider a entidad `List`.
- `apps/api/src/modules/lists/application/CreateList.ts` — asignar provider al draft (y reglas para draft existente).
- `apps/api/src/modules/lists/application/AddCatalogItem.ts` — bloquear mezcla de providers y validar compatibilidad con provider de lista.
- `apps/api/src/modules/lists/application/ReuseList.ts`, `StartListEditing.ts`, `FinishListEdit.ts`, `UpsertAutosaveDraft.ts` — preservar provider durante transiciones.
- `apps/api/src/modules/lists/application/ListLists.ts` y `GetList.ts` — exponer provider en DTOs de listas.
- `apps/api/src/modules/lists/api/validation.ts` + `router.ts` — entrada explícita de provider cuando corresponda (create/switch).
- `apps/api/src/modules/lists/infrastructure/PostgresListRepository.ts` — columna `provider` en `lists` + mapping persistencia.
- `apps/api/src/modules/lists/infrastructure/InMemoryListRepository.ts` — compatibilidad de modelo actualizado.

### Approaches
1. **Provider como atributo de lista + rutas explícitas por provider**
   - Pros: regla de dominio clara (ownership), evita mezcla por diseño, fácil de testear en domain/application, alinea web+api.
   - Cons: requiere tocar varios casos de uso/list DTOs y migración en Postgres.
   - Effort: Medium.

2. **Provider implícito derivado de items existentes**
   - Pros: menos cambios estructurales iniciales.
   - Cons: rompe cuando draft vacío, hace ambiguo switch en DRAFT, complica inmutabilidad de ACTIVE/COMPLETED, más edge cases.
   - Effort: Medium-High.

### Recommendation
Implementar **Approach 1**. Persistir `provider` en `List` y usar routing canónico `/:provider/catalog`, manteniendo `/catalog` como alias de redirección (último provider o `mercadona`). Esta opción sostiene la regla de dominio pedida (DRAFT mutable solo si vacío; ACTIVE/COMPLETED inmutables) y simplifica validaciones anti-mezcla en backend.

### Risks
- **Compatibilidad de datos existentes**: listas legacy sin provider requieren default/migración (`mercadona`) para no romper ListLists/GetList.
- **Desalineación web/api en redirect**: si frontend redirige a provider inválido sin validación compartida, habrá 404/errores de carga.
- **Regla de switch en draft con items**: si se resuelve solo en UI y no en backend, se puede violar por llamadas directas API.
- **Impacto en tests CORE**: cambios en `application`/`services` exigen ampliar suite al 100% en áreas críticas.

### Missing Decisions
- Fuente de verdad para “último provider” de `/catalog`: `localStorage`, perfil usuario o ambos.
- Contrato de API para cambio de provider de draft existente: ¿nuevo endpoint `PATCH /lists/:id/provider` o overload de `POST /lists` con `provider`?
- Política exacta al confirmar switch incompatible: ¿limpiar items del draft actual, crear draft nuevo, o reemplazar draft actual vacío?
- Normalización de providers: ¿enum cerrado actual (`mercadona`) con diseño extensible o soporte inmediato multi-provider?

### Validation Strategy (TDD)
- **API Domain/Application (CORE 100%)**:
  - `CreateList.test.ts`: crea/reutiliza draft respetando provider.
  - `AddCatalogItem.test.ts`: rechaza item de provider distinto al de la lista.
  - Nuevos tests de regla de switch provider por estado (`DRAFT` vacío sí; `DRAFT` con items no sin confirmación/caso de uso; `ACTIVE/COMPLETED` no).
  - `ListLists.test.ts`/`GetList` tests: provider visible en respuestas.
  - `PostgresListRepository.test.ts`: persistencia/lectura de columna provider + fallback legacy.
- **Web Services/Adapters (CORE 100%)**:
  - `CatalogService.test.ts`: endpoints provider-aware.
  - `ListAdapter.test.ts`: mapeo de provider en summary/detail.
  - tests de navegación (`useAppShellNavigation*.test*`): `/`, `/catalog` alias, `/:provider/catalog`.
- **Web Components (IMPORTANT 80%)**:
  - tests de home informativa y copy no técnico.
  - `ListsScreen.test.tsx`: provider visible por tarjeta.
  - flujo UX: seleccionar mismo provider (sin modal) vs switch incompatible (modal con impacto).

### Ready for Proposal
Yes — con definición previa de las 3 decisiones faltantes (persistencia último provider, contrato de switch API, política exacta de reemplazo de draft).
