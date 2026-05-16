# Mobile Android — Session/Offline Alignment

## Objective
Align Android behavior with the existing product contract for session invalidation, offline complete-list flow, and environment-safe network policy.

## Key Rules
- Refresh is attempted at most once for a 401 request chain.
- If refresh fails (401/invalid), local auth state is fully invalidated (cookies + persisted session) and app transitions to unauthenticated.
- Offline/no-connection complete-list is accepted locally and queued for replay.

## Flavor-safe Cookie and Network Policy
- `local` flavor uses `BuildConfig.API_BASE_URL = http://10.0.2.2:3000` and allows cleartext traffic.
- `prod` flavor uses `BuildConfig.API_BASE_URL = https://api-shopping-list.onrender.com` and enforces HTTPS-only (no cleartext).
- `localRelease` remains disabled in Gradle variant filtering.
- Persisted cookies are restored only when their domain matches the active API host domain; cross-environment cookies are rejected.

## Implementation Notes
- `PersistentCookieJar` now stores cookie metadata required for safe restore and validates domain against the active `BuildConfig.API_BASE_URL` host.
- `AndroidManifest.xml` now receives `usesCleartextTraffic` from flavor manifest placeholders.
- `network_security_config.xml` keeps cleartext scoped to emulator/local domains and explicit HTTPS for production host.

## Verification
- Unit tests: `CookieStorageTest` covers host/domain safety checks.
- Android regression: run `:app:testLocalDebugUnitTest`.
