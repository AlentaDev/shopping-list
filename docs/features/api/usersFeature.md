# Users Feature (MVP)

## Overview
User profile access for authenticated users, backed by the shared user repository and protected by the access-token cookie.

## Endpoints

### GET /api/users/me
Returns the current authenticated user.

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
- `401` not authenticated

## Implementation Notes
- **Module path**: `apps/api/src/modules/users`
- **Layers**:
  - `application`: user lookup use case
  - `infrastructure`: in-memory repository (default), Postgres repository disponible
  - `api`: Express router protected by `requireAuth`
- **Auth**: relies on the access-token cookie set by the auth module
