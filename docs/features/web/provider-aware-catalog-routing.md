## Provider-aware catalog routing (Web)

### Objetivo

Unificar la navegación del catálogo con rutas canónicas por provider y mantener compatibilidad con enlaces legacy (`/catalog`) sin romper la experiencia.

### Rutas y comportamiento

- Home: `/`
  - Renderiza vista no técnica con CTA **Ir al catálogo**.
- Alias legacy: `/catalog`
  - Redirige a `/{lastProvider}/catalog` si existe `lastProvider` en storage.
  - Si no existe, fallback a `/mercadona/catalog`.
- Rutas canónicas:
  - `/:provider/catalog`
  - `/:provider/catalog/:category`

### Handshake WAITING/READY

- Cuando hay usuario autenticado:
  - `WAITING`: se muestra banner _"Estamos preparando tu lista para que puedas seguir comprando."_
  - `READY`: se oculta banner y se habilitan mutaciones de lista.
  - Se muestra toast de confirmación al pasar a `READY`.
- Cuando no hay usuario autenticado:
  - handshake efectivo en `READY` (sin bloqueo de sesión).

### Regla de continuidad de navegación

- Se recuerda última categoría por clave compuesta `userId + providerSlug`.
- Al volver a `/:provider/catalog`:
  - si hay historial para esa clave, reabre esa categoría;
  - si no hay historial, abre la primera categoría determinística.

### Notas de implementación

- `useAppShellNavigation` resuelve alias y parsea rutas canónicas.
- `CatalogService` consume endpoints provider-aware:
  - `GET /api/catalog/:provider/categories`
  - `GET /api/catalog/:provider/categories/:id`
- No se hacen requests de catálogo a rutas legacy sin `:provider`.

### Cobertura asociada

- Unit/Integration Web:
  - alias `/catalog` -> provider resuelto
  - handshake WAITING/READY
- E2E crítico:
  - redirect de `/catalog`, espera de handshake y add-item habilitado al quedar `READY`.
