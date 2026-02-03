# Casos de uso – App de listas de la compra

## Objetivo del producto

Permitir a los usuarios **preparar listas de la compra en PC**, guardarlas en su cuenta y **consumirlas desde una app móvil** durante la compra, marcando productos como comprados. Las listas finalizadas se conservan como historial y pueden reutilizarse para crear nuevas listas.

---

## Estados de una lista

* **LOCAL_DRAFT**: único borrador en navegador cuando no hay sesión.
* **DRAFT**: único borrador sincronizado con autosave remoto al autenticarse.
* **ACTIVE**: lista preparada para comprar, visible en web y móvil.
* **COMPLETED**: compra finalizada, visible en historial.

### Autosave con sesión (decisión)

Cuando el usuario ya está autenticado, el autosave se persiste en servidor.
La comparación entre el borrador local y el autosave remoto ocurre **una sola vez**
al iniciar la app o tras login. La regla es:

* Gana el borrador con más productos (`items.length`).
* Si hay conflicto (local + remoto), se pide al usuario elegir.
* Si elige el local, se sincroniza el autosave remoto con el local.
* Si elige el remoto, se reemplaza el borrador local.

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
Al registrarse o iniciar sesión, el borrador local se compara con el autosave remoto. Si ambos
existen, el usuario decide cuál mantener.

**Flujo principal:**

1. El usuario pulsa “Registrarse / Iniciar sesión”.
2. El sistema detecta un `LOCAL_DRAFT`.
3. Si existe autosave remoto, se muestra un modal para elegir:
   * Mantener la lista local → se sincroniza el autosave remoto con el local.
   * Mantener la lista remota → se reemplaza el borrador local.
4. Si no existe autosave remoto, se sincroniza el borrador local al autosave remoto.

**Estado resultante:** `DRAFT`

---

### CU-03: Crear y editar lista en borrador (web)

**Actor:** Usuario registrado (web)

**Descripción:**
El usuario crea y edita listas en modo borrador desde el PC.

**Flujo principal:**

1. El usuario crea una nueva lista.
2. Añade, edita o elimina productos.
3. La lista se autoguarda localmente; si hay sesión, también se sincroniza por autosave.
4. El usuario puede cerrar sesión o refrescar sin perder cambios.
5. El usuario puede pulsar “Confirmar lista” para pasarla a `ACTIVE`.

**Estado resultante:** `DRAFT` o `ACTIVE`

---

### CU-03B: Recuperar autosave temporal al reabrir

**Actor:** Usuario registrado (web)

**Descripción:**
Si el usuario no guardó explícitamente, el autosave temporal se recupera al volver a abrir la app.

**Flujo principal:**

1. El usuario cierra o pierde la sesión mientras edita.
2. Al volver a abrir la app, el sistema compara local vs remoto una única vez.
3. Se carga el borrador ganador para continuar.

**Estado resultante:** `DRAFT` (autosave temporal)

---

### CU-03C: Descartar autosave temporal

**Actor:** Usuario registrado (web)

**Descripción:**
El usuario decide no continuar con el autosave temporal.

**Flujo principal:**

1. El usuario recibe el modal de elección local/remoto.
2. El usuario elige mantener el borrador local.
3. El sistema sobrescribe el autosave remoto con el borrador local.

**Estado resultante:** sin borrador temporal activo

---

### CU-04: Marcar lista como lista para comprar

**Actor:** Usuario registrado (web)

**Descripción:**
El usuario indica que la lista está lista para usarse en el móvil.

**Flujo principal:**

1. Desde una lista en `DRAFT`, el usuario pulsa “Confirmar lista”.
2. El sistema cambia el estado de la lista a `ACTIVE` **reutilizando el mismo registro**.
3. El borrador local/autosave se limpia (sin items) y se restaura un título genérico.

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
Al editar una lista `ACTIVE` desde la web, pasa temporalmente a `DRAFT` y deja de estar disponible
en móvil hasta volver a confirmarla.

**Flujo principal:**

1. El usuario abre una lista `ACTIVE` en la web.
2. El sistema avisa que mientras se edita no estará disponible en móvil.
3. La lista pasa a `DRAFT` y se permite editar productos.
4. Al pulsar “Confirmar lista”, vuelve a `ACTIVE`.

**Estado resultante:** `DRAFT` o `ACTIVE`

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
* El autoguardado es continuo en web y se sincroniza si hay sesión.
* Solo existe **un borrador en progreso** (local + autosave remoto).
* Las listas `ACTIVE` **pueden volver a `DRAFT`** durante la edición web.
* Si una lista `ACTIVE` se borra antes de sincronizar en móvil, la sincronización devuelve error.

---

## Notas finales

Este modelo prioriza:

* Claridad de estados
* Historial limpio
* Flujo natural PC → móvil
* Reutilización sin romper datos históricos
