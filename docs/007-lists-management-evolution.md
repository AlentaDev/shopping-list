# ADR 007: Evolución de la gestión de listas para usuarios autenticados

## Estado
Propuesto.

## Contexto

Se han refinado los flujos de listas para usuarios autenticados con nuevas reglas de negocio y UX:

- Solo existe **un draft** (carrito) con autosave local; **no** aparece en el listado principal.
- El `DRAFT` único puede crearse vacío al autenticarse para garantizar continuidad entre sesiones y flujos, y en usuarios con bootstrap completado se mantiene como entidad persistente (Variant A).
- Se explicita semántica de listas vacías: `DRAFT` puede estar vacío, `DRAFT` -> `ACTIVE` sin items está prohibido, y la validación es obligatoria en Web (UX guard) y API (invariante de negocio).
- Implicación de flujo: `COMPLETED` no debería quedar vacío en operación normal.
- En el listado principal solo se muestran **Activas** e **Historial**, ordenadas por fecha más nueva.
- Matriz canónica UI: tarjetas `ACTIVE` y `COMPLETED` muestran botón **Borrar**; click en tarjeta abre modal de detalle en solo lectura (items + total, sin edición inline).
- En modal `ACTIVE`: **Editar/Borrar/Cerrar**. En modal `COMPLETED`: **Reusar/Borrar/Cerrar**.
- **Cerrar** es una acción modal-only de UX (no acción de negocio).
- Se requiere bloquear la edición en móvil cuando una lista activa esté en edición (`isEditing=true`).
- Se necesitan campos adicionales en resumen/detalle: `itemCount`, `activatedAt`, `isEditing`.
- Se requiere persistir `activated_at` e `is_editing` en BD.

Estos cambios afectan **API**, **BD** y **Web**, y deben implementarse de forma incremental y comprobable en los 3 entornos.

- En semántica Variant A, `DELETE /api/lists/autosave` y `POST /api/lists/:id/finish-edit` limpian contenido del draft y no eliminan la entidad.
- `GET /api/lists/autosave` solo devuelve `204` en bootstrap inicial previo a primera inicialización de draft; luego devuelve `200`.

## Decisión

Adoptar un plan de migración incremental que prioriza **API/BD primero** y luego **Web**, con las siguientes decisiones:

1. **BD**: añadir columnas `activated_at` y `is_editing` en `lists`.
2. **API**:
   - Excluir `DRAFT` y `is_autosave_draft=true` del listado principal por defecto.
   - Exponer `itemCount`, `activatedAt`, `isEditing` en `ListSummary` y `ListDetail`.
   - Alinear acciones y endpoints con **editar** y **reusar**.
   - Ordenar listados por fecha más reciente (activas por `activated_at`, historial por fecha de cierre o `updated_at` si no existe campo específico).
   - Validar que listas activas/historial nunca queden sin ítems.
   - Rechazar explícitamente activación de listas vacías (`DRAFT` -> `ACTIVE`) como invariante de negocio.
3. **Web**:
   - UI con solo **Activas** e **Historial**.
   - Detalle en solo lectura (items + total, sin edición inline) con acciones:
     - `ACTIVE`: **Editar/Borrar/Cerrar**
     - `COMPLETED`: **Reusar/Borrar/Cerrar**
   - **Cerrar** se trata explícitamente como acción modal-only de UX.
   - Mensajes de confirmación para pérdida de draft (solo si tiene ítems).
   - Bloqueo móvil cuando `isEditing=true`.
   - Estados de carga con skeletons y botones con loading.

### Decision rationale

Se prioriza permitir la creación de `DRAFT` vacío porque simplifica el modelo (siempre existe a lo sumo un borrador remoto), reduce ramas condicionales en login/recuperación y hace más predecibles los flujos de reusar/editar. El coste es persistir borradores sin items, pero se considera aceptable porque mejora la consistencia funcional y evita divergencias entre web y API.

## Consecuencias

- **Compatibilidad**: el backend debe exponer nuevos campos antes de que el frontend los consuma.
- **Persistencia**: se requiere migración de BD para soportar fechas de activación y bloqueo de edición.
- **UX**: se simplifica la navegación a Activas/Historial y se elimina el draft del listado principal.
- **Testing**: los cambios deben entregarse en pasos pequeños y verificables en web, sin romper API/DB.

## Referencias

- `docs/usecases/list-use-cases.md`
- `docs/features/api/listsFeature.md`
- `docs/features/web/lists-management.md`
- `docs/003-rest-api-feature-first.md`
