# Provider-aware catalog routing (web)

## Objective

Keep provider catalog routing explicit and predictable: Home chooses the provider, canonical catalog routes always include the provider segment, and `/catalog` resolves through `lastProvider` without a hidden default.

## Canonical routes

- Home: `/`
- Compatibility alias: `/catalog`
- Catalog root: `/:provider/catalog`
- Catalog category: `/:provider/catalog/:category`

## Routing rules

- `/` is the canonical provider-entry page.
- Home never assigns a default provider just by rendering.
- `/catalog` redirects to `/{lastProvider}/catalog` when a last provider exists.
- `/catalog` redirects to `/` when no last provider exists.
- Category navigation must remain inside the canonical provider route.

## Handshake behavior

- Authenticated sessions use the shell `WAITING` / `READY` handshake before enabling list mutations.
- Anonymous sessions resolve directly into the ready flow because there is no authenticated bootstrap to wait for.

## Implementation notes

- `useAppShellNavigation` resolves the `/catalog` alias and persists `lastProvider`.
- `CatalogHome` handles explicit provider entry before catalog navigation.

## Verification focus

- `useAppShellNavigation.test.ts`
- `CatalogHome.test.tsx`

These tests verify canonical routing, alias fallback to Home, provider entry, and anonymous draft guidance.
