# Product detail modal

Issue: #281. Branch: `feature/product-detail-modal`.

## Specs

- S1: “cuando cliquemos en la card se abra un modal y nos enseñe el producto en grande. Con más detalles de los muestra la card obviamente.”
- S2: “Quiero que se guarde en cache para que no vuelva a hacer llamada la api a la api de mercadona.” “Si. Para las listas da igual al precio que se confeccionaron. No es lo primordial que sean exactos los precios al comprar” (six-hour category-detail TTL).
- S3: “reutiliza la formula para el precio y el precio por unidad litro kilo etc...” “si por supuesto” (modal follows card pricing for bulk products).
- S4: “Para las fotos la primera es el producto y la segunda es la etiqueta. Que hacemos unas flechitas para ver todas las fotos?”
- S5: “Esto lo vamos a hacer en la web de momento.”

## Tasks

- T1 [done] S1-S3 API product detail, cache and tests; inline; commit 2e61534.
- T2 [done] S1-S5 Web modal, service and tests; delegated; commits 6f80eb5, 77c57f7 and 916fff6.
- T3 [done] S1-S5 Documentation and verification; inline; documentation commits 2e61534 and 77c57f7.

## Log

L1: Tenemos un endpoint para un producto simple. Quiero que lo uses, vamos a hacer que cuando cliquemos en la card se abra un modal y nos enseñe el producto en grande. Con más detalles de los muestra la card obviamente. Quiero que se guarde en cache para que no vuelva a hacer llamada la api a la api de mercadona. Necesito saber que nos devuelve el endpoint para ver lo que nos interesa mostrar. Esto lo vamos a hacer en la web de momento. Necesito que crees una nueva rama para esta nueva feature y un isue
L2: Para los precios y precios por unidad lo resolvi para las cards y para la suma de productos en la lista fijate por que hay productos que van al peso o utiliza el peso total. Ahora no se decirte pero ya lo resolvi. reutiliza la formula para el precio y el precio por unidad litro kilo etc...

Para las fotos la primera es el producto y la segunda es la etiqueta. Que hacemos unas flechitas para ver todas las fotos?
L3: Lo mismo que para las listas
L4: Si. Para las listas da igual al precio que se confeccionaron. No es lo primordial que sean exactos los precios al comprar
L5: si por supuesto
L6: Playwright Chromium passed desktop (1280×800) and mobile (390×844) functional checks with mocked API responses; image URLs were mocked as unavailable.
L7: Review slice boundary: API 2e61534, web service 6f80eb5, modal 77c57f7 and coverage tests 916fff6. The modal commit has 578 changed lines and exceeds the approximate 400-line review target.
L8: API suite, lint and typecheck passed; web lint, typecheck, coverage suite and build passed. New product-detail CORE files reached 100% across coverage metrics; existing CORE debt remains globally.
L9: Playwright Chromium loaded both supplied real product photos at 600×600.
