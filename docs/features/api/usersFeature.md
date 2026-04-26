# Usuarios (API)

## Resumen
Acceso al perfil del usuario autenticado, respaldado por el repositorio compartido de usuarios y protegido por la cookie `access_token`.

## Endpoints

### GET /api/users/me
Devuelve el usuario autenticado actual.

**Respuestas**
- `200` con usuario:
```json
{
  "id": "uuid",
  "name": "Alice",
  "email": "alice@example.com",
  "postalCode": "12345"
}
```
- `401` no autenticado

## Notas de implementación
- **Ruta del módulo**: `apps/api/src/modules/users`
- **Capas**:
  - `application`: caso de uso de obtención de usuario actual
  - `infrastructure`: repositorio in-memory (default), repositorio Postgres disponible
  - `api`: router de Express protegido por `requireAuth`
- **Auth**: depende de la cookie `access_token` emitida por el módulo de auth
