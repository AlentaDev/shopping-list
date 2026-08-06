# Draft Provider Conflict Modal Specification

## Purpose

Define the in-app resolution of provider conflicts when a non-empty draft exists, replacing the native confirmation dialog while preserving the existing message, accept semantics, and active-edit delegation.

## Requirements

### Requirement: Dedicated Draft-Only Conflict Modal

The system MUST display a dedicated in-app modal when a user selects a different provider while a non-empty draft exists. The system MUST NOT use `window.confirm` for this flow.

#### Scenario: Non-empty cross-provider draft triggers modal

- GIVEN the current draft has items and belongs to provider `mercadona`
- WHEN the user selects provider `bonpreuesclat`
- THEN the draft provider conflict modal is rendered
- AND the native confirmation dialog is not shown

#### Scenario: Empty or same-provider selection bypasses modal

- GIVEN the current draft has no items or already belongs to the selected provider
- WHEN the user selects that provider
- THEN the system proceeds without showing a modal

### Requirement: Literal Conflict Message Preservation

The modal MUST render the exact existing conflict message from `UI_TEXT.CATALOG.DRAFT_PROVIDER_CONFLICT` with current and requested provider display names substituted using existing rules.

#### Scenario: Message renders with provider names and override

- GIVEN the current draft belongs to `mercadona` and the user selects `bonpreuesclat`
- WHEN the modal is rendered with an optional `requestedProviderName` override
- THEN the modal body contains the literal message with the correct current and requested provider labels substituted

### Requirement: Accept and Dismiss Semantics

The modal MUST reset the draft and navigate to the requested provider catalog when the user confirms. The modal MUST leave the draft unchanged when the user dismisses. The resolution callback MUST return `true` on confirm and `false` on dismiss.

#### Scenario: Confirm resets draft and navigates

- GIVEN a non-empty cross-provider conflict modal is open
- WHEN the user confirms the action
- THEN the draft is reset to the requested provider
- AND the app navigates to `/{requestedProvider}/catalog`
- AND the resolution callback resolves to `true`

#### Scenario: Dismiss keeps draft intact

- GIVEN a non-empty cross-provider conflict modal is open
- WHEN the user dismisses the action
- THEN the draft provider and items remain unchanged
- AND the app stays on the current route
- AND the resolution callback resolves to `false`

### Requirement: Active-Edit Conflict Delegation

The draft provider conflict flow MUST NOT alter active-edit conflict behavior. When an active edit session exists, the system MUST delegate to the existing active-edit conflict callback and MUST NOT render the draft provider conflict modal.

#### Scenario: Active edit session delegates to existing handler

- GIVEN an active edit session exists in local storage
- WHEN a cross-provider draft conflict is requested
- THEN the existing active-edit conflict callback is invoked
- AND the draft provider conflict modal is not rendered

### Requirement: Modal UI Text Centralization

The modal title and action labels MUST be centralized in `UI_TEXT`. The existing conflict message key MUST remain unchanged.

#### Scenario: Modal labels come from UI_TEXT

- GIVEN the modal is rendered
- THEN the title, confirm label, and dismiss label are read from `UI_TEXT`

### Requirement: AppShell Ownership and Callback Threading

The modal state MUST be owned by `AppShell`. The asynchronous confirmation callback MUST be threaded through `useDraftProviderConflict`, Catalog, and list-reuse flows so that feature components remain UI-only.

#### Scenario: Features delegate conflict resolution to AppShell

- GIVEN the user triggers a provider switch from Catalog or the lists flow
- WHEN the feature resolves the conflict
- THEN it delegates to the callback provided by `AppShell`
- AND the modal is composed by `AppShell`

### Requirement: Modal Accessibility

The modal MUST be accessible. It MUST expose `role="dialog"` and `aria-modal="true"`, and it MUST keep focus within the modal while open.

#### Scenario: Modal is accessible and focus-trapped

- GIVEN the modal is open
- THEN the modal container has `role="dialog"` and `aria-modal="true"`
- AND focus remains inside the modal
