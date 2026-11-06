# Android product detail

Implement the informational product detail for the existing shopping list.

## Specs

- S1: "vamos a trabajar unicamente con los datos que ya tenemos para la lista. Evitaremos una llamada a la api por cada producto que queramos mirar"
- S2: "la nota y los productos a mano no existen fue una idea descartada"
- S3: "Vale simplemente usaremos el logo de la app como fallback y que la imagen que ya está usando es la misma que se usa en las cards de la pagina web no problema con el resize. Si falla o no hay conexion ahora no vuelve a intentar bajarse la imagen y se queda vacia. Pero cuando recupera conexion no pone la imagen hasta que no cierras y vuelves a abrir la lista por ejemplo."
- S4: "Las imagenes que ya vienen en la lista son las mismas que se usan en la web. Por tanto no se deben bajar nuevas imagenes. La imagen de la lista va a ser la misma que la de la card."
- S5: "si pero debe salir desde abajo  abriendose, es lo que habíamos hablado"
- S6: "Informativa. A modo de recordatorio para poder usar en este entorno android tienes una configuracion duplicada. Así se puede pasar test aquí y ver lo que pasa en android studio windows. ok? Pues dale"
- S7: "vale esta skill la deberás actualizar para que recoja las diferentes acciones que debes hacer con la app para probarla a medida que lo consigas"

## Tasks

- T1 [S1-S6] inline: Implement and test informational bottom sheet and image reconnection; commit: pending.
- T2 [S1-S7] inline: Verify Android behavior and document verified ADB actions; commit: pending.

## Log

- L1: "Entonces al lio"
- L2: "Vale simplemente usaremos el logo de la app como fallback y que la imagen que ya está usando es la misma que se usa en las cards de la pagina web no problema con el resize. Si falla o no hay conexion ahora no vuelve a intentar bajarse la imagen y se queda vacia. Pero cuando recupera conexion no pone la imagen hasta que no cierras y vuelves a abrir la lista por ejemplo."
- L3: "Las imagenes que ya vienen en la lista son las mismas que se usan en la web. Por tanto no se deben bajar nuevas imagenes. La imagen de la lista va a ser la misma que la de la card."
- L4: "si pero debe salir desde abajo  abriendose, es lo que habíamos hablado"
