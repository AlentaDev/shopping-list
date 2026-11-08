# Caso de uso: Detalle de lista

## Objetivo
Permitir ver los productos de una lista activa, marcar/desmarcar productos y
calcular el total localmente.

## Precondiciones
- Usuario autenticado.
- Lista seleccionada (online u offline).

## Flujo principal
1) Se muestran productos con nombre, precio, cantidad y foto (link) incluidos en
   el snapshot de la lista.
2) El usuario marca un producto como comprado.
3) El total se recalcula localmente (EUR, sin redondeos).
4) El usuario puede desmarcar productos.
5) Al pulsar un producto de catálogo, se abre una ficha informativa desde abajo
   con los datos disponibles en el snapshot. No se consulta un endpoint por
   producto. La ficha se cierra con el gesto o control de cierre del sheet.

## Reglas y decisiones
- Los checks son **locales** y funcionan offline.
- El total se calcula en la app: `precio * cantidad`.
- El producto marcado se muestra con estilo visual (tachado leve, gris).
- Se mantiene visible el texto del producto aunque esté tachado.
- El checkbox sigue marcando/desmarcando; pulsar la tarjeta de catálogo abre la
  ficha informativa. Los productos manuales no abren esa ficha.
- La ficha utiliza los campos ya presentes en el producto de la lista y no
  añade notas ni productos manuales.
- La miniatura usa la misma URL y clave de caché tanto en la tarjeta como en la
  ficha. No se genera una imagen ni una clave de caché distintas por tamaño o
  estado de conexión.
- Si falta la URL de imagen o la carga falla, se muestra el logo de la app.
  Después de una carga fallida, una transición de desconectado a conectado
  vuelve a solicitar esa imagen. Una carga exitosa no se invalida al reconectar.

## Estados especiales
- Lista vacía inesperada: estado vacío y opción de volver.

## Mensajes sugeridos
- Lista vacía: "Esta lista no tiene productos."
