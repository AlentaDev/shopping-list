# Verification Remediation Specification

## Purpose

Define the bounded evidence required to make the existing draft provider conflict modal change buildable, deterministic to test, and archive-ready without changing product behavior.

## Requirements

### Requirement: Web Build Validity

The web application MUST pass its authoritative type/build validation after the reported compiler defects are remediated, without changing the existing draft-conflict or active-edit behavior.

#### Scenario: Reported build blockers are resolved

- GIVEN the verification-remediation changes are applied
- WHEN web typecheck and build commands run
- THEN both commands exit successfully
- AND no new product behavior or public contract is introduced

### Requirement: Deterministic Authoritative Web Tests

The authoritative web test command MUST pass repeatedly under the repository's Node 26 storage environment. Deterministic storage isolation MUST NOT remove coverage of explicit storage-error fallback behavior.

#### Scenario: Repeated full-suite execution is stable

- GIVEN the web test environment is initialized for an isolated run
- WHEN the authoritative web suite is executed repeatedly
- THEN every run exits successfully with the same passing result

#### Scenario: Storage-error fallback remains observable

- GIVEN a test temporarily makes storage access fail
- WHEN the device-fingerprint fallback path is exercised
- THEN the fallback result and warning are asserted
- AND subsequent tests use restored storage

### Requirement: Runtime Proof of Existing Conflict Outcomes

The verification suite MUST exercise the existing AppShell callback flow and prove its current outcomes without adding user-visible behavior.

#### Scenario: Draft conflict uses the in-app flow

- GIVEN a non-empty draft requests another provider
- WHEN the conflict flow is invoked
- THEN `window.confirm` is not called
- AND the existing modal callback is used

#### Scenario: Confirm resolves the existing acceptance outcome

- GIVEN the AppShell conflict resolver is pending
- WHEN the user confirms
- THEN the resolver Promise resolves `true`
- AND the requested provider catalog route is reached

#### Scenario: Dismiss resolves the existing cancellation outcome

- GIVEN the AppShell conflict resolver is pending at a known route
- WHEN the user dismisses the conflict
- THEN the resolver Promise resolves `false`
- AND the exact current route remains unchanged
