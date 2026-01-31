# Caso de uso: Detalle de lista

## Objetivo
Permitir ver los productos de una lista activa, marcar/desmarcar productos y
calcular el total localmente.

## Precondiciones
- Usuario autenticado.
- Lista seleccionada (online u offline).

## Flujo principal
1) Se muestran productos con nombre, precio, cantidad y foto (link).
2) El usuario marca un producto como comprado.
3) El total se recalcula localmente (EUR, sin redondeos).
4) El usuario puede desmarcar productos.

## Reglas y decisiones
- Los checks son **locales** y funcionan offline.
- El total se calcula en la app: `precio * cantidad`.
- El producto marcado se muestra con estilo visual (tachado leve, gris).
- Se mantiene visible el texto del producto aunque esté tachado.

## Estados especiales
- Lista vacía inesperada: estado vacío y opción de volver.

## Mensajes sugeridos
- Lista vacía: "Esta lista no tiene productos."
