# Home landing (web)

Landing Home now lives in `features/home` so `app-shell` stays focused on routing and composition.

## Quick path

1. Open `/`.
2. Use the hero CTA to jump to providers or open `/app`.
3. Choose a provider card to enter `/:provider/catalog`.

## Details

| Topic | Decision |
|---|---|
| Ownership | Home UI lives in `apps/web/src/features/home/*`. |
| Hero CTA | The Android app CTA moved from the footer into the hero and links to `/app`. |
| Provider entry | Provider cards still call the explicit provider selection flow before entering catalog routes. |
| Draft guidance | Anonymous draft guidance still appears only when a local draft already owns a provider. |

## Checklist

- [x] `app-shell` wires Home through the feature public entrypoint.
- [x] Footer no longer owns the Android CTA.
- [x] Home copy stays centralized in `UI_TEXT`.

## Next step

Review `docs/features/web/provider-aware-catalog-routing.md` for the route contract Home must preserve.
