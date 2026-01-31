# Caso de uso: Listas activas

## Objetivo
Mostrar al usuario sus listas en estado **active** creadas en la web.

## Precondiciones
- Usuario autenticado.

## Flujo principal (online)
1) La app solicita listas activas.
2) Se muestran las listas disponibles.
3) El usuario selecciona una lista para ver detalle.

## Flujo offline (snapshot)
1) Si no hay red, se usa el snapshot local.
2) Se permite abrir el detalle de listas guardadas.

## Reglas y decisiones
- Solo se muestran listas `active`.
- Si no hay listas activas: estado vacío controlado.
- Se almacena snapshot local para uso offline.

## Mensajes sugeridos
- Sin listas: "No tienes listas activas en este momento."
- Sin red y sin snapshot: "No hay conexión ni datos guardados."
