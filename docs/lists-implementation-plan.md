# Plan incremental para implementar la nueva gestión de listas

## Objetivo

Implementar los cambios de listas de forma **incremental y verificable** en los 3 entornos, siguiendo la decisión del ADR 007.

## Alcance

- **API y BD** primero para asegurar compatibilidad de datos.
- **Web** después para consumir los nuevos campos y flujos.
- Cada paso debe poder probarse manualmente en la web sin romper el resto del sistema.

## Pre-requisitos

- Mantener la arquitectura feature-first en API (`docs/003-rest-api-feature-first.md`).
- No introducir dependencias nuevas.
- Mantener pasos pequeños, con cambios aislados.

## Plan por iteraciones

### Iteración 1 — Preparar BD y dominio (sin cambios funcionales visibles)

**Objetivo**: persistir la nueva información sin cambiar el comportamiento de la UI.

1. **BD**: migración para añadir `activated_at` y `is_editing`.
2. **Dominio**: añadir `activatedAt?: Date` e `isEditing: boolean` en el modelo `List`.
3. **Repositorios**: mapear columnas en Postgres e InMemory.

**Verificación (web)**:
- La aplicación sigue funcionando sin cambios visibles.

---

### Iteración 2 — Exponer nuevos campos en API

**Objetivo**: que la API entregue los campos requeridos por la UI futura.

1. **ListSummary / ListDetail**: añadir `itemCount`, `activatedAt`, `isEditing`.
2. **Adapters/DTOs**: mapear los nuevos campos.
3. **OpenAPI**: documentar los campos en esquemas.

**Verificación (web)**:
- No cambia la UI, pero las respuestas API ya incluyen campos nuevos (inspección con herramientas de red).

---

### Iteración 3 — Filtrado y orden en API

**Objetivo**: ajustar la semántica del listado principal.

1. Excluir `DRAFT` y `is_autosave_draft=true` del listado principal por defecto.
2. Ordenar activas por `activated_at` y historial por fecha relevante.

**Verificación (web)**:
- En la UI actual, el listado muestra solo activas/historial (el draft desaparece).

---

### Iteración 4 — Acciones de edición y reuso (API)

**Objetivo**: alinear endpoints con el nuevo flujo.

1. Definir endpoint para activar `isEditing=true` en listas activas.
2. Alinear “reusar” con el endpoint existente o renombrarlo en API (documentar decisión).
3. Validar reglas: listas activas/historial no pueden quedarse sin ítems.

**Verificación (web)**:
- Acciones existentes siguen funcionando; no se rompe la UI.

---

### Iteración 5 — Actualizar Web: tabs y tarjetas

**Objetivo**: reflejar Activas/Historial en la UI.

1. Eliminar tab de draft y renombrar según las reglas.
2. Mostrar `itemCount` y `activatedAt` en tarjetas.

**Verificación (web)**:
- UI muestra solo Activas e Historial, con contador y fechas correctas.

---

### Iteración 6 — Actualizar Web: detalle y acciones

**Objetivo**: incorporar las nuevas acciones en el detalle.

1. Botones **Editar/Cerrar/Borrar** para activas.
2. Botones **Reusar/Cerrar/Borrar** para historial.
3. Modal de confirmación para borrar en listado y detalle.

**Verificación (web)**:
- Las acciones corresponden a los estados y se muestran los modales.

---

### Iteración 7 — Avisos y bloqueo móvil por edición

**Objetivo**: aplicar reglas de edición y pérdida de draft.

1. Aviso de pérdida de draft solo si tiene ítems (editar/reusar).
2. Al editar activa, marcar `isEditing=true` y bloquear edición en móvil.

**Verificación (web)**:
- Al editar, se ve el aviso correcto y en móvil queda en modo solo lectura.

---

### Iteración 8 — Estados de carga

**Objetivo**: mejorar feedback del usuario.

1. Skeletons en el listado.
2. Placeholders en detalle.
3. Botones con loading + disabled.
4. Toast solo para errores.

**Verificación (web)**:
- Cargas muestran skeletons y botones en estado loading.

## Notas de implementación

- Evitar refactors masivos: cambios pequeños y reversibles.
- Mantener reutilización de componentes de confirmación y mensajes.
- Usar `UI_TEXT` para todos los textos de UI.
