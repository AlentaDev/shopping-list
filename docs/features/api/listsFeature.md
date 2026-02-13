# Lists (Phase 1)

## Resumen

El módulo de listas permite crear y gestionar listas de compra para usuarios autenticados. Los invitados no persisten listas en el servidor.
Existe un **único `DRAFT` por usuario** y siempre es el autosave persistido en servidor. En el modelo actual corresponde a `status=DRAFT` con `is_autosave_draft` cuando aplica. Puede estar vacío y se reutiliza entre flujos (crear, `ReuseList`, editar).

### Decision rationale

Se prefiere permitir `DRAFT` vacío para mantener contratos API estables y unificados en todos los flujos. Esta decisión evita lógica especial de creación diferida del autosave y facilita la recuperación de sesión con menor complejidad en cliente y servidor.

### Semántica de listas vacías (normativa)

- `DRAFT` **puede estar vacío** y seguir siendo válido como autosave persistente.
- Está **prohibido** activar (`DRAFT` -> `ACTIVE`) una lista sin items.
- La validación es en doble capa obligatoria:
  - **Web**: guard de UX que bloquea “Finalizar lista” cuando el borrador está vacío.
  - **API**: invariante de negocio que rechaza la transición aunque el cliente no aplique el guard.
- Implicación esperada: una lista `COMPLETED` en flujo normal **no debe estar vacía**, porque parte de una `ACTIVE` válida con items.

> **Deprecado:** los items manuales están en proceso de eliminación y se retirarán de la API, la base de datos y la web. Todas las evoluciones futuras deben asumir listas **solo de catálogo**.


## Política canónica de Draft y Recovery

La política canónica de invariante y recuperación del `DRAFT` vive en `docs/usecases/list-use-cases.md#draft-invariant-and-recovery-policy`.

Resumen operativo para API:

- Un usuario autenticado en primer bootstrap puede no tener draft todavía.
- Tras bootstrap debe existir exactamente un `DRAFT` reutilizable en servidor.
- Variant A (canónica): para usuarios con bootstrap completado, la entidad `DRAFT` es persistente y no se elimina; los flujos limpian su contenido.
- Si un flujo requiere draft y no existe, backend aplica self-heal con update-or-create.
- Toda operación que muta draft debe dejar exactamente un `DRAFT` en servidor.

### Defensive update-or-create behavior

Cualquier operación dependiente de draft debe aplicar comportamiento defensivo `update-or-create`:

- Si existe `DRAFT`, se actualiza ese draft.
- Si falta `DRAFT`, se crea uno nuevo antes de continuar.

Alcance mínimo obligatorio:

- escrituras de autosave (`PUT /api/lists/autosave`),
- operaciones de `reuse`,
- operaciones de draft relacionadas con edición.

Este fallback existe para resiliencia ante errores transitorios y condiciones de carrera (por ejemplo, lecturas desfasadas o eventos concurrentes). Aun en estos escenarios, la operación debe preservar el invariante de **draft único por usuario**.

Ejemplo conciso de recuperación (reuse/edit):

1. Cliente inicia `reuse` de una lista y backend intenta aplicar cambios sobre `DRAFT`.
2. El `DRAFT` esperado no existe (eliminación accidental o carrera).
3. Backend crea `DRAFT` en el mismo flujo y continúa la operación de edición/reuse.
4. La respuesta es exitosa y el usuario termina con exactamente un `DRAFT` reutilizable.

## Acceptance checklist (backend + frontend)

> Checklist verificable para QA/API/Web. Cada criterio referencia endpoint(s) y caso(s) de uso concretos para evitar ambigüedad de implementación.

- [ ] **`204` solo en bootstrap de primer login/auth**
  - **Endpoint:** `GET /api/lists/autosave`
  - **Use case:** bootstrap de sesión autenticada sin draft previo.
  - **Criterio verificable:**
    1. Usuario autenticado recién creado, sin `DRAFT` inicializado -> `GET /api/lists/autosave` devuelve `204`.
    2. Después de primera inicialización (`PUT /api/lists/autosave` o flujo equivalente de bootstrap) -> `GET /api/lists/autosave` devuelve siempre `200` (incluyendo draft vacío).
    3. En usuarios existentes (ya bootstrappeados) no reaparece `204` como estado normal.

- [ ] **Usuarios existentes terminan operaciones con exactamente un draft**
  - **Endpoints / casos de uso:** `PUT /api/lists/autosave`, `PATCH /api/lists/:id/activate`, `POST /api/lists/:id/reuse`, `POST /api/lists/:id/finish-edit`, `DELETE /api/lists/autosave`.
  - **Criterio verificable:** al finalizar cualquiera de estos flujos para usuario existente, una consulta de autosave (`GET /api/lists/autosave`) devuelve un único `DRAFT` reutilizable (`200`) y no existen 0 ni >1 drafts.

- [ ] **Semántica Variant A: la entidad draft persiste y los flujos la limpian**
  - **Endpoints / casos de uso:** `GET /api/lists/autosave`, `PUT /api/lists/autosave`, `DELETE /api/lists/autosave`, `POST /api/lists/:id/finish-edit`, `POST /api/lists/:id/reuse`.
  - **Criterio verificable:** en usuarios con bootstrap completado, tras limpiar autosave o terminar edición/reuso debe seguir existiendo la misma entidad lógica de `DRAFT` (lectura posterior `GET /api/lists/autosave` en `200`, incluyendo contenido vacío), sin volver al estado normal de `204`.

- [ ] **`finish-edit` y `DELETE autosave` limpian contenido, no eliminan entidad draft**
  - **Endpoints:** `POST /api/lists/:id/finish-edit`, `DELETE /api/lists/autosave`.
  - **Criterio verificable:**
    1. Tras `POST /api/lists/:id/finish-edit`, la lista activa queda actualizada y el `DRAFT` permanece existente pero vacío/limpio según contrato.
    2. Tras `DELETE /api/lists/autosave`, la API responde `204` y el `DRAFT` sigue existiendo (lectura posterior con `GET /api/lists/autosave` devuelve `200` con contenido limpio).

- [ ] **Flujos de reuse/edit recuperan automáticamente si falta draft (update-or-create)**
  - **Endpoints / casos de uso:** `POST /api/lists/:id/reuse` y operaciones de edición que dependen de draft (`POST /api/lists/:id/finish-edit`, escrituras `PUT /api/lists/autosave`).
  - **Criterio verificable:** si el `DRAFT` no existe por condición transitoria/carrera, la operación crea uno en el mismo flujo y responde éxito funcional (sin error por draft faltante), manteniendo invariante de draft único.

- [ ] **Migración local-first en primer login preserva items locales pre-auth al draft servidor**
  - **Use case:** reconciliación login/bootstrap cliente-servidor.
  - **Endpoints:** `GET /api/lists/autosave` (detección bootstrap `204`) + `PUT /api/lists/autosave` (persistencia del `LOCAL_DRAFT` pre-auth).
  - **Criterio verificable:** con items en `LOCAL_DRAFT` antes de autenticar, el primer login debe terminar con `GET /api/lists/autosave` en `200` y los items locales presentes en el draft servidor (sin pérdida silenciosa).

- [ ] **Matriz canónica de acciones en modal de detalle read-only (`ACTIVE`/`COMPLETED`)**
  - **Estado UI esperado (web):** el modal de detalle abre en solo lectura para ambos estados.
  - **Criterio verificable:**
    1. En `ACTIVE`, el modal muestra únicamente acciones de **Editar**, **Borrar** y **Cerrar**.
    2. En `COMPLETED`, el modal muestra únicamente acciones de **Reusar**, **Borrar** y **Cerrar**.
    3. En ambos estados, **Cerrar** no muta datos ni llama endpoints de negocio.
    4. Ninguna combinación de acciones contradice endpoints actuales: edición vía `PATCH /api/lists/:id/editing` + `POST /api/lists/:id/finish-edit`, reuso vía `POST /api/lists/:id/reuse`, borrado vía endpoint de delete vigente.

- [ ] **Guard de transición `DRAFT` -> `ACTIVE` no vacío en Web y API**
  - **Endpoints / casos de uso:** acción “Finalizar lista” web + `PATCH /api/lists/:id/activate`.
  - **Criterio verificable:**
    1. Si el borrador no tiene items, la Web bloquea la acción de finalizar (guard UX).
    2. Si un cliente intenta activar un `DRAFT` vacío directo contra API, `PATCH /api/lists/:id/activate` rechaza la transición (error de validación de negocio).
    3. Si el borrador tiene >=1 item, Web permite finalizar y API devuelve éxito.

- [ ] **Conflictos de autosave con `baseUpdatedAt` devuelven `409` sin overwrite silencioso**
  - **Endpoint:** `PUT /api/lists/autosave`.
  - **Criterio verificable:**
    1. Con `baseUpdatedAt` igual al `updatedAt` remoto vigente, la escritura se persiste y devuelve `200`.
    2. Con `baseUpdatedAt` desfasado, la API devuelve `409` con `error=autosave_version_conflict` y `remoteUpdatedAt`.
    3. Tras un `409`, una lectura `GET /api/lists/autosave` confirma que el contenido remoto no fue sobreescrito por el payload en conflicto.

## Endpoints

### POST /api/lists

**Request**

```json
{
  "title": "Groceries"
}
```

**Response 201**

```json
{
  "id": "uuid",
  "title": "Groceries",
  "status": "DRAFT",
  "itemCount": 0,
  "activatedAt": null,
  "isEditing": false,
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### GET /api/lists

**Response 200**

```json
{
  "lists": [
    {
      "id": "uuid",
      "title": "Groceries",
      "status": "ACTIVE",
      "itemCount": 12,
      "activatedAt": "2024-01-01T00:00:00.000Z",
      "isEditing": false,
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Notas**

- El listado general excluye listas en estado `DRAFT`.
- Orden por fecha más reciente (Activas: `activatedAt`, Historial: `updatedAt`).


### GET /api/lists/autosave

**Response 200**

```json
{
  "id": "uuid",
  "title": "Autosave",
  "items": [
    {
      "id": "uuid",
      "kind": "catalog",
      "name": "Milk",
      "qty": 1,
      "checked": false,
      "source": "mercadona",
      "sourceProductId": "123",
      "thumbnail": "https://cdn.example.com/milk.png",
      "price": 1.25,
      "unitSize": 1,
      "unitFormat": "L",
      "unitPrice": 1.25,
      "isApproxSize": false,
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

Para un usuario autenticado que aún no inicializó su draft (estado bootstrap inicial), `GET /api/lists/autosave` responde `204`.
Para usuarios con bootstrap completado (draft inicializado), `GET /api/lists/autosave` responde siempre `200` con el payload de autosave (aunque esté vacío).

El `204` representa exclusivamente el estado inicial de bootstrap y no debe reaparecer como estado normal en usuarios establecidos.
Después de la primera inicialización/bootstrapping que crea el draft, las lecturas siguientes deben devolver `200`.

Secuencia de ejemplo:

1. Usuario se registra.
2. `GET /api/lists/autosave` → `204` (sin draft inicializado todavía).
3. Bootstrap/primera escritura crea el `DRAFT`.
4. `GET /api/lists/autosave` → `200` con payload de draft.

El autosave se crea o recupera al autenticarse (puede estar vacío) y se actualiza cuando el frontend guarda cambios del `LOCAL_DRAFT` o del propio `DRAFT`.

### PUT /api/lists/autosave

**Request**

```json
{
  "title": "Autosave",
  "baseUpdatedAt": "2024-01-01T00:00:00.000Z",
  "items": [
    {
      "id": "uuid",
      "kind": "catalog",
      "name": "Milk",
      "qty": 1,
      "checked": false,
      "source": "mercadona",
      "sourceProductId": "123",
      "thumbnail": "https://cdn.example.com/milk.png",
      "price": 1.25,
      "unitSize": 1,
      "unitFormat": "L",
      "unitPrice": 1.25,
      "isApproxSize": false
    }
  ]
}
```

**Response 200**

```json
{
  "id": "uuid",
  "title": "Autosave",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

Sobrescribe el `DRAFT` con el contenido enviado (incluyendo el caso vacío).

**Regla de concurrencia (obligatoria):**

- `baseUpdatedAt` representa la versión remota sobre la que el cliente editó.
- El servidor compara `baseUpdatedAt` contra el `updatedAt` actual del `DRAFT`.
- Si `updatedAt` servidor `!= baseUpdatedAt`, la API **debe** responder `409 Conflict` y **no** persistir la escritura.

**Response 409 (conflict)**

```json
{
  "error": "autosave_version_conflict",
  "remoteUpdatedAt": "2024-01-01T00:00:00.000Z",
  "message": "Autosave conflict: remote draft was updated by another session."
}
```


## Sync policy

- **Debounce (cliente web):** el cliente agrupa cambios del `LOCAL_DRAFT` y envía `PUT /api/lists/autosave` con ventana de **800 ms**. La API asume escrituras idempotentes del último snapshot recibido.
- **Retry en autosave fallido (cliente):**
  - Estrategia esperada: 3 reintentos con backoff exponencial (**1 s**, **2 s**, **4 s**).
  - Si se agotan, el cliente conserva cambios localmente y deja el estado en error de sincronización hasta reintento manual o nueva edición.
- **Conflictos multi-tab / actualizaciones concurrentes:**
  - `PUT /api/lists/autosave` valida precondición de versión con `baseUpdatedAt`.
  - Contrato determinista: si `server.updatedAt !== baseUpdatedAt`, responde `409` con `remoteUpdatedAt` y no aplica cambios.
  - Ante conflicto, responder **`409 Conflict`** sin aplicar overwrite silencioso.
  - El cliente debe tratar el conflicto como recuperación explícita (no merge implícito en backend).
- **Comportamiento offline esperado:**
  - Sin red, no hay persistencia en servidor; los cambios permanecen en `LOCAL_DRAFT`.
  - Al recuperar conectividad, el cliente reintenta sincronizar el último snapshot pendiente.
- **Regla explícita server -> local:**
  - Los datos del servidor solo pueden sobrescribir estado local en escenarios de recuperación definidos: bootstrap inicial de sesión, rehidratación tras relogin, o resolución explícita de conflicto (`409`) iniciada por el usuario.
  - Fuera de esos casos, el servidor no debe considerarse fuente para sobrescribir edición local en curso.

### Timeline de ejemplo (conflicto concurrente)

1. **t0:** Cliente A y B leen autosave con `updatedAt=10:00`.
2. **t1:** A envía `PUT /autosave` con base `10:00`; API guarda y devuelve `updatedAt=10:01`.
3. **t2:** B envía `PUT /autosave` todavía con base `10:00`.
4. **t3:** API detecta desfasaje y responde `409 Conflict` (sin persistir payload de B).
5. **t4:** B mantiene cambios locales pendientes y usa `remoteUpdatedAt=10:01` para pedir el último autosave remoto.
6. **t5:** Solo si el usuario elige flujo de recuperación, B reemplaza local por remoto o reintenta con snapshot reconciliado.

### GET /api/lists/:id

**Response 200**

```json
{
  "id": "uuid",
  "title": "Groceries",
  "status": "ACTIVE",
  "isEditing": false,
  "activatedAt": "2024-01-01T00:00:00.000Z",
  "itemCount": 1,
  "items": [
    {
      "id": "uuid",
      "kind": "catalog",
      "name": "Milk",
      "qty": 1,
      "checked": false,
      "source": "mercadona",
      "sourceProductId": "123",
      "thumbnail": "https://cdn.example.com/milk.png",
      "price": 1.25,
      "unitSize": 1,
      "unitFormat": "L",
      "unitPrice": 1.25,
      "isApproxSize": false,
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### PATCH /api/lists/:id/activate

**Request**

```json
{
  "status": "ACTIVE"
}
```

**Response 200**

```json
{
  "id": "uuid",
  "status": "ACTIVE",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Regla:** solo se permite activar si el `DRAFT` tiene items. Tras activar, se mantiene el invariante post-activación de un único `DRAFT` reutilizable en servidor.

After completion, exactly one reusable server DRAFT exists.

### POST /api/lists/:id/complete

Completa una lista activa y sincroniza items marcados.

**Request**

```json
{
  "checkedItemIds": ["uuid"]
}
```

### DELETE /api/lists/:id

**Response 200**

```json
{
  "ok": true
}
```

### DELETE /api/lists/autosave

**Response 204**

Sin contenido. En Variant A para usuarios bootstrap-completed, limpia el contenido del `DRAFT` (título/items según regla vigente), pero no elimina la entidad `DRAFT` persistente.

After completion, exactly one reusable server DRAFT exists.

### POST /api/lists/:id/items/from-catalog

**Request**

```json
{
  "source": "mercadona",
  "productId": "123",
  "qty": 2
}
```

**Response 201**

```json
{
  "id": "uuid",
  "kind": "catalog",
  "name": "Milk",
  "qty": 2,
  "checked": false,
  "source": "mercadona",
  "sourceProductId": "123",
  "thumbnail": "https://cdn.example.com/milk.png",
  "price": 1.25,
  "unitSize": 1,
  "unitFormat": "L",
  "unitPrice": 1.25,
  "isApproxSize": false,
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### PATCH /api/lists/:id/items/:itemId

**Request**

```json
{
  "checked": true,
  "qty": 3
}
```

**Response 200**

```json
{
  "id": "uuid",
  "kind": "catalog",
  "name": "Milk",
  "qty": 3,
  "checked": true,
  "source": "mercadona",
  "sourceProductId": "123",
  "thumbnail": "https://cdn.example.com/milk.png",
  "price": 1.25,
  "unitSize": 1,
  "unitFormat": "L",
  "unitPrice": 1.25,
  "isApproxSize": false,
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### DELETE /api/lists/:id/items/:itemId

**Response 200**

```json
{
  "ok": true
}
```

### POST /api/lists/:id/reuse

Caso de uso **ReuseList**: reusa una lista completada sobrescribiendo el contenido del `DRAFT` existente con los mismos items sin marcar; si falta draft, aplica fallback update-or-create.

**Response 201**

```json
{
  "id": "uuid",
  "title": "Groceries",
  "status": "DRAFT",
  "items": [
    {
      "id": "uuid",
      "kind": "catalog",
      "name": "Milk",
      "qty": 1,
      "checked": false,
      "source": "mercadona",
      "sourceProductId": "123",
      "thumbnail": "https://cdn.example.com/milk.png",
      "price": 1.25,
      "unitSize": 1,
      "unitFormat": "L",
      "unitPrice": 1.25,
      "isApproxSize": false,
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

After completion, exactly one reusable server DRAFT exists.

### PATCH /api/lists/:id/editing

Marca una lista activa como en edición (`isEditing=true`) o la desactiva (`isEditing=false`).

**Request**

```json
{
  "isEditing": true
}
```

**Response 200**

```json
{
  "id": "uuid",
  "isEditing": true,
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### POST /api/lists/:id/finish-edit

Aplica el borrador autosave a la lista `ACTIVE`, pone `isEditing=false` y luego limpia el contenido del `DRAFT` sin eliminar la entidad persistente.

After completion, exactly one reusable server DRAFT exists.

## Referencia de transiciones

- Ver la tabla canónica de transiciones en `docs/usecases/list-use-cases.md#tabla-de-transiciones-de-estado` para el detalle de reconciliación login/bootstrap, activación, edición de `ACTIVE`, reutilización de `COMPLETED` y cierre de compra en móvil.

## Notas de implementación

- Todas las rutas requieren sesión autenticada.
- La persistencia por defecto es en memoria mediante `InMemoryListRepository` (hay alternativa Postgres).
- La autorización restringe el acceso a las listas del propietario.
- Validación de payloads con Zod y errores uniformes de validación.
- La duplicación solo aplica a listas en estado `COMPLETED`.

## Cambios previstos (API)

- Sin cambios pendientes relevantes.
