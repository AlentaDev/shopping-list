## List provider ownership (API)

### Objetivo

Garantizar ownership de provider por lista con integridad referencial real y contrato DTO consistente para web/mobile.

### Contrato

Cada lista persiste provider con FK real:

- `lists.provider_id -> providers.id`

Y expone en summary/detail:

```json
{
  "providerId": "provider-mercadona",
  "provider": {
    "slug": "mercadona",
    "displayName": "Mercadona"
  }
}
```

### Reglas de dominio

- Cambio de provider permitido solo en `DRAFT` vacío.
- Provider inmutable para:
  - `DRAFT` con items
  - `ACTIVE`
  - `COMPLETED`
- Mutaciones desde catálogo validan que el provider del item coincida con `draft.provider.slug` resuelto desde FK.

### Endpoints relevantes

- `POST /api/lists`
- `GET /api/lists`
- `GET /api/lists/:id`
- `POST /api/lists/:id/items/from-catalog`

Validación con Zod en capa web/API y enforcement de invariantes en application/domain.

### Transición legacy

Para compatibilidad con datos previos:

- Backfill de `provider_id` faltante o legacy (`NULL`, vacío o `mercadona`) hacia `provider-mercadona`.
- Normalización de inputs legacy para mantener operabilidad durante la transición.

### Notas de implementación

- Integración de provider externo sigue backend-only.
- DTO `provider` se resuelve desde `providers` (slug/display_name), no desde strings ambiguos.
- Fallback legacy está acotado y cubierto por tests de repositorio/integración.
