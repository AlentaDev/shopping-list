# BonpreuEsclat catalogue retirement

BonpreuEsclat is retired as an available catalogue. The project has no provider authorization for the integration, and observed upstream requests are blocked by CloudFront. The project will not try to bypass that block.

## User-facing behaviour

- Bonpreu is absent from catalogue selection.
- New catalogue operations accept only `mercadona`.
- Existing Bonpreu lists remain readable; retirement does not remove their historical data.
- Unsupported provider URLs, including `/bonpreuesclat/catalog`, canonicalize to `/mercadona/catalog` and drop any invalid category segment.

## Scope and reintroduction

This retirement concerns new catalogue access and mutations, not readability of legacy lists. It has no automatic rollback or fallback to Bonpreu.

BonpreuEsclat may be reintroduced only through a documented, authorized integration covered by tests.

See [List provider ownership](./list-provider-ownership.md) for the persisted-provider and legacy-list rules.
