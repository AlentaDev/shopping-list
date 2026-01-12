# Auth Feature (MVP)

## Overview
Basic authentication module with in-memory persistence, cookie-based sessions, and input validation. It supports signup, login, and logout.

## Endpoints

### POST /api/auth/signup
Creates a new user and starts an account with unique email.

**Request body**
```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "secret123",
  "postalCode": "12345"
}
```

**Validation**
- `name`: string, 3–20 chars
- `email`: valid email format
- `password`: non-empty string
- `postalCode`: non-empty string

**Responses**
- `201` with user:
```json
{
  "id": "uuid",
  "name": "Alice",
  "email": "alice@example.com",
  "postalCode": "12345"
}
```
- `400` validation error
- `409` duplicate email

---

### POST /api/auth/login
Authenticates a user and sets an httpOnly cookie session.

**Request body**
```json
{
  "email": "alice@example.com",
  "password": "secret123"
}
```

**Responses**
- `200` with user:
```json
{
  "id": "uuid",
  "name": "Alice",
  "email": "alice@example.com",
  "postalCode": "12345"
}
```
- `401` invalid credentials

**Cookie**
- `session` is set with `HttpOnly` and `SameSite=Lax`.

---

### GET /api/auth/me (deprecated)
Deprecated. Use `GET /api/users/me` instead.

**Responses**
- `410` deprecated endpoint

### POST /api/auth/logout
Clears the session cookie.

**Responses**
- `200` with:
```json
{ "ok": true }
```

## Implementation Notes
- **Module path**: `apps/api/src/modules/auth`
- **Layers**:
  - `application`: use cases and ports
  - `infrastructure`: in-memory repositories, session store, password hasher
  - `web`: Express router with Zod validation
- **Password hashing**: Node.js `scrypt` with per-user salt
- **Sessions**: in-memory map keyed by session id
- **Error handling**: centralized in `apps/api/src/app.ts`
