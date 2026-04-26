# Autenticación (API)

## Resumen
Módulo de autenticación con persistencia in-memory por defecto (Postgres opcional), sesiones por cookies httpOnly y validación de inputs con Zod.

> Fuente canónica del contrato actual:
> - `docs/api/openapi.yaml`
> - `docs/api/design.md`

## Endpoints

### POST /api/auth/register
Crea un usuario nuevo (email único) y abre sesión.

**Body de request**
```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "secret123",
  "postalCode": "12345"
}
```

**Validación**
- `name`: string, 3–20 caracteres
- `email`: formato de email válido
- `password`: string no vacío
- `postalCode`: string no vacío

**Respuestas**
- `201` con usuario:
```json
{
  "id": "uuid",
  "name": "Alice",
  "email": "alice@example.com",
  "postalCode": "12345"
}
```
- `400` error de validación
- `409` email duplicado

---

### POST /api/auth/login
Autentica usuario y setea cookies de sesión.

**Body de request**
```json
{
  "email": "alice@example.com",
  "password": "secret123"
}
```

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
- `401` credenciales inválidas

**Cookies**
- `access_token` + `refresh_token` con `HttpOnly` y `SameSite=Lax`.

---

### GET /api/auth/me (deprecado)
Deprecado. Usar `GET /api/users/me`.

**Respuestas**
- `410` endpoint deprecado

### POST /api/auth/refresh
Usa `refresh_token`, rota tokens y responde `{ ok: true }`.

### POST /api/auth/logout
Limpia `access_token` y `refresh_token`.

**Respuestas**
- `200` con:
```json
{ "ok": true }
```

## Notas de implementación
- **Ruta del módulo**: `apps/api/src/modules/auth`
- **Capas**:
  - `application`: casos de uso y puertos
  - `infrastructure`: stores in-memory (default), stores Postgres, password hasher y servicios de tokens
  - `api`: Express router con validación Zod
- **Hash de contraseña**: Node.js `scrypt` con salt por usuario
- **Refresh tokens**: store in-memory por defecto (Postgres disponible)
- **Manejo de errores**: centralizado en `apps/api/src/app/errors/errorMiddleware.ts`
