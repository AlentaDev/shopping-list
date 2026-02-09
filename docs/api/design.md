# API Design Doc (estado actual)

## Objetivo
Este documento describe el estado **actual** de la API (lo que está implementado hoy) para usarlo como base de iteración. No incluye propuestas futuras ni cambios de arquitectura.

## Alcance
- API HTTP en `apps/api` construida con Express.
- Endpoints actuales, formato de errores, autenticación por cookies y dependencias clave.
- Persistencia in-memory por defecto con opción de Postgres y proveedor externo de catálogo (Mercadona).

## Base URL y healthcheck
- **Base URL**: todas las rutas de API se sirven bajo `/api`.
- **Healthcheck**: `GET /health` devuelve `{ "status": "ok" }`.

## Middleware y formato de errores
- Se usa `express.json()` para body JSON.
- CORS abierto (`Access-Control-Allow-Origin: *`) con headers y métodos básicos.
- **Errores de validación** (Zod): `400` con `{ error: "validation_error", details: [...] }`.
- **Errores de dominio/AppError**: código y status definidos por cada error, respuesta `{ error: "<code>" }`.
- **Errores inesperados**: `500` con `{ error: "internal_server_error" }`.

## Autenticación
- Autenticación por **cookies httpOnly**.
- Cookie de acceso: `access_token`.
- Cookie de refresh: `refresh_token`.
- `sameSite=lax`, `secure` solo en producción.
- El middleware `requireAuth` valida el JWT de `access_token` y expone `userId` en la request autenticada.

## Módulos y rutas actuales
La composición del router principal monta los módulos en estas rutas:

| Módulo | Base | Notas |
| --- | --- | --- |
| Auth | `/api/auth` | Registro, login, refresh/logout. |
| Users | `/api/users` | Perfil actual autenticado. |
| Catalog | `/api/catalog` | Catálogo (Mercadona) con cache. |
| Lists | `/api/lists` | Listas de compra y sus items. |

### Auth (`/api/auth`)
**POST `/register`**
- Body: `{ name, email, password, postalCode? }`.
- Respuesta `201`: usuario público `{ id, name, email, postalCode }`.
- Setea cookies `access_token` y `refresh_token`.

**POST `/login`**
- Body: `{ email, password }`.
- Respuesta `200`: usuario público `{ id, name, email, postalCode }`.
- Setea cookies `access_token` y `refresh_token`.

**GET `/me`**
- **Deprecated**: responde error `410` con código `deprecated_endpoint`.

**POST `/refresh`**
- Usa cookie `refresh_token`.
- Respuesta `200`: `{ ok: true }`.
- Refresca cookies de auth.

**POST `/logout`**
- Usa cookie `refresh_token` (puede ser `null`).
- Respuesta `200`: `{ ok: true }`.
- Limpia cookies de auth.

### Users (`/api/users`)
Todas las rutas requieren autenticación.

**GET `/me`**
- Respuesta `200`: usuario público `{ id, name, email, postalCode }`.

### Catalog (`/api/catalog`)
**GET `/categories`**
- Respuesta `200`: `MercadonaRootCategoriesResponse`.

**GET `/categories/:id`**
- Params: `{ id }`.
- Respuesta `200`: `MercadonaCategoryDetailResponse`.

### Lists (`/api/lists`)
Todas las rutas requieren autenticación.

**POST `/`**
- Body: `{ title }`.
- Respuesta `201`: `ListSummary`.

**GET `/`**
- Respuesta `200`: `{ lists: ListSummary[] }`.

**GET `/:id`**
- Params: `{ id }`.
- Respuesta `200`: `ListDetail`.

**GET `/autosave`**
- Respuesta `200`: `AutosaveDraft`.
- Respuesta `204`: sin contenido cuando no hay autosave.

**PUT `/autosave`**
- Body: `{ title, items }`.
- Respuesta `200`: `AutosaveDraftSummary`.

**DELETE `/autosave`**
- Respuesta `204`: sin contenido.

**POST `/:id/items`**
- Params: `{ id }`.
- Body: `{ name, qty?, note? }`.
- Respuesta `201`: `ListItemDto`.

**POST `/:id/items/from-catalog`**
- Params: `{ id }`.
- Body: `{ source: "mercadona", productId, qty?, note? }`.
- Respuesta `201`: `ListItemDto` (tipo `catalog`).

**PATCH `/:id/items/:itemId`**
- Params: `{ id, itemId }`.
- Body: `{ name?, qty?, checked?, note? }`.
- Respuesta `200`: `ListItemDto`.

**DELETE `/:id/items/:itemId`**
- Params: `{ id, itemId }`.
- Respuesta `200`: `{ ok: true }`.

**PATCH `/:id/activate`**
- Params: `{ id }`.
- Body: `{ status: "ACTIVE" }`.
- Respuesta `200`: `{ id, status, updatedAt }`.

**POST `/:id/reuse`**
- Params: `{ id }`.
- Respuesta `201`: `ListDetail`.

**POST `/:id/finish-edit`**
- Params: `{ id }`.
- Respuesta `200`: `ListDetail`.

**PATCH `/:id/editing`**
- Params: `{ id }`.
- Body: `{ isEditing }`.
- Respuesta `200`: `{ id, isEditing, updatedAt }`.

## DTOs y modelos expuestos
### Usuario público (`PublicUser`)
```
{
  "id": string,
  "name": string,
  "email": string,
  "postalCode": string
}
```

### ListSummary
```
{
  "id": string,
  "title": string,
  "status": "DRAFT" | "ACTIVE" | "COMPLETED",
  "itemCount": number,
  "activatedAt": string (ISO) | null,
  "isEditing": boolean,
  "updatedAt": string (ISO)
}
```

### ListDetail
```
{
  "id": string,
  "title": string,
  "status": "DRAFT" | "ACTIVE" | "COMPLETED",
  "itemCount": number,
  "activatedAt": string (ISO) | null,
  "isEditing": boolean,
  "items": ListItemDto[],
  "updatedAt": string (ISO)
}
```

### ListItemDto
- **Deprecado:** los items manuales y las notas están en proceso de eliminación de API/DB/web. Todo cambio nuevo debe asumir **solo catálogo** y sin notas libres.
- **Manual**
```
{
  "id": string,
  "kind": "manual",
  "name": string,
  "qty": number,
  "checked": boolean,
  "note"?: string,
  "updatedAt": string (ISO)
}
```
- **Catalog**
```
{
  "id": string,
  "kind": "catalog",
  "name": string,
  "qty": number,
  "checked": boolean,
  "note"?: string,
  "updatedAt": string (ISO),
  "thumbnail"?: string | null,
  "price"?: number | null,
  "unitSize"?: number | null,
  "unitFormat"?: string | null,
  "unitPrice"?: number | null,
  "isApproxSize"?: boolean,
  "source"?: "mercadona",
  "sourceProductId"?: string
}
```

### Catálogo (Mercadona)
- `MercadonaRootCategoriesResponse` y `MercadonaCategoryDetailResponse` se retornan tal como los define el provider (estructura JSON con `count`, `results`, categorías y productos).

## Persistencia actual
- El wiring por defecto usa repositorios **in-memory** (reiniciar el servidor elimina los datos).
- Existen implementaciones **Postgres** listas para cablearse cuando se requiera persistencia.

## Integraciones externas
- El catálogo usa el proveedor de Mercadona (`https://tienda.mercadona.es/api`) con cache in-memory.
- Fallos del proveedor de catálogo devuelven error `502` con código `catalog_provider_failed`.

## Notas de estado
- El endpoint `/api/auth/me` está marcado como **deprecated** y responde `410`.
- El módulo de auth comparte el repositorio de usuarios con el módulo `users` para coherencia.
