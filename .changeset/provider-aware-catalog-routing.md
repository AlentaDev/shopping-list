---
"@app/web": minor
"@app/api": minor
---

Add provider-aware catalog routing and provider ownership across web and API.

## Web

- Add home-to-catalog flow with canonical provider routes and category route updates.
- Add health-gated bootstrap to avoid premature authenticated requests during API warmup.
- Persist and isolate last visited category by user and provider.

## API

- Introduce providers model and list provider ownership with FK integrity.
- Add migrations for providers table, list provider backfill, and FK constraints.
- Enforce provider/state invariants and expose provider-friendly DTO fields.
