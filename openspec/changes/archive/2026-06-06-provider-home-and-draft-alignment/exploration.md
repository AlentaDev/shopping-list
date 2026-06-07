## Exploration: provider-home-and-draft-alignment

### Current State
- Web already supports provider-aware catalog routes and API calls: `useAppShellNavigation` resolves `/:provider/catalog` and `CatalogService` fetches `/api/catalog/${providerId}/...`.
- The current Home is still a minimal CTA screen (`CatalogHome`) and provider switching is not modeled there; the categories button is still always rendered in `AppHeader`, including outside catalog pages.
- Draft state in Web has no provider source of truth. `ListContext` stores only items/count/total/actions, local draft persistence stores only `title`, `items`, and `updatedAt`, and `useAutosaveDraft` hardcodes catalog item `source: "mercadona"` when building autosave payloads.
- Remote autosave is also not provider-aware at the draft level. API `UpsertAutosaveDraft` preserves `targetAutosave?.providerId ?? DEFAULT_PROVIDER_ID`, but the request body has no top-level provider and `GetAutosaveDraft` does not return provider metadata.
- API list detail/summary endpoints already expose `providerId` and `provider`, and `AddCatalogItem` already enforces `409 draft_provider_conflict` with `allowedActions = ["switch_and_clear", "keep_draft_provider"]`.
- Web currently drops that provider metadata: `ListAdapter` and `features/lists/services/types.ts` ignore the API `provider` fields, so list cards cannot show provider yet.

### Affected Areas
- `apps/web/src/context/ListContext.tsx` and `apps/web/src/context/ListContextValue.ts` — active draft context needs provider state and actions, not only items.
- `apps/web/src/features/shopping-list/services/types.ts`, `AutosaveService.ts`, `useAutosaveDraft.ts`, `useAutosaveRecovery.ts` — local/remote draft contracts currently omit draft-level provider and still default catalog items to Mercadona.
- `apps/web/src/app-shell/useAppShellNavigation.ts`, `AppShell.tsx`, `app-shell/components/CatalogHome.tsx`, `app-shell/components/AppHeader.tsx` — Home must become the only provider switch point and categories visibility must become route-aware.
- `apps/web/src/features/catalog/Catalog.tsx` — add-to-list flow already knows route provider, so it is the natural integration point for provider-aware draft guards.
- `apps/web/src/features/lists/services/types.ts`, `adapters/ListAdapter.ts`, `components/ListsScreen.tsx` — API already returns provider metadata, but Web does not map or render it.
- `apps/api/src/modules/lists/application/GetAutosaveDraft.ts`, `UpsertAutosaveDraft.ts`, `api/validation.ts` — autosave contract likely needs explicit draft provider alignment so Web can rehydrate and promote anonymous drafts safely.
- `apps/api/src/modules/lists/application/providerDto.ts` — display-name mapping only knows `mercadona`, so BonpreuEsclat would currently fall back to raw slug in list UI.
- `apps/api/src/modules/lists/application/AddCatalogItem.ts` and `errors.ts` — existing `draft_provider_conflict` payload is the server guardrail the Web flow should reuse.

### Approaches
1. **Explicit draft provider across context, storage, and autosave** — add `providerId` as draft state in Web, persist it locally/remotely, make Home own provider switching, and reuse the existing API conflict contract when catalog/provider drift appears.
   - Pros: matches the pre-SDD product rules, gives one client-side source of truth, works for empty drafts and auth promotion, and keeps Bonpreu/Mercadona behavior deterministic.
   - Cons: touches both Web draft plumbing and a small API autosave contract surface; requires broad test updates in CORE areas.
   - Effort: High.

2. **Infer provider from route or first item and keep current autosave shape** — keep Web draft model mostly as-is and derive provider from current route, existing list provider, or first catalog item source.
   - Pros: smaller initial diff and fewer contract changes.
   - Cons: brittle for empty drafts, local anonymous drafts, login promotion, and recovery flows; it also leaves Mercadona hardcodes in place and makes provider conflicts harder to explain consistently.
   - Effort: Medium.

### Recommendation
Choose **Explicit draft provider across context, storage, and autosave**. The current code already proves that provider-aware catalog routing and server-side conflict enforcement exist, but the draft lifecycle is still Mercadona-centric. Making `providerId` explicit in Web state plus autosave DTOs is the cleanest way to turn BonpreuEsclat into a real first-class web flow without hidden fallback behavior.

### Risks
- Autosave contract drift: if Web adds draft provider locally but API autosave stays provider-agnostic, anonymous-to-authenticated promotion can silently rebind drafts to the wrong provider.
- Hidden Mercadona defaults: `useAutosaveDraft`, `AutosaveAdapter`, and related tests currently assume `source: "mercadona"`, so partial changes would leave Bonpreu flows inconsistent.
- UX inconsistency around switching: if Home confirmation/reset is implemented without reusing `draft_provider_conflict` semantics, route provider, draft provider, and server provider can diverge.
- Review size risk: this likely spans context, app-shell, shopping-list services, list adapters/UI, and a small API contract slice, so it is unlikely to fit comfortably in one small PR.

### Ready for Proposal
Yes — the proposal should scope this as a Web-first change with a focused API autosave/list-provider alignment slice, not as a new catalog-provider foundation.
