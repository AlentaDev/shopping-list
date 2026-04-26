# Gestión de listas (web)

## Objetivo

Proveer una pantalla dedicada para gestionar listas por estado desde el menú de usuario. El `DRAFT` único (autosave persistido en servidor) se gestiona en el modal de lista, puede estar vacío y no aparece en este listado.

## Clasificación de estado

- **COMPORTAMIENTO_ACTUAL**: reglas implementadas deben contrastarse con `docs/api/design.md` y con el comportamiento real de UI.
- **COMPORTAMIENTO_OBJETIVO**: decisiones objetivo de producto/arquitectura en `docs/007-lists-management-evolution.md`.
- **NOTA_TRANSICION**: orden de migración y cortes por iteración en `docs/lists-implementation-plan.md`.

## Endpoints

- `GET /api/lists` (carga de listas)
- `POST /api/lists/:id/reuse` (ReuseList: reusar listas del historial)
- `DELETE /api/lists/:id` (borrar listas)
- `PATCH /api/lists/:id/editing` (activar/desactivar edición)
- `POST /api/lists/:id/finish-edit` (finalizar edición)


## Política canónica de Draft y Recovery

La política canónica de invariante y recuperación del `DRAFT` está en `docs/usecases/list-use-cases.md#draft-invariant-and-recovery-policy`.
Este documento debe tratarla como fuente única para reglas de bootstrap, reutilización y self-healing backend, siguiendo Variant A como semántica canónica de draft persistente.


### Bootstrap de primer login (referencia canónica)

Para evitar drift, los detalles normativos de bootstrap (casos, desempates y feedback) se mantienen en:

- `docs/usecases/list-use-cases.md#bootstrap-de-primer-login-normativo`

Este documento solo define comportamiento UI de gestión de listas y debe permanecer alineado con esa sección.

## Reglas importantes

### Matriz canónica de acciones UI (listas)

Esta matriz define una sola fuente de verdad para las acciones visibles y separa explícitamente:

- **Acciones de negocio**: cambian estado o datos de listas.
- **Acción modal de UX**: solo cierra el modal, sin cambiar estado.

| Contexto UI | Acción visible | Tipo | UI text key |
| --- | --- | --- | --- |
| Tarjeta `ACTIVE` (listado) | `Borrar` (botón en tarjeta) | Negocio | `UI_TEXT.LISTS.ACTIONS.DELETE` |
| Tarjeta `COMPLETED` (listado) | `Borrar` (botón en tarjeta) | Negocio | `UI_TEXT.LISTS.ACTIONS.DELETE` |
| Click en tarjeta (`ACTIVE`/`COMPLETED`) | Abrir modal de detalle en solo lectura (items + total, sin edición inline) | UX navegación | `UI_TEXT.LISTS.ACTIONS.VIEW` |
| Modal detalle `ACTIVE` | `Editar` | Negocio | `UI_TEXT.SHOPPING_LIST.DETAIL_ACTIONS.EDIT` |
| Modal detalle `ACTIVE` | `Borrar` | Negocio | `UI_TEXT.SHOPPING_LIST.DETAIL_ACTIONS.DELETE` |
| Modal detalle `ACTIVE` | `Cerrar` | UX modal-only | `UI_TEXT.SHOPPING_LIST.DETAIL_ACTIONS.CLOSE` |
| Modal detalle `COMPLETED` | `Reusar` | Negocio | `UI_TEXT.SHOPPING_LIST.DETAIL_ACTIONS.REUSE` |
| Modal detalle `COMPLETED` | `Borrar` | Negocio | `UI_TEXT.SHOPPING_LIST.DETAIL_ACTIONS.DELETE` |
| Modal detalle `COMPLETED` | `Cerrar` | UX modal-only | `UI_TEXT.SHOPPING_LIST.DETAIL_ACTIONS.CLOSE` |

### Listado general

- Tabs por estado: **Activas**, **Historial**.
- Orden: fecha más nueva primero.
- No se muestran listas sin items.
- El `DRAFT` único no se lista nunca (aunque exista vacío o con items).
- Nombre de la lista: máximo 35 caracteres, truncado con `…`.
- Estados vacíos: mostrar mensaje informativo.

### Semántica de listas vacías (normativa)

- `DRAFT` **puede estar vacío**. Esto es válido y esperado como parte del autosave persistente.
- Está **prohibido** transicionar de `DRAFT` a `ACTIVE` sin items.
- Esta regla debe validarse en dos capas:
  - **Web (UX guard)**: bloquear acción de “Finalizar lista” si no hay items y mostrar feedback claro.
  - **API (invariante de negocio)**: rechazar cualquier transición a `ACTIVE` sin items aunque la UI falle o sea omitida.
- Implicación esperada: `COMPLETED` **no debería quedar vacío en flujo normal**, porque proviene de una `ACTIVE` válida con items.

### Activas (listado)

- Cada tarjeta muestra: nombre, nº de productos, fecha de activación y botón de borrar.
- Click en la tarjeta abre un modal de detalle en **solo lectura** (items + total, sin edición inline).
- Borrar abre un **modal** de confirmación (“no se puede recuperar”).
- Si falla el backend al borrar: toast de error y no se elimina en UI.

### Activas (detalle)

- Se muestran productos + total, en modo **solo lectura** (sin edición inline de items).
- Botones: **Editar**, **Borrar**, **Cerrar**.
- Borrar reutiliza el modal de confirmación del listado.
- **Cerrar** es una acción de UX modal-only (no cambia estado de negocio).

#### Editar lista activa

- La edición solo se inicia desde el modal de visualización.
- Antes de editar, se muestra un modal de confirmación con:
  - “No se podrá usar en móvil mientras se edita”.
  - Si hay `DRAFT` con items: “Perderás la lista que estás confeccionando”.
- Al confirmar, la lista activa queda con `isEditing=true`.
- Se crea un **DRAFT paralelo editable** con el contenido actual de la lista activa.
- Si ya existía `DRAFT`, se reemplaza (tras el aviso). El `DRAFT` único puede quedar vacío cuando se descarta.
- En móvil, una lista activa en edición se muestra solo lectura con aviso fijo.

##### Semántica canónica de `isEditing` (edición activa)

Durante una edición iniciada sobre una lista `ACTIVE`, `isEditing=true` aplica de forma conjunta a:

- la lista `ACTIVE` origen, y
- el `DRAFT` que contiene los cambios de esa edición.

Esta combinación representa una sesión de edición activa (no un flujo de borrador normal desacoplado de la lista `ACTIVE`).

##### Refresh / reload durante edición activa

- Tras recargar la app con una edición activa en curso, se debe restaurar el modo edición.
- La UI debe recuperar el contexto de la lista `ACTIVE` en edición.
- No debe degradar a un flujo de `DRAFT` plano sin vínculo con la `ACTIVE`.

- Si el usuario cancela la edición, el `DRAFT` se reinicia a vacío y se vuelve a `isEditing=false` (sin eliminar la entidad draft).
- Si el usuario termina la edición, `POST /api/lists/:id/finish-edit` aplica el DRAFT a la lista activa y el `DRAFT` se reinicia a vacío (sin eliminar la entidad draft).

##### Semántica finish / cancel (ACTIVE y DRAFT)

- **ACTIVE en edición (`isEditing=true`) + DRAFT de edición**
  - **Cancelar:** `PATCH /api/lists/:id/editing` desactiva edición (`isEditing=false`) y limpia el `DRAFT`.
  - **Finalizar:** `POST /api/lists/:id/finish-edit` aplica cambios en `ACTIVE`, desactiva edición (`isEditing=false`) y limpia el `DRAFT`.
- **DRAFT normal (autosave, sin ACTIVE en edición)**
  - Se mantiene como borrador persistente reutilizable.
  - `DELETE /api/lists/autosave` limpia contenido, sin eliminar la entidad `DRAFT`.

### Historial (listado)

- Cada tarjeta muestra: nombre, nº de productos e icono de borrar.
- Click en la tarjeta abre un modal de detalle en **solo lectura** (items + total, sin edición inline).
- Borrar abre modal de confirmación.

### Historial (detalle)

- Se muestran productos + total, en modo **solo lectura** (sin edición inline de items).
- Botones: **Reusar**, **Borrar**, **Cerrar**.
- ReuseList abre el modal y sobrescribe el `DRAFT` único con los items del historial.
- Si existe un `DRAFT` con items, se avisa de pérdida y se reemplaza.
- Borrar reutiliza el modal de confirmación del listado.
- **Cerrar** es una acción de UX modal-only (no cambia estado de negocio).

### Estado en móvil

- Si una lista activa está en edición (`isEditing=true`), en móvil solo se permite ver y se muestra aviso fijo de edición.


### Web source of truth (normativo)

- Web lee y escribe primero en `LOCAL_DRAFT`.
- El autosave sincroniza al `DRAFT` del servidor como backup.
- El `DRAFT` del servidor se usa para bootstrap/recuperación, no como estado primario de edición.
- Flujo ejemplo: editar item -> actualizar `LOCAL_DRAFT` al instante -> lanzar autosave con debounce -> persistir en `DRAFT` remoto.

- Semántica de limpieza del draft en servidor (Variant A):
  - `DELETE /api/lists/autosave` limpia contenido del `DRAFT`, no elimina la entidad.
  - `POST /api/lists/:id/finish-edit` también limpia contenido del `DRAFT` tras aplicar cambios a `ACTIVE`, sin eliminar la entidad.
- `GET /api/lists/autosave` devuelve `204` solo en bootstrap inicial antes de la primera inicialización del draft.
  Después de bootstrap (usuarios establecidos), debe devolver `200` incluso con draft vacío.

### Sync policy (resumen web)

La semántica canónica de sincronización, conflicto `409` y overwrite server->local está centralizada en:

- `docs/usecases/list-use-cases.md#draft-invariant-and-recovery-policy`
- `docs/api/design.md` (contrato HTTP actual)

Este documento mantiene solo las decisiones de UX web:

- La edición operativa usa `LOCAL_DRAFT` como source of truth local.
- Ante `409`, se requiere resolución explícita del usuario (`Mantener local` / `Mantener remoto`).
- No se permite overwrite remoto implícito fuera de escenarios de recuperación definidos.


## Contrato final de edit-mode

- **Invariantes**
  - Existe un único `DRAFT` remoto por usuario (puede estar vacío).
  - Si una `ACTIVE` entra en edición, el sistema mantiene el par atómico `ACTIVE(isEditing=true)` + `DRAFT` asociado hasta `finish` o `cancel`.
  - Nunca se permite `DRAFT -> ACTIVE` con `items.length = 0`.
- **Transiciones permitidas**
  - `start`: `ACTIVE(isEditing=false)` -> `ACTIVE(isEditing=true)` + `DRAFT` de edición.
  - `finish`: aplica snapshot de `DRAFT` en `ACTIVE`, pasa `isEditing=false` y limpia `DRAFT`.
  - `cancel`: descarta snapshot de `DRAFT`, pasa `isEditing=false` y limpia `DRAFT`.
  - `recovery`: tras reload/login, si `isEditing=true`, la UI rehidrata ese edit-mode (no degrada a flujo draft normal).
- **Regla canónica de item ID**
  - `itemId` es el identificador estable de línea y único dentro de la lista.
  - Operaciones de update/delete se resuelven por `itemId` (no por índice).
  - En reuse/edit se preserva `itemId` para la misma línea; líneas nuevas generan `itemId` nuevo.
- **Política de timestamp/version reutilizada**
  - Todos los writes de `DRAFT` (normal, reuse, edit-mode) usan `baseUpdatedAt` vs `updatedAt` remoto.
  - En mismatch, API responde `409 Conflict` sin persistir.
  - `updatedAt` es la versión canónica (sin versión paralela).

## Referencia de transiciones

- Ver la tabla canónica de transiciones en `docs/usecases/list-use-cases.md#tabla-de-transiciones-de-estado` para validar los flujos de reconciliación login/bootstrap, activar desde draft, edición de listas activas, reutilización de historial y finalización desde móvil.

## Notas de implementación

- La pantalla se monta cuando la ruta es `/lists`.
- Los textos de UI se centralizan en `UI_TEXT.LISTS`.
  - Sub-objetos sugeridos: `UI_TEXT.LISTS.ACTIVE`, `UI_TEXT.LISTS.HISTORY`, `UI_TEXT.LISTS.DETAIL`.

### Estados de carga y feedback

- Skeletons en listado mientras carga.
- Placeholder en detalle para items (3–5 filas) y total.
- Botones con estado loading + disabled en borrar / reusar / editar.
- Banner de carga en detalle (“Cargando lista…”).
- Spinner pequeño junto al total si tarda en calcular/cargar.
- Bloqueo de doble click en acciones.
- Timeout amable (“Estamos tardando más de lo esperado”) con opción de reintentar.
- Toast solo para errores (no para loading).
- Banner offline: desactivar acciones de API si no hay red.

## Checklist QA rápido (multi-tab y conflictos)

- Dos pestañas del mismo navegador: la segunda pestaña refresca la vista del draft al recibir `storage` event cuando no tiene cambios locales pendientes.
- Dos pestañas con ediciones conflictivas: aparece diálogo de conflicto (`409`) y funcionan ambas opciones (`Mantener local` / `Mantener remoto`).
- No existe retry silencioso que oculte conflictos reales: cuando persiste el conflicto, la resolución siempre pasa por una acción explícita del usuario.
