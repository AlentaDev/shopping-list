# Product detail modal

Issue: #281. Branch: `feature/product-detail-modal`.

## Specs

- S1: “cuando cliquemos en la card se abra un modal y nos enseñe el producto en grande. Con más detalles de los muestra la card obviamente.”
- S2: “Quiero que se guarde en cache para que no vuelva a hacer llamada la api a la api de mercadona.” “Si. Para las listas da igual al precio que se confeccionaron. No es lo primordial que sean exactos los precios al comprar” (six-hour category-detail TTL).
- S3: “reutiliza la formula para el precio y el precio por unidad litro kilo etc...” “si por supuesto” (modal follows card pricing for bulk products).
- S4: “Para las fotos la primera es el producto y la segunda es la etiqueta. Que hacemos unas flechitas para ver todas las fotos?”
- S5: “Esto lo vamos a hacer en la web de momento.”

## Tasks

- T1 [done] S1-S3 API product detail, cache and tests; inline; commit pending.
- T2 [in_progress] S1-S5 Web modal, service and tests; inline; commit pending.
- T3 [pending] S1-S5 Documentation and verification; inline; commit pending.

## Log

L1: Tenemos un endpoint para un producto simple. Quiero que lo uses, vamos a hacer que cuando cliquemos en la card se abra un modal y nos enseñe el producto en grande. Con más detalles de los muestra la card obviamente. Quiero que se guarde en cache para que no vuelva a hacer llamada la api a la api de mercadona. Necesito saber que nos devuelve el endpoint para ver lo que nos interesa mostrar. Esto lo vamos a hacer en la web de momento. Necesito que crees una nueva rama para esta nueva feature y un isue
L2: Para los precios y precios por unidad lo resolvi para las cards y para la suma de productos en la lista fijate por que hay productos que van al peso o utiliza el peso total. Ahora no se decirte pero ya lo resolvi. reutiliza la formula para el precio y el precio por unidad litro kilo etc...

Para las fotos la primera es el producto y la segunda es la etiqueta. Que hacemos unas flechitas para ver todas las fotos?
L3: Lo mismo que para las listas
L4: Si. Para las listas da igual al precio que se confeccionaron. No es lo primordial que sean exactos los precios al comprar
L5: si por supuesto
