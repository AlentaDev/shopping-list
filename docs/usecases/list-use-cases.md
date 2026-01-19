# Casos de uso – App de listas de la compra

## Objetivo del producto

Permitir a los usuarios **preparar listas de la compra en PC**, guardarlas en su cuenta y **consumirlas desde una app móvil** durante la compra, marcando productos como comprados. Las listas finalizadas se conservan como historial y pueden reutilizarse para crear nuevas listas.

---

## Estados de una lista

* **LOCAL_DRAFT**: borrador solo en navegador, antes de registro/login.
* **DRAFT**: borrador en la nube, editable solo en web.
* **ACTIVE**: lista preparada para comprar, visible en web y móvil.
* **COMPLETED**: compra finalizada, visible en historial.

---

## Actores

* Usuario no registrado (web)
* Usuario registrado (web)
* Usuario registrado (móvil)

---

## Casos de uso

### CU-01: Crear lista sin registrarse (borrador local)

**Actor:** Usuario no registrado (web)

**Descripción:**
El usuario puede crear una lista sin tener cuenta. La lista se guarda automáticamente en el navegador.

**Flujo principal:**

1. El usuario accede a la web sin iniciar sesión.
2. Añade productos, cantidades y notas.
3. La lista se autoguarda en el navegador.
4. Al recargar la página, la lista sigue disponible.

**Estado resultante:** `LOCAL_DRAFT`

---

### CU-02: Registro/Login con borrador existente

**Actor:** Usuario no registrado → Usuario registrado (web)

**Descripción:**
Al registrarse o iniciar sesión, el borrador local se guarda automáticamente en la cuenta del usuario.

**Flujo principal:**

1. El usuario pulsa “Registrarse / Iniciar sesión”.
2. El sistema detecta un `LOCAL_DRAFT`.
3. Se crea una lista en la BBDD con estado `DRAFT` usando el contenido local.
4. El borrador local permanece como autosave temporal hasta que el usuario decida descartarlo.

**Estado resultante:** `DRAFT`

---

### CU-03: Crear y editar lista en borrador (web)

**Actor:** Usuario registrado (web)

**Descripción:**
El usuario crea y edita listas en modo borrador desde el PC.

**Flujo principal:**

1. El usuario crea una nueva lista.
2. Añade, edita o elimina productos.
3. La lista se autoguarda cada 1–3s en la BBDD si hay cambios.
4. El usuario puede cerrar sesión o refrescar sin perder cambios.
5. El usuario puede elegir entre:
   * “Guardar como borrador” → la lista queda como `DRAFT` en su cuenta.
   * “Lista lista para comprar” → la lista pasa a `ACTIVE`.

**Estado resultante:** `DRAFT` o `ACTIVE`

---

### CU-04: Marcar lista como lista para comprar

**Actor:** Usuario registrado (web)

**Descripción:**
El usuario indica que la lista está lista para usarse en el móvil.

**Flujo principal:**

1. Desde una lista en `DRAFT`, el usuario pulsa “Lista lista para comprar”.
2. El sistema cambia el estado de la lista.

**Estado resultante:** `ACTIVE`

---

### CU-05: Ver y usar listas activas en móvil

**Actor:** Usuario registrado (móvil)

**Descripción:**
El usuario ve únicamente las listas activas y las usa durante la compra. En móvil solo se marcan/desmarcan productos.

**Flujo principal:**

1. El usuario abre la app móvil.
2. El sistema muestra las listas con estado `ACTIVE`.
3. El usuario entra en una lista.
4. Marca o desmarca productos como comprados.
5. La sincronización con la BBDD se realiza al finalizar la compra.
6. Si la lista ya no existe al sincronizar, se muestra un mensaje de error.

**Estado resultante:** `ACTIVE`

---

### CU-06: Editar lista activa desde web

**Actor:** Usuario registrado (web)

**Descripción:**
Mientras una lista está activa, el usuario puede seguir editándola desde el PC sin cambiar su estado.

**Flujo principal:**

1. El usuario abre una lista `ACTIVE` en la web.
2. Puede añadir productos o modificar cantidades/notas.
3. Si intenta borrar un producto, el sistema muestra un aviso.
4. Los cambios se reflejan en el móvil cuando se sincronice la lista.

**Estado resultante:** `ACTIVE`

---

### CU-07: Finalizar compra

**Actor:** Usuario registrado (móvil)

**Descripción:**
El usuario indica que ha terminado la compra.

**Flujo principal:**

1. En una lista `ACTIVE`, el usuario pulsa “Compra finalizada”.
2. El sistema sincroniza los productos marcados y completa la lista.

**Estado resultante:** `COMPLETED`

---

### CU-08: Ver historial de compras

**Actor:** Usuario registrado (web)

**Descripción:**
El usuario puede consultar listas de compras anteriores.

**Flujo principal:**

1. El usuario accede a la sección de historial.
2. El sistema muestra listas con estado `COMPLETED`.
3. El usuario puede abrir una lista para verla.

**Estado resultante:** `COMPLETED`

---

### CU-09: Reutilizar una lista completada

**Actor:** Usuario registrado (web)

**Descripción:**
El usuario crea una nueva lista a partir de una compra anterior.

**Flujo principal:**

1. Desde una lista `COMPLETED`, el usuario pulsa “Reutilizar”.
2. El sistema crea una nueva lista copiando todos los productos.
3. Los productos aparecen sin marcar.

**Estado resultante:** nueva lista en `DRAFT`

---

### CU-10: Borrar una lista

**Actor:** Usuario registrado (web)

**Descripción:**
El usuario puede borrar cualquier lista, independientemente de su estado.

**Flujo principal:**

1. El usuario pulsa “Borrar lista”.
2. El sistema elimina la lista.
3. Si la lista estaba activa, desaparece inmediatamente del móvil y la sincronización fallará.

**Estados posibles:** `DRAFT`, `ACTIVE`, `COMPLETED`

---

## Reglas clave

* El móvil **solo muestra listas `ACTIVE`**.
* En móvil solo se permite **marcar/desmarcar** productos.
* Una lista `COMPLETED` **no se reutiliza directamente**: siempre se duplica.
* Se pueden tener **varias listas activas a la vez**.
* Todas las listas pueden borrarse.
* El autoguardado es continuo en web y se sincroniza cada 1–3s si hay cambios.
* Si el usuario guarda explícitamente como borrador o lista activa, el autosave temporal deja de usarse.
* Las listas `ACTIVE` **no vuelven a `DRAFT`**: se editan en web sin cambiar estado.
* Si una lista `ACTIVE` se borra antes de sincronizar en móvil, la sincronización devuelve error.

---

## Notas finales

Este modelo prioriza:

* Claridad de estados
* Historial limpio
* Flujo natural PC → móvil
* Reutilización sin romper datos históricos
