# Caso de uso: Offline y sincronización

## Objetivo
Permitir uso offline con snapshots locales y sincronización posterior con merge
confirmado por el usuario.

## Snapshot local
Se guarda un snapshot con:
- Lista: `id`, `name`.
- Productos: `id`, `name`, `price`, `quantity`, `photoUrl`.
- Estado local: `checked`.
- Info extra si la API la requiere en UI.

## Flujo offline
1) La app detecta falta de red.
2) Se usa el snapshot local.
3) El usuario puede marcar/desmarcar productos.

## Al recuperar la red (merge)
1) La app compara la versión remota con el snapshot.
2) Si hay cambios, se avisa al usuario.
3) Se realiza merge con confirmación.

## Regla de productos eliminados
- Si un producto fue eliminado en backend:
  - Se elimina localmente.
  - Se muestra aviso explícito.

## UX de avisos
- Con snapshot disponible: banner/snackbar no intrusivo.
- Sin snapshot disponible: pantalla completa con botón **Reintentar**.

## Mensajes sugeridos
- Sin conexión: "Sin conexión. Usando datos guardados."
- Cambios detectados: "La lista cambió en la web. Revisa los cambios."
- Producto eliminado: "Se eliminó un producto desde la web."
