# Design: Provider Home and Draft Alignment

## Technical Approach

Make the web draft provider explicit end-to-end and treat it as the mutation guardrail. `ListContext` becomes the in-memory source for `draftProviderId`, synced with local draft storage, autosave DTOs, and list/recovery payloads. Home remains the canonical provider entry at `/`; catalog routes stay browseable for any provider, but add/reuse/edit-triggered mutations must resolve against the current draft provider and branch into either generic reset-confirmation or dedicated active-edit conflict UX.

## Architecture Decisions

| Decision | Options | Choice / Rationale |
|---|---|---|
| Draft provider state owner | Infer from route or store in context | Store `draftProviderId` in `apps/web/src/context/ListContext*`. Routes are browse state, not ownership state; mutations need a stable source independent of navigation. |
| Conflict enforcement point | Block navigation or block mutation | Block only on mutation. This matches the validated product rule and preserves free cross-provider browsing. |
| Edit-session conflict handling | Reuse generic `switch_and_clear` flow or separate branch | Separate branch in app-shell/shopping-list. Active editing already has dedicated `finish-edit`/`cancel` behavior, so conflating it with draft reset would break domain semantics. |
| API rollout | New conflict endpoint or extend existing contracts | Extend existing list/autosave DTOs and keep `409 draft_provider_conflict` as the server guardrail. This minimizes backend surface changes and preserves current clients. |

## Data Flow

    Home/Catalog choice ──→ ListContext.draftProviderId ──→ local draft + autosave PUT
              │                         │                          │
              └──── browse any route ───┴──── mutation request ────┘
                                        │
                         provider match? yes → proceed
                                        no
                                        │
                      active edit? yes → dedicated modal/actions
                               no → reset/keep-provider confirmation

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/context/ListContextValue.ts` | Modify | Add `draftProviderId` plus setter/reset helpers to the shared draft state contract. |
| `apps/web/src/context/ListContext.tsx` | Modify | Extend reducer/state shape to persist provider ownership alongside items. |
| `apps/web/src/features/shopping-list/services/types.ts` | Modify | Add provider fields to `AutosaveDraftInput`, `LocalDraft`, `AutosaveDraft`, `AutosaveSummary`, and list DTOs consumed by Web. |
| `apps/web/src/features/shopping-list/services/AutosaveService.ts` | Modify | Persist provider in local draft, GET/PUT autosave payloads, and aligned empty-draft writes. |
| `apps/web/src/features/shopping-list/services/adapters/AutosaveAdapter.ts` | Modify | Adapt provider metadata from remote autosave responses. |
| `apps/web/src/app-shell/useAppShellNavigation.ts` | Modify | Redirect `/catalog` to `/{lastProvider}/catalog` or `/`; keep `/` as canonical Home without default provider fallback. |
| `apps/web/src/app-shell/components/CatalogHome.tsx` | Modify | Replace CTA-only Home with provider-entry actions and anonymous draft-aware guidance via `UI_TEXT`. |
| `apps/web/src/app-shell/AppShell.tsx` | Modify | Wire Home/provider selection, route-to-provider transitions, and active-edit conflict modal orchestration. |
| `apps/web/src/features/catalog/Catalog.tsx` | Modify | On add-to-list, compare route provider vs `draftProviderId`; apply mutation guard flow instead of blindly `addItem`. |
| `apps/web/src/features/lists/ListsContainer.tsx` | Modify | Reuse list `providerId`/`provider` in reuse/edit actions and surface generic vs active-edit conflict branches. |
| `apps/web/src/features/lists/services/adapters/ListAdapter.ts` | Modify | Preserve provider metadata already emitted by API list endpoints. |
| `apps/api/src/modules/lists/api/validation.ts` | Modify | Require explicit draft `providerId` in autosave payloads. |
| `apps/api/src/modules/lists/application/{GetAutosaveDraft,UpsertAutosaveDraft,ReuseList,UpdateListStatus}.ts` | Modify | Carry provider ownership through autosave fetch/save, reuse into draft, and `DRAFT -> ACTIVE` empty-draft recreation. |

## Interfaces / Contracts

```ts
type DraftProviderRef = {
  providerId: string;
  provider: { slug: string; displayName: string };
};

type AutosaveDraftInput = {
  title: string;
  providerId: string;
  items: AutosaveCatalogItemInput[];
  isEditing?: boolean;
  editingTargetListId?: string | null;
};

type DraftProviderConflict = {
  errorCode: "draft_provider_conflict";
  draftProvider: DraftProviderRef["provider"] & { id: string };
  requestedProvider: DraftProviderRef["provider"] & { id: string };
  allowedActions: ["switch_and_clear", "keep_draft_provider"];
};
```

Web list adapters should also retain `providerId` and `provider` on `ListSummary`/`ListDetail` so reuse/edit decisions do not need extra fetches for ownership labels.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Context provider ownership, autosave adapters/service payloads, `/catalog` alias resolution | Extend Vitest tests in `ListContext`, `AutosaveService`, `AutosaveAdapter`, and `useAppShellNavigation`. |
| Integration | Catalog add, reuse, and Home provider switch conflict branches; active edit dedicated actions | Add React tests around `AppShell`, `Catalog`, and `ListsContainer` with mocked auth/list services. |
| Integration | API autosave/reuse/status provider propagation | Extend use-case tests for `UpsertAutosaveDraft`, `GetAutosaveDraft`, `ReuseList`, and `UpdateListStatus`. |
| E2E | None for this change | Existing rules keep E2E for critical end-to-end flows only; this change is sufficiently covered by service/component integration tests. |

## Migration / Rollout

No migration required. Backend keeps legacy fallback-to-Mercadona for old records, but all new Web autosave and empty-draft writes must send explicit provider ownership.

## Open Questions

- [ ] Should the dedicated active-edit conflict modal live in `app-shell/` or `features/shopping-list/components/`? Either works, but `shopping-list/components/` better matches ownership of edit actions.
