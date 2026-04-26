# Auth (API)

## Objetivo
Proveer registro, login y refresh de tokens usando access + refresh tokens en cookies.

## Endpoints
- `POST /api/auth/register`
  - Body: `{ name, email, password, postalCode }`
  - Respuesta: usuario público.
  - Setea cookies `access_token` y `refresh_token`.

- `POST /api/auth/login`
  - Body: `{ email, password }`
  - Respuesta: usuario público.
  - Setea cookies `access_token` y `refresh_token`.

- `POST /api/auth/refresh`
  - Usa cookie `refresh_token`.
  - Respuesta: `{ ok: true }`.
  - Rota refresh token y setea nuevas cookies.

- `POST /api/auth/logout`
  - Limpia cookies `access_token` y `refresh_token`.

- `GET /api/users/me`
  - Endpoint canónico para usuario actual autenticado.

`GET /api/auth/me` se mantiene solo como endpoint deprecado (`410`).

## Reglas importantes
- Password policy: 12-20 caracteres, minúscula, mayúscula, número y carácter especial.
- Refresh token es opaco y se rota en cada refresh.
- Access token expira a los 15 min; refresh a 7 días.

## Notas de implementación
- Persistencia in-memory por defecto para usuarios y refresh tokens (con alternativa Postgres disponible).
- Validación de inputs con Zod.
