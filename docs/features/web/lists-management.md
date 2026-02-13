# Gestión de listas (web)

## Objetivo

Proveer una pantalla dedicada para gestionar listas por estado desde el menú de usuario. El `DRAFT` único (autosave persistido en servidor) se gestiona en el modal de lista, puede estar vacío y no aparece en este listado.

## Endpoints

- `GET /api/lists` (carga de listas)
- `POST /api/lists/:id/reuse` (ReuseList: reusar listas del historial)
- `DELETE /api/lists/:id` (borrar listas)
- `PATCH /api/lists/:id/editing` (activar/desactivar edición)
- `POST /api/lists/:id/finish-edit` (finalizar edición)


## Política canónica de Draft y Recovery

La política canónica de invariante y recuperación del `DRAFT` está en `docs/usecases/list-use-cases.md#draft-invariant-and-recovery-policy`.
Este documento debe tratarla como fuente única para reglas de bootstrap, reutilización y self-healing backend, siguiendo Variant A como semántica canónica de draft persistente.


### Bootstrap de primer login (resumen operativo web)

Al autenticarse por primera vez, la web debe cerrar bootstrap con un único `DRAFT` remoto reutilizable:

1. Sin `DRAFT` remoto + `LOCAL_DRAFT` con items: crear `DRAFT` remoto con contenido local y mantener edición sobre `LOCAL_DRAFT`.
2. Sin `DRAFT` remoto + `LOCAL_DRAFT` vacío: crear `DRAFT` remoto vacío para dejar preparado autosave posterior.
3. Condición de carrera (local y remoto aparecen a la vez): resolver por `updatedAt`; con empate y contenido distinto usar desempate explícito:
   - Prioridad local cuando remoto quedó vacío y local tiene items.
   - Modal de elección cuando ambos tienen contenido distinto.

Feedback UX esperado:

- Creación desde local con items: toast de confirmación de guardado en cuenta.
- Creación de `DRAFT` vacío: sin modal, mensaje no bloqueante opcional.
- Resolución automática por `updatedAt`: toast de recuperación indicando que se aplicó la versión más reciente.
- Empate con conflicto de contenido: modal obligatorio para elegir fuente + toast final de confirmación.

Invariante de salida: al terminar bootstrap existe exactamente un `DRAFT` remoto por usuario, reutilizable por crear/editar/reusar sin crear drafts adicionales.

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
- Si el usuario cancela la edición, el `DRAFT` se reinicia a vacío y se vuelve a `isEditing=false` (sin eliminar la entidad draft).
- Si el usuario termina la edición, `POST /api/lists/:id/finish-edit` aplica el DRAFT a la lista activa y el `DRAFT` se reinicia a vacío (sin eliminar la entidad draft).

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

### Sync policy

- **Debounce de autosave:** cada cambio en `LOCAL_DRAFT` programa un `PUT /api/lists/autosave` con debounce de **800 ms**. Cambios consecutivos dentro de la ventana reinician el temporizador y solo se envía el último snapshot.
- **Retry en fallos de autosave:**
  - Reintentos automáticos con backoff exponencial: **1 s**, **2 s**, **4 s** (máximo 3 reintentos).
  - Si todos fallan, se mantiene el estado en `LOCAL_DRAFT`, se marca estado `sync=error` y se habilita reintento manual.
  - Un nuevo cambio del usuario vuelve a intentar sincronizar automáticamente.
- **Conflictos multi-tab/concurrencia:**
  - Regla base: el servidor valida con `updatedAt` (o versión equivalente) enviado por cliente.
  - Si llega `409 Conflict`, la pestaña no sobrescribe el remoto automáticamente.
  - Se mantiene `LOCAL_DRAFT` como “cambios pendientes”, se obtiene snapshot remoto actualizado y se muestra estado de conflicto para que el usuario recargue/aplique recuperación.
- **Comportamiento offline:**
  - Sin conectividad no se intentan llamadas de autosave.
  - Los cambios siguen aplicando a `LOCAL_DRAFT`.
  - Al volver la red, se reanuda el autosave con el último snapshot local pendiente.
- **Regla explícita de sobreescritura server -> local:**
  - Los datos del servidor **solo pueden sobrescribir `LOCAL_DRAFT`** en escenarios de recuperación definidos: bootstrap inicial de sesión, recuperación tras logout/login, o resolución explícita después de conflicto (`409`) aceptada por el usuario.
  - Fuera de esos escenarios, nunca se pisa `LOCAL_DRAFT` con datos remotos de forma implícita.

#### Timeline de ejemplo (resolución de conflicto entre pestañas)

1. **t0:** Pestaña A y B cargan el mismo `DRAFT` (`updatedAt=10:00`).
2. **t1:** A edita y autosave guarda OK (`updatedAt=10:01`).
3. **t2:** B edita sobre snapshot viejo (`updatedAt=10:00`) y envía autosave.
4. **t3:** API responde `409 Conflict` a B.
5. **t4:** B conserva su `LOCAL_DRAFT` pendiente, descarga snapshot remoto (`10:01`) y muestra aviso de conflicto.
6. **t5:** Usuario en B elige “recargar desde servidor” (flujo de recuperación); recién ahí se permite sobrescribir `LOCAL_DRAFT` con remoto.

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
