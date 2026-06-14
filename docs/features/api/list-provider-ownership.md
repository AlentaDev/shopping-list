## List provider ownership (API)

### Objetivo

Garantizar ownership de provider por lista con integridad referencial real, wiring provider-aware en mutaciones de catálogo y contrato DTO consistente para web/mobile.

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
- Mutaciones desde catálogo validan que el provider pedido coincida con `draft.provider.slug` resuelto desde `provider_id` mediante el catalog provider registry/resolver.
- La capa de composición API no inyecta un singleton default de Mercadona para mutaciones.
- Si el ownership persistido no se puede resolver, o el slug resultante no corresponde a un provider registrado/resoluble, la mutación falla con error explícito antes de tocar el provider externo.

### Endpoints relevantes

- `POST /api/lists`
- `GET /api/lists`
- `GET /api/lists/:id`
- `POST /api/lists/:id/items/from-catalog`

Validación con Zod en capa web/API y enforcement de invariantes en application/domain.

### Flujo de mutación desde catálogo

1. `POST /api/lists/:id/items/from-catalog` valida el payload solicitado.
2. `AddCatalogItem` carga la lista y toma `draft.provider.slug` como fuente de verdad después del handshake.
3. El slug del draft/lista se resuelve a través del registry/resolver expuesto por catálogo.
4. Si el provider solicitado no coincide, la API responde `409 draft_provider_conflict`.
5. Si el ownership no se puede resolver o el slug/provider resultante no está registrado/resoluble, la API responde `404 provider_not_found`.
6. Solo entonces se ejecuta la mutación contra el provider correcto (`mercadona` o `bonpreuesclat`).

### Contrato de conflicto

Cuando un draft activo pertenece a un provider y el cliente intenta mutar desde otro:

- status: `409`
- `errorCode`: `draft_provider_conflict`
- `allowedActions`: `switch_and_clear`, `keep_draft_provider`

Esto aplica también a requests `bonpreuesclat` contra drafts/listas Mercadona y viceversa.

### Transición legacy

Para compatibilidad con datos previos:

- Backfill de `provider_id` faltante o legacy (`NULL`, vacío o `mercadona`) hacia `provider-mercadona`.
- Normalización de inputs legacy para mantener operabilidad durante la transición.
- No se permite depender de fallback en tiempo de mutación hacia Mercadona para cubrir listas sin ownership válido.

### Orden de rollout obligatorio

1. Ejecutar el backfill de `provider_id` en el modo de persistencia desplegado.
2. Verificar que solo se actualicen filas `NULL`, vacías o legacy `mercadona`.
3. Confirmar que listas Bonpreu queden intactas.
4. Desplegar después el wiring estricto basado en resolver.

Se rechaza el fallback en mutación porque oculta defectos de datos y vuelve inseguro el rollout: la producción parecería funcionar mientras mantiene ownership inconsistente.

### Notas de implementación

- Integración de provider externo sigue backend-only.
- DTO `provider` se resuelve desde `providers` (slug/display_name), no desde strings ambiguos.
- La compatibilidad legacy queda acotada al backfill y a flujos de lectura; las mutaciones estrictas no corrigen ownership en runtime.
