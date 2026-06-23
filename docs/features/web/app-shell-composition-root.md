# App Shell Composition Root (web)

## Objective

Define `apps/web/src/app-shell/*` as the single composition root for shell routing and cross-feature orchestration, while keeping feature business rules inside their owning features.

## Scope

- `App.tsx` delegates application composition to `AppShell`.
- `app-shell/*` owns route composition for `/`, `/catalog`, `/:provider/catalog`, and `/:provider/catalog/:category`.
- `features/home/*` owns the landing UI rendered at `/`.
- Feature logic stays inside feature services/components. The shell wires screens together; it does not own shopping-list business rules.

## Current provider-aware behavior

- `/` is the canonical Home entry point.
- Home requires an explicit provider choice before catalog navigation. Rendering Home alone never assigns a hidden default provider.
- Anonymous Home can show draft-provider guidance when local draft ownership already exists.
- Authenticated Home stays focused on landing/provider-entry content; shopping lists live on the dedicated `/lists` route.
- `/catalog` remains a compatibility alias:
  - redirect to `/{lastProvider}/catalog` when `lastProvider` exists;
  - redirect to `/` when no provider has been stored yet.

## Dependency boundaries

- `app-shell/*` may import public feature entrypoints, `context/*`, and `shared/*`.
- `features/*` must not import `app-shell/*`.
- `app-shell/*` must not contain DTO mapping, persistence rules, or feature business invariants.
- Route-aware header state (active nav options like `Inicio`, `Descargar app`, `Mis Listas`, plus provider-logo context for catalog routes) is resolved in `app-shell` and passed down as shell composition data.

## Verification focus

- `AppShell.test.tsx`
- `features/home/components/CatalogHome.test.tsx`
- `useAppShellNavigation.test.ts`

These tests cover canonical Home routing, provider-entry behavior, dedicated `/lists` routing, alias redirect behavior, and anonymous draft guidance.
