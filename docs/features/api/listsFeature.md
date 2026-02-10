# Lists (Phase 1)

## Resumen

El módulo de listas permite crear y gestionar listas de compra para usuarios autenticados. Los invitados no persisten listas en el servidor.
Existe un **único `DRAFT` por usuario** y siempre es el autosave persistido en servidor. En el modelo actual corresponde a `status=DRAFT` con `is_autosave_draft` cuando aplica. Puede estar vacío y se reutiliza entre flujos (crear, `ReuseList`, editar).

### Decision rationale

Se prefiere permitir `DRAFT` vacío para mantener contratos API estables y unificados en todos los flujos. Esta decisión evita lógica especial de creación diferida del autosave y facilita la recuperación de sesión con menor complejidad en cliente y servidor.

> **Deprecado:** los items manuales están en proceso de eliminación y se retirarán de la API, la base de datos y la web. Todas las evoluciones futuras deben asumir listas **solo de catálogo**.


## Política canónica de Draft y Recovery

La política canónica de invariante y recuperación del `DRAFT` vive en `docs/usecases/list-use-cases.md#draft-invariant-and-recovery-policy`.

Resumen operativo para API:

- Un usuario autenticado en primer bootstrap puede no tener draft todavía.
- Tras bootstrap debe existir exactamente un `DRAFT` reutilizable en servidor.
- Variant A: el draft no se elimina; los flujos limpian su contenido.
- Si un flujo requiere draft y no existe, backend aplica self-heal con update-or-create.
- Toda operación que muta draft debe dejar exactamente un `DRAFT` en servidor.

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
Para usuarios con draft ya inicializado, `GET /api/lists/autosave` responde `200` con el payload de autosave (aunque esté vacío).

El `204` representa un estado inicial de bootstrap, no un estado normal recurrente para usuarios establecidos.
Después de la primera escritura/bootstrapping que crea el draft, las lecturas siguientes deben devolver `200`.

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


## Sync policy

- **Debounce (cliente web):** el cliente agrupa cambios del `LOCAL_DRAFT` y envía `PUT /api/lists/autosave` con ventana de **800 ms**. La API asume escrituras idempotentes del último snapshot recibido.
- **Retry en autosave fallido (cliente):**
  - Estrategia esperada: 3 reintentos con backoff exponencial (**1 s**, **2 s**, **4 s**).
  - Si se agotan, el cliente conserva cambios localmente y deja el estado en error de sincronización hasta reintento manual o nueva edición.
- **Conflictos multi-tab / actualizaciones concurrentes:**
  - `PUT /api/lists/autosave` debe validar precondición de versión (`updatedAt` o equivalente) para detectar escrituras sobre snapshot obsoleto.
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
5. **t4:** B mantiene cambios locales pendientes y solicita último autosave remoto (`10:01`).
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

Sin contenido. Limpia el contenido del `DRAFT` (título/items según regla vigente), pero conserva la entidad `DRAFT`.

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

Aplica el borrador autosave a la lista `ACTIVE`, pone `isEditing=false` y luego limpia el contenido del `DRAFT`.

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
